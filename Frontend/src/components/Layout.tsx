import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  BarChart3, 
  Map, 
  TrendingUp, 
  Building2, 
  Brain, 
  MessageSquare,
  LogOut,
  User,
  FileSearch
} from 'lucide-react';

const Layout = () => {
  const { state, dispatch } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/states', label: 'State Analytics', icon: Map },
    { path: '/fiscal', label: 'Fiscal Performance', icon: TrendingUp },
    { path: '/infrastructure', label: 'Infrastructure', icon: Building2 },
    { path: '/ai-insights', label: 'AI Insights', icon: Brain },
    { path: '/sentiment', label: 'Public Sentiment', icon: MessageSquare },
    { path: '/rag-analysis', label: 'RAG Analysis', icon: FileSearch },
  ];

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">Fiscal Intelligence</h1>
          <p className="sidebar-subtitle">AI-Powered Dashboard</p>
        </div>
        
        <ul className="nav-menu">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path} className="nav-item">
                <Link 
                  to={item.path} 
                  className={`nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon className="nav-icon" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <main className="main-content">
        <header className="header">
          <h1 className="header-title">
            {navigationItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </h1>
          
          <div className="user-menu">
            <div className="user-info">
              <div className="user-name">{state.user?.name}</div>
              <div className="user-role">{state.user?.organization || 'Policy Analyst'}</div>
            </div>
            <User size={20} />
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </header>

        <Outlet />
      </main>
    </div>
  );
};

export default Layout;