const dataGovService = require('../services/dataGovService');

class DashboardController {
  async getOverview(req, res) {
    try {
      console.log('📊 Fetching dashboard overview...');
      const states = await dataGovService.fetchStateFiscalData();
      
      if (states.length === 0) {
        return res.status(404).json({
          error: 'No data available'
        });
      }

      const overview = {
        totalStates: states.length,
        totalRevenue: states.reduce((sum, state) => sum + (state.revenue || 0), 0),
        totalExpenditure: states.reduce((sum, state) => sum + (state.expenditure || 0), 0),
        totalFiscalDeficit: states.reduce((sum, state) => sum + (state.fiscalDeficit || 0), 0),
        totalInfrastructureSpending: states.reduce((sum, state) => sum + (state.infrastructureSpending || 0), 0),
        averageGsdpGrowth: (states.reduce((sum, state) => sum + parseFloat(state.gsdpGrowth || 0), 0) / states.length).toFixed(2),
        lastUpdated: new Date()
      };

      console.log('✅ Dashboard overview generated successfully');
      res.json(overview);
    } catch (error) {
      console.error('❌ Error fetching dashboard overview:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  async getTopPerformers(req, res) {
    try {
      console.log('🏆 Fetching top performers...');
      const states = await dataGovService.fetchStateFiscalData();
      
      if (states.length === 0) {
        return res.status(404).json({
          error: 'No data available'
        });
      }

      const performers = states
        .map(state => ({
          state: state.stateName || state.state,
          gsdpGrowth: parseFloat(state.gsdpGrowth || 0).toFixed(2),
          revenueEfficiency: ((state.revenue / state.expenditure) * 100).toFixed(2)
        }))
        .sort((a, b) => parseFloat(b.gsdpGrowth) - parseFloat(a.gsdpGrowth))
        .slice(0, 5);

      console.log('✅ Top performers data generated');
      res.json(performers);
    } catch (error) {
      console.error('❌ Error fetching top performers:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  async getFiscalHealth(req, res) {
    try {
      console.log('🏥 Fetching fiscal health indicators...');
      const states = await dataGovService.fetchStateFiscalData();
      
      if (states.length === 0) {
        return res.status(404).json({
          error: 'No data available'
        });
      }

      const healthIndicators = states.map(state => {
        const deficitRatio = state.revenue > 0 ? ((state.fiscalDeficit / state.revenue) * 100).toFixed(2) : '0.00';
        const revenueGrowth = (Math.random() * 10 + 2).toFixed(2);
        const expenditureEfficiency = state.expenditure > 0 ? ((state.revenue / state.expenditure) * 100).toFixed(2) : '0.00';
        
        let debtSustainability = 'Good';
        if (parseFloat(deficitRatio) >= 5) {
          debtSustainability = 'Concern';
        } else if (parseFloat(deficitRatio) >= 3) {
          debtSustainability = 'Moderate';
        }

        return {
          state: state.state,
          stateName: state.stateName,
          deficitRatio,
          debtSustainability,
          revenueGrowth,
          expenditureEfficiency
        };
      });

      console.log('✅ Fiscal health data generated');
      res.json(healthIndicators);
    } catch (error) {
      console.error('❌ Error fetching fiscal health:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  async getComparativeAnalysis(req, res) {
    try {
      const states = await dataGovService.fetchStateFiscalData();
      
      const analysis = {
        nationalAverage: {
          gsdpGrowth: (states.reduce((sum, s) => sum + parseFloat(s.gsdpGrowth || 0), 0) / states.length).toFixed(2),
          deficitRatio: (states.reduce((sum, s) => sum + (s.fiscalDeficit / s.revenue * 100), 0) / states.length).toFixed(2)
        },
        topPerformers: states.slice(0, 3),
        lastUpdated: new Date()
      };

      res.json(analysis);
    } catch (error) {
      console.error('❌ Error in comparative analysis:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  async getRealTimeUpdates(req, res) {
    try {
      const updates = [
        {
          id: 1,
          type: 'data_update',
          message: 'Maharashtra fiscal data updated',
          timestamp: new Date(),
          severity: 'info'
        },
        {
          id: 2,
          type: 'alert',
          message: 'Gujarat deficit ratio increased',
          timestamp: new Date(),
          severity: 'warning'
        }
      ];

      res.json(updates);
    } catch (error) {
      console.error('❌ Error fetching real-time updates:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
}

module.exports = new DashboardController();