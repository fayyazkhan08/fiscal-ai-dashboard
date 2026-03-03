const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const dataGovService = require('../services/dataGovService');
const worldBankService = require('../services/worldBankService');
const myGovService = require('../services/myGovService');
const { HTTP_STATUS } = require('../config/constants');
const logger = require('../utils/logger');

const router = express.Router();

// Get status of all external APIs
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const [dataGovStatus, worldBankStatus, myGovStatus] = await Promise.allSettled([
      dataGovService.getAPIStatus(),
      worldBankService.getAPIStatus(),
      myGovService.getAPIStatus()
    ]);

    const status = {
      dataGovIn: dataGovStatus.status === 'fulfilled' ? dataGovStatus.value : { status: 'error', error: dataGovStatus.reason?.message },
      worldBank: worldBankStatus.status === 'fulfilled' ? worldBankStatus.value : { status: 'error', error: worldBankStatus.reason?.message },
      myGov: myGovStatus.status === 'fulfilled' ? myGovStatus.value : { status: 'error', error: myGovStatus.reason?.message },
      lastChecked: new Date()
    };

    res.json(status);
  } catch (error) {
    logger.error('Error checking external API status:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to check API status'
    });
  }
});

// Refresh all external data
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const results = {
      dataGovIn: null,
      worldBank: null,
      myGov: null,
      errors: []
    };

    // Fetch from Data.gov.in
    try {
      results.dataGovIn = await dataGovService.fetchFiscalData();
      logger.info('Successfully refreshed data from Data.gov.in');
    } catch (error) {
      logger.error('Data.gov.in refresh error:', error);
      results.errors.push('Data.gov.in API error');
    }

    // Fetch from World Bank
    try {
      results.worldBank = await worldBankService.fetchIndiaEconomicData();
      logger.info('Successfully refreshed data from World Bank');
    } catch (error) {
      logger.error('World Bank refresh error:', error);
      results.errors.push('World Bank API error');
    }

    // Fetch from MyGov
    try {
      results.myGov = await myGovService.fetchPolicyData();
      logger.info('Successfully refreshed data from MyGov');
    } catch (error) {
      logger.error('MyGov refresh error:', error);
      results.errors.push('MyGov API error');
    }

    res.json({
      message: 'External data refresh completed',
      timestamp: new Date(),
      results: {
        successful: 3 - results.errors.length,
        failed: results.errors.length,
        errors: results.errors
      },
      data: {
        dataGovIn: results.dataGovIn ? 'Updated' : 'Failed',
        worldBank: results.worldBank ? 'Updated' : 'Failed',
        myGov: results.myGov ? 'Updated' : 'Failed'
      }
    });
  } catch (error) {
    logger.error('Error refreshing external data:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to refresh external data'
    });
  }
});

// Get Data.gov.in fiscal data
router.get('/data-gov/fiscal', authenticateToken, async (req, res) => {
  try {
    const data = await dataGovService.fetchFiscalData();
    res.json({
      source: 'Data.gov.in',
      data,
      lastUpdated: new Date()
    });
  } catch (error) {
    logger.error('Error fetching Data.gov.in fiscal data:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch Data.gov.in fiscal data'
    });
  }
});

// Get Data.gov.in infrastructure data
router.get('/data-gov/infrastructure', authenticateToken, async (req, res) => {
  try {
    const data = await dataGovService.fetchInfrastructureData();
    res.json({
      source: 'Data.gov.in',
      data,
      lastUpdated: new Date()
    });
  } catch (error) {
    logger.error('Error fetching Data.gov.in infrastructure data:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch Data.gov.in infrastructure data'
    });
  }
});

// Get World Bank economic data
router.get('/world-bank/economic', authenticateToken, async (req, res) => {
  try {
    const data = await worldBankService.fetchIndiaEconomicData();
    res.json({
      source: 'World Bank',
      data,
      lastUpdated: new Date()
    });
  } catch (error) {
    logger.error('Error fetching World Bank economic data:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch World Bank economic data'
    });
  }
});

// Get World Bank fiscal indicators
router.get('/world-bank/fiscal', authenticateToken, async (req, res) => {
  try {
    const data = await worldBankService.fetchFiscalIndicators();
    res.json({
      source: 'World Bank',
      data,
      lastUpdated: new Date()
    });
  } catch (error) {
    logger.error('Error fetching World Bank fiscal indicators:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch World Bank fiscal indicators'
    });
  }
});

// Get MyGov policy data
router.get('/mygov/policies', authenticateToken, async (req, res) => {
  try {
    const data = await myGovService.fetchPolicyData();
    res.json({
      source: 'MyGov',
      data,
      lastUpdated: new Date()
    });
  } catch (error) {
    logger.error('Error fetching MyGov policy data:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch MyGov policy data'
    });
  }
});

// Get MyGov announcements
router.get('/mygov/announcements', authenticateToken, async (req, res) => {
  try {
    const data = await myGovService.fetchAnnouncements();
    res.json({
      source: 'MyGov',
      data,
      lastUpdated: new Date()
    });
  } catch (error) {
    logger.error('Error fetching MyGov announcements:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch MyGov announcements'
    });
  }
});

// Get MyGov budget documents
router.get('/mygov/budget/:year?', authenticateToken, async (req, res) => {
  try {
    const year = req.params.year || new Date().getFullYear();
    const data = await myGovService.fetchBudgetDocuments(year);
    res.json({
      source: 'MyGov',
      year: parseInt(year),
      data,
      lastUpdated: new Date()
    });
  } catch (error) {
    logger.error('Error fetching MyGov budget documents:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to fetch MyGov budget documents'
    });
  }
});

// Get combined external data summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const summary = {
      dataSources: {
        dataGovIn: {
          status: 'active',
          lastUpdate: new Date(),
          dataTypes: ['fiscal', 'infrastructure', 'economic']
        },
        worldBank: {
          status: 'active',
          lastUpdate: new Date(),
          dataTypes: ['economic', 'fiscal', 'development']
        },
        myGov: {
          status: 'active',
          lastUpdate: new Date(),
          dataTypes: ['policies', 'announcements', 'budget']
        }
      },
      integrationHealth: {
        overall: 'healthy',
        issues: [],
        lastHealthCheck: new Date()
      },
      dataFreshness: {
        fiscal: 'current',
        economic: 'current',
        policy: 'current'
      }
    };

    res.json(summary);
  } catch (error) {
    logger.error('Error generating external data summary:', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: 'Failed to generate external data summary'
    });
  }
});

module.exports = router;