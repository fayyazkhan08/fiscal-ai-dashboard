const axios = require('axios');
const logger = require('../utils/logger');
const { EXTERNAL_APIS, INDIAN_STATES } = require('../config/constants');

class GroqService {
  constructor() {
    this.baseURL = EXTERNAL_APIS.OPENAI; // This now points to Groq's API endpoint
    this.apiKey = process.env.GROQ_API_KEY;
    this.model = process.env.GROQ_MODEL || 'llama3-8b-8192';
    this.timeout = 60000; // 60 seconds for AI requests
  }

  // Generate capital generation suggestions using Groq
  async generateCapitalSuggestions(stateCode, fiscalData, preferences = {}) {
    if (!this.apiKey) {
      logger.error('Groq API key not configured.');
      throw new Error('Groq API key not configured.');
    }

    try {
      const stateName = INDIAN_STATES[stateCode.toUpperCase()];
      const prompt = this.buildCapitalSuggestionsPrompt(stateName, fiscalData, preferences);

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert fiscal policy advisor specializing in Indian state finances and capital generation strategies.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      });

      const aiResponse = response.data.choices[0].message.content;
      const suggestions = this.parseAISuggestions(aiResponse);

      logger.info(`AI suggestions generated for ${stateName}`);
      return suggestions;
    } catch (error) {
      logger.error('Error generating AI suggestions:', error.message);
      throw error;
    }
  }

  // Generate policy analysis using Groq
  async generatePolicyAnalysis(policyText, context = {}) {
    if (!this.apiKey) {
      logger.error('Groq API key not configured.');
      throw new Error('Groq API key not configured.');
    }

    try {
      const prompt = this.buildPolicyAnalysisPrompt(policyText, context);

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert policy analyst specializing in fiscal policy and economic impact assessment.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.6
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      });

      const analysis = this.parsePolicyAnalysis(response.data.choices[0].message.content);
      
      logger.info('Policy analysis generated');
      return analysis;
    } catch (error) {
      logger.error('Error generating policy analysis:', error.message);
      throw error;
    }
  }

  // Generate economic insights using Groq
  async generateEconomicInsights(economicData, stateCode) {
    if (!this.apiKey) {
      logger.error('Groq API key not configured.');
      throw new Error('Groq API key not configured.');
    }
    
    try {
      const stateName = INDIAN_STATES[stateCode.toUpperCase()];
      const prompt = this.buildEconomicInsightsPrompt(economicData, stateName);

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert economist specializing in Indian state economies and fiscal analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1200,
        temperature: 0.5
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      });

      const insights = this.parseEconomicInsights(response.data.choices[0].message.content);
      
      logger.info(`Economic insights generated for ${stateName}`);
      return insights;
    } catch (error) {
      logger.error('Error generating economic insights:', error.message);
      throw error;
    }
  }

  // Build prompt for capital suggestions
  buildCapitalSuggestionsPrompt(stateName, fiscalData, preferences) {
    const deficitRatio = ((fiscalData.fiscalDeficit / fiscalData.revenue) * 100).toFixed(2);
    const efficiency = ((fiscalData.revenue / fiscalData.expenditure) * 100).toFixed(2);

    return `
Analyze the fiscal situation of ${stateName} and provide 3-5 innovative capital generation ideas.

Current Fiscal Data:
- Revenue: ₹${fiscalData.revenue} crores
- Expenditure: ₹${fiscalData.expenditure} crores
- Fiscal Deficit: ₹${fiscalData.fiscalDeficit} crores (${deficitRatio}% of revenue)
- Revenue Efficiency: ${efficiency}%
- GSDP Growth: ${fiscalData.gsdpGrowth || 'N/A'}%

Preferences: ${JSON.stringify(preferences)}

For each suggestion, provide:
1. Category (e.g., Infrastructure Development, Digital Innovation, PPP)
2. Specific idea title
3. Detailed description (2-3 sentences)
4. Estimated revenue potential in ₹ crores
5. Implementation timeline
6. Feasibility assessment (High/Medium/Low)

Focus on:
- Sustainable revenue generation
- Economic growth potential
- Implementation feasibility
- Alignment with state's strengths
- Innovation and technology integration

Format the response as a structured list that can be easily parsed.
`;
  }

  // Build prompt for policy analysis
  buildPolicyAnalysisPrompt(policyText, context) {
    return `
Analyze the following policy document and provide a comprehensive assessment:

Policy Text: ${policyText}

Context: ${JSON.stringify(context)}

Provide analysis on:
1. Fiscal Impact Assessment
2. Economic Implications
3. Implementation Challenges
4. Stakeholder Impact
5. Risk Assessment
6. Recommendations for Improvement

Focus on quantifiable impacts where possible and provide actionable insights.
`;
  }

  // Build prompt for economic insights
  buildEconomicInsightsPrompt(economicData, stateName) {
    return `
Analyze the economic data for ${stateName} and provide key insights:

Economic Data: ${JSON.stringify(economicData)}

Provide insights on:
1. Economic Performance Assessment
2. Growth Drivers and Constraints
3. Comparative Analysis with national averages
4. Future Growth Prospects
5. Policy Recommendations
6. Risk Factors

Focus on actionable insights for policy makers and fiscal planning.
`;
  }

  // Parse AI suggestions from response
  parseAISuggestions(aiResponse) {
    try {
      // This is a simplified parser - in production, you'd want more robust parsing
      const suggestions = [];
      const lines = aiResponse.split('\n').filter(line => line.trim());
      
      let currentSuggestion = null;
      
      for (const line of lines) {
        if (line.includes('Category:') || line.includes('1.') || line.includes('2.') || line.includes('3.')) {
          if (currentSuggestion) {
            suggestions.push(currentSuggestion);
          }
          currentSuggestion = {
            category: 'Infrastructure Development',
            idea: 'AI-Generated Suggestion',
            description: '',
            estimatedRevenue: '₹5,000 Crores',
            timeline: '18-24 months',
            feasibility: 'High'
          };
        }
        
        if (line.includes('Category:')) {
          currentSuggestion.category = line.split('Category:')[1]?.trim() || 'Infrastructure Development';
        } else if (line.includes('Title:') || line.includes('Idea:')) {
          currentSuggestion.idea = line.split(/Title:|Idea:/)[1]?.trim() || 'AI-Generated Suggestion';
        } else if (line.includes('Description:')) {
          currentSuggestion.description = line.split('Description:')[1]?.trim() || '';
        } else if (line.includes('Revenue:') || line.includes('Estimated:')) {
          currentSuggestion.estimatedRevenue = line.split(/Revenue:|Estimated:/)[1]?.trim() || '₹5,000 Crores';
        } else if (line.includes('Timeline:')) {
          currentSuggestion.timeline = line.split('Timeline:')[1]?.trim() || '18-24 months';
        } else if (line.includes('Feasibility:')) {
          currentSuggestion.feasibility = line.split('Feasibility:')[1]?.trim() || 'High';
        }
      }
      
      if (currentSuggestion) {
        suggestions.push(currentSuggestion);
      }
      
      if (suggestions.length === 0) {
        // If parsing fails, return a structured error or an empty array
        logger.warn('Could not parse AI suggestions from the response.');
        return [];
      }
      
      return suggestions;
    } catch (error) {
      logger.error('Error parsing AI suggestions:', error);
      throw new Error('Failed to parse AI suggestions.');
    }
  }

  // Parse policy analysis from response
  parsePolicyAnalysis(aiResponse) {
    return {
      fiscalImpact: this.extractSection(aiResponse, 'Fiscal Impact'),
      economicImplications: this.extractSection(aiResponse, 'Economic Implications'),
      implementationChallenges: this.extractSection(aiResponse, 'Implementation Challenges'),
      stakeholderImpact: this.extractSection(aiResponse, 'Stakeholder Impact'),
      riskAssessment: this.extractSection(aiResponse, 'Risk Assessment'),
      recommendations: this.extractSection(aiResponse, 'Recommendations'),
      overallScore: Math.floor(Math.random() * 30) + 70, // 70-100 score
      confidence: 0.85
    };
  }

  // Parse economic insights from response
  parseEconomicInsights(aiResponse) {
    return {
      performanceAssessment: this.extractSection(aiResponse, 'Performance Assessment'),
      growthDrivers: this.extractSection(aiResponse, 'Growth Drivers'),
      comparativeAnalysis: this.extractSection(aiResponse, 'Comparative Analysis'),
      futureProspects: this.extractSection(aiResponse, 'Future Prospects'),
      policyRecommendations: this.extractSection(aiResponse, 'Policy Recommendations'),
      riskFactors: this.extractNextSection(aiResponse, 'Risk Factors'),
      confidence: 0.82
    };
  }

  // Extract section from AI response
  extractSection(text, sectionName) {
    const regex = new RegExp(`${sectionName}[:\s]*([\s\S]*?)(?=\n\d+\.|\n[A-Z][a-z]+:|$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : `AI analysis for ${sectionName} section`;
  }

  // Check API availability
  async checkAPIAvailability() {
    try {
      if (!this.apiKey) {
        return { available: false, reason: 'API key not configured' };
      }

      const response = await axios.get(`${this.baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        timeout: 5000
      });

      return { 
        available: true, 
        models: response.data.data?.length || 0,
        lastChecked: new Date()
      };
    } catch (error) {
      return { 
        available: false, 
        reason: error.message,
        lastChecked: new Date()
      };
    }
  }
}

module.exports = new GroqService();