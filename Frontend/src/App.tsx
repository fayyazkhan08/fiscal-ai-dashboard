import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StateAnalytics from './pages/StateAnalytics';
import FiscalPerformance from './pages/FiscalPerformance';
import Infrastructure from './pages/Infrastructure';
import AIInsights from './pages/AIInsights';
import SentimentTracking from './pages/SentimentTracking';
import RAGAnalysis from './pages/RAGAnalysis'; // Import new page
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/states" element={<StateAnalytics />} />
                <Route path="/fiscal" element={<FiscalPerformance />} />
                <Route path="/infrastructure" element={<Infrastructure />} />
                <Route path="/ai-insights" element={<AIInsights />} />
                <Route path="/sentiment" element={<SentimentTracking />} />
                <Route path="/rag-analysis" element={<RAGAnalysis />} />
              </Route>
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
