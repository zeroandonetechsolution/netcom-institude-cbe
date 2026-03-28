import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { supabase } from './supabase';
import './index.css';

export const AuthContext = React.createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Immediate hydration from localStorage for Netcom persistence model
    const savedSession = localStorage.getItem('netcom_auth_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        setUser(parsed);
      } catch (e) {
        console.error("Session corruption detected, clearing...");
        localStorage.removeItem('netcom_auth_session');
      }
    }
    setLoading(false);

    // Optional: Keep listening for Supabase Auth changes if they integrate it later
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        if (_event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem('netcom_auth_session');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="loading-screen">
      <div className="spinner"></div>
      <p>Initializing Secure Session...</p>
    </div>;
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <div className="app-wrapper">
        <Router>
          <Routes>
            <Route path="/" element={!user ? <Login /> : (user.role === 'admin' ? <Navigate to="/admin"/> : <Navigate to="/faculty"/>)} />
            <Route path="/faculty" element={user?.role === 'faculty' ? <FacultyDashboard /> : <Navigate to="/"/>} />
            <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/"/>} />
          </Routes>
        </Router>
      </div>
    </AuthContext.Provider>
  );
}

export default App;
