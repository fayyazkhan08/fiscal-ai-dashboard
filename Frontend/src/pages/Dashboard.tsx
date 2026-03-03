import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';

interface DashboardData {
  overview: {
    totalRevenue: number;
    totalExpenditure: number;
    averageGsdpGrowth: string;
    totalFiscalDeficit: number;
    totalStates: number;
  };
  topPerformers: Array<{
    state: string;
    gsdpGrowth: string;
    revenueEfficiency: string;
  }>;
}

const Dashboard = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/dashboard/overview', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const overviewData = await response.json();
        
        // Fetch top performers
        const performersResponse = await fetch('http://localhost:3001/api/dashboard/top-performers', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const topPerformers = performersResponse.ok ? await performersResponse.json() : [];
        
        setData({
          overview: overviewData,
          topPerformers
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  if (!data) {
    return <div>Error loading dashboard data</div>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(amount);
  };

  const revenueVsExpenditure = [
    { name: 'Revenue', value: data.overview.totalRevenue, fill: '#10b981' },
    { name: 'Expenditure', value: data.overview.totalExpenditure, fill: '#ef4444' }
  ];

  const fiscalTrends = [
    { month: 'Jan', revenue: 85000, expenditure: 92000, deficit: 7000 },
    { month: 'Feb', revenue: 88000, expenditure: 89000, deficit: 1000 },
    { month: 'Mar', revenue: 92000, expenditure: 95000, deficit: 3000 },
    { month: 'Apr', revenue: 87000, expenditure: 88000, deficit: 1000 },
    { month: 'May', revenue: 95000, expenditure: 97000, deficit: 2000 },
    { month: 'Jun', revenue: 98000, expenditure: 94000, deficit: -4000 }
  ];

  return (
    <div>
      {/* Key Metrics */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Total Revenue</h3>
            <DollarSign className="card-icon" style={{ color: '#10b981' }} />
          </div>
          <div className="metric-value" style={{ color: '#10b981' }}>
            {formatCurrency(data.overview.totalRevenue)}
          </div>
          <div className="metric-change positive">
            <TrendingUp size={16} />
            +8.5% from last quarter
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Total Expenditure</h3>
            <TrendingDown className="card-icon" style={{ color: '#ef4444' }} />
          </div>
          <div className="metric-value" style={{ color: '#ef4444' }}>
            {formatCurrency(data.overview.totalExpenditure)}
          </div>
          <div className="metric-change negative">
            <TrendingUp size={16} />
            +12.3% from last quarter
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Average GSDP Growth</h3>
            <TrendingUp className="card-icon" style={{ color: '#6366f1' }} />
          </div>
          <div className="metric-value" style={{ color: '#6366f1' }}>
            {data.overview.averageGsdpGrowth}%
          </div>
          <div className="metric-change positive">
            <TrendingUp size={16} />
            +2.1% from last year
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Fiscal Deficit</h3>
            <AlertTriangle className="card-icon" style={{ color: '#f59e0b' }} />
          </div>
          <div className="metric-value" style={{ color: '#f59e0b' }}>
            {formatCurrency(data.overview.totalFiscalDeficit)}
          </div>
          <div className="metric-change negative">
            <TrendingDown size={16} />
            -15.2% from last quarter
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="dashboard-grid">
        {/* Revenue vs Expenditure Pie Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Revenue vs Expenditure</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueVsExpenditure}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                >
                  {revenueVsExpenditure.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performing States */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Performing States</h3>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topPerformers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="state" />
                <YAxis />
                <Tooltip 
                  formatter={(value: string, name: string) => [
                    `${value}${name.includes('Growth') ? '%' : '%'}`, 
                    name
                  ]}
                />
                <Legend />
                <Bar dataKey="gsdpGrowth" fill="#6366f1" name="GSDP Growth" />
                <Bar dataKey="revenueEfficiency" fill="#10b981" name="Revenue Efficiency" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Fiscal Trends Line Chart */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Fiscal Trends (6 Months)</h3>
        </div>
        <div className="chart-container large">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fiscalTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Revenue"
              />
              <Line 
                type="monotone" 
                dataKey="expenditure" 
                stroke="#ef4444" 
                strokeWidth={3}
                name="Expenditure"
              />
              <Line 
                type="monotone" 
                dataKey="deficit" 
                stroke="#f59e0b" 
                strokeWidth={3}
                name="Deficit/Surplus"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;