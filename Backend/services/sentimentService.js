const axios = require('axios');
const logger = require('../utils/logger');
const { POLICY_AREAS } = require('../config/constants');

class SentimentService {
  constructor() {
    this.twitterBearerToken = process.env.TWITTER_BEARER_TOKEN;
    this.redditClientId = process.env.REDDIT_CLIENT_ID;
    this.redditClientSecret = process.env.REDDIT_CLIENT_SECRET;
    this.sentimentAPIUrl = process.env.SENTIMENT_API_URL;
    this.timeout = 30000;
  }

  // Analyze sentiment for a specific state and policy
  async analyzeSentiment(stateCode, policy, days = 7) {
    try {
      const socialMediaData = await this.fetchSocialMediaData(stateCode, policy, days);
      const newsData = await this.fetchNewsData(stateCode, policy, days);
      
      const combinedData = [...socialMediaData, ...newsData];
      const sentimentAnalysis = await this.processSentimentData(combinedData);
      
      return {
        state: stateCode,
        policy,
        period: `${days} days`,
        totalMentions: combinedData.length,
        sentiment: sentimentAnalysis,
        sources: this.categorizeBySource(combinedData),
        trends: this.calculateTrends(combinedData),
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Error analyzing sentiment:', error.message);
      return this.getMockSentimentAnalysis(stateCode, policy, days);
    }
  }

  // Fetch data from Twitter
  async fetchTwitterData(query, days) {
    try {
      if (!this.twitterBearerToken) {
        logger.warn('Twitter Bearer Token not configured');
        return [];
      }

      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (days * 24 * 60 * 60 * 1000));

      const response = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
        headers: {
          'Authorization': `Bearer ${this.twitterBearerToken}`
        },
        params: {
          query: query,
          'tweet.fields': 'created_at,public_metrics,context_annotations',
          'user.fields': 'verified,public_metrics',
          'expansions': 'author_id',
          'max_results': 100,
          'start_time': startTime.toISOString(),
          'end_time': endTime.toISOString()
        },
        timeout: this.timeout
      });

      if (response.data && response.data.data) {
        return response.data.data.map(tweet => ({
          id: tweet.id,
          text: tweet.text,
          createdAt: new Date(tweet.created_at),
          source: 'twitter',
          metrics: tweet.public_metrics,
          author: response.data.includes?.users?.find(user => user.id === tweet.author_id)
        }));
      }

      return [];
    } catch (error) {
      logger.error('Error fetching Twitter data:', error.message);
      return [];
    }
  }

  // Fetch data from Reddit
  async fetchRedditData(query, days) {
    try {
      if (!this.redditClientId || !this.redditClientSecret) {
        logger.warn('Reddit credentials not configured');
        return [];
      }

      // Get Reddit access token
      const tokenResponse = await axios.post('https://www.reddit.com/api/v1/access_token', 
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${this.redditClientId}:${this.redditClientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const accessToken = tokenResponse.data.access_token;

      // Search Reddit posts
      const searchResponse = await axios.get('https://oauth.reddit.com/search', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'FiscalDashboard/1.0'
        },
        params: {
          q: query,
          sort: 'new',
          limit: 50,
          t: days <= 7 ? 'week' : 'month'
        },
        timeout: this.timeout
      });

      if (searchResponse.data && searchResponse.data.data && searchResponse.data.data.children) {
        return searchResponse.data.data.children.map(post => ({
          id: post.data.id,
          text: `${post.data.title} ${post.data.selftext || ''}`,
          createdAt: new Date(post.data.created_utc * 1000),
          source: 'reddit',
          subreddit: post.data.subreddit,
          score: post.data.score,
          comments: post.data.num_comments
        }));
      }

      return [];
    } catch (error) {
      logger.error('Error fetching Reddit data:', error.message);
      return [];
    }
  }

  // Fetch social media data
  async fetchSocialMediaData(stateCode, policy, days) {
    const query = this.buildSearchQuery(stateCode, policy);
    
    const twitterData = await this.fetchTwitterData(query, days);
    const redditData = await this.fetchRedditData(query, days);
    
    return [...twitterData, ...redditData];
  }

  // Fetch news data (mock implementation)
  async fetchNewsData(stateCode, policy, days) {
    try {
      // This would integrate with news APIs like NewsAPI, Google News API, etc.
      // For now, returning mock data
      return this.getMockNewsData(stateCode, policy, days);
    } catch (error) {
      logger.error('Error fetching news data:', error.message);
      return [];
    }
  }

  // Process sentiment data using external API or built-in analysis
  async processSentimentData(data) {
    try {
      if (this.sentimentAPIUrl) {
        // Use external sentiment analysis API
        const response = await axios.post(this.sentimentAPIUrl, {
          texts: data.map(item => item.text)
        }, {
          timeout: this.timeout
        });

        return this.aggregateSentimentResults(response.data);
      } else {
        // Use built-in sentiment analysis
        return this.performBuiltInSentimentAnalysis(data);
      }
    } catch (error) {
      logger.error('Error processing sentiment data:', error.message);
      return this.performBuiltInSentimentAnalysis(data);
    }
  }

  // Built-in sentiment analysis (simplified)
  performBuiltInSentimentAnalysis(data) {
    const positiveWords = [
      'good', 'great', 'excellent', 'positive', 'success', 'improvement',
      'benefit', 'progress', 'effective', 'helpful', 'support', 'approve'
    ];
    
    const negativeWords = [
      'bad', 'terrible', 'negative', 'failure', 'problem', 'issue',
      'concern', 'worry', 'oppose', 'against', 'disappointing', 'poor'
    ];

    let totalSentiment = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    data.forEach(item => {
      const text = item.text.toLowerCase();
      let score = 0;

      positiveWords.forEach(word => {
        if (text.includes(word)) score += 1;
      });

      negativeWords.forEach(word => {
        if (text.includes(word)) score -= 1;
      });

      // Normalize score to -1 to 1 range
      const normalizedScore = Math.max(-1, Math.min(1, score / 5));
      totalSentiment += normalizedScore;

      if (normalizedScore > 0.3) positiveCount++;
      else if (normalizedScore < -0.3) negativeCount++;
      else neutralCount++;
    });

    const averageSentiment = data.length > 0 ? totalSentiment / data.length : 0;

    return {
      overall: averageSentiment,
      distribution: {
        positive: (positiveCount / data.length * 100).toFixed(1),
        negative: (negativeCount / data.length * 100).toFixed(1),
        neutral: (neutralCount / data.length * 100).toFixed(1)
      },
      confidence: 0.75, // Built-in analysis has lower confidence
      details: data.map(item => ({
        id: item.id,
        sentiment: this.calculateItemSentiment(item.text, positiveWords, negativeWords),
        source: item.source
      }))
    };
  }

  // Calculate sentiment for individual item
  calculateItemSentiment(text, positiveWords, negativeWords) {
    const lowerText = text.toLowerCase();
    let score = 0;

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) score += 1;
    });

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) score -= 1;
    });

    return Math.max(-1, Math.min(1, score / 5));
  }

  // Aggregate sentiment results from external API
  aggregateSentimentResults(apiResults) {
    if (!apiResults || !apiResults.length) {
      return { overall: 0, distribution: { positive: 0, negative: 0, neutral: 100 }, confidence: 0 };
    }

    const totalSentiment = apiResults.reduce((sum, result) => sum + result.sentiment, 0);
    const averageSentiment = totalSentiment / apiResults.length;

    const positive = apiResults.filter(r => r.sentiment > 0.3).length;
    const negative = apiResults.filter(r => r.sentiment < -0.3).length;
    const neutral = apiResults.length - positive - negative;

    return {
      overall: averageSentiment,
      distribution: {
        positive: (positive / apiResults.length * 100).toFixed(1),
        negative: (negative / apiResults.length * 100).toFixed(1),
        neutral: (neutral / apiResults.length * 100).toFixed(1)
      },
      confidence: 0.9,
      details: apiResults
    };
  }

  // Build search query for social media
  buildSearchQuery(stateCode, policy) {
    const stateNames = {
      'MH': 'Maharashtra',
      'KA': 'Karnataka',
      'TN': 'Tamil Nadu',
      'GJ': 'Gujarat',
      'UP': 'Uttar Pradesh'
    };

    const stateName = stateNames[stateCode.toUpperCase()] || stateCode;
    const policyKeywords = this.getPolicyKeywords(policy);
    
    return `${stateName} ${policy} ${policyKeywords.join(' OR ')} -is:retweet lang:en`;
  }

  // Get keywords for specific policy
  getPolicyKeywords(policy) {
    const keywordMap = {
      'Budget Allocation': ['budget', 'allocation', 'spending', 'finance'],
      'Infrastructure Spending': ['infrastructure', 'roads', 'bridges', 'development'],
      'Digital Initiatives': ['digital', 'technology', 'online', 'e-governance'],
      'Healthcare': ['health', 'medical', 'hospital', 'treatment'],
      'Education': ['education', 'school', 'university', 'learning']
    };

    return keywordMap[policy] || ['government', 'policy'];
  }

  // Categorize data by source
  categorizeBySource(data) {
    const sources = {};
    
    data.forEach(item => {
      if (!sources[item.source]) {
        sources[item.source] = {
          count: 0,
          sentiment: 0
        };
      }
      sources[item.source].count++;
      sources[item.source].sentiment += item.sentiment || 0;
    });

    // Calculate average sentiment per source
    Object.keys(sources).forEach(source => {
      sources[source].averageSentiment = sources[source].sentiment / sources[source].count;
    });

    return sources;
  }

  // Calculate sentiment trends over time
  calculateTrends(data) {
    const trends = {};
    
    data.forEach(item => {
      const date = item.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!trends[date]) {
        trends[date] = {
          count: 0,
          sentiment: 0
        };
      }
      
      trends[date].count++;
      trends[date].sentiment += item.sentiment || 0;
    });

    // Calculate average sentiment per day
    Object.keys(trends).forEach(date => {
      trends[date].averageSentiment = trends[date].sentiment / trends[date].count;
    });

    return trends;
  }

  // Mock sentiment analysis for fallback
  getMockSentimentAnalysis(stateCode, policy, days) {
    const mockData = this.generateMockSentimentData(stateCode, policy, days);
    
    return {
      state: stateCode,
      policy,
      period: `${days} days`,
      totalMentions: mockData.length,
      sentiment: {
        overall: (Math.random() - 0.5) * 1.5, // -0.75 to 0.75
        distribution: {
          positive: (Math.random() * 30 + 35).toFixed(1), // 35-65%
          negative: (Math.random() * 25 + 15).toFixed(1), // 15-40%
          neutral: (Math.random() * 20 + 20).toFixed(1)   // 20-40%
        },
        confidence: 0.8
      },
      sources: {
        twitter: { count: Math.floor(mockData.length * 0.6), averageSentiment: Math.random() - 0.5 },
        reddit: { count: Math.floor(mockData.length * 0.3), averageSentiment: Math.random() - 0.5 },
        news: { count: Math.floor(mockData.length * 0.1), averageSentiment: Math.random() - 0.5 }
      },
      trends: this.generateMockTrends(days),
      lastUpdated: new Date()
    };
  }

  // Generate mock sentiment data
  generateMockSentimentData(stateCode, policy, days) {
    const data = [];
    const baseCount = Math.floor(Math.random() * 500) + 200; // 200-700 mentions
    
    for (let i = 0; i < baseCount; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * days));
      
      data.push({
        id: `mock_${i}`,
        text: `Mock social media post about ${policy} in ${stateCode}`,
        createdAt: date,
        source: ['twitter', 'reddit', 'news'][Math.floor(Math.random() * 3)],
        sentiment: (Math.random() - 0.5) * 2 // -1 to 1
      });
    }
    
    return data;
  }

  // Generate mock trends
  generateMockTrends(days) {
    const trends = {};
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      trends[dateStr] = {
        count: Math.floor(Math.random() * 50) + 10,
        averageSentiment: (Math.random() - 0.5) * 1.5
      };
    }
    
    return trends;
  }

  // Mock news data
  getMockNewsData(stateCode, policy, days) {
    const headlines = [
      `${policy} initiative shows positive results in ${stateCode}`,
      `Government announces new ${policy} measures`,
      `Citizens respond to ${policy} implementation`,
      `${policy} budget allocation increases for ${stateCode}`,
      `Experts analyze ${policy} impact on state economy`
    ];

    return headlines.map((headline, index) => ({
      id: `news_${index}`,
      text: headline,
      createdAt: new Date(Date.now() - Math.random() * days * 24 * 60 * 60 * 1000),
      source: 'news',
      sentiment: (Math.random() - 0.5) * 1.5
    }));
  }
}

module.exports = new SentimentService();