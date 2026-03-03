// Application constants and configuration
module.exports = {
  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
  },

  // User Roles
  USER_ROLES: {
    ADMIN: 'admin',
    ANALYST: 'analyst',
    USER: 'user',
    VIEWER: 'viewer'
  },

  // Indian States
  INDIAN_STATES: {
    'MH': 'Maharashtra',
    'KA': 'Karnataka',
    'TN': 'Tamil Nadu',
    'GJ': 'Gujarat',
    'UP': 'Uttar Pradesh',
    'RJ': 'Rajasthan',
    'WB': 'West Bengal',
    'AP': 'Andhra Pradesh',
    'TG': 'Telangana',
    'KL': 'Kerala',
    'OR': 'Odisha',
    'JH': 'Jharkhand',
    'AS': 'Assam',
    'PB': 'Punjab',
    'CT': 'Chhattisgarh',
    'HR': 'Haryana',
    'DL': 'Delhi',
    'JK': 'Jammu and Kashmir',
    'UK': 'Uttarakhand',
    'HP': 'Himachal Pradesh',
    'TR': 'Tripura',
    'ML': 'Meghalaya',
    'MN': 'Manipur',
    'NL': 'Nagaland',
    'GA': 'Goa',
    'AR': 'Arunachal Pradesh',
    'MZ': 'Mizoram',
    'SK': 'Sikkim'
  },

  // Infrastructure Categories
  INFRASTRUCTURE_CATEGORIES: [
    'Transportation',
    'Energy',
    'Water',
    'Digital',
    'Healthcare',
    'Education',
    'Urban Development',
    'Rural Development'
  ],

  // Policy Areas for Sentiment Analysis
  POLICY_AREAS: [
    'Budget Allocation',
    'Infrastructure Spending',
    'Digital Initiatives',
    'Healthcare',
    'Education',
    'Employment',
    'Agriculture',
    'Environment',
    'Social Welfare',
    'Economic Policy'
  ],

  // API Rate Limits
  RATE_LIMITS: {
    GENERAL: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    },
    AUTH: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5 // limit each IP to 5 requests per windowMs
    },
    AI: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 50 // limit each IP to 50 AI requests per hour
    }
  },

  // External API Endpoints
  EXTERNAL_APIS: {
    DATA_GOV_IN: 'https://api.data.gov.in/resource',
    WORLD_BANK: 'https://api.worldbank.org/v2',
    MYGOV: 'https://api.mygov.in/v1',
    OPENAI: 'https://api.groq.com/openai/v1'
  },

  // Database Collections
  COLLECTIONS: {
    USERS: 'users',
    STATES: 'states',
    FISCAL_DATA: 'fiscal_data',
    INFRASTRUCTURE_DATA: 'infrastructure_data',
    SENTIMENT_DATA: 'sentiment_data',
    AI_SUGGESTIONS: 'ai_suggestions',
    FORECASTS: 'forecasts',
    AUDIT_LOGS: 'audit_logs'
  },

  // Validation Rules
  VALIDATION: {
    PASSWORD_MIN_LENGTH: 8,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    STATE_CODE_REGEX: /^[A-Z]{2}$/,
    PHONE_REGEX: /^[6-9]\d{9}$/
  },

  // File Upload Limits
  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf', 'text/csv']
  },

  // Cache TTL (Time To Live) in seconds
  CACHE_TTL: {
    FISCAL_DATA: 3600, // 1 hour
    EXTERNAL_API: 1800, // 30 minutes
    USER_SESSION: 86400, // 24 hours
    AI_SUGGESTIONS: 7200 // 2 hours
  },

  // Error Messages
  ERROR_MESSAGES: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_NOT_FOUND: 'User not found',
    USER_ALREADY_EXISTS: 'User already exists',
    UNAUTHORIZED_ACCESS: 'Unauthorized access',
    INVALID_TOKEN: 'Invalid or expired token',
    VALIDATION_ERROR: 'Validation error',
    SERVER_ERROR: 'Internal server error',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
    INVALID_STATE_CODE: 'Invalid state code',
    DATA_NOT_FOUND: 'Data not found',
    EXTERNAL_API_ERROR: 'External API error'
  },

  // Success Messages
  SUCCESS_MESSAGES: {
    USER_CREATED: 'User created successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    DATA_UPDATED: 'Data updated successfully',
    DATA_DELETED: 'Data deleted successfully',
    EMAIL_SENT: 'Email sent successfully'
  }
};