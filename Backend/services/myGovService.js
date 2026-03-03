const axios = require('axios');
const logger = require('../utils/logger');
const { EXTERNAL_APIS } = require('../config/constants');

class MyGovService {
  constructor() {
    this.baseURL = EXTERNAL_APIS.MYGOV;
    this.apiKey = process.env.MYGOV_API_KEY;
    this.timeout = 30000;
  }

  // Fetch policy data from MyGov
  async fetchPolicyData() {
    try {
      if (!this.apiKey) {
        logger.warn('MyGov API key not configured');
        return this.getMockPolicyData();
      }

      const response = await axios.get(`${this.baseURL}/policies`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          status: 'active',
          category: 'fiscal',
          limit: 50
        },
        timeout: this.timeout
      });

      logger.info('Successfully fetched policy data from MyGov');
      return this.processPolicyData(response.data);
    } catch (error) {
      logger.error('Error fetching policy data from MyGov:', error.message);
      return this.getMockPolicyData();
    }
  }

  // Fetch government announcements
  async fetchAnnouncements() {
    try {
      if (!this.apiKey) {
        logger.warn('MyGov API key not configured');
        return this.getMockAnnouncements();
      }

      const response = await axios.get(`${this.baseURL}/announcements`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          type: 'fiscal',
          date_from: this.getDateDaysAgo(30), // Last 30 days
          limit: 20
        },
        timeout: this.timeout
      });

      logger.info('Successfully fetched announcements from MyGov');
      return this.processAnnouncements(response.data);
    } catch (error) {
      logger.error('Error fetching announcements from MyGov:', error.message);
      return this.getMockAnnouncements();
    }
  }

  // Fetch budget documents
  async fetchBudgetDocuments(year = new Date().getFullYear()) {
    try {
      if (!this.apiKey) {
        logger.warn('MyGov API key not configured');
        return this.getMockBudgetDocuments(year);
      }

      const response = await axios.get(`${this.baseURL}/budget-documents`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          financial_year: year,
          document_type: 'budget',
          format: 'json'
        },
        timeout: this.timeout
      });

      logger.info(`Successfully fetched budget documents for ${year} from MyGov`);
      return this.processBudgetDocuments(response.data);
    } catch (error) {
      logger.error(`Error fetching budget documents for ${year}:`, error.message);
      return this.getMockBudgetDocuments(year);
    }
  }

  // Fetch scheme data
  async fetchSchemeData() {
    try {
      if (!this.apiKey) {
        logger.warn('MyGov API key not configured');
        return this.getMockSchemeData();
      }

      const response = await axios.get(`${this.baseURL}/schemes`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          status: 'active',
          category: 'economic',
          include_budget: true
        },
        timeout: this.timeout
      });

      logger.info('Successfully fetched scheme data from MyGov');
      return this.processSchemeData(response.data);
    } catch (error) {
      logger.error('Error fetching scheme data from MyGov:', error.message);
      return this.getMockSchemeData();
    }
  }

  // Fetch public consultation data
  async fetchPublicConsultations() {
    try {
      if (!this.apiKey) {
        logger.warn('MyGov API key not configured');
        return this.getMockConsultations();
      }

      const response = await axios.get(`${this.baseURL}/consultations`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        params: {
          status: 'open',
          topic: 'fiscal_policy',
          include_responses: true
        },
        timeout: this.timeout
      });

      logger.info('Successfully fetched public consultations from MyGov');
      return this.processConsultations(response.data);
    } catch (error) {
      logger.error('Error fetching public consultations from MyGov:', error.message);
      return this.getMockConsultations();
    }
  }

  // Process policy data from API response
  processPolicyData(data) {
    try {
      if (data && data.policies) {
        return data.policies.map(policy => ({
          id: policy.policy_id,
          title: policy.title,
          description: policy.description,
          category: policy.category,
          status: policy.status,
          implementationDate: new Date(policy.implementation_date),
          budgetAllocation: parseFloat(policy.budget_allocation) || 0,
          targetStates: policy.target_states || [],
          expectedImpact: policy.expected_impact,
          ministry: policy.ministry,
          lastUpdated: new Date(policy.last_updated)
        }));
      }
      
      return [];
    } catch (error) {
      logger.error('Error processing policy data:', error);
      return [];
    }
  }

  // Process announcements from API response
  processAnnouncements(data) {
    try {
      if (data && data.announcements) {
        return data.announcements.map(announcement => ({
          id: announcement.announcement_id,
          title: announcement.title,
          content: announcement.content,
          type: announcement.type,
          priority: announcement.priority,
          publishedDate: new Date(announcement.published_date),
          ministry: announcement.ministry,
          tags: announcement.tags || [],
          relatedPolicies: announcement.related_policies || [],
          fiscalImpact: parseFloat(announcement.fiscal_impact) || 0
        }));
      }
      
      return [];
    } catch (error) {
      logger.error('Error processing announcements:', error);
      return [];
    }
  }

  // Process budget documents from API response
  processBudgetDocuments(data) {
    try {
      if (data && data.documents) {
        return data.documents.map(doc => ({
          id: doc.document_id,
          title: doc.title,
          type: doc.document_type,
          financialYear: doc.financial_year,
          ministry: doc.ministry,
          downloadUrl: doc.download_url,
          summary: doc.summary,
          keyHighlights: doc.key_highlights || [],
          budgetSize: parseFloat(doc.budget_size) || 0,
          publishedDate: new Date(doc.published_date)
        }));
      }
      
      return [];
    } catch (error) {
      logger.error('Error processing budget documents:', error);
      return [];
    }
  }

  // Process scheme data from API response
  processSchemeData(data) {
    try {
      if (data && data.schemes) {
        return data.schemes.map(scheme => ({
          id: scheme.scheme_id,
          name: scheme.scheme_name,
          description: scheme.description,
          category: scheme.category,
          launchDate: new Date(scheme.launch_date),
          budgetAllocated: parseFloat(scheme.budget_allocated) || 0,
          budgetUtilized: parseFloat(scheme.budget_utilized) || 0,
          beneficiaries: parseInt(scheme.beneficiaries) || 0,
          targetStates: scheme.target_states || [],
          ministry: scheme.ministry,
          status: scheme.status,
          objectives: scheme.objectives || [],
          outcomes: scheme.outcomes || []
        }));
      }
      
      return [];
    } catch (error) {
      logger.error('Error processing scheme data:', error);
      return [];
    }
  }

  // Process consultations from API response
  processConsultations(data) {
    try {
      if (data && data.consultations) {
        return data.consultations.map(consultation => ({
          id: consultation.consultation_id,
          title: consultation.title,
          description: consultation.description,
          topic: consultation.topic,
          startDate: new Date(consultation.start_date),
          endDate: new Date(consultation.end_date),
          status: consultation.status,
          totalResponses: parseInt(consultation.total_responses) || 0,
          ministry: consultation.ministry,
          documents: consultation.documents || [],
          summary: consultation.response_summary,
          sentiment: this.analyzeSentiment(consultation.responses || [])
        }));
      }
      
      return [];
    } catch (error) {
      logger.error('Error processing consultations:', error);
      return [];
    }
  }

  // Analyze sentiment from consultation responses
  analyzeSentiment(responses) {
    if (!responses || responses.length === 0) {
      return { positive: 0, negative: 0, neutral: 0, overall: 'neutral' };
    }

    let positive = 0, negative = 0, neutral = 0;

    responses.forEach(response => {
      const sentiment = response.sentiment_score || 0;
      if (sentiment > 0.3) positive++;
      else if (sentiment < -0.3) negative++;
      else neutral++;
    });

    const total = responses.length;
    const overallScore = (positive - negative) / total;
    
    let overall = 'neutral';
    if (overallScore > 0.2) overall = 'positive';
    else if (overallScore < -0.2) overall = 'negative';

    return {
      positive: (positive / total * 100).toFixed(1),
      negative: (negative / total * 100).toFixed(1),
      neutral: (neutral / total * 100).toFixed(1),
      overall,
      score: overallScore.toFixed(2)
    };
  }

  // Helper method to get date N days ago
  getDateDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  // Mock data methods for fallback
  getMockPolicyData() {
    return [
      {
        id: 'POL001',
        title: 'Digital India Infrastructure Development',
        description: 'Comprehensive digital infrastructure development across states',
        category: 'Digital Infrastructure',
        status: 'active',
        implementationDate: new Date('2024-01-01'),
        budgetAllocation: 50000000000, // 50 billion
        targetStates: ['MH', 'KA', 'TN', 'GJ', 'UP'],
        expectedImpact: 'Improved digital connectivity and e-governance',
        ministry: 'Ministry of Electronics and Information Technology',
        lastUpdated: new Date()
      },
      {
        id: 'POL002',
        title: 'Green Energy Transition Fund',
        description: 'State-level renewable energy infrastructure funding',
        category: 'Energy',
        status: 'active',
        implementationDate: new Date('2024-02-01'),
        budgetAllocation: 75000000000, // 75 billion
        targetStates: ['RJ', 'GJ', 'MH', 'KA'],
        expectedImpact: 'Increased renewable energy capacity',
        ministry: 'Ministry of New and Renewable Energy',
        lastUpdated: new Date()
      }
    ];
  }

  getMockAnnouncements() {
    return [
      {
        id: 'ANN001',
        title: 'New Fiscal Incentives for Manufacturing',
        content: 'Government announces new tax incentives for manufacturing sector',
        type: 'policy',
        priority: 'high',
        publishedDate: new Date(),
        ministry: 'Ministry of Finance',
        tags: ['manufacturing', 'tax', 'incentives'],
        relatedPolicies: ['POL001'],
        fiscalImpact: 25000000000
      },
      {
        id: 'ANN002',
        title: 'Infrastructure Development Budget Increase',
        content: 'Additional allocation for state infrastructure projects',
        type: 'budget',
        priority: 'medium',
        publishedDate: new Date(),
        ministry: 'Ministry of Road Transport and Highways',
        tags: ['infrastructure', 'budget', 'development'],
        relatedPolicies: ['POL002'],
        fiscalImpact: 15000000000
      }
    ];
  }

  getMockBudgetDocuments(year) {
    return [
      {
        id: 'BUD001',
        title: `Union Budget ${year}-${year + 1}`,
        type: 'union_budget',
        financialYear: year,
        ministry: 'Ministry of Finance',
        downloadUrl: 'https://example.com/budget.pdf',
        summary: 'Comprehensive budget focusing on infrastructure and digital development',
        keyHighlights: [
          'Increased infrastructure spending',
          'Digital India initiatives',
          'Green energy focus'
        ],
        budgetSize: 4500000000000, // 4.5 trillion
        publishedDate: new Date()
      }
    ];
  }

  getMockSchemeData() {
    return [
      {
        id: 'SCH001',
        name: 'PM Gati Shakti',
        description: 'National Master Plan for multi-modal connectivity',
        category: 'Infrastructure',
        launchDate: new Date('2021-10-13'),
        budgetAllocated: 1000000000000, // 1 trillion
        budgetUtilized: 650000000000, // 650 billion
        beneficiaries: 1000000,
        targetStates: Object.keys(require('../config/constants').INDIAN_STATES),
        ministry: 'Ministry of Road Transport and Highways',
        status: 'active',
        objectives: [
          'Integrated planning and coordinated implementation',
          'Reduce logistics costs',
          'Increase cargo handling capacity'
        ],
        outcomes: [
          'Improved connectivity',
          'Reduced transportation time',
          'Enhanced economic growth'
        ]
      }
    ];
  }

  getMockConsultations() {
    return [
      {
        id: 'CON001',
        title: 'Public Consultation on Fiscal Policy Reforms',
        description: 'Seeking public input on proposed fiscal policy changes',
        topic: 'fiscal_policy',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-02-01'),
        status: 'open',
        totalResponses: 1250,
        ministry: 'Ministry of Finance',
        documents: ['policy_draft.pdf', 'impact_assessment.pdf'],
        summary: 'Mixed responses with majority supporting infrastructure focus',
        sentiment: {
          positive: '65.2',
          negative: '20.8',
          neutral: '14.0',
          overall: 'positive',
          score: '0.44'
        }
      }
    ];
  }

  // Get API status
  async getAPIStatus() {
    try {
      const response = await axios.get(`${this.baseURL}/status`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
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

module.exports = new MyGovService();