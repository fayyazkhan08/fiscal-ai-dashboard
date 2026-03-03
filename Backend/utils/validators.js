const { VALIDATION, INDIAN_STATES } = require('../config/constants');

// Email validation
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return VALIDATION.EMAIL_REGEX.test(email.trim().toLowerCase());
}

// Password validation
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return false;
  }
  return password.length >= VALIDATION.PASSWORD_MIN_LENGTH;
}

// State code validation
function validateStateCode(stateCode) {
  if (!stateCode || typeof stateCode !== 'string') {
    return false;
  }
  return VALIDATION.STATE_CODE_REGEX.test(stateCode.toUpperCase()) && 
         INDIAN_STATES.hasOwnProperty(stateCode.toUpperCase());
}

// Phone number validation (Indian format)
function validatePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  return VALIDATION.PHONE_REGEX.test(phone.replace(/\s+/g, ''));
}

// Fiscal year validation
function validateFiscalYear(year) {
  const currentYear = new Date().getFullYear();
  const numYear = parseInt(year);
  return numYear >= 2000 && numYear <= currentYear + 5;
}

// Amount validation (positive number)
function validateAmount(amount) {
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount >= 0;
}

// Date validation
function validateDate(dateString) {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// URL validation
function validateURL(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Percentage validation (0-100)
function validatePercentage(percentage) {
  const numPercentage = parseFloat(percentage);
  return !isNaN(numPercentage) && numPercentage >= 0 && numPercentage <= 100;
}

// Object ID validation (MongoDB ObjectId format)
function validateObjectId(id) {
  if (!id || typeof id !== 'string') {
    return false;
  }
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// Sanitize string input
function sanitizeString(input, maxLength = 1000) {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\s+/g, ' '); // Normalize whitespace
}

// Validate pagination parameters
function validatePagination(page, limit) {
  const numPage = parseInt(page) || 1;
  const numLimit = parseInt(limit) || 10;
  
  return {
    page: Math.max(1, numPage),
    limit: Math.min(100, Math.max(1, numLimit)) // Max 100 items per page
  };
}

// Validate sort parameters
function validateSort(sortBy, allowedFields = []) {
  if (!sortBy || typeof sortBy !== 'string') {
    return { field: 'createdAt', order: -1 };
  }
  
  const [field, order] = sortBy.split(':');
  
  if (!allowedFields.includes(field)) {
    return { field: 'createdAt', order: -1 };
  }
  
  return {
    field,
    order: order === 'asc' ? 1 : -1
  };
}

// Validate file upload
function validateFileUpload(file, allowedTypes = [], maxSize = 5 * 1024 * 1024) {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
    return { valid: false, error: 'Invalid file type' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large' };
  }
  
  return { valid: true };
}

// Validate search query
function validateSearchQuery(query) {
  if (!query || typeof query !== 'string') {
    return '';
  }
  
  return query
    .trim()
    .slice(0, 100) // Limit search query length
    .replace(/[^\w\s-]/g, '') // Allow only alphanumeric, spaces, and hyphens
    .replace(/\s+/g, ' '); // Normalize whitespace
}

// Validate coordinate (latitude/longitude)
function validateCoordinate(coord, type = 'latitude') {
  const numCoord = parseFloat(coord);
  if (isNaN(numCoord)) return false;
  
  if (type === 'latitude') {
    return numCoord >= -90 && numCoord <= 90;
  } else if (type === 'longitude') {
    return numCoord >= -180 && numCoord <= 180;
  }
  
  return false;
}

// Validate JSON string
function validateJSON(jsonString) {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

// Validate array of values
function validateArray(arr, validator, maxLength = 100) {
  if (!Array.isArray(arr)) {
    return false;
  }
  
  if (arr.length > maxLength) {
    return false;
  }
  
  return arr.every(validator);
}

// Comprehensive input validation middleware
function validateInput(schema) {
  return (req, res, next) => {
    const errors = [];
    
    Object.keys(schema).forEach(field => {
      const rules = schema[field];
      const value = req.body[field];
      
      // Check required fields
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        return;
      }
      
      // Skip validation if field is not required and not provided
      if (!rules.required && (value === undefined || value === null || value === '')) {
        return;
      }
      
      // Type validation
      if (rules.type && typeof value !== rules.type) {
        errors.push(`${field} must be of type ${rules.type}`);
        return;
      }
      
      // Custom validator
      if (rules.validator && !rules.validator(value)) {
        errors.push(rules.message || `${field} is invalid`);
      }
      
      // Length validation for strings
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters long`);
      }
      
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`${field} must be no more than ${rules.maxLength} characters long`);
      }
      
      // Range validation for numbers
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${field} must be at least ${rules.min}`);
      }
      
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${field} must be no more than ${rules.max}`);
      }
    });
    
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    next();
  };
}

module.exports = {
  validateEmail,
  validatePassword,
  validateStateCode,
  validatePhoneNumber,
  validateFiscalYear,
  validateAmount,
  validateDate,
  validateURL,
  validatePercentage,
  validateObjectId,
  sanitizeString,
  validatePagination,
  validateSort,
  validateFileUpload,
  validateSearchQuery,
  validateCoordinate,
  validateJSON,
  validateArray,
  validateInput
};