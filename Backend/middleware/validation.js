const { validateInput } = require('../utils/validators');
const { HTTP_STATUS } = require('../config/constants');

// User registration validation schema
const userRegistrationSchema = {
  name: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    message: 'Name must be between 2 and 100 characters'
  },
  email: {
    required: true,
    type: 'string',
    validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Please provide a valid email address'
  },
  password: {
    required: true,
    type: 'string',
    minLength: 8,
    validator: (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value),
    message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
  },
  organization: {
    required: false,
    type: 'string',
    maxLength: 200,
    message: 'Organization name must be less than 200 characters'
  }
};

// User login validation schema
const userLoginSchema = {
  email: {
    required: true,
    type: 'string',
    validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Please provide a valid email address'
  },
  password: {
    required: true,
    type: 'string',
    minLength: 1,
    message: 'Password is required'
  }
};

// AI suggestions validation schema
const aiSuggestionsSchema = {
  stateCode: {
    required: true,
    type: 'string',
    validator: (value) => /^[A-Z]{2}$/.test(value),
    message: 'State code must be a valid 2-letter code'
  },
  fiscalData: {
    required: false,
    type: 'object'
  },
  preferences: {
    required: false,
    type: 'object'
  }
};

// Forecast generation validation schema
const forecastSchema = {
  stateCode: {
    required: true,
    type: 'string',
    validator: (value) => /^[A-Z]{2}$/.test(value),
    message: 'State code must be a valid 2-letter code'
  },
  metric: {
    required: true,
    type: 'string',
    validator: (value) => ['fiscalDeficit', 'revenue', 'expenditure', 'gsdpGrowth'].includes(value),
    message: 'Metric must be one of: fiscalDeficit, revenue, expenditure, gsdpGrowth'
  },
  timeframe: {
    required: true,
    type: 'string',
    validator: (value) => {
      const num = parseInt(value);
      return num >= 1 && num <= 60;
    },
    message: 'Timeframe must be between 1 and 60 months'
  },
  modelType: {
    required: false,
    type: 'string',
    validator: (value) => ['lstm', 'prophet', 'arima'].includes(value),
    message: 'Model type must be one of: lstm, prophet, arima'
  }
};

// Budget allocation validation schema
const budgetAllocationSchema = {
  category: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    message: 'Category must be between 2 and 100 characters'
  },
  amount: {
    required: true,
    type: 'number',
    min: 0,
    message: 'Amount must be a positive number'
  },
  year: {
    required: true,
    type: 'number',
    min: 2000,
    max: 2030,
    message: 'Year must be between 2000 and 2030'
  },
  description: {
    required: false,
    type: 'string',
    maxLength: 500,
    message: 'Description must be less than 500 characters'
  }
};

// Infrastructure project validation schema
const infrastructureProjectSchema = {
  projectName: {
    required: true,
    type: 'string',
    minLength: 5,
    maxLength: 200,
    message: 'Project name must be between 5 and 200 characters'
  },
  state: {
    required: true,
    type: 'string',
    validator: (value) => /^[A-Z]{2}$/.test(value),
    message: 'State must be a valid 2-letter code'
  },
  category: {
    required: true,
    type: 'string',
    validator: (value) => [
      'Transportation', 'Energy', 'Water', 'Digital', 
      'Healthcare', 'Education', 'Urban Development', 'Rural Development'
    ].includes(value),
    message: 'Category must be a valid infrastructure category'
  },
  cost: {
    required: true,
    type: 'number',
    min: 1000,
    message: 'Cost must be at least 1000'
  },
  startDate: {
    required: true,
    type: 'string',
    validator: (value) => !isNaN(Date.parse(value)),
    message: 'Start date must be a valid date'
  },
  expectedCompletion: {
    required: true,
    type: 'string',
    validator: (value) => !isNaN(Date.parse(value)),
    message: 'Expected completion must be a valid date'
  }
};

// Query parameter validation schema
const queryParamsSchema = {
  page: {
    required: false,
    type: 'string',
    validator: (value) => {
      const num = parseInt(value);
      return num >= 1;
    },
    message: 'Page must be a positive integer'
  },
  limit: {
    required: false,
    type: 'string',
    validator: (value) => {
      const num = parseInt(value);
      return num >= 1 && num <= 100;
    },
    message: 'Limit must be between 1 and 100'
  },
  sortBy: {
    required: false,
    type: 'string',
    validator: (value) => /^[a-zA-Z_]+:(asc|desc)$/.test(value),
    message: 'Sort format must be field:asc or field:desc'
  },
  search: {
    required: false,
    type: 'string',
    maxLength: 100,
    message: 'Search query must be less than 100 characters'
  }
};

// File upload validation
const validateFileUpload = (allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next(); // No file uploaded, continue
    }

    const files = req.files || [req.file];
    
    for (const file of files) {
      // Check file type
      if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Invalid file type',
          allowedTypes
        });
      }

      // Check file size
      if (file.size > maxSize) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'File too large',
          maxSize: `${maxSize / (1024 * 1024)}MB`
        });
      }

      // Check for malicious file names
      if (/[<>:"/\\|?*]/.test(file.originalname)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          error: 'Invalid file name'
        });
      }
    }

    next();
  };
};

// Sanitize request body
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const sanitizeValue = (value) => {
      if (typeof value === 'string') {
        return value
          .trim()
          .replace(/[<>]/g, '') // Remove potential HTML tags
          .slice(0, 10000); // Limit string length
      }
      if (typeof value === 'object' && value !== null) {
        const sanitized = {};
        Object.keys(value).forEach(key => {
          if (key.length <= 100) { // Limit key length
            sanitized[key] = sanitizeValue(value[key]);
          }
        });
        return sanitized;
      }
      return value;
    };

    req.body = sanitizeValue(req.body);
  }
  next();
};

// Rate limiting validation
const validateRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart);
      requests.set(key, userRequests);
    } else {
      requests.set(key, []);
    }

    const userRequests = requests.get(key);

    if (userRequests.length >= max) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    userRequests.push(now);
    requests.set(key, userRequests);
    next();
  };
};

// Custom validation middleware factory
const createValidationMiddleware = (schema) => {
  return validateInput(schema);
};

// Validate state code parameter
const validateStateParam = (req, res, next) => {
  const { stateCode } = req.params;
  
  if (!stateCode || !/^[A-Z]{2}$/.test(stateCode)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Invalid state code. Must be a 2-letter uppercase code.'
    });
  }
  
  next();
};

// Validate date range parameters
const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;
  
  if (startDate && isNaN(Date.parse(startDate))) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Invalid start date format'
    });
  }
  
  if (endDate && isNaN(Date.parse(endDate))) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Invalid end date format'
    });
  }
  
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Start date must be before end date'
    });
  }
  
  next();
};

// Validate pagination parameters
const validatePagination = (req, res, next) => {
  let { page = 1, limit = 10 } = req.query;
  
  page = parseInt(page);
  limit = parseInt(limit);
  
  if (isNaN(page) || page < 1) {
    page = 1;
  }
  
  if (isNaN(limit) || limit < 1 || limit > 100) {
    limit = 10;
  }
  
  req.pagination = { page, limit };
  next();
};

// Export validation middleware
module.exports = {
  // Schema-based validation
  validateUserRegistration: createValidationMiddleware(userRegistrationSchema),
  validateUserLogin: createValidationMiddleware(userLoginSchema),
  validateAISuggestions: createValidationMiddleware(aiSuggestionsSchema),
  validateForecast: createValidationMiddleware(forecastSchema),
  validateBudgetAllocation: createValidationMiddleware(budgetAllocationSchema),
  validateInfrastructureProject: createValidationMiddleware(infrastructureProjectSchema),
  validateQueryParams: createValidationMiddleware(queryParamsSchema),
  
  // Custom validation middleware
  validateFileUpload,
  sanitizeBody,
  validateRateLimit,
  validateStateParam,
  validateDateRange,
  validatePagination,
  createValidationMiddleware,
  
  // Validation schemas for reuse
  schemas: {
    userRegistrationSchema,
    userLoginSchema,
    aiSuggestionsSchema,
    forecastSchema,
    budgetAllocationSchema,
    infrastructureProjectSchema,
    queryParamsSchema
  }
};