import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import { LogOut, Users, FileText, Activity, ShieldAlert, Building2, UserPlus, Trash2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../supabase';

export default function AdminDashboard() {
  const { user, setUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  
  const [faculties, setFaculties] = useState([]);
  const [reports, setReports] = useState([]);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  // Add Faculty Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFacId, setNewFacId] = useState('');
  const [newFacName, setNewFacName] = useState('');
  const [newFacPass, setNewFacPass] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`*, users(name)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      const formattedData = data.map(r => ({
        ...r,
        name: r.users?.name || 'Unknown'
      }));
      setReports(formattedData);
    } catch (err) {
      console.error('Fetch Reports Error:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('role', 'faculty');
      if (error) throw error;
      setFaculties(data);
    } catch (err) {
      console.error('Fetch Users Error:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchReports();
  }, [activeTab]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('zeroandone_auth_session');
    setUser(null);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm(`Permanently delete faculty record: ${id}?`)) return;
    try {
      const { error } = await supabase.from('users').delete().eq('id', id).eq('role', 'faculty');
      if (error) throw error;
      fetchUsers();
      fetchReports();
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newFacId || !newFacName || !newFacPass) return alert("All fields required");
    
    setCreateLoading(true);
    try {
      // NOTE: Ensure your 'users' table in Supabase has RLS disabled or a policy for inserts!
      const { error } = await supabase.from('users').insert({
        id: newFacId,
        name: newFacName,
        password: newFacPass,
        role: 'faculty'
      });
      
      if (error) {
        console.error('Supabase Insert Error:', error);
        throw new Error(error.message || "Database rejected the entry. Check RLS policies.");
      }
      
      // Reset form
      setNewFacId('');
      setNewFacName('');
      setNewFacPass('');
      setShowAddForm(false);
      alert("Faculty successfully registered to terminal.");
      fetchUsers();
    } catch (e) {
      alert("CRITICAL ERROR: " + e.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    setAiGenerating(true);
    setAiMessage('Synthesizing regional data...');
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-report');
      if (error || !data?.success) throw new Error(data?.error || error?.message || 'Synthesis failed');
      setAiMessage(data.previewUrl ? `Success! Report Draft: ${data.previewUrl}` : 'Report dispatched to Administrator inbox.');
    } catch (e) {
      setAiMessage('Synthesis Error: ' + e.toString());
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="dashboard-root" style={{ background: 'var(--bg-color)', minHeight: '100vh', paddingBottom: '60px' }}>
      <header style={{ 
        background: 'var(--panel-bg)', 
        backdropFilter: 'blur(10px)', 
        borderBottom: '1px solid var(--border-color)', 
        padding: '15px 40px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        position: 'sticky', top: 0, zIndex: 100 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ background: 'var(--primary-color)', padding: '6px', borderRadius: '8px', color: 'white' }}>
            <Building2 size={24} />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            NETCOM <span style={{ color: 'var(--primary-color)', fontWeight: 400 }}>MASTER TERMINAL</span>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '6px 15px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{user?.name}</span>
          </div>
          <button onClick={handleLogout} className="btn outline" style={{ borderRadius: '10px', fontSize: '0.85rem' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="container" style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: '40px' }}>
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            className={`btn ${activeTab === 'overview' ? '' : 'outline'}`} 
            onClick={() => setActiveTab('overview')}
            style={{ justifyContent: 'flex-start', border: activeTab === 'overview' ? 'none' : '1px solid var(--border-color)', background: activeTab === 'overview' ? 'var(--primary-color)' : 'transparent', padding: '12px 20px', borderRadius: '12px' }}
          >
            <Users size={18} /> Faculty Database
          </button>
          <button 
            className={`btn ${activeTab === 'reports' ? '' : 'outline'}`} 
            onClick={() => setActiveTab('reports')}
            style={{ justifyContent: 'flex-start', border: activeTab === 'reports' ? 'none' : '1px solid var(--border-color)', background: activeTab === 'reports' ? 'var(--primary-color)' : 'transparent', padding: '12px 20px', borderRadius: '12px' }}
          >
            <FileText size={18} /> Activity Logs
          </button>
          
          <div style={{ marginTop: 'auto', padding: '20px', background: 'rgba(124, 58, 237, 0.05)', borderRadius: '15px', border: '1px dashed var(--primary-color)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>AI REPORT GENERATOR</p>
            <button className="btn" onClick={handleGenerateAI} disabled={aiGenerating} style={{ width: '100%', fontSize: '0.8rem', padding: '10px' }}>
              {aiGenerating ? 'Synthesizing...' : 'Generate AI Weekly'}
            </button>
            {aiMessage && <p style={{ fontSize: '0.7rem', marginTop: '8px', color: 'var(--primary-color)' }}>{aiMessage}</p>}
          </div>
        </aside>

        <main className="panel animate-fade-in" style={{ borderRadius: '24px', background: 'var(--panel-bg)', borderColor: 'var(--border-color)', padding: '35px' }}>
          {activeTab === 'overview' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Personnel Registry</h2>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>— {faculties.length} entries detected</span>
                </div>
                <button className="btn" onClick={() => setShowAddForm(!showAddForm)} style={{ background: 'var(--accent-color)', borderColor: 'var(--accent-color)', borderRadius: '10px' }}>
                  <UserPlus size={18} /> {showAddForm ? 'Cancel' : 'Enroll Faculty'}
                </button>
              </div>

              {showAddForm && (
                <div className="glass-panel" style={{ padding: '25px', borderRadius: '16px', marginBottom: '35px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={18} color="var(--accent-color)" /> Mandatory Information Request
                  </h3>
                  <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto', gap: '20px', alignItems: 'flex-end' }}>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label>ID CODE</label>
                      <input type="text" placeholder="F-10X" value={newFacId} onChange={e => setNewFacId(e.target.value)} required />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label>FULL LEGAL NAME</label>
                      <input type="text" placeholder="John Doe" value={newFacName} onChange={e => setNewFacName(e.target.value)} required />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label>ACCESS KEY</label>
                      <input type="text" placeholder="Set password" value={newFacPass} onChange={e => setNewFacPass(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn" disabled={createLoading} style={{ padding: '12px 25px' }}>
                      {createLoading ? 'Syncing...' : 'Confirm Enrollment'}
                    </button>
                  </form>
                </div>
              )}

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                  <thead>
                    <tr style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      <th style={{ padding: '10px 20px', textAlign: 'left' }}>Terminal ID</th>
                      <th style={{ padding: '10px 20px', textAlign: 'left' }}>Faculty Name</th>
                      <th style={{ padding: '10px 20px', textAlign: 'left' }}>System Role</th>
                      <th style={{ padding: '10px 20px', textAlign: 'right' }}>Management</th>
                    </tr>
                  </thead>
                  <tbody>
                    {faculties.map((f, i) => (
                      <tr key={i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                        <td style={{ padding: '15px 20px', borderRadius: '12px 0 0 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>#{f.id}</td>
                        <td style={{ padding: '15px 20px', fontWeight: 700 }}>{f.name}</td>
                        <td style={{ padding: '15px 20px' }}>
                          <span style={{ color: 'var(--accent-color)', background: 'rgba(6,182,212,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>{f.role.toUpperCase()}</span>
                        </td>
                        <td style={{ padding: '15px 20px', borderRadius: '0 12px 12px 0', textAlign: 'right' }}>
                          <button onClick={() => handleDeleteUser(f.id)} className="btn danger outline" style={{ padding: '6px 12px', fontSize: '0.8rem', opacity: 0.7 }}>
                            <Trash2 size={14} /> Purge
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '30px' }}>Activity Stream</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {reports.length === 0 ? (
                  <div style={{ padding: '60px', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '16px', border: '1px dashed var(--border-color)' }}>
                    <AlertCircle size={40} style={{ color: 'var(--text-secondary)', marginBottom: '15px', opacity: 0.5 }} />
                    <p style={{ color: 'var(--text-secondary)' }}>No telemetry data received for the current cycle.</p>
                  </div>
                ) : (
                  reports.map((r, i) => (
                    <div key={i} className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{r.name}</h3>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Terminal: {r.faculty_id}</span>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 600 }}>{r.date}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                        <span style={{ 
                          background: r.attendance_status === 'present' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: r.attendance_status === 'present' ? '#34d399' : '#f87171',
                          padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase'
                        }}>
                          {r.attendance_status}
                        </span>
                        {r.attendance_status === 'present' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <Clock size={14} /> {r.in_time} — {r.out_time || 'ACTIVE'}
                          </div>
                        )}
                        {r.latitude && r.longitude && (
                          <a 
                            href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ 
                              display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', 
                              color: 'var(--accent-color)', fontWeight: 700, textDecoration: 'none',
                              background: 'rgba(6,182,212,0.1)', padding: '4px 8px', borderRadius: '4px'
                            }}
                          >
                            <MapPin size={12} /> Live Location Sync
                          </a>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                        {r.image_url && (
                          <div style={{ width: '150px', minWidth: '150px' }}>
                            <img src={r.image_url} alt="verification" style={{ width: '100%', borderRadius: '10px', height: '100px', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '5px' }}>Geotagged Proof</p>
                          </div>
                        )}
                        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', opacity: 0.9, lineHeight: 1.6 }}>
                          {r.attendance_status === 'leave' ? `Reason: ${r.leave_reason}` : r.activities}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
