const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get dashboard overview data
router.get('/overview', authenticateToken, dashboardController.getOverview);

// Get top performing states
router.get('/top-performers', authenticateToken, dashboardController.getTopPerformers);

// Get fiscal health indicators
router.get('/fiscal-health', authenticateToken, dashboardController.getFiscalHealth);

// Get comparative analysis
router.get('/comparative', authenticateToken, dashboardController.getComparativeAnalysis);

// Get real-time updates
router.get('/updates', authenticateToken, dashboardController.getRealTimeUpdates);

module.exports = router;