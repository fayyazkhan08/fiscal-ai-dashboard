import React, { useState, useEffect, useCallback } from 'react';
import { Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { MessageSquare, TrendingUp, TrendingDown, Users, BarChart3 } from 'lucide-react';

interface SentimentData {
  state: string;
  policy: string;
  sentiment: number;
  confidence: number;
  mentions: number;
  timestamp: string;
}

const SentimentTracking = () => {
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [selectedState, setSelectedState] = useState<string>('MH');
  const [selectedPolicy, setSelectedPolicy] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const states = [
    { code: 'MH', name: 'Maharashtra' },
    { code: 'KA', name: 'Karnataka' },
    { code: 'TN', name: 'Tamil Nadu' },
    { code: 'GJ', name: 'Gujarat' },
    { code: 'UP', name: 'Uttar Pradesh' }
  ];

  const policies = [
    'Budget Allocation',
    'Infrastructure Spending',
    'Digital Initiatives',
    'Healthcare',
    'Education'
  ];

  const fetchSentimentData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/ai/sentiment/${selectedState}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSentimentData(data);
      }
    } catch (error) {
      console.error('Error fetching sentiment data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedState]);

  useEffect(() => {
    fetchSentimentData();
  }, [fetchSentimentData]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const filteredData = selectedPolicy === 'all' 
    ? sentimentData 
    : sentimentData.filter(item => item.policy === selectedPolicy);

  // Aggregate sentiment by policy
  const policyAggregated = policies.map(policy => {
    const policyData = sentimentData.filter(item => item.policy === policy);
    const avgSentiment = policyData.reduce((sum, item) => sum + item.sentiment, 0) / policyData.length;
    const totalMentions = policyData.reduce((sum, item) => sum + item.mentions, 0);
    const avgConfidence = policyData.reduce((sum, item) => sum + item.confidence, 0) / policyData.length;
    
    return {
      policy,
      sentiment: avgSentiment,
      mentions: totalMentions,
      confidence: avgConfidence
    };
  });

  // Time series data for trending
  const timeSeriesData = filteredData
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-30) // Last 30 data points
    .map(item => ({
      date: new Date(item.timestamp).toLocaleDateString(),
      sentiment: item.sentiment,
      confidence: item.confidence,
      mentions: item.mentions
    }));

  const getSentimentLabel = (sentiment: number) => {
    if (sentiment > 0.3) return 'Positive';
    if (sentiment > -0.3) return 'Neutral';
    return 'Negative';
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment > 0.3) return '#10b981';
    if (sentiment > -0.3) return '#f59e0b';
    return '#ef4444';
  };

  const overallSentiment = filteredData.reduce((sum, item) => sum + item.sentiment, 0) / filteredData.length;
  const totalMentions = filteredData.reduce((sum, item) => sum + item.mentions, 0);

  return (
    <div>
      {/* Controls */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Public Sentiment Analysis</h3>
          <MessageSquare className="card-icon" />
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <select 
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '1rem',
              minWidth: '200px'
            }}
          >
            {states.map(state => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
          
          <select 
            value={selectedPolicy}
            onChange={(e) => setSelectedPolicy(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              fontSize: '1rem',
              minWidth: '200px'
            }}
          >
            <option value="all">All Policies</option>
            {policies.map(policy => (
              <option key={policy} value={policy}>
                {policy}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sentiment Overview */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Overall Sentiment</h3>
            {overallSentiment > 0 ? 
              <TrendingUp className="card-icon" style={{ color: '#10b981' }} /> :
              <TrendingDown className="card-icon" style={{ color: '#ef4444' }} />
            }
          </div>
          <div className="metric-value" style={{ color: getSentimentColor(overallSentiment) }}>
            {getSentimentLabel(overallSentiment)}
          </div>
          <div className="metric-label">
            Score: {overallSentiment.toFixed(2)}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Total Mentions</h3>
            <Users className="card-icon" style={{ color: '#6366f1' }} />
          </div>
          <div className="metric-value" style={{ color: '#6366f1' }}>
            {totalMentions.toLocaleString()}
          </div>
          <div className="metric-label">Social media mentions</div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Confidence Level</h3>
            <BarChart3 className="card-icon" style={{ color: '#f59e0b' }} />
          </div>
          <div className="metric-value" style={{ color: '#f59e0b' }}>
            {(filteredData.reduce((sum, item) => sum + item.confidence, 0) / filteredData.length * 100).toFixed(1)}%
          </div>
          <div className="metric-label">Analysis confidence</div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Trend Direction</h3>
            <TrendingUp className="card-icon" style={{ color: '#10b981' }} />
          </div>
          <div className="metric-value" style={{ color: '#10b981' }}>
            Improving
          </div>
          <div className="metric-label">7-day trend</div>
        </div>
      </div>

      {/* Sentiment Trends */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Sentiment Trends Over Time</h3>
        </div>
        <div className="chart-container large">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[-1, 1]} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'sentiment' ? value.toFixed(2) : 
                  name === 'confidence' ? `${(value * 100).toFixed(1)}%` :
                  value,
                  name === 'sentiment' ? 'Sentiment Score' :
                  name === 'confidence' ? 'Confidence' : 'Mentions'
                ]}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="sentiment" 
                stroke="#6366f1" 
                fill="#6366f1" 
                fillOpacity={0.3}
                name="Sentiment Score"
              />
              <Line 
                type="monotone" 
                dataKey="confidence" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Confidence Level"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Policy-wise Sentiment */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Sentiment by Policy Area</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Policy Area</th>
                <th>Sentiment</th>
                <th>Score</th>
                <th>Mentions</th>
                <th>Confidence</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {policyAggregated.map(policy => (
                <tr key={policy.policy}>
                  <td>{policy.policy}</td>
                  <td>
                    <div style={{ 
                      color: getSentimentColor(policy.sentiment),
                      fontWeight: '600'
                    }}>
                      {getSentimentLabel(policy.sentiment)}
                    </div>
                  </td>
                  <td>{policy.sentiment.toFixed(2)}</td>
                  <td>{policy.mentions.toLocaleString()}</td>
                  <td>{(policy.confidence * 100).toFixed(1)}%</td>
                  <td>
                    <div className={`status-indicator ${
                      policy.sentiment > 0.3 ? 'status-good' : 
                      policy.sentiment > -0.3 ? 'status-moderate' : 'status-concern'
                    }`}>
                      {policy.sentiment > 0.3 ? 'Positive' : 
                       policy.sentiment > -0.3 ? 'Neutral' : 'Needs Attention'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sentiment Distribution */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Sentiment Activity</h3>
        </div>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {filteredData.slice(-10).reverse().map((item, index) => (
            <div 
              key={index}
              style={{
                padding: '1rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                  {item.policy}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  {item.mentions} mentions • {(item.confidence * 100).toFixed(1)}% confidence
                </div>
              </div>
              <div style={{ 
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                fontWeight: '600',
                color: 'white',
                backgroundColor: getSentimentColor(item.sentiment)
              }}>
                {getSentimentLabel(item.sentiment)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SentimentTracking;