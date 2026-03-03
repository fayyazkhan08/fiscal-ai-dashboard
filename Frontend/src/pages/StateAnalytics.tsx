import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MapPin, TrendingUp, DollarSign, Building } from 'lucide-react';

interface StateData {
  state: string;
  revenue: number;
  expenditure: number;
  fiscalDeficit: number;
  gsdpGrowth: string;
  infrastructureSpending: number;
  lastUpdated: string;
}

const StateAnalytics = () => {
  const [statesData, setStatesData] = useState<StateData[]>([]);
  const [selectedState, setSelectedState] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatesData();
  }, []);

  const fetchStatesData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/fiscal/states', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatesData(data);
        if (data.length > 0) {
          setSelectedState(data[0].state);
        }
      }
    } catch (error) {
      console.error('Error fetching states data:', error);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

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

  const selectedStateData = statesData.find(state => state.state === selectedState);

  const chartData = statesData.map(state => ({
    state: getStateName(state.state),
    revenue: state.revenue / 1000, // Convert to thousands for better readability
    expenditure: state.expenditure / 1000,
    deficit: state.fiscalDeficit / 1000,
    gsdpGrowth: parseFloat(state.gsdpGrowth),
    infrastructure: state.infrastructureSpending / 1000
  }));

  return (
    <div>
      {/* State Selector */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Select State for Detailed Analysis</h3>
          <MapPin className="card-icon" />
        </div>
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
          {statesData.map(state => (
            <option key={state.state} value={state.state}>
              {getStateName(state.state)}
            </option>
          ))}
        </select>
      </div>

      {/* Selected State Overview */}
      {selectedStateData && (
        <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Revenue</h3>
              <DollarSign className="card-icon" style={{ color: '#10b981' }} />
            </div>
            <div className="metric-value" style={{ color: '#10b981' }}>
              {formatCurrency(selectedStateData.revenue)}
            </div>
            <div className="metric-label">Total State Revenue</div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Expenditure</h3>
              <TrendingUp className="card-icon" style={{ color: '#ef4444' }} />
            </div>
            <div className="metric-value" style={{ color: '#ef4444' }}>
              {formatCurrency(selectedStateData.expenditure)}
            </div>
            <div className="metric-label">Total State Expenditure</div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">GSDP Growth</h3>
              <TrendingUp className="card-icon" style={{ color: '#6366f1' }} />
            </div>
            <div className="metric-value" style={{ color: '#6366f1' }}>
              {selectedStateData.gsdpGrowth}%
            </div>
            <div className="metric-label">Annual Growth Rate</div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Infrastructure</h3>
              <Building className="card-icon" style={{ color: '#f59e0b' }} />
            </div>
            <div className="metric-value" style={{ color: '#f59e0b' }}>
              {formatCurrency(selectedStateData.infrastructureSpending)}
            </div>
            <div className="metric-label">Infrastructure Spending</div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="dashboard-grid">
        {/* Revenue vs Expenditure by State */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Revenue vs Expenditure by State</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="state" />
                <YAxis tickFormatter={(value) => `₹${value}K Cr`} />
                <Tooltip formatter={(value: number) => [`₹${value}K Crores`, '']} />
                <Legend />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                <Bar dataKey="expenditure" fill="#ef4444" name="Expenditure" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GSDP Growth Comparison */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">GSDP Growth Comparison</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="state" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value}%`, 'GSDP Growth']} />
                <Bar dataKey="gsdpGrowth" fill="#6366f1" name="GSDP Growth %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Infrastructure Spending and Fiscal Deficit */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Infrastructure Spending by State</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="state" />
                <YAxis tickFormatter={(value) => `₹${value}K Cr`} />
                <Tooltip formatter={(value: number) => [`₹${value}K Crores`, 'Infrastructure']} />
                <Bar dataKey="infrastructure" fill="#f59e0b" name="Infrastructure Spending" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Fiscal Deficit by State</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="state" />
                <YAxis tickFormatter={(value) => `₹${value}K Cr`} />
                <Tooltip formatter={(value: number) => [`₹${value}K Crores`, 'Deficit']} />
                <Bar dataKey="deficit" fill="#ef4444" name="Fiscal Deficit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* States Data Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Detailed State-wise Data</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>State</th>
                <th>Revenue</th>
                <th>Expenditure</th>
                <th>Fiscal Deficit</th>
                <th>GSDP Growth</th>
                <th>Infrastructure Spending</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {statesData.map(state => (
                <tr key={state.state}>
                  <td>{getStateName(state.state)}</td>
                  <td>{formatCurrency(state.revenue)}</td>
                  <td>{formatCurrency(state.expenditure)}</td>
                  <td>{formatCurrency(state.fiscalDeficit)}</td>
                  <td>{state.gsdpGrowth}%</td>
                  <td>{formatCurrency(state.infrastructureSpending)}</td>
                  <td>{new Date(state.lastUpdated).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StateAnalytics;