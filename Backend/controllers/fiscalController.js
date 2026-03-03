const dataGovService = require('../services/dataGovService');

class FiscalController {
  async getAllStatesData(req, res) {
    try {
      console.log('🗺️  Fetching all states fiscal data...');
      const data = await dataGovService.fetchStateFiscalData();
      
      console.log(`✅ Retrieved data for ${data.length} states`);
      res.json(data);
    } catch (error) {
      console.error('❌ Error fetching all states data:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  async getStateData(req, res) {
    try {
      const { stateCode } = req.params;
      console.log(`🏛️  Fetching data for state: ${stateCode}`);
      
      const allData = await dataGovService.fetchStateFiscalData();
      const stateData = allData.find(state => state.state === stateCode.toUpperCase());
      
      if (!stateData) {
        return res.status(404).json({
          error: 'State data not found',
          stateCode: stateCode
        });
      }

      // Add detailed breakdown
      const detailedData = {
        ...stateData,
        revenueBreakdown: {
          taxRevenue: Math.floor(stateData.revenue * 0.7),
          nonTaxRevenue: Math.floor(stateData.revenue * 0.2),
          grants: Math.floor(stateData.revenue * 0.1)
        },
        expenditureBreakdown: {
          capitalExpenditure: Math.floor(stateData.expenditure * 0.3),
          revenueExpenditure: Math.floor(stateData.expenditure * 0.7)
        },
        fiscalIndicators: {
          debtToGSDP: stateData.revenue > 0 ? ((stateData.fiscalDeficit / stateData.revenue) * 100).toFixed(2) : '0.00',
          revenueDeficit: Math.max(0, stateData.expenditure - stateData.revenue),
          primaryDeficit: stateData.fiscalDeficit - (stateData.revenue * 0.05)
        }
      };

      console.log(`✅ State data retrieved for ${stateCode}`);
      res.json(detailedData);
    } catch (error) {
      console.error('❌ Error fetching state data:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  async getInfrastructureData(req, res) {
    try {
      console.log('🏗️  Fetching infrastructure data...');
      const data = await dataGovService.fetchInfrastructureData();
      
      console.log(`✅ Retrieved infrastructure data: ${data.length} records`);
      res.json(data);
    } catch (error) {
      console.error('❌ Error fetching infrastructure data:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  async refreshExternalData(req, res) {
    try {
      console.log('🔄 Refreshing external data...');
      
      const results = {
        stateFiscal: null,
        infrastructure: null,
        errors: []
      };

      // Fetch from Data.gov.in
      try {
        results.stateFiscal = await dataGovService.fetchStateFiscalData();
        console.log('✅ State fiscal data refreshed');
      } catch (error) {
        console.error('❌ State fiscal data refresh failed:', error);
        results.errors.push('State fiscal data refresh failed');
      }

      try {
        results.infrastructure = await dataGovService.fetchInfrastructureData();
        console.log('✅ Infrastructure data refreshed');
      } catch (error) {
        console.error('❌ Infrastructure data refresh failed:', error);
        results.errors.push('Infrastructure data refresh failed');
      }

      res.json({
        message: 'External data refresh completed',
        timestamp: new Date(),
        results: {
          successful: 2 - results.errors.length,
          failed: results.errors.length,
          errors: results.errors
        },
        data: {
          stateFiscal: results.stateFiscal ? 'Updated' : 'Failed',
          infrastructure: results.infrastructure ? 'Updated' : 'Failed'
        }
      });
    } catch (error) {
      console.error('❌ Error refreshing external data:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  async getFiscalTrends(req, res) {
    try {
      const { period = '12', metric = 'all' } = req.query;
      const months = parseInt(period);

      console.log(`📈 Generating fiscal trends for ${months} months`);

      // Generate historical trend data
      const trends = this.generateFiscalTrends(months, metric);

      res.json({
        period: `${months} months`,
        metric,
        trends,
        summary: {
          averageGrowth: (trends.reduce((sum, item) => sum + parseFloat(item.growth), 0) / trends.length).toFixed(2),
          volatility: this.calculateVolatility(trends),
          trend: this.determineTrend(trends)
        }
      });
    } catch (error) {
      console.error('❌ Error fetching fiscal trends:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  async getBudgetAllocation(req, res) {
    try {
      const { stateCode } = req.params;
      const { year = new Date().getFullYear() } = req.query;

      console.log(`💰 Fetching budget allocation for ${stateCode}`);
      
      // Generate mock budget allocation data
      const categories = ['Education', 'Healthcare', 'Infrastructure', 'Agriculture', 'Social Welfare'];
      const allocation = categories.map(category => ({
        category,
        allocated: Math.floor(Math.random() * 20000) + 5000,
        spent: Math.floor(Math.random() * 15000) + 3000,
        percentage: (Math.random() * 100).toFixed(1)
      }));

      res.json({
        state: stateCode.toUpperCase(),
        year: parseInt(year),
        allocation,
        totalBudget: allocation.reduce((sum, item) => sum + item.allocated, 0)
      });
    } catch (error) {
      console.error('❌ Error fetching budget allocation:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Helper methods
  generateFiscalTrends(months, metric) {
    const trends = [];
    const currentDate = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);

      const baseValue = 100000 + Math.random() * 50000;
      const seasonality = Math.sin((date.getMonth() / 12) * 2 * Math.PI) * 0.1;
      const growth = (Math.random() - 0.5) * 0.2 + seasonality;

      trends.push({
        month: date.toISOString().slice(0, 7),
        value: Math.floor(baseValue * (1 + growth)),
        growth: (growth * 100).toFixed(2),
        metric: metric === 'all' ? 'composite' : metric
      });
    }

    return trends;
  }

  calculateVolatility(trends) {
    const values = trends.map(t => parseFloat(t.growth));
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance).toFixed(2);
  }

  determineTrend(trends) {
    const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
    const secondHalf = trends.slice(Math.floor(trends.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, t) => sum + parseFloat(t.growth), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, t) => sum + parseFloat(t.growth), 0) / secondHalf.length;
    
    if (secondAvg > firstAvg + 1) return 'improving';
    if (secondAvg < firstAvg - 1) return 'declining';
    return 'stable';
  }
}

module.exports = new FiscalController();