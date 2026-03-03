const { RATE_LIMITS } = require('../config/constants');
const logger = require('../utils/logger');

class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  // Create rate limiting middleware
  createLimiter(options = {}) {
    const {
      windowMs = RATE_LIMITS.GENERAL.windowMs,
      max = RATE_LIMITS.GENERAL.max,
      message = 'Too many requests from this IP, please try again later',
      standardHeaders = true,
      legacyHeaders = false,
      skipSuccessfulRequests = false,
      skipFailedRequests = false,
      keyGenerator = (req) => req.ip || req.connection.remoteAddress,
      skip = () => false,
      onLimitReached = null
    } = options;

    return (req, res, next) => {
      if (skip(req, res)) {
        return next();
      }

      const key = keyGenerator(req);
      const now = Date.now();
      const windowStart = now - windowMs;

      // Initialize or get existing request data
      if (!this.requests.has(key)) {
        this.requests.set(key, []);
      }

      const userRequests = this.requests.get(key);
      
      // Remove old requests outside the window
      const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
      this.requests.set(key, validRequests);

      // Check if limit exceeded
      if (validRequests.length >= max) {
        const resetTime = new Date(validRequests[0] + windowMs);
        
        // Set rate limit headers
        if (standardHeaders) {
          res.set({
            'RateLimit-Limit': max,
            'RateLimit-Remaining': 0,
            'RateLimit-Reset': resetTime.toISOString(),
            'RateLimit-Policy': `${max};w=${windowMs / 1000}`
          });
        }

        if (legacyHeaders) {
          res.set({
            'X-RateLimit-Limit': max,
            'X-RateLimit-Remaining': 0,
            'X-RateLimit-Reset': Math.ceil(resetTime.getTime() / 1000)
          });
        }

        // Log rate limit exceeded
        logger.logSecurity('rate_limit_exceeded', {
          ip: key,
          userAgent: req.get('User-Agent'),
          path: req.path,
          method: req.method
        });

        // Call onLimitReached callback if provided
        if (onLimitReached) {
          onLimitReached(req, res);
        }

        return res.status(429).json({
          error: message,
          retryAfter: Math.ceil((resetTime.getTime() - now) / 1000)
        });
      }

      // Add current request timestamp
      validRequests.push(now);
      this.requests.set(key, validRequests);

      // Set rate limit headers for successful requests
      const remaining = Math.max(0, max - validRequests.length);
      const resetTime = new Date(now + windowMs);

      if (standardHeaders) {
        res.set({
          'RateLimit-Limit': max,
          'RateLimit-Remaining': remaining,
          'RateLimit-Reset': resetTime.toISOString(),
          'RateLimit-Policy': `${max};w=${windowMs / 1000}`
        });
      }

      if (legacyHeaders) {
        res.set({
          'X-RateLimit-Limit': max,
          'X-RateLimit-Remaining': remaining,
          'X-RateLimit-Reset': Math.ceil(resetTime.getTime() / 1000)
        });
      }

      // Skip counting this request if configured
      const shouldSkip = (
        (skipSuccessfulRequests && res.statusCode < 400) ||
        (skipFailedRequests && res.statusCode >= 400)
      );

      if (shouldSkip) {
        // Remove the request we just added
        validRequests.pop();
        this.requests.set(key, validRequests);
      }

      next();
    };
  }

  // General rate limiter
  general() {
    return this.createLimiter(RATE_LIMITS.GENERAL);
  }

  // Authentication rate limiter (stricter)
  auth() {
    return this.createLimiter({
      ...RATE_LIMITS.AUTH,
      message: 'Too many authentication attempts, please try again later',
      onLimitReached: (req, res) => {
        logger.logSecurity('auth_rate_limit_exceeded', {
          ip: req.ip,
          email: req.body?.email,
          userAgent: req.get('User-Agent')
        });
      }
    });
  }

  // AI endpoints rate limiter
  ai() {
    return this.createLimiter({
      ...RATE_LIMITS.AI,
      message: 'Too many AI requests, please try again later',
      keyGenerator: (req) => {
        // Use user ID if authenticated, otherwise IP
        return req.user?.id || req.ip || req.connection.remoteAddress;
      }
    });
  }

  // API key based rate limiter
  apiKey(options = {}) {
    return this.createLimiter({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 1000, // 1000 requests per hour
      keyGenerator: (req) => req.get('X-API-Key') || req.ip,
      ...options
    });
  }

  // User-specific rate limiter
  user(options = {}) {
    return this.createLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200, // 200 requests per 15 minutes per user
      keyGenerator: (req) => req.user?.id || req.ip,
      skip: (req) => !req.user, // Skip if not authenticated
      ...options
    });
  }

  // Endpoint-specific rate limiter
  endpoint(endpoint, options = {}) {
    return this.createLimiter({
      keyGenerator: (req) => `${endpoint}:${req.user?.id || req.ip}`,
      ...options
    });
  }

  // Progressive rate limiter (increases limits for trusted users)
  progressive() {
    return (req, res, next) => {
      const user = req.user;
      let limits = RATE_LIMITS.GENERAL;

      if (user) {
        // Increase limits based on user activity/trust level
        const accountAge = Date.now() - new Date(user.createdAt).getTime();
        const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);

        if (daysSinceCreation > 30) {
          limits = {
            windowMs: RATE_LIMITS.GENERAL.windowMs,
            max: RATE_LIMITS.GENERAL.max * 2 // Double the limit for older accounts
          };
        }

        if (user.role === 'admin') {
          limits = {
            windowMs: RATE_LIMITS.GENERAL.windowMs,
            max: RATE_LIMITS.GENERAL.max * 5 // 5x limit for admins
          };
        }
      }

      return this.createLimiter(limits)(req, res, next);
    };
  }

  // Sliding window rate limiter
  slidingWindow(options = {}) {
    const {
      windowMs = 15 * 60 * 1000,
      max = 100,
      keyGenerator = (req) => req.ip
    } = options;

    return (req, res, next) => {
      const key = keyGenerator(req);
      const now = Date.now();
      const windowStart = now - windowMs;

      if (!this.requests.has(key)) {
        this.requests.set(key, []);
      }

      const userRequests = this.requests.get(key);
      
      // Remove requests outside the sliding window
      const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
      
      if (validRequests.length >= max) {
        return res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
        });
      }

      validRequests.push(now);
      this.requests.set(key, validRequests);
      next();
    };
  }

  // Burst rate limiter (allows short bursts but limits sustained usage)
  burst(options = {}) {
    const {
      burstLimit = 10,
      sustainedLimit = 100,
      burstWindow = 60 * 1000, // 1 minute
      sustainedWindow = 15 * 60 * 1000, // 15 minutes
      keyGenerator = (req) => req.ip
    } = options;

    return (req, res, next) => {
      const key = keyGenerator(req);
      const now = Date.now();

      if (!this.requests.has(key)) {
        this.requests.set(key, { burst: [], sustained: [] });
      }

      const userRequests = this.requests.get(key);

      // Check burst limit
      const burstStart = now - burstWindow;
      userRequests.burst = userRequests.burst.filter(timestamp => timestamp > burstStart);

      if (userRequests.burst.length >= burstLimit) {
        return res.status(429).json({
          error: 'Burst rate limit exceeded',
          retryAfter: Math.ceil((userRequests.burst[0] + burstWindow - now) / 1000)
        });
      }

      // Check sustained limit
      const sustainedStart = now - sustainedWindow;
      userRequests.sustained = userRequests.sustained.filter(timestamp => timestamp > sustainedStart);

      if (userRequests.sustained.length >= sustainedLimit) {
        return res.status(429).json({
          error: 'Sustained rate limit exceeded',
          retryAfter: Math.ceil((userRequests.sustained[0] + sustainedWindow - now) / 1000)
        });
      }

      // Add current request to both counters
      userRequests.burst.push(now);
      userRequests.sustained.push(now);
      this.requests.set(key, userRequests);

      next();
    };
  }

  // Get current rate limit status for a key
  getStatus(key) {
    if (!this.requests.has(key)) {
      return { requests: 0, resetTime: null };
    }

    const userRequests = this.requests.get(key);
    const now = Date.now();
    const validRequests = userRequests.filter(timestamp => timestamp > now - RATE_LIMITS.GENERAL.windowMs);

    return {
      requests: validRequests.length,
      resetTime: validRequests.length > 0 ? new Date(validRequests[0] + RATE_LIMITS.GENERAL.windowMs) : null
    };
  }

  // Reset rate limit for a specific key
  reset(key) {
    this.requests.delete(key);
    logger.info(`Rate limit reset for key: ${key}`);
  }

  // Cleanup old entries
  cleanup() {
    const now = Date.now();
    const maxAge = Math.max(
      RATE_LIMITS.GENERAL.windowMs,
      RATE_LIMITS.AUTH.windowMs,
      RATE_LIMITS.AI.windowMs
    );

    for (const [key, requests] of this.requests.entries()) {
      if (Array.isArray(requests)) {
        const validRequests = requests.filter(timestamp => timestamp > now - maxAge);
        if (validRequests.length === 0) {
          this.requests.delete(key);
        } else {
          this.requests.set(key, validRequests);
        }
      } else if (typeof requests === 'object') {
        // Handle burst rate limiter format
        const validBurst = requests.burst?.filter(timestamp => timestamp > now - maxAge) || [];
        const validSustained = requests.sustained?.filter(timestamp => timestamp > now - maxAge) || [];
        
        if (validBurst.length === 0 && validSustained.length === 0) {
          this.requests.delete(key);
        } else {
          this.requests.set(key, { burst: validBurst, sustained: validSustained });
        }
      }
    }

    logger.debug(`Rate limiter cleanup completed. Active keys: ${this.requests.size}`);
  }

  // Get statistics
  getStats() {
    const stats = {
      totalKeys: this.requests.size,
      totalRequests: 0,
      keysByType: {}
    };

    for (const [key, requests] of this.requests.entries()) {
      if (Array.isArray(requests)) {
        stats.totalRequests += requests.length;
      } else if (typeof requests === 'object') {
        stats.totalRequests += (requests.burst?.length || 0) + (requests.sustained?.length || 0);
      }

      // Categorize keys
      if (key.includes('@')) {
        stats.keysByType.email = (stats.keysByType.email || 0) + 1;
      } else if (/^\d+$/.test(key)) {
        stats.keysByType.userId = (stats.keysByType.userId || 0) + 1;
      } else {
        stats.keysByType.ip = (stats.keysByType.ip || 0) + 1;
      }
    }

    return stats;
  }

  // Destroy the rate limiter
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.requests.clear();
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

module.exports = rateLimiter;