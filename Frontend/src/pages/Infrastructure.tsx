import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Building2, Zap, Droplets, Wifi, Activity } from 'lucide-react';

interface InfrastructureData {
  state: string;
  category: string;
  spending: number;
  projects: number;
  completion: number;
  year: number;
}

const Infrastructure = () => {
  const [infrastructureData, setInfrastructureData] = useState<InfrastructureData[]>([]);
  const [selectedState, setSelectedState] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInfrastructureData();
  }, []);

  const fetchInfrastructureData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/fiscal/infrastructure', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInfrastructureData(data);
      }
    } catch (error) {
      console.error('Error fetching infrastructure data:', error);
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Transportation':
        return <Building2 size={24} style={{ color: '#6366f1' }} />;
      case 'Energy':
        return <Zap size={24} style={{ color: '#f59e0b' }} />;
      case 'Water':
        return <Droplets size={24} style={{ color: '#06b6d4' }} />;
      case 'Digital':
        return <Wifi size={24} style={{ color: '#8b5cf6' }} />;
      case 'Healthcare':
        return <Activity size={24} style={{ color: '#ef4444' }} />;
      default:
        return <Building2 size={24} style={{ color: '#64748b' }} />;
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

  const uniqueStates = [...new Set(infrastructureData.map(item => item.state))];
  
  const filteredData = selectedState === 'all' 
    ? infrastructureData 
    : infrastructureData.filter(item => item.state === selectedState);

  // Aggregate data by category
  interface CategoryData {
    category: string;
    spending: number;
    projects: number;
    avgCompletion: number;
  }

  const categoryData = infrastructureData.reduce((acc: CategoryData[], item) => {
    const existing = acc.find(cat => cat.category === item.category);
    if (existing) {
      existing.spending += item.spending;
      existing.projects += item.projects;
      existing.avgCompletion = (existing.avgCompletion + item.completion) / 2;
    } else {
      acc.push({
        category: item.category,
        spending: item.spending,
        projects: item.projects,
        avgCompletion: item.completion
      });
    }
    return acc;
  }, []);

  const pieColors = ['#6366f1', '#f59e0b', '#06b6d4', '#8b5cf6', '#ef4444'];

  // State-wise aggregated data
  const stateWiseData = uniqueStates.map(stateCode => {
    const stateData = infrastructureData.filter(item => item.state === stateCode);
    return {
      state: getStateName(stateCode),
      totalSpending: stateData.reduce((sum, item) => sum + item.spending, 0),
      totalProjects: stateData.reduce((sum, item) => sum + item.projects, 0),
      avgCompletion: stateData.reduce((sum, item) => sum + item.completion, 0) / stateData.length
    };
  });

  return (
    <div>
      {/* State Filter */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Infrastructure Analysis</h3>
          <Building2 className="card-icon" />
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
          <option value="all">All States</option>
          {uniqueStates.map(state => (
            <option key={state} value={state}>
              {getStateName(state)}
            </option>
          ))}
        </select>
      </div>

      {/* Category Overview Cards */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        {categoryData.map((category, index) => (
          <div key={category.category} className="card">
            <div className="card-header">
              <h3 className="card-title">{category.category}</h3>
              {getCategoryIcon(category.category)}
            </div>
            <div className="metric-value" style={{ color: pieColors[index] }}>
              {formatCurrency(category.spending)}
            </div>
            <div className="metric-label">
              {category.projects} projects • {category.avgCompletion.toFixed(1)}% completion
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="dashboard-grid">
        {/* Spending by Category Pie Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Infrastructure Spending by Category</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  dataKey="spending"
                  label={({ category, spending }) => `${category}: ${formatCurrency(spending)}`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Completion by Category */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Project Completion Rate</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Completion Rate']} />
                <Bar dataKey="avgCompletion" fill="#10b981" name="Completion Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* State-wise Infrastructure Spending */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">State-wise Infrastructure Investment</h3>
        </div>
        <div className="chart-container large">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stateWiseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="state" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  name === 'totalSpending' ? formatCurrency(value) : value,
                  name === 'totalSpending' ? 'Total Spending' : 
                  name === 'totalProjects' ? 'Total Projects' : 'Avg Completion %'
                ]}
              />
              <Legend />
              <Bar dataKey="totalSpending" fill="#6366f1" name="Total Spending" />
              <Bar dataKey="totalProjects" fill="#f59e0b" name="Total Projects" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Infrastructure Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Detailed Infrastructure Data</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>State</th>
                <th>Category</th>
                <th>Spending</th>
                <th>Projects</th>
                <th>Completion Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={index}>
                  <td>{getStateName(item.state)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getCategoryIcon(item.category)}
                      {item.category}
                    </div>
                  </td>
                  <td>{formatCurrency(item.spending)}</td>
                  <td>{item.projects}</td>
                  <td>{item.completion}%</td>
                  <td>
                    <div className={`status-indicator ${
                      item.completion >= 80 ? 'status-good' : 
                      item.completion >= 60 ? 'status-moderate' : 'status-concern'
                    }`}>
                      {item.completion >= 80 ? 'On Track' : 
                       item.completion >= 60 ? 'In Progress' : 'Needs Attention'}
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

export default Infrastructure;