import React, { useState, useEffect, useCallback } from 'react';
import { Brain, Lightbulb, TrendingUp, Target, Clock, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AISuggestion {
  category: string;
  idea: string;
  description: string;
  estimatedRevenue: string;
  timeline: string;
  feasibility: string;
}

interface Forecast {
  state: string;
  metric: string;
  forecast: Array<{
    month: number;
    value: number;
    confidence: number;
  }>;
  accuracy: string;
  model: string;
}

const AIInsights = () => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [selectedState, setSelectedState] = useState<string>('MH');
  const [loading, setLoading] = useState(false);
  const [forecastLoading, setForecastLoading] = useState(false);

  const states = [
    { code: 'MH', name: 'Maharashtra' },
    { code: 'KA', name: 'Karnataka' },
    { code: 'TN', name: 'Tamil Nadu' },
    { code: 'GJ', name: 'Gujarat' },
    { code: 'UP', name: 'Uttar Pradesh' }
  ];

  const generateAISuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/ai/suggestions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stateCode: selectedState,
          fiscalData: {
            revenue: 100000,
            expenditure: 120000,
            deficit: 20000
          }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedState]);

  useEffect(() => {
    generateAISuggestions();
  }, [generateAISuggestions]);

  const generateForecast = async () => {
    setForecastLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/ai/forecast', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stateCode: selectedState,
          metric: 'fiscalDeficit',
          timeframe: '12'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setForecast(data);
      }
    } catch (error) {
      console.error('Error generating forecast:', error);
    } finally {
      setForecastLoading(false);
    }
  };

  const getFeasibilityColor = (feasibility: string) => {
    switch (feasibility.toLowerCase()) {
      case 'high':
        return '#10b981';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  return (
    <div>
      {/* State Selector */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">AI-Powered Fiscal Intelligence</h3>
          <Brain className="card-icon" />
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
          <button 
            onClick={generateAISuggestions}
            className="btn btn-primary"
            disabled={loading}
          >
            <Lightbulb size={16} />
            {loading ? 'Generating...' : 'Generate Ideas'}
          </button>
          <button 
            onClick={generateForecast}
            className="btn btn-secondary"
            disabled={forecastLoading}
          >
            <TrendingUp size={16} />
            {forecastLoading ? 'Forecasting...' : 'Generate Forecast'}
          </button>
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Capital Generation Ideas</h3>
          <Lightbulb className="card-icon" />
        </div>
        
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {suggestions.map((suggestion, index) => (
              <div 
                key={index}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'start',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h4 style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: '600', 
                      marginBottom: '0.5rem',
                      color: '#1a202c'
                    }}>
                      {suggestion.idea}
                    </h4>
                    <div style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      backgroundColor: '#6366f1',
                      color: 'white'
                    }}>
                      {suggestion.category}
                    </div>
                  </div>
                  <div style={{
                    display: 'inline-block',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    backgroundColor: getFeasibilityColor(suggestion.feasibility),
                    color: 'white'
                  }}>
                    {suggestion.feasibility} Feasibility
                  </div>
                </div>
                
                <p style={{ 
                  color: '#64748b', 
                  marginBottom: '1rem',
                  lineHeight: '1.6'
                }}>
                  {suggestion.description}
                </p>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <DollarSign size={16} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '0.875rem' }}>
                      <strong>Revenue:</strong> {suggestion.estimatedRevenue}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Clock size={16} style={{ color: '#f59e0b' }} />
                    <span style={{ fontSize: '0.875rem' }}>
                      <strong>Timeline:</strong> {suggestion.timeline}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Forecast Results */}
      {forecast && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 className="card-title">Fiscal Deficit Forecast - {states.find(s => s.code === selectedState)?.name}</h3>
            <TrendingUp className="card-icon" />
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Model Accuracy: </span>
                <span style={{ fontWeight: '600', color: '#10b981' }}>{forecast.accuracy}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Model Type: </span>
                <span style={{ fontWeight: '600' }}>{forecast.model}</span>
              </div>
            </div>
          </div>

          <div className="chart-container large">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast.forecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={(value) => `Month ${value}`}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    name === 'value' ? 'Predicted Deficit' : 'Confidence'
                  ]}
                  labelFormatter={(value) => `Month ${value}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  name="Predicted Deficit"
                />
                <Line 
                  type="monotone" 
                  dataKey="confidence" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Confidence Level"
                  yAxisId="right"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* AI Insights Summary */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">AI Analysis Summary</h3>
            <Brain className="card-icon" />
          </div>
          <div style={{ fontSize: '0.875rem', lineHeight: '1.6', color: '#64748b' }}>
            <p style={{ marginBottom: '1rem' }}>
              Based on current fiscal data analysis, {states.find(s => s.code === selectedState)?.name} shows 
              strong potential for revenue generation through innovative capital projects.
            </p>
            <p>
              Our AI model recommends focusing on public-private partnerships and green infrastructure 
              initiatives to maximize both fiscal impact and sustainability goals.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Key Recommendations</h3>
            <Target className="card-icon" />
          </div>
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            fontSize: '0.875rem',
            lineHeight: '1.6'
          }}>
            <li style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: '#10b981' 
              }}></div>
              Prioritize high-feasibility infrastructure bonds
            </li>
            <li style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: '#6366f1' 
              }}></div>
              Implement digital service fee structures
            </li>
            <li style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: '#f59e0b' 
              }}></div>
              Establish PPP frameworks for smart cities
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AIInsights;