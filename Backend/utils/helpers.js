const crypto = require('crypto');
const { INDIAN_STATES } = require('../config/constants');

// Generate random string
function generateRandomString(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Generate UUID v4
function generateUUID() {
  return crypto.randomUUID();
}

// Hash string using SHA256
function hashString(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

// Format currency in Indian format
function formatCurrency(amount, currency = 'INR') {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount) || 0;
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(amount);
}

// Format large numbers in Indian format (Lakhs/Crores)
function formatIndianNumber(num) {
  if (typeof num !== 'number') {
    num = parseFloat(num) || 0;
  }

  if (num >= 10000000) { // 1 Crore
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  } else if (num >= 100000) { // 1 Lakh
    return `₹${(num / 100000).toFixed(2)} L`;
  } else if (num >= 1000) { // 1 Thousand
    return `₹${(num / 1000).toFixed(2)} K`;
  } else {
    return `₹${num.toFixed(2)}`;
  }
}

// Calculate percentage change
function calculatePercentageChange(current, previous) {
  if (!previous || previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// Calculate growth rate
function calculateGrowthRate(values) {
  if (!Array.isArray(values) || values.length < 2) return 0;
  
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const periods = values.length - 1;
  
  if (firstValue <= 0) return 0;
  
  return (Math.pow(lastValue / firstValue, 1 / periods) - 1) * 100;
}

// Calculate moving average
function calculateMovingAverage(data, window = 3) {
  if (!Array.isArray(data) || data.length < window) return data;
  
  const result = [];
  for (let i = window - 1; i < data.length; i++) {
    const sum = data.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / window);
  }
  
  return result;
}

// Calculate standard deviation
function calculateStandardDeviation(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
  const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / values.length;
  
  return Math.sqrt(variance);
}

// Get state name from code
function getStateName(stateCode) {
  return INDIAN_STATES[stateCode?.toUpperCase()] || stateCode;
}

// Get state code from name
function getStateCode(stateName) {
  const entry = Object.entries(INDIAN_STATES).find(([code, name]) => 
    name.toLowerCase() === stateName.toLowerCase()
  );
  return entry ? entry[0] : null;
}

// Validate and parse date
function parseDate(dateInput) {
  if (!dateInput) return null;
  
  const date = new Date(dateInput);
  return isNaN(date.getTime()) ? null : date;
}

// Format date for display
function formatDate(date, format = 'short') {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const options = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric' },
    time: { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }
  };
  
  return dateObj.toLocaleDateString('en-IN', options[format] || options.short);
}

// Get financial year from date
function getFinancialYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-based
  
  // Financial year in India: April 1 to March 31
  if (month >= 3) { // April onwards
    return `${year}-${year + 1}`;
  } else { // January to March
    return `${year - 1}-${year}`;
  }
}

// Get quarter from date
function getQuarter(date = new Date()) {
  const month = date.getMonth(); // 0-based
  return Math.floor(month / 3) + 1;
}

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Deep clone object
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
}

// Merge objects deeply
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

// Capitalize first letter
function capitalize(str) {
  if (!str || typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Convert to title case
function toTitleCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/\w\S*/g, txt => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

// Generate slug from string
function generateSlug(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Check if value is empty
function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

// Get nested object property safely
function getNestedProperty(obj, path, defaultValue = null) {
  if (!obj || !path) return defaultValue;
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined || !current.hasOwnProperty(key)) {
      return defaultValue;
    }
    current = current[key];
  }
  
  return current;
}

// Set nested object property
function setNestedProperty(obj, path, value) {
  if (!obj || !path) return obj;
  
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
  return obj;
}

// Retry function with exponential backoff
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries - 1) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Generate pagination metadata
function generatePaginationMeta(page, limit, total) {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
    nextPage: hasNext ? page + 1 : null,
    prevPage: hasPrev ? page - 1 : null
  };
}

// Calculate fiscal health score
function calculateFiscalHealthScore(fiscalData) {
  const {
    revenue = 0,
    expenditure = 0,
    fiscalDeficit = 0,
    gsdpGrowth = 0
  } = fiscalData;
  
  // Calculate various ratios
  const deficitRatio = revenue > 0 ? (fiscalDeficit / revenue) * 100 : 100;
  const efficiency = expenditure > 0 ? (revenue / expenditure) * 100 : 0;
  const growth = parseFloat(gsdpGrowth) || 0;
  
  // Scoring weights
  const deficitWeight = 0.4;
  const efficiencyWeight = 0.3;
  const growthWeight = 0.3;
  
  // Calculate scores (0-100)
  const deficitScore = Math.max(0, 100 - (deficitRatio * 10)); // Lower deficit is better
  const efficiencyScore = Math.min(100, efficiency); // Higher efficiency is better
  const growthScore = Math.min(100, growth * 10); // Higher growth is better
  
  const totalScore = (
    deficitScore * deficitWeight +
    efficiencyScore * efficiencyWeight +
    growthScore * growthWeight
  );
  
  return {
    totalScore: Math.round(totalScore),
    deficitScore: Math.round(deficitScore),
    efficiencyScore: Math.round(efficiencyScore),
    growthScore: Math.round(growthScore),
    grade: getGrade(totalScore)
  };
}

// Get grade from score
function getGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B+';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C+';
  if (score >= 40) return 'C';
  return 'D';
}

// Export all helper functions
module.exports = {
  generateRandomString,
  generateUUID,
  hashString,
  formatCurrency,
  formatIndianNumber,
  calculatePercentageChange,
  calculateGrowthRate,
  calculateMovingAverage,
  calculateStandardDeviation,
  getStateName,
  getStateCode,
  parseDate,
  formatDate,
  getFinancialYear,
  getQuarter,
  debounce,
  throttle,
  deepClone,
  deepMerge,
  capitalize,
  toTitleCase,
  generateSlug,
  isEmpty,
  getNestedProperty,
  setNestedProperty,
  retryWithBackoff,
  generatePaginationMeta,
  calculateFiscalHealthScore,
  getGrade
};