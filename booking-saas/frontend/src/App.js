import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BookingPage from './pages/BookingPage';
import SettingsPage from './pages/SettingsPage';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [businessId, setBusinessId] = useState(localStorage.getItem('business_id'));

  useEffect(() => {
    // Set default axios headers
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  const handleLogin = (newToken, newBusinessId) => {
    setToken(newToken);
    setBusinessId(newBusinessId);
    localStorage.setItem('token', newToken);
    localStorage.setItem('business_id', newBusinessId);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  const handleLogout = () => {
    setToken(null);
    setBusinessId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('business_id');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          token ? <Navigate to="/dashboard" /> : <LoginPage onLogin={handleLogin} />
        } />
        
        <Route path="/dashboard" element={
          token ? <DashboardPage businessId={businessId} onLogout={handleLogout} /> : <Navigate to="/login" />
        } />
        
        <Route path="/bookings" element={
          token ? <BookingPage businessId={businessId} /> : <Navigate to="/login" />
        } />
        
        <Route path="/settings" element={
          token ? <SettingsPage businessId={businessId} /> : <Navigate to="/login" />
        } />
        
        <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
