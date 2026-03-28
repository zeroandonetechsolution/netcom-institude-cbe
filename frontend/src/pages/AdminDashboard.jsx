import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import { LogOut, Users, FileText, Activity, Building2, UserPlus, Trash2, Clock, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';
import { supabase } from '../supabase';
import netcomLogo from '../assets/netcom logo.jpg';

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
  const [newFacRole, setNewFacRole] = useState('faculty'); // Default role
  const [createLoading, setCreateLoading] = useState(false);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`*, users(name)`)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      const formattedData = data.map(r => ({ ...r, name: r.users?.name || 'Unknown' }));
      setReports(formattedData);
    } catch (err) {
      console.error('Fetch Reports Error:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('users').select('id, name, role');
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
    localStorage.removeItem('netcom_auth_session');
    setUser(null);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm(`Permanently Purge Faculty: ${id}?`)) return;
    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      fetchUsers();
      fetchReports();
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newFacId || !newFacName || !newFacPass) return alert("Required Metadata Missing");
    
    setCreateLoading(true);
    try {
      const { error } = await supabase.from('users').insert({
        id: newFacId,
        name: newFacName,
        password: newFacPass,
        role: newFacRole
      });
      
      if (error) throw new Error(error.message);
      
      setNewFacId('');
      setNewFacName('');
      setNewFacPass('');
      setShowAddForm(false);
      alert("Faculty enrollment confirmed.");
      fetchUsers();
    } catch (e) {
      alert("Enrollment Failed: " + e.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-report');
      if (error || !data?.success) throw new Error('Synthesis failure.');
      setAiMessage(data.previewUrl ? 'Report Ready.' : 'Report Mailed.');
    } catch (e) {
      setAiMessage('Error.');
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="dashboard-root" style={{ background: '#0c0e14', minHeight: '100vh', paddingBottom: '60px' }}>
      <header style={{ 
        background: 'rgba(22, 28, 45, 0.95)', 
        backdropFilter: 'blur(10px)', 
        borderBottom: '1px solid rgba(255,255,255,0.1)', 
        padding: '10px 40px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        position: 'sticky', top: 0, zIndex: 100 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={netcomLogo} alt="NETCOM" style={{ height: '45px', borderRadius: '4px' }} />
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.5px', color: '#fff' }}>
            ADMIN <span style={{ color: '#7c3aed', fontWeight: 400 }}>TERMINAL</span>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{user?.name}</span>
          </div>
          <button onClick={handleLogout} className="btn outline" style={{ fontSize: '0.8rem' }}>Logout</button>
        </div>
      </header>

      <div className="container" style={{ marginTop: '40px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: '40px' }}>
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button className={`btn ${activeTab === 'overview' ? '' : 'outline'}`} onClick={() => setActiveTab('overview')} style={{ justifyContent: 'flex-start', background: activeTab === 'overview' ? '#7c3aed' : 'transparent', borderRadius: '12px' }}>
            <Users size={18} /> Faculty DB
          </button>
          <button className={`btn ${activeTab === 'reports' ? '' : 'outline'}`} onClick={() => setActiveTab('reports')} style={{ justifyContent: 'flex-start', background: activeTab === 'reports' ? '#7c3aed' : 'transparent', borderRadius: '12px' }}>
            <FileText size={18} /> Shift Logs
          </button>
        </aside>

        <main className="panel animate-fade-in" style={{ borderRadius: '24px', background: 'rgba(22, 28, 45, 0.7)', border: '1px solid rgba(255,255,255,0.1)', padding: '35px' }}>
          {activeTab === 'overview' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Personnel Registry</h2>
                <button className="btn" onClick={() => setShowAddForm(!showAddForm)} style={{ background: '#06b6d4', borderColor: '#06b6d4' }}>
                  <UserPlus size={18} /> {showAddForm ? 'Close' : 'Enroll New'}
                </button>
              </div>

              {showAddForm && (
                <div style={{ padding: '25px', borderRadius: '16px', marginBottom: '35px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                    <div className="input-group">
                      <label>ID CODE</label>
                      <input type="text" placeholder="F-10X" value={newFacId} onChange={e => setNewFacId(e.target.value)} required />
                    </div>
                    <div className="input-group">
                      <label>FULL NAME</label>
                      <input type="text" placeholder="John Doe" value={newFacName} onChange={e => setNewFacName(e.target.value)} required />
                    </div>
                    <div className="input-group">
                      <label>ACCESS KEY</label>
                      <input type="text" placeholder="Password" value={newFacPass} onChange={e => setNewFacPass(e.target.value)} required />
                    </div>
                    <div className="input-group">
                      <label>DESIGNATION / ROLE</label>
                      <select 
                        value={newFacRole} 
                        onChange={e => setNewFacRole(e.target.value)} 
                        style={{ padding: '12px', background: '#0c0e14', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px' }}
                      >
                        <option value="faculty">Faculty</option>
                        <option value="hardware engineer">Hardware Engineer</option>
                        <option value="coordinator">Coordinator</option>
                        <option value="sub-coordinator">Sub-Coordinator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <button type="submit" className="btn" disabled={createLoading} style={{ gridColumn: 'span 2', padding: '15px' }}>
                      {createLoading ? 'Syncing...' : 'Enroll Faculty Member'}
                    </button>
                  </form>
                </div>
              )}

              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                <thead>
                  <tr style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 20px', textAlign: 'left' }}>UID</th>
                    <th style={{ padding: '10px 20px', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '10px 20px', textAlign: 'left' }}>Designation</th>
                    <th style={{ padding: '10px 20px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {faculties.map((f, i) => (
                    <tr key={i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                      <td style={{ padding: '15px 20px', fontWeight: 600 }}>#{f.id}</td>
                      <td style={{ padding: '15px 20px', fontWeight: 700 }}>{f.name}</td>
                      <td style={{ padding: '15px 20px' }}>
                        <span style={{ color: '#06b6d4', background: 'rgba(6,182,212,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>{f.role}</span>
                      </td>
                      <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                        <button onClick={() => handleDeleteUser(f.id)} className="btn danger outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '25px' }}>Activity Logs</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {reports.map((r, i) => (
                  <div key={i} style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{r.name}</h3>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ID: {r.faculty_id}</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: '#7c3aed', fontWeight: 700 }}>{r.date}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                        <span style={{ background: r.attendance_status === 'present' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: r.attendance_status === 'present' ? '#34d399' : '#f87171', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800 }}>{r.attendance_status.toUpperCase()}</span>
                        {r.latitude && <a href={`https://maps.google.com?q=${r.latitude},${r.longitude}`} target="_blank" style={{ fontSize: '0.75rem', color: '#06b6d4' }}><MapPin size={12} /> Map Proof</a>}
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      {r.image_url && <img src={r.image_url} alt="Proof" style={{ width: 100, height: 80, borderRadius: 8, objectFit: 'cover' }} />}
                      <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>{r.activities || 'No activities logged.'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
