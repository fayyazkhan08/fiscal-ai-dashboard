const express = require('express');
const aiController = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate AI suggestions for capital generation
router.post('/suggestions', authenticateToken, aiController.generateSuggestions);

// Get historical AI suggestions
router.get('/suggestions/:stateCode', authenticateToken, aiController.getHistoricalSuggestions);

// Sentiment analysis for public policies
router.get('/sentiment/:stateCode', authenticateToken, aiController.getSentimentAnalysis);

// Forecast generation using ML models
router.post('/forecast', authenticateToken, aiController.generateForecast);

// Get AI insights summary
router.get('/insights/:stateCode', authenticateToken, aiController.getAIInsightsSummary);

module.exports = router;