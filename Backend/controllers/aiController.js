class AIController {
  async generateSuggestions(req, res) {
    try {
      const { stateCode, fiscalData } = req.body;

      if (!stateCode) {
        return res.status(400).json({
          error: 'State code is required'
        });
      }

      console.log(`🤖 Generating AI suggestions for state: ${stateCode}`);

      const suggestions = this.getMockSuggestions(stateCode, fiscalData);

      res.json({
        state: stateCode.toUpperCase(),
        suggestions,
        generatedAt: new Date(),
        context: fiscalData || {}
      });
    } catch (error) {
      console.error('❌ Error generating AI suggestions:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  async getHistoricalSuggestions(req, res) {
    try {
      const { stateCode } = req.params;
      
      console.log(`📚 Fetching historical suggestions for ${stateCode}`);

      const historicalData = [
        {
          id: 1,
          suggestion: 'Digital Infrastructure Bonds',
          category: 'Digital Innovation',
          generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          status: 'implemented'
        },
        {
          id: 2,
          suggestion: 'Green Energy PPP',
          category: 'Energy',
          generatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          status: 'under_review'
        }
      ];

      res.json(historicalData);
    } catch (error) {
      console.error('❌ Error fetching historical suggestions:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  async getSentimentAnalysis(req, res) {
    try {
      const { stateCode } = req.params;
      const { policy, days = 30 } = req.query;

      console.log(`💭 Fetching sentiment analysis for ${stateCode}`);

      const data = this.generateSentimentData(stateCode, parseInt(days));

      res.json(data);
    } catch (error) {
      console.error('❌ Error fetching sentiment analysis:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  async generateForecast(req, res) {
    try {
      const { stateCode, metric, timeframe } = req.body;

      if (!stateCode || !metric || !timeframe) {
        return res.status(400).json({
          error: 'State code, metric, and timeframe are required'
        });
      }

      console.log(`🔮 Generating forecast for ${stateCode} - ${metric}`);

      const forecast = this.generateMLForecast(stateCode, metric, timeframe);

      res.json(forecast);
    } catch (error) {
      console.error('❌ Error generating ML forecast:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  async getAIInsightsSummary(req, res) {
    try {
      const { stateCode } = req.params;

      console.log(`📋 Fetching AI insights summary for ${stateCode}`);

      const summary = this.generateAISummary(stateCode);

      res.json(summary);
    } catch (error) {
      console.error('❌ Error fetching AI insights summary:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // Mock data generation methods
  getMockSuggestions(stateCode, fiscalData) {
    const stateNames = {
      'MH': 'Maharashtra',
      'KA': 'Karnataka',
      'TN': 'Tamil Nadu',
      'GJ': 'Gujarat',
      'UP': 'Uttar Pradesh',
      'RJ': 'Rajasthan',
      'WB': 'West Bengal',
      'AP': 'Andhra Pradesh'
    };
    
    const stateName = stateNames[stateCode.toUpperCase()] || stateCode;
    
    return [
      {
        category: 'Infrastructure Development',
        idea: 'Green Energy Infrastructure Bonds',
        description: `Issue state-backed green bonds specifically for ${stateName} to fund renewable energy projects. This will attract ESG-focused investors while building sustainable infrastructure.`,
        estimatedRevenue: '₹8,000 Crores',
        timeline: '18-24 months',
        feasibility: 'High'
      },
      {
        category: 'Digital Innovation',
        idea: 'State Digital Services Platform',
        description: `Create a unified digital platform for all government services in ${stateName} with premium service fees. This will generate revenue while improving citizen experience.`,
        estimatedRevenue: '₹2,500 Crores',
        timeline: '12-18 months',
        feasibility: 'High'
      },
      {
        category: 'Public-Private Partnership',
        idea: 'Smart City Development Hub',
        description: `Establish PPP model for smart city infrastructure in ${stateName} with revenue sharing from commercial developments and smart services.`,
        estimatedRevenue: '₹6,500 Crores',
        timeline: '24-36 months',
        feasibility: 'Medium'
      },
      {
        category: 'Asset Monetization',
        idea: 'State Asset Leasing Program',
        description: `Monetize underutilized state assets through strategic leasing arrangements while retaining ownership. Focus on commercial properties and land banks.`,
        estimatedRevenue: '₹4,200 Crores',
        timeline: '6-12 months',
        feasibility: 'High'
      }
    ];
  }

  generateSentimentData(stateCode, days) {
    const policies = [
      'Budget Allocation',
      'Infrastructure Spending',
      'Digital Initiatives',
      'Healthcare',
      'Education'
    ];
    
    const data = [];
    const currentDate = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(currentDate);
      date.setDate(date.getDate() - i);
      
      policies.forEach(policy => {
        data.push({
          state: stateCode.toUpperCase(),
          policy,
          sentiment: (Math.random() - 0.5) * 2,
          confidence: Math.random() * 0.4 + 0.6,
          mentions: Math.floor(Math.random() * 1000) + 100,
          timestamp: date.toISOString()
        });
      });
    }
    
    return data;
  }

  generateMLForecast(stateCode, metric, timeframe) {
    const months = parseInt(timeframe);
    const predictions = [];
    
    for (let i = 1; i <= months; i++) {
      const baseValue = 100000 + Math.random() * 50000;
      const trend = Math.sin(i * 0.5) * 0.1;
      const growth = 0.02;
      const noise = (Math.random() - 0.5) * 0.05;
      
      const value = baseValue * (1 + (growth + trend + noise) * i);
      const confidence = Math.max(0.6, 0.9 - (i * 0.02));
      
      predictions.push({
        month: i,
        value: Math.round(value),
        confidence: parseFloat(confidence.toFixed(3))
      });
    }
    
    return {
      state: stateCode.toUpperCase(),
      metric,
      timeframe: months,
      forecast: predictions,
      accuracy: '85%',
      model: 'LSTM',
      generatedAt: new Date()
    };
  }

  generateAISummary(stateCode) {
    const stateNames = {
      'MH': 'Maharashtra',
      'KA': 'Karnataka',
      'TN': 'Tamil Nadu',
      'GJ': 'Gujarat',
      'UP': 'Uttar Pradesh',
      'RJ': 'Rajasthan',
      'WB': 'West Bengal',
      'AP': 'Andhra Pradesh'
    };
    
    const stateName = stateNames[stateCode.toUpperCase()] || stateCode;
    
    return {
      state: stateCode.toUpperCase(),
      stateName,
      summary: `AI Analysis for ${stateName}: Strong potential for revenue generation through innovative capital projects. Focus on high-impact infrastructure projects and monitor public sentiment for policy adjustments.`,
      lastUpdated: new Date(),
      dataAvailability: {
        suggestions: true,
        sentiment: true,
        forecast: true
      }
    };
  }
}

module.exports = new AIController();