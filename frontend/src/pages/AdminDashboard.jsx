import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import { LogOut, Users, FileText, Activity, ShieldAlert, Building2, UserPlus, Trash2, Clock } from 'lucide-react';

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

  const fetchReports = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/reports');
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users');
      const data = await res.json();
      setFaculties(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchReports();
  }, [activeTab]);

  const handleLogout = () => {
    setUser(null);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm(`Are you sure you want to completely delete exactly this faculty member (${id}) and all their reports?`)) return;
    try {
      await fetch(`http://localhost:5000/api/users/${id}`, { method: 'DELETE' });
      fetchUsers();
      fetchReports();
    } catch (e) {
      alert("Error deleting user: " + e.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newFacId || !newFacName || !newFacPass) return alert("All fields are required");
    try {
      const res = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newFacId, name: newFacName, password: newFacPass })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Reset form on success
      setNewFacId('');
      setNewFacName('');
      setNewFacPass('');
      setShowAddForm(false);
      fetchUsers();
    } catch (e) {
      alert("Error creating user: " + e.message);
    }
  };

  const handleGenerateAI = async () => {
    setAiGenerating(true);
    setAiMessage('Synthesizing data... This may take a moment.');
    try {
      const res = await fetch('http://localhost:5000/api/generate-ai-report', { method: 'POST' });
      const data = await res.json();
      if (data.previewUrl) {
        setAiMessage(`Success! Test Draft URL: ${data.previewUrl}`);
      } else {
        setAiMessage('Report directly sent to your jegatheeshwar01@gmail.com inbox! Check your email.');
      }
    } catch (e) {
      setAiMessage('Error generating report: ' + e.toString());
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh', paddingBottom: '40px' }}>
      <header style={{ background: 'var(--panel-bg)', borderBottom: '1px solid var(--border-color)', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Building2 size={28} color="var(--primary-color)" />
          <h1 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Netcom <span style={{ color: 'var(--primary-color)', fontWeight: '400' }}>Admin Portal</span>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.95rem' }}>
            <Activity size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} />
            {user?.name}
          </span>
          <button onClick={handleLogout} className="btn outline" style={{ padding: '8px 16px' }}>
            <LogOut size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Logout
          </button>
        </div>
      </header>

      <div className="container" style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: '250px 1fr', gap: '30px' }}>
        <aside className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px' }}>
          <button 
            className={`btn ${activeTab === 'overview' ? '' : 'outline'}`} 
            onClick={() => setActiveTab('overview')}
            style={{ textAlign: 'left', justifyContent: 'flex-start', border: 'none', background: activeTab === 'overview' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'overview' ? '#fff' : 'var(--text-secondary)' }}
          >
            <Users size={18} style={{ marginRight: '8px' }} /> Manage Faculty
          </button>
          <button 
            className={`btn ${activeTab === 'reports' ? '' : 'outline'}`} 
            onClick={() => setActiveTab('reports')}
            style={{ textAlign: 'left', justifyContent: 'flex-start', border: 'none', background: activeTab === 'reports' ? 'var(--primary-color)' : 'transparent', color: activeTab === 'reports' ? '#fff' : 'var(--text-secondary)' }}
          >
            <FileText size={18} style={{ marginRight: '8px' }} /> Daily Reports
          </button>
        </aside>

        <main className="panel animate-fade-in" style={{ minHeight: '60vh', padding: '30px' }}>
          {activeTab === 'overview' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', display: 'inline-block', marginRight: '15px' }}>Faculty Database</h2>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>({faculties.length} total)</span>
                </div>
                <button className="btn" onClick={() => setShowAddForm(!showAddForm)} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                  <UserPlus size={16} /> Add New Faculty
                </button>
              </div>

              {showAddForm && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px', marginBottom: '25px' }}>
                  <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '15px' }}>Register New Faculty Account</h3>
                  <form onSubmit={handleCreateUser} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                    <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                      <label>Faculty ID</label>
                      <input type="text" placeholder="e.g. F-105" value={newFacId} onChange={e => setNewFacId(e.target.value)} required />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0, flex: 1.5 }}>
                      <label>Full Name</label>
                      <input type="text" placeholder="e.g. Dr. Sarah Connor" value={newFacName} onChange={e => setNewFacName(e.target.value)} required />
                    </div>
                    <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                      <label>Password</label>
                      <input type="text" placeholder="Set password" value={newFacPass} onChange={e => setNewFacPass(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn" style={{ padding: '11px 20px', height: 'fit-content' }}>Create User</button>
                  </form>
                </div>
              )}

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 16px', borderRadius: '6px 0 0 6px' }}>UID</th>
                    <th style={{ padding: '12px 16px' }}>Name</th>
                    <th style={{ padding: '12px 16px' }}>Role</th>
                    <th style={{ padding: '12px 16px', borderRadius: '0 6px 6px 0', textAlign: 'right' }}>Superuser Actions</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.95rem' }}>
                  {faculties.map((f, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '16px', fontWeight: '500', color: 'var(--text-secondary)' }}>{f.id}</td>
                      <td style={{ padding: '16px', color: 'var(--text-primary)', fontWeight: '500' }}>{f.name}</td>
                      <td style={{ padding: '16px', color: 'var(--primary-color)' }}>{f.role}</td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleDeleteUser(f.id)}
                          className="btn danger" 
                          style={{ padding: '6px 10px', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)' }}
                        >
                          <Trash2 size={14} style={{ marginRight: '4px' }} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {faculties.length === 0 && <tr><td colSpan="4" style={{padding: '20px', textAlign: 'center', color: 'var(--text-secondary)'}}>No users found</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <div style={{ marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid var(--border-color)' }}>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Daily Reports Database</h2>
              </div>
              
              {reports.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Waiting for daily reports submission deadline (5:00 PM).</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', marginTop: '10px' }}>Logs will populate here once faculty members upload their activity.</p>
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                  {reports.map((r, i) => (
                     <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-color)'}}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <h3 style={{fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0}}>{r.name} <span style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>({r.faculty_id})</span></h3>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{r.date}</span>
                       </div>
                       <div style={{ marginBottom: '10px' }}>
                         <span style={{ 
                            background: r.attendance_status === 'present' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: r.attendance_status === 'present' ? '#34d399' : '#f87171',
                            padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold'
                          }}>
                            {r.attendance_status.toUpperCase()}
                          </span>
                          {r.attendance_status === 'present' && r.in_time && (
                            <span style={{ marginLeft: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                              Clocked In: {r.in_time} {r.out_time ? `— Out: ${r.out_time}` : '(Active Shift)'}
                            </span>
                          )}
                       </div>
                       <div>
                          {r.attendance_status === 'leave' ? (
                            <p style={{ color: '#f87171', fontSize: '0.95rem' }}><strong>Reason:</strong> {r.leave_reason}</p>
                          ) : (
                            <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-line', fontSize: '0.95rem', lineHeight: '1.5' }}>{r.activities}</p>
                          )}
                       </div>
                     </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
