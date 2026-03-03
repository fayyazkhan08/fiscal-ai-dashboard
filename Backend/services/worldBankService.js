const axios = require('axios');
const logger = require('../utils/logger');
const { EXTERNAL_APIS } = require('../config/constants');

class WorldBankService {
  constructor() {
    this.baseURL = EXTERNAL_APIS.WORLD_BANK;
    this.apiKey = process.env.WORLD_BANK_API_KEY;
    this.timeout = 30000;
    this.countryCode = 'IN'; // India
  }

  // Fetch India's economic data from World Bank
  async fetchIndiaEconomicData() {
    try {
      const indicators = [
        'NY.GDP.MKTP.CD', // GDP (current US$)
        'NY.GDP.MKTP.KD.ZG', // GDP growth (annual %)
        'FP.CPI.TOTL.ZG', // Inflation, consumer prices (annual %)
        'SL.UEM.TOTL.ZS', // Unemployment, total (% of total labor force)
        'GC.BAL.CASH.GD.ZS', // Cash surplus/deficit (% of GDP)
        'GC.DOD.TOTL.GD.ZS' // Central government debt, total (% of GDP)
      ];

      const data = {};
      
      for (const indicator of indicators) {
        try {
          const response = await this.fetchIndicator(indicator);
          data[indicator] = response;
        } catch (error) {
          logger.error(`Error fetching indicator ${indicator}:`, error.message);
          data[indicator] = null;
        }
      }

      logger.info('Successfully fetched economic data from World Bank');
      return this.processEconomicData(data);
    } catch (error) {
      logger.error('Error fetching India economic data from World Bank:', error.message);
      return this.getMockWorldBankData();
    }
  }

  // Fetch specific indicator data
  async fetchIndicator(indicatorCode) {
    try {
      const currentYear = new Date().getFullYear();
      const startYear = currentYear - 5; // Last 5 years
      
      const url = `${this.baseURL}/country/${this.countryCode}/indicator/${indicatorCode}`;
      const params = {
        format: 'json',
        date: `${startYear}:${currentYear}`,
        per_page: 10
      };

      if (this.apiKey) {
        params.api_key = this.apiKey;
      }

      const response = await axios.get(url, {
        params,
        timeout: this.timeout
      });

      if (response.data && response.data[1]) {
        return response.data[1]; // World Bank returns metadata in [0] and data in [1]
      }

      return [];
    } catch (error) {
      logger.error(`Error fetching indicator ${indicatorCode}:`, error.message);
      throw error;
    }
  }

  // Fetch fiscal indicators
  async fetchFiscalIndicators() {
    try {
      const fiscalIndicators = [
        'GC.REV.XGRT.GD.ZS', // Revenue, excluding grants (% of GDP)
        'GC.XPN.TOTL.GD.ZS', // Expense (% of GDP)
        'GC.BAL.CASH.GD.ZS', // Cash surplus/deficit (% of GDP)
        'GC.DOD.TOTL.GD.ZS', // Central government debt, total (% of GDP)
        'GC.TAX.TOTL.GD.ZS' // Tax revenue (% of GDP)
      ];

      const data = {};
      
      for (const indicator of fiscalIndicators) {
        try {
          const response = await this.fetchIndicator(indicator);
          data[indicator] = response;
        } catch (error) {
          logger.error(`Error fetching fiscal indicator ${indicator}:`, error.message);
          data[indicator] = null;
        }
      }

      return this.processFiscalIndicators(data);
    } catch (error) {
      logger.error('Error fetching fiscal indicators:', error.message);
      return this.getMockFiscalIndicators();
    }
  }

  // Fetch development indicators
  async fetchDevelopmentIndicators() {
    try {
      const developmentIndicators = [
        'SE.XPD.TOTL.GD.ZS', // Government expenditure on education, total (% of GDP)
        'SH.XPD.GHED.GD.ZS', // Domestic general government health expenditure (% of GDP)
        'SP.POP.TOTL', // Population, total
        'NY.GDP.PCAP.CD', // GDP per capita (current US$)
        'SI.POV.GINI' // GINI index (World Bank estimate)
      ];

      const data = {};
      
      for (const indicator of developmentIndicators) {
        try {
          const response = await this.fetchIndicator(indicator);
          data[indicator] = response;
        } catch (error) {
          logger.error(`Error fetching development indicator ${indicator}:`, error.message);
          data[indicator] = null;
        }
      }

      return this.processDevelopmentIndicators(data);
    } catch (error) {
      logger.error('Error fetching development indicators:', error.message);
      return this.getMockDevelopmentIndicators();
    }
  }

  // Process economic data from World Bank API
  processEconomicData(rawData) {
    const processedData = {
      country: 'India',
      countryCode: 'IN',
      indicators: {},
      lastUpdated: new Date()
    };

    Object.keys(rawData).forEach(indicatorCode => {
      const indicatorData = rawData[indicatorCode];
      
      if (indicatorData && indicatorData.length > 0) {
        // Get the most recent non-null value
        const latestData = indicatorData.find(item => item.value !== null);
        
        if (latestData) {
          processedData.indicators[indicatorCode] = {
            name: latestData.indicator.value,
            value: latestData.value,
            year: latestData.date,
            unit: this.getIndicatorUnit(indicatorCode)
          };
        }
      }
    });

    return processedData;
  }

  // Process fiscal indicators
  processFiscalIndicators(rawData) {
    const fiscalData = {
      country: 'India',
      type: 'fiscal_indicators',
      data: {},
      lastUpdated: new Date()
    };

    Object.keys(rawData).forEach(indicatorCode => {
      const indicatorData = rawData[indicatorCode];
      
      if (indicatorData && indicatorData.length > 0) {
        const latestData = indicatorData.find(item => item.value !== null);
        
        if (latestData) {
          fiscalData.data[indicatorCode] = {
            name: latestData.indicator.value,
            value: latestData.value,
            year: latestData.date,
            trend: this.calculateTrend(indicatorData)
          };
        }
      }
    });

    return fiscalData;
  }

  // Process development indicators
  processDevelopmentIndicators(rawData) {
    const developmentData = {
      country: 'India',
      type: 'development_indicators',
      data: {},
      lastUpdated: new Date()
    };

    Object.keys(rawData).forEach(indicatorCode => {
      const indicatorData = rawData[indicatorCode];
      
      if (indicatorData && indicatorData.length > 0) {
        const latestData = indicatorData.find(item => item.value !== null);
        
        if (latestData) {
          developmentData.data[indicatorCode] = {
            name: latestData.indicator.value,
            value: latestData.value,
            year: latestData.date,
            formattedValue: this.formatIndicatorValue(indicatorCode, latestData.value)
          };
        }
      }
    });

    return developmentData;
  }

  // Calculate trend from historical data
  calculateTrend(data) {
    if (!data || data.length < 2) return 'stable';
    
    const validData = data.filter(item => item.value !== null).slice(0, 3);
    if (validData.length < 2) return 'stable';
    
    const recent = validData[0].value;
    const previous = validData[1].value;
    
    const change = ((recent - previous) / previous) * 100;
    
    if (change > 2) return 'increasing';
    if (change < -2) return 'decreasing';
    return 'stable';
  }

  // Get unit for indicator
  getIndicatorUnit(indicatorCode) {
    const units = {
      'NY.GDP.MKTP.CD': 'USD',
      'NY.GDP.MKTP.KD.ZG': '%',
      'FP.CPI.TOTL.ZG': '%',
      'SL.UEM.TOTL.ZS': '%',
      'GC.BAL.CASH.GD.ZS': '% of GDP',
      'GC.DOD.TOTL.GD.ZS': '% of GDP',
      'GC.REV.XGRT.GD.ZS': '% of GDP',
      'GC.XPN.TOTL.GD.ZS': '% of GDP',
      'GC.TAX.TOTL.GD.ZS': '% of GDP',
      'SE.XPD.TOTL.GD.ZS': '% of GDP',
      'SH.XPD.GHED.GD.ZS': '% of GDP',
      'SP.POP.TOTL': 'People',
      'NY.GDP.PCAP.CD': 'USD',
      'SI.POV.GINI': 'Index'
    };
    
    return units[indicatorCode] || '';
  }

  // Format indicator value for display
  formatIndicatorValue(indicatorCode, value) {
    if (indicatorCode === 'SP.POP.TOTL') {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    
    if (indicatorCode === 'NY.GDP.MKTP.CD' || indicatorCode === 'NY.GDP.PCAP.CD') {
      return `$${(value / 1000000000).toFixed(2)}B`;
    }
    
    if (value > 1000000) {
      return `${(value / 1000000).toFixed(2)}M`;
    }
    
    return value.toFixed(2);
  }

  // Mock data methods for fallback
  getMockWorldBankData() {
    return {
      country: 'India',
      countryCode: 'IN',
      indicators: {
        'NY.GDP.MKTP.CD': {
          name: 'GDP (current US$)',
          value: 3737000000000,
          year: '2022',
          unit: 'USD'
        },
        'NY.GDP.MKTP.KD.ZG': {
          name: 'GDP growth (annual %)',
          value: 6.8,
          year: '2022',
          unit: '%'
        },
        'FP.CPI.TOTL.ZG': {
          name: 'Inflation, consumer prices (annual %)',
          value: 5.5,
          year: '2022',
          unit: '%'
        },
        'SL.UEM.TOTL.ZS': {
          name: 'Unemployment, total (% of total labor force)',
          value: 7.3,
          year: '2022',
          unit: '%'
        }
      },
      lastUpdated: new Date()
    };
  }

  getMockFiscalIndicators() {
    return {
      country: 'India',
      type: 'fiscal_indicators',
      data: {
        'GC.REV.XGRT.GD.ZS': {
          name: 'Revenue, excluding grants (% of GDP)',
          value: 20.5,
          year: '2022',
          trend: 'stable'
        },
        'GC.XPN.TOTL.GD.ZS': {
          name: 'Expense (% of GDP)',
          value: 27.2,
          year: '2022',
          trend: 'increasing'
        },
        'GC.BAL.CASH.GD.ZS': {
          name: 'Cash surplus/deficit (% of GDP)',
          value: -6.7,
          year: '2022',
          trend: 'stable'
        }
      },
      lastUpdated: new Date()
    };
  }

  getMockDevelopmentIndicators() {
    return {
      country: 'India',
      type: 'development_indicators',
      data: {
        'SE.XPD.TOTL.GD.ZS': {
          name: 'Government expenditure on education, total (% of GDP)',
          value: 4.6,
          year: '2022',
          formattedValue: '4.60'
        },
        'SH.XPD.GHED.GD.ZS': {
          name: 'Domestic general government health expenditure (% of GDP)',
          value: 3.2,
          year: '2022',
          formattedValue: '3.20'
        },
        'SP.POP.TOTL': {
          name: 'Population, total',
          value: 1417173173,
          year: '2022',
          formattedValue: '1417.2M'
        }
      },
      lastUpdated: new Date()
    };
  }

  // Get API status
  async getAPIStatus() {
    try {
      const response = await axios.get(`${this.baseURL}/country/IN`, {
        params: { format: 'json' },
        timeout: 5000
      });
      
      return {
        status: 'active',
        lastChecked: new Date(),
        responseTime: response.headers['x-response-time'] || 'N/A'
      };
    } catch (error) {
      return {
        status: 'inactive',
        lastChecked: new Date(),
        error: error.message
      };
    }
  }
}

module.exports = new WorldBankService();