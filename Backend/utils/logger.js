const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  // Ensure log directory exists
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  // Get current timestamp
  getTimestamp() {
    return new Date().toISOString();
  }

  // Get log filename for current date
  getLogFilename(level = 'combined') {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(this.logDir, `${level}-${date}.log`);
  }

  // Format log message
  formatMessage(level, message, meta = {}) {
    const timestamp = this.getTimestamp();
    const metaString = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}\n`;
  }

  // Write to log file
  writeToFile(level, message, meta = {}) {
    try {
      const logMessage = this.formatMessage(level, message, meta);
      
      // Write to level-specific log file
      fs.appendFileSync(this.getLogFilename(level), logMessage);
      
      // Write to combined log file
      fs.appendFileSync(this.getLogFilename('combined'), logMessage);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // Log to console with colors
  logToConsole(level, message, meta = {}) {
    const colors = {
      error: '\x1b[31m',   // Red
      warn: '\x1b[33m',    // Yellow
      info: '\x1b[36m',    // Cyan
      debug: '\x1b[35m',   // Magenta
      reset: '\x1b[0m'     // Reset
    };

    const color = colors[level] || colors.reset;
    const timestamp = this.getTimestamp();
    const metaString = Object.keys(meta).length > 0 ? ` | ${JSON.stringify(meta)}` : '';
    
    console.log(`${color}[${timestamp}] [${level.toUpperCase()}] ${message}${metaString}${colors.reset}`);
  }

  // Info level logging
  info(message, meta = {}) {
    this.logToConsole('info', message, meta);
    this.writeToFile('info', message, meta);
  }

  // Warning level logging
  warn(message, meta = {}) {
    this.logToConsole('warn', message, meta);
    this.writeToFile('warn', message, meta);
  }

  // Error level logging
  error(message, meta = {}) {
    this.logToConsole('error', message, meta);
    this.writeToFile('error', message, meta);
  }

  // Debug level logging
  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole('debug', message, meta);
      this.writeToFile('debug', message, meta);
    }
  }

  // Log HTTP requests
  logRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.id || 'anonymous'
    };

    const message = `${req.method} ${req.url} - ${res.statusCode} - ${responseTime}ms`;
    
    if (res.statusCode >= 400) {
      this.error(message, logData);
    } else {
      this.info(message, logData);
    }
  }

  // Log database operations
  logDatabase(operation, collection, query = {}, result = {}) {
    const logData = {
      operation,
      collection,
      query: JSON.stringify(query),
      resultCount: result.length || result.modifiedCount || result.insertedCount || 0,
      executionTime: result.executionTime || 'N/A'
    };

    this.debug(`Database ${operation} on ${collection}`, logData);
  }

  // Log API calls to external services
  logExternalAPI(service, endpoint, method, statusCode, responseTime) {
    const logData = {
      service,
      endpoint,
      method,
      statusCode,
      responseTime: `${responseTime}ms`
    };

    const message = `External API call: ${service} ${method} ${endpoint} - ${statusCode}`;
    
    if (statusCode >= 400) {
      this.warn(message, logData);
    } else {
      this.info(message, logData);
    }
  }

  // Log authentication events
  logAuth(event, userId, email, success = true, details = {}) {
    const logData = {
      event,
      userId,
      email,
      success,
      timestamp: this.getTimestamp(),
      ...details
    };

    const message = `Auth ${event}: ${email} - ${success ? 'SUCCESS' : 'FAILED'}`;
    
    if (success) {
      this.info(message, logData);
    } else {
      this.warn(message, logData);
    }
  }

  // Log security events
  logSecurity(event, details = {}) {
    const logData = {
      event,
      timestamp: this.getTimestamp(),
      ...details
    };

    this.warn(`Security event: ${event}`, logData);
  }

  // Log performance metrics
  logPerformance(operation, duration, details = {}) {
    const logData = {
      operation,
      duration: `${duration}ms`,
      timestamp: this.getTimestamp(),
      ...details
    };

    if (duration > 5000) { // Log slow operations (>5 seconds)
      this.warn(`Slow operation: ${operation} took ${duration}ms`, logData);
    } else {
      this.debug(`Performance: ${operation} completed in ${duration}ms`, logData);
    }
  }

  // Clean old log files
  cleanOldLogs(daysToKeep = 30) {
    try {
      const files = fs.readdirSync(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          this.info(`Deleted old log file: ${file}`);
        }
      });
    } catch (error) {
      this.error('Failed to clean old logs:', { error: error.message });
    }
  }

  // Get log statistics
  getLogStats() {
    try {
      const files = fs.readdirSync(this.logDir);
      const stats = {
        totalFiles: files.length,
        totalSize: 0,
        filesByType: {}
      };

      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const fileStats = fs.statSync(filePath);
        const fileType = file.split('-')[0]; // error, warn, info, etc.
        
        stats.totalSize += fileStats.size;
        
        if (!stats.filesByType[fileType]) {
          stats.filesByType[fileType] = {
            count: 0,
            size: 0
          };
        }
        
        stats.filesByType[fileType].count++;
        stats.filesByType[fileType].size += fileStats.size;
      });

      // Convert bytes to MB
      stats.totalSizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2);
      
      Object.keys(stats.filesByType).forEach(type => {
        stats.filesByType[type].sizeMB = (stats.filesByType[type].size / (1024 * 1024)).toFixed(2);
      });

      return stats;
    } catch (error) {
      this.error('Failed to get log stats:', { error: error.message });
      return null;
    }
  }

  // Express middleware for request logging
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Override res.end to capture response time
      const originalEnd = res.end;
      res.end = function(...args) {
        const responseTime = Date.now() - startTime;
        logger.logRequest(req, res, responseTime);
        originalEnd.apply(this, args);
      };
      
      next();
    };
  }
}

// Create singleton instance
const logger = new Logger();

// Clean old logs on startup
logger.cleanOldLogs();

module.exports = logger;