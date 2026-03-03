const express = require('express');
const fiscalController = require('../controllers/fiscalController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get fiscal data for all states
router.get('/states', authenticateToken, fiscalController.getAllStatesData);

// Get specific state data
router.get('/states/:stateCode', authenticateToken, fiscalController.getStateData);

// Infrastructure spending data
router.get('/infrastructure', authenticateToken, fiscalController.getInfrastructureData);

// Refresh data from external APIs
router.post('/external/refresh', authenticateToken, fiscalController.refreshExternalData);

// Get fiscal trends
router.get('/trends', authenticateToken, fiscalController.getFiscalTrends);

// Get budget allocation for a state
router.get('/budget/:stateCode', authenticateToken, fiscalController.getBudgetAllocation);

module.exports = router;