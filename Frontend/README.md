# AI-Powered Fiscal Intelligence Dashboard

A comprehensive full-stack web application for government fiscal data analysis, featuring AI-powered insights, real-time data visualization, and predictive analytics.

## 🚀 Features

- **Interactive Dashboards**: Real-time visualization of fiscal data with charts and graphs
- **AI-Powered Insights**: Capital generation suggestions using OpenAI integration
- **Multi-Source Data Integration**: Data.gov.in, World Bank, and MyGov API integration
- **Predictive Analytics**: ML forecasting for fiscal deficits and economic trends
- **Public Sentiment Analysis**: Social media sentiment tracking for policy decisions
- **Secure Authentication**: JWT-based user authentication system
- **Responsive Design**: Mobile-first design with modern UI components
- **State-wise Analytics**: Detailed analysis for Indian states

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **Recharts** for data visualization
- **Tailwind CSS** for styling
- **Lucide React** for icons

### Backend
- **Node.js** with Express.js
- **MongoDB** for database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Helmet** for security
- **CORS** for cross-origin requests

### AI/ML Integration
- **GORQ API** for AI insights
- **Custom NLP models** for sentiment analysis
- **Time-series forecasting** with Prophet/LSTM

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v16 or higher)
- **MongoDB** (v5 or higher)
- **npm** or **yarn**
- API keys for external services (see Environment Variables section)

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd fiscal-intelligence-dashboard
```

### 2. Install Dependencies
```bash
# Install all dependencies (frontend + backend)
npm install

# Or install separately
npm install --prefix server  # Backend dependencies
npm install                  # Frontend dependencies
```

### 3. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/fiscal_dashboard
DB_NAME=fiscal_dashboard

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_complex
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# External API Keys
DATA_GOV_IN_API_KEY=your_data_gov_in_api_key
WORLD_BANK_API_KEY=your_world_bank_api_key
MYGOV_API_KEY=your_mygov_api_key

# AI/ML Services
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-3.5-turbo

# Social Media APIs (for sentiment analysis)
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret

# ML Model Endpoints
ML_FORECAST_API_URL=http://localhost:8000/forecast
SENTIMENT_API_URL=http://localhost:8001/sentiment

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 4. Database Setup

Run the database setup script to create collections and sample data:

```bash
npm run setup-db
```

This will:
- Create MongoDB collections
- Set up indexes for performance
- Insert sample fiscal data for testing
- Create user roles and permissions

### 5. Start the Application

#### Development Mode (Recommended)
```bash
# Start both frontend and backend concurrently
npm start

# Or start separately
npm run dev          # Frontend (React)
npm run dev:server   # Backend (Express)
```

#### Production Mode
```bash
# Build frontend
npm run build

# Start production server
npm run server
```

## 📁 Project Structure

```
fiscal-intelligence-dashboard/
├── README.md
├── package.json
├── .env
├── database-setup.js
├── 
├── src/                          # Frontend React Application
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── ProtectedRoute.tsx
│   │   └── charts/
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── StateAnalytics.tsx
│   │   ├── FiscalPerformance.tsx
│   │   ├── Infrastructure.tsx
│   │   ├── AIInsights.tsx
│   │   ├── SentimentTracking.tsx
│   │   └── Login.tsx
│   ├── utils/
│   ├── types/
│   ├── App.tsx
│   ├── App.css
│   └── main.tsx
│
├── server/                       # Backend Express Application
│   ├── app.js                   # Main server file
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   └── constants.js         # App constants
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── fiscalController.js  # Fiscal data logic
│   │   ├── aiController.js      # AI insights logic
│   │   └── dashboardController.js
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── validation.js        # Input validation
│   │   ├── rateLimiting.js      # API rate limiting
│   │   └── errorHandler.js      # Error handling
│   ├── models/
│   │   ├── User.js              # User data model
│   │   ├── FiscalData.js        # Fiscal data model
│   │   └── AIInsight.js         # AI insights model
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── fiscal.js            # Fiscal data routes
│   │   ├── ai.js                # AI insights routes
│   │   ├── dashboard.js         # Dashboard routes
│   │   └── external.js          # External API routes
│   ├── services/
│   │   ├── dataGovService.js    # Data.gov.in integration
│   │   ├── worldBankService.js  # World Bank API
│   │   ├── myGovService.js      # MyGov API
│   │   ├── openAIService.js     # OpenAI integration
│   │   └── sentimentService.js  # Sentiment analysis
│   └── utils/
│       ├── helpers.js           # Utility functions
│       ├── validators.js        # Data validators
│       └── logger.js            # Logging utility
│
└── docs/                        # Documentation
    ├── API.md                   # API documentation
    ├── DEPLOYMENT.md            # Deployment guide
    └── CONTRIBUTING.md          # Contribution guidelines
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Fiscal Data
- `GET /api/fiscal/states` - Get all states fiscal data
- `GET /api/fiscal/states/:stateCode` - Get specific state data
- `GET /api/fiscal/infrastructure` - Get infrastructure data
- `POST /api/fiscal/external/refresh` - Refresh external data

