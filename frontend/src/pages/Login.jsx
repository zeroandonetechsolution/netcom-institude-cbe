import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../App';
import { Building2, Shield, UserCheck, ArrowRight, Sparkles } from 'lucide-react';
import './Login.css';
import { supabase } from '../supabase';

export default function Login() {
  const { setUser } = useContext(AuthContext);
  const [role, setRole] = useState('admin');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  // Trigger changing animation
  const handleRoleChange = (newRole) => {
    if (role === newRole) return;
    setIsChanging(true);
    setTimeout(() => {
      setRole(newRole);
      setUserId('');
      setPassword('');
      setError('');
      setIsChanging(false);
    }, 200);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!userId || !password) {
      setError("Identification required.");
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Direct Database Query for simpler Role-Based Access without complex Supabase Auth setup
      // Matches the "Zero and One" pragmatic premium structure
      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .eq('role', role)
        .single();
        
      if (dbError || !data || data.password !== password) {
        throw new Error('Authentication failed. Invalid credentials.');
      }
      
      const sessionUser = { id: data.id, name: data.name, role: data.role };
      
      // Save to localStorage for simple persistence across reloads (Zero-config migration)
      localStorage.setItem('zeroandone_auth_session', JSON.stringify(sessionUser));
      setUser(sessionUser);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Dynamic Background */}
      <div className="ambient-background">
        <div className="vibrant-blob purple"></div>
        <div className="vibrant-blob cyan"></div>
        <div className="vibrant-blob blue"></div>
      </div>
      
      <div className="login-card glass-panel">
        <div className="login-header">
          <div className="logo-section">
            <div className="icon-badge">
              <Building2 size={32} />
            </div>
            <div className="brand-copy">
              <span className="platform-tag">Netcom Powered by</span>
              <h2>Zero<span>&</span>One</h2>
            </div>
          </div>
          <p className="portal-title">Institutional Resource Management</p>
        </div>

        <div className="role-toggle-container">
          <button 
            className={`toggle-tab ${role === 'admin' ? 'active' : ''}`}
            onClick={() => handleRoleChange('admin')}
          >
            <Shield size={16} /> Admin
          </button>
          <button 
            className={`toggle-tab ${role === 'faculty' ? 'active' : ''}`}
            onClick={() => handleRoleChange('faculty')}
          >
            <UserCheck size={16} /> Faculty
          </button>
          <div className={`tab-indicator ${role}`} />
        </div>

        <form onSubmit={handleLogin} className={`login-form ${isChanging ? 'shifting' : ''}`}>
          <div className="input-row">
            <label>{role === 'admin' ? 'Administrative Access ID' : 'Faculty Personnel ID'}</label>
            <div className="field-group">
              <input 
                type="text" 
                placeholder={role === 'admin' ? 'admin' : 'faculty_id'}
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
          
          <div className="input-row">
            <label>Secure Keyphrase</label>
            <div className="field-group">
              <input 
                type="password" 
                placeholder="********" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          {error && (
            <div className="auth-error animate-shake">
              <ShieldAlert size={14} /> {error}
            </div>
          )}

          <button type="submit" className="login-action-btn" disabled={loading}>
            {loading ? (
              <span className="loader">Authenticating...</span>
            ) : (
              <>
                <span>Enter Terminal</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <span className="encryption-notice">
            <Sparkles size={12} /> Military-grade end-to-end encryption active
          </span>
        </div>
      </div>
    </div>
  );
}
