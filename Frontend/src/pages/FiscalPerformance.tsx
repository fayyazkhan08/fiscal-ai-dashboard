import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react';

interface FiscalHealth {
  state: string;
  deficitRatio: string;
  debtSustainability: string;
  revenueGrowth: string;
  expenditureEfficiency: string;
}

const FiscalPerformance = () => {
  const [fiscalHealth, setFiscalHealth] = useState<FiscalHealth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiscalHealth();
  }, []);

  const fetchFiscalHealth = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/dashboard/fiscal-health', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFiscalHealth(data);
      }
    } catch (error) {
      console.error('Error fetching fiscal health data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const getStateName = (code: string) => {
    const stateNames: { [key: string]: string } = {
      'MH': 'Maharashtra',
      'KA': 'Karnataka',
      'TN': 'Tamil Nadu',
      'GJ': 'Gujarat',
      'UP': 'Uttar Pradesh'
    };
    return stateNames[code] || code;
  };

  const getSustainabilityIcon = (sustainability: string) => {
    switch (sustainability) {
      case 'Good':
        return <CheckCircle size={20} style={{ color: '#10b981' }} />;
      case 'Moderate':
        return <AlertCircle size={20} style={{ color: '#f59e0b' }} />;
      case 'Concern':
        return <TrendingDown size={20} style={{ color: '#ef4444' }} />;
      default:
        return <AlertCircle size={20} style={{ color: '#64748b' }} />;
    }
  };

  // Generate historical data for trending
  const generateHistoricalData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(month => ({
      month,
      deficitRatio: Math.random() * 6 + 1,
      revenueGrowth: Math.random() * 15 + 5,
      expenditureEfficiency: Math.random() * 20 + 80
    }));
  };

  const historicalData = generateHistoricalData();

  const chartData = fiscalHealth.map(state => ({
    state: getStateName(state.state),
    deficitRatio: parseFloat(state.deficitRatio),
    revenueGrowth: parseFloat(state.revenueGrowth),
    expenditureEfficiency: parseFloat(state.expenditureEfficiency)
  }));

  return (
    <div>
      {/* Fiscal Health Overview */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Average Deficit Ratio</h3>
            <TrendingDown className="card-icon" style={{ color: '#ef4444' }} />
          </div>
          <div className="metric-value" style={{ color: '#ef4444' }}>
            {(fiscalHealth.reduce((sum, state) => sum + parseFloat(state.deficitRatio), 0) / fiscalHealth.length).toFixed(2)}%
          </div>
          <div className="metric-label">Of Revenue</div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">States with Good Health</h3>
            <CheckCircle className="card-icon" style={{ color: '#10b981' }} />
          </div>
          <div className="metric-value" style={{ color: '#10b981' }}>
            {fiscalHealth.filter(state => state.debtSustainability === 'Good').length}
          </div>
          <div className="metric-label">Out of {fiscalHealth.length} states</div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Average Revenue Growth</h3>
            <TrendingUp className="card-icon" style={{ color: '#6366f1' }} />
          </div>
          <div className="metric-value" style={{ color: '#6366f1' }}>
            {(fiscalHealth.reduce((sum, state) => sum + parseFloat(state.revenueGrowth), 0) / fiscalHealth.length).toFixed(2)}%
          </div>
          <div className="metric-label">Year over Year</div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Efficiency Score</h3>
            <TrendingUp className="card-icon" style={{ color: '#f59e0b' }} />
          </div>
          <div className="metric-value" style={{ color: '#f59e0b' }}>
            {(fiscalHealth.reduce((sum, state) => sum + parseFloat(state.expenditureEfficiency), 0) / fiscalHealth.length).toFixed(1)}%
          </div>
          <div className="metric-label">Expenditure Efficiency</div>
        </div>
      </div>

      {/* Historical Trends */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Fiscal Performance Trends (12 Months)</h3>
        </div>
        <div className="chart-container large">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="deficitRatio" 
                stroke="#ef4444" 
                strokeWidth={3}
                name="Deficit Ratio (%)"
              />
              <Line 
                type="monotone" 
                dataKey="revenueGrowth" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Revenue Growth (%)"
              />
              <Line 
                type="monotone" 
                dataKey="expenditureEfficiency" 
                stroke="#6366f1" 
                strokeWidth={3}
                name="Expenditure Efficiency (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* State-wise Performance Charts */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Deficit Ratio by State</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="state" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value}%`, 'Deficit Ratio']} />
                <Bar dataKey="deficitRatio" fill="#ef4444" name="Deficit Ratio %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Revenue Growth by State</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="state" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value}%`, 'Revenue Growth']} />
                <Bar dataKey="revenueGrowth" fill="#10b981" name="Revenue Growth %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Fiscal Health Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Detailed Fiscal Health Assessment</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>State</th>
                <th>Deficit Ratio</th>
                <th>Debt Sustainability</th>
                <th>Revenue Growth</th>
                <th>Expenditure Efficiency</th>
                <th>Overall Health</th>
              </tr>
            </thead>
            <tbody>
              {fiscalHealth.map(state => (
                <tr key={state.state}>
                  <td>{getStateName(state.state)}</td>
                  <td>{state.deficitRatio}%</td>
                  <td>
                    <div className="status-indicator" style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem' 
                    }}>
                      {getSustainabilityIcon(state.debtSustainability)}
                      <span className={`status-${state.debtSustainability.toLowerCase()}`}>
                        {state.debtSustainability}
                      </span>
                    </div>
                  </td>
                  <td>{state.revenueGrowth}%</td>
                  <td>{state.expenditureEfficiency}%</td>
                  <td>
                    <div className={`status-indicator status-${state.debtSustainability.toLowerCase()}`}>
                      {state.debtSustainability}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FiscalPerformance;