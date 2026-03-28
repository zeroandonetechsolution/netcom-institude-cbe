import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../App';
import { Building2, Shield, UserCheck, ArrowRight } from 'lucide-react';
import './Login.css';
import { API_BASE_URL } from '../config';

export default function Login() {
  const { setUser } = useContext(AuthContext);
  const [role, setRole] = useState('admin'); // 'admin' or 'faculty'
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [loading, setLoading] = useState(false);

  // Re-trigger animation on role change
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [role]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!userId || !password) {
      setError("Please enter both User ID and Password.");
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, password, role })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      
      setUser(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Animated Background Elements */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>
      
      <div className="login-box panel">
        <div className="brand-header fade-in">
          <div className="icon-wrapper">
            <Building2 size={36} color="var(--primary-color)" />
          </div>
          <h1>Netcom</h1>
          <span className="brand-suffix">Technologies</span>
        </div>
        
        <p className="subtitle fade-in" style={{ animationDelay: '0.1s' }}>
          Institute Management Portal
        </p>

        <div className="role-selector fade-in" style={{ animationDelay: '0.2s' }}>
          <button 
            type="button" 
            className={`role-btn ${role === 'admin' ? 'active' : ''}`}
            onClick={() => { setRole('admin'); setError(''); setUserId(''); setPassword(''); }}
          >
            <Shield size={18} /> Admin Login
          </button>
          <button 
            type="button" 
            className={`role-btn ${role === 'faculty' ? 'active' : ''}`}
            onClick={() => { setRole('faculty'); setError(''); setUserId(''); setPassword(''); }}
          >
            <UserCheck size={18} /> Faculty Login
          </button>
        </div>

        <form onSubmit={handleLogin} className={`login-form ${isAnimating ? 'form-changing' : ''}`}>
          <div className="input-group slide-up" style={{ animationDelay: '0.3s' }}>
            <label>{role === 'admin' ? 'Administrator ID' : 'Faculty ID'}</label>
            <input 
              type="text" 
              placeholder={`Enter your ID...`}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="animated-input"
              disabled={loading}
            />
          </div>
          
          <div className="input-group slide-up" style={{ animationDelay: '0.4s' }}>
            <label>Secure Password</label>
            <input 
              type="password" 
              placeholder="Enter your password..." 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="animated-input"
              disabled={loading}
            />
          </div>
          
          {error && <div className="error-message shake">{error}</div>}

          <button type="submit" className="btn submit-btn slide-up" style={{ animationDelay: '0.5s' }} disabled={loading}>
            <span>{loading ? 'Authenticating...' : 'Access Portal'}</span>
            <ArrowRight size={18} className="btn-icon" />
          </button>
        </form>
      </div>
    </div>
  );
}
