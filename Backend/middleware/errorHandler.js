const logger = require('../utils/logger');
const { HTTP_STATUS, ERROR_MESSAGES } = require('../config/constants');

class ErrorHandler {
  // Main error handling middleware
  static handle(err, req, res, next) {
    // Log the error
    logger.error('Error occurred:', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });

    // Handle different types of errors
    if (err.name === 'ValidationError') {
      return ErrorHandler.handleValidationError(err, res);
    }

    if (err.name === 'CastError') {
      return ErrorHandler.handleCastError(err, res);
    }

    if (err.name === 'MongoError' || err.name === 'MongoServerError') {
      return ErrorHandler.handleDatabaseError(err, res);
    }

    if (err.name === 'JsonWebTokenError') {
      return ErrorHandler.handleJWTError(err, res);
    }

    if (err.name === 'MulterError') {
      return ErrorHandler.handleMulterError(err, res);
    }

    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return ErrorHandler.handleConnectionError(err, res);
    }

    if (err.status || err.statusCode) {
      return ErrorHandler.handleHTTPError(err, res);
    }

    // Default error response
    return ErrorHandler.handleGenericError(err, res);
  }

  // Handle validation errors
  static handleValidationError(err, res) {
    const errors = Object.values(err.errors || {}).map(error => ({
      field: error.path,
      message: error.message,
      value: error.value
    }));

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Validation Error',
      message: 'The provided data is invalid',
      details: errors,
      timestamp: new Date().toISOString()
    });
  }

  // Handle MongoDB cast errors
  static handleCastError(err, res) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Invalid Data Format',
      message: `Invalid ${err.path}: ${err.value}`,
      timestamp: new Date().toISOString()
    });
  }

  // Handle database errors
  static handleDatabaseError(err, res) {
    let message = 'Database operation failed';
    let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;

    // Handle duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      message = `${field} already exists`;
      statusCode = HTTP_STATUS.BAD_REQUEST;
    }

    // Handle connection errors
    if (err.code === 'ECONNREFUSED') {
      message = 'Database connection failed';
      statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    }

    return res.status(statusCode).json({
      error: 'Database Error',
      message,
      timestamp: new Date().toISOString()
    });
  }

  // Handle JWT errors
  static handleJWTError(err, res) {
    let message = ERROR_MESSAGES.INVALID_TOKEN;
    let statusCode = HTTP_STATUS.UNAUTHORIZED;

    if (err.message === 'jwt expired') {
      message = 'Token has expired';
    } else if (err.message === 'jwt malformed') {
      message = 'Invalid token format';
    } else if (err.message === 'invalid signature') {
      message = 'Invalid token signature';
    }

    return res.status(statusCode).json({
      error: 'Authentication Error',
      message,
      timestamp: new Date().toISOString()
    });
  }

  // Handle file upload errors
  static handleMulterError(err, res) {
    let message = 'File upload failed';
    let statusCode = HTTP_STATUS.BAD_REQUEST;

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields';
        break;
      default:
        message = err.message || 'File upload failed';
    }

    return res.status(statusCode).json({
      error: 'File Upload Error',
      message,
      timestamp: new Date().toISOString()
    });
  }

  // Handle connection errors
  static handleConnectionError(err, res) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Connection Error',
      message: 'Unable to connect to external service',
      timestamp: new Date().toISOString()
    });
  }

  // Handle HTTP errors with status codes
  static handleHTTPError(err, res) {
    const statusCode = err.status || err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    const message = err.message || ERROR_MESSAGES.SERVER_ERROR;

    return res.status(statusCode).json({
      error: err.name || 'HTTP Error',
      message,
      timestamp: new Date().toISOString()
    });
  }

  // Handle generic errors
  static handleGenericError(err, res) {
    const isDevelopment = process.env.NODE_ENV === 'development';

    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Internal Server Error',
      message: isDevelopment ? err.message : ERROR_MESSAGES.SERVER_ERROR,
      ...(isDevelopment && { stack: err.stack }),
      timestamp: new Date().toISOString()
    });
  }

  // Handle 404 errors
  static notFound(req, res) {
    logger.warn('Route not found:', {
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    return res.status(HTTP_STATUS.NOT_FOUND).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.url} not found`,
      timestamp: new Date().toISOString()
    });
  }

  // Handle async errors
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  // Create custom error
  static createError(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, name = 'CustomError') {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.status = statusCode;
    error.name = name;
    return error;
  }

  // Handle operational errors vs programming errors
  static isOperationalError(error) {
    if (error.isOperational) {
      return true;
    }

    // Check for known operational error types
    const operationalErrors = [
      'ValidationError',
      'CastError',
      'MongoError',
      'MongoServerError',
      'JsonWebTokenError',
      'MulterError'
    ];

    return operationalErrors.includes(error.name) || 
           (error.status && error.status < 500);
  }

  // Log and exit for programming errors
  static handleProgrammingError(error) {
    logger.error('Programming error detected:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });

    // In production, we might want to restart the process
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  // Global error handlers for uncaught exceptions
  static setupGlobalHandlers() {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', {
        error: error.message,
        stack: error.stack
      });

      // Graceful shutdown
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection:', {
        reason: reason?.message || reason,
        stack: reason?.stack,
        promise: promise.toString()
      });

      // Graceful shutdown
      process.exit(1);
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      process.exit(0);
    });

    // Handle SIGINT
    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      process.exit(0);
    });
  }

  // Middleware to handle specific error types
  static handleSpecificError(errorType, handler) {
    return (err, req, res, next) => {
      if (err.name === errorType || err.constructor.name === errorType) {
        return handler(err, req, res, next);
      }
      next(err);
    };
  }

  // Rate limit error handler
  static handleRateLimitError(err, req, res, next) {
    if (err.status === 429) {
      logger.logSecurity('rate_limit_error', {
        ip: req.ip,
        url: req.url,
        userAgent: req.get('User-Agent')
      });

      return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        error: 'Rate Limit Exceeded',
        message: 'Too many requests, please try again later',
        retryAfter: err.retryAfter || 60,
        timestamp: new Date().toISOString()
      });
    }
    next(err);
  }

  // CORS error handler
  static handleCORSError(err, req, res, next) {
    if (err.message && err.message.includes('CORS')) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        error: 'CORS Error',
        message: 'Cross-origin request blocked',
        timestamp: new Date().toISOString()
      });
    }
    next(err);
  }

  // Timeout error handler
  static handleTimeoutError(err, req, res, next) {
    if (err.code === 'ETIMEDOUT' || err.message.includes('timeout')) {
      return res.status(HTTP_STATUS.REQUEST_TIMEOUT).json({
        error: 'Request Timeout',
        message: 'Request took too long to process',
        timestamp: new Date().toISOString()
      });
    }
    next(err);
  }

  // Create error response with additional context
  static createErrorResponse(error, req) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return {
      error: error.name || 'Error',
      message: error.message,
      statusCode: error.statusCode || error.status || HTTP_STATUS.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      path: req.url,
      method: req.method,
      ...(isDevelopment && {
        stack: error.stack,
        details: error.details
      })
    };
  }
}

// Setup global error handlers
ErrorHandler.setupGlobalHandlers();

module.exports = ErrorHandler;