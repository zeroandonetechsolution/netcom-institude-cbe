import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';
import { Shield, Lock, User, LogIn, AlertTriangle, ShieldCheck } from 'lucide-react';
import { supabase } from '../supabase';
import './Login.css';
import netcomLogo from '../assets/netcom logo.jpg';

export default function Login() {
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' or 'employee'
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Fetch user data across all roles to determine access
      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (dbError || !data) {
        throw new Error("Terminal ID not found in Netcom database.");
      }

      if (data.password !== password) {
        throw new Error("Secure keyphrase mismatch. Verification failed.");
      }

      // Logic check: Ensure admins use the Admin tab, and employees use the Employee tab
      if (activeTab === 'admin' && data.role !== 'admin') {
        throw new Error("Administrative override required. Use Employee terminal.");
      }
      if (activeTab === 'employee' && data.role === 'admin') {
        throw new Error("Administrator detected. Please use Admin Portal access.");
      }

      const sessionUser = { id: data.id, name: data.name, role: data.role };
      setUser(sessionUser);
      localStorage.setItem('netcom_auth_session', JSON.stringify(sessionUser));

    } catch (err) {
      setError(err.errorMessage || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="ambient-background">
        <div className="vibrant-blob purple"></div>
        <div className="vibrant-blob cyan"></div>
        <div className="vibrant-blob blue"></div>
      </div>

      <div className="glass-panel login-card">
        <div className="logo-section">
          <img src={netcomLogo} alt="Netcom" style={{ width: 80, height: 60, borderRadius: 10, objectFit: 'cover' }} />
          <div className="brand-copy">
            <span className="platform-tag">CENTRAL ACCESS GATEWAY</span>
            <h2 style={{ color: 'white', margin: 0 }}>NETCOM <span style={{ color: '#7c3aed' }}>TECHNOLOGIES</span></h2>
          </div>
        </div>

        <p className="portal-title">Institutional Resource Management</p>

        <div className="role-toggle-container">
          <button className={`toggle-tab ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
            <Shield size={18} /> Admin
          </button>
          <button className={`toggle-tab ${activeTab === 'employee' ? 'active' : ''}`} onClick={() => setActiveTab('employee')}>
            <User size={18} /> Employee
          </button>
          <div className={`tab-indicator ${activeTab === 'employee' ? 'faculty' : ''}`}></div>
        </div>

        <form onSubmit={handleLogin} className={`login-form ${isLoading ? 'shifting' : ''}`}>
          <div className="input-row">
            <label>{activeTab === 'admin' ? 'Administrative Access ID' : 'Employee Terminal ID'}</label>
            <div className="field-group">
              <input type="text" placeholder={activeTab === 'admin' ? "Admin ID" : "F-10X / H-10X"} value={userId} onChange={(e) => setUserId(e.target.value)} required />
            </div>
          </div>

          <div className="input-row">
            <label>Master Security Key</label>
            <div className="field-group">
              <input type="password" placeholder="********" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>

          {error && (
            <div className="auth-error animate-shake">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <button type="submit" className="login-action-btn" disabled={isLoading}>
            {isLoading ? <span className="loader">Syncing...</span> : (
              <>
                <LogIn size={20} />
                Access Terminal
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <div className="encryption-notice">
             <ShieldCheck size={14} color="#10b981" />
             Secured by Netcom Institutional Protocols
          </div>
        </div>
      </div>
    </div>
  );
}