### AI Insights
- `POST /api/ai/suggestions` - Generate capital suggestions
- `GET /api/ai/suggestions/:stateCode` - Get historical suggestions
- `GET /api/ai/sentiment/:stateCode` - Get sentiment analysis
- `POST /api/ai/forecast` - Generate ML forecasts

### Dashboard
- `GET /api/dashboard/overview` - Dashboard overview data
- `GET /api/dashboard/top-performers` - Top performing states
- `GET /api/dashboard/fiscal-health` - Fiscal health indicators

## 🔑 External API Integration

### Required API Keys

1. **Data.gov.in API**
   - Register at: https://data.gov.in/
   - Documentation: https://data.gov.in/help/api

2. **World Bank API**
   - Register at: https://datahelpdesk.worldbank.org/
   - Documentation: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392

3. **MyGov API**
   - Register at: https://www.mygov.in/
   - Contact MyGov team for API access

4. **OpenAI API**
   - Register at: https://platform.openai.com/
   - Get API key from: https://platform.openai.com/api-keys

## 🧪 Testing

```bash
# Run frontend tests
npm test

# Run backend tests
npm run test:server

# Run all tests
npm run test:all
```

## 🚀 Deployment

### Using Docker
```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Manual Deployment
1. Set environment variables for production
2. Build the frontend: `npm run build`
3. Start the server: `npm run server`

### Environment-specific Configurations

#### Development
- Hot reloading enabled
- Detailed error messages
- Debug logging

#### Production
- Minified assets
- Error logging only
- Security headers enabled

## 📊 Data Sources

The application integrates with multiple data sources:

1. **Government APIs**
   - Data.gov.in for official government data
   - MyGov for policy announcements
   - State government portals

2. **International Sources**
   - World Bank economic indicators
   - IMF fiscal data
   - UN development metrics

3. **Social Media**
   - Twitter for public sentiment
   - Reddit for policy discussions
   - News APIs for media sentiment

## 🤖 AI Features

### Capital Generation Suggestions
- Analyzes fiscal patterns using OpenAI GPT models
- Suggests infrastructure projects and revenue streams
- Evaluates feasibility based on historical data

### Sentiment Analysis
- Real-time social media monitoring
- Policy impact assessment
- Public opinion tracking

### Predictive Analytics
- Fiscal deficit forecasting
- Economic trend prediction
- Budget allocation optimization

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- Helmet.js security headers

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Start MongoDB
   sudo systemctl start mongod
   ```

2. **API Key Issues**
   - Verify all API keys in `.env` file
   - Check API quotas and limits
   - Ensure proper API permissions

3. **Port Conflicts**
   - Frontend runs on port 5173
   - Backend runs on port 3001
   - MongoDB runs on port 27017

### Debug Mode
```bash
# Enable debug logging
DEBUG=fiscal:* npm start
```

## 📈 Performance Optimization

- Database indexing for faster queries
- API response caching
- Image optimization
- Code splitting for frontend
- Gzip compression

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@fiscaldashboard.com
- Documentation: https://docs.fiscaldashboard.com

## 🙏 Acknowledgments

- Government of India for open data initiatives
- World Bank for economic data access
- OpenAI for AI capabilities
- React and Node.js communities

---

**Note**: This application is designed for educational and research purposes. Ensure compliance with all relevant data protection and government regulations when deploying in production environments.