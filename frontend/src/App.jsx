import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';

export const AuthContext = React.createContext();

function App() {
  const [user, setUser] = useState(null); // { role: 'admin' | 'faculty', name: '...' }

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
