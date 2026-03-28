import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import { LogOut, CheckCircle, Building2, Clock, Camera, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';
import netcomLogo from '../assets/netcom logo.jpg';

export default function FacultyDashboard() {
  const { user, setUser } = useContext(AuthContext);
  
  const [report, setReport] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [punchedIn, setPunchedIn] = useState(false);
  const [inTime, setInTime] = useState(null);
  const [punchedOut, setPunchedOut] = useState(false);
  const [outTime, setOutTime] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Geotag & Photo States
  const [photo, setPhoto] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    checkTodayStatus();
  }, []);

  const checkTodayStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('reports')
        .select('*')
        .eq('faculty_id', user.id)
        .eq('date', today)
        .order('id', { ascending: false })
        .limit(1)
        .single();
        
      if (data) {
        if (data.in_time) {
          setPunchedIn(true);
          setInTime(data.in_time);
        }
        if (data.out_time) {
          setPunchedOut(true);
          setOutTime(data.out_time);
          setReport(data.activities);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('netcom_auth_session');
    setUser(null);
  };

  const getCoordinates = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation not supported.'));
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => { setIsGettingLocation(false); resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
        (err) => { setIsGettingLocation(false); reject(new Error('Position access denied. Enable GPS.')); }
      );
    });
  };

  const handlePunchIn = async () => {
    if (!photo) return setErrorMsg("Geotagged Photo is required.");
    
    setIsSubmitting(true);
    setErrorMsg('');
    const time = new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });

    try {
      const coords = await getCoordinates();
      const localDate = new Date().toISOString().split('T')[0];

      // Upload Photo
      const fileExt = photo.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('faculty-verify')
        .upload(fileName, photo);

      if (uploadError) throw new Error("Upload failed.");

      const imageUrl = supabase.storage.from('faculty-verify').getPublicUrl(fileName).data.publicUrl;

      // Insert Report
      const { error } = await supabase.from('reports').insert({
          faculty_id: user.id,
          date: localDate,
          attendance_status: 'present',
          in_time: time,
          image_url: imageUrl,
          latitude: coords.lat,
          longitude: coords.lng
      });
      
      if (error) throw new Error('Database rejection.');
      
      setPunchedIn(true);
      setInTime(time);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePunchOutAndSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const time = new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
    
    try {
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('reports').update({
          activities: report,
          out_time: time
      }).eq('faculty_id', user.id).eq('date', today).eq('attendance_status', 'present');
      
      setPunchedOut(true);
      setOutTime(time);
      setTimeout(() => setUser(null), 1500);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="loading-screen"><Loader2 className="spinner" /> Syncing...</div>;

  return (
    <div className="dashboard-root" style={{ background: '#0c0e14', minHeight: '100vh', paddingBottom: '40px' }}>
      <header style={{ 
        background: 'rgba(22, 28, 45, 0.95)', 
        borderBottom: '1px solid rgba(255,255,255,0.1)', 
        padding: '10px 40px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src={netcomLogo} alt="NETCOM" style={{ height: '40px', borderRadius: '4px' }} />
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>FACULTY TERMINAL</h1>
        </div>
        <button onClick={handleLogout} className="btn outline">Logout</button>
      </header>

      <main className="container" style={{ marginTop: '40px', maxWidth: '600px' }}>
        <div className="panel animate-fade-in" style={{ padding: '40px', background: 'rgba(22, 28, 45, 0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px' }}>
          <h2 style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            Shift Verification
            {punchedIn && <MapPin size={18} color="#06b6d4" />}
          </h2>

          {errorMsg && <div className="auth-error" style={{ marginBottom: '20px' }}>{errorMsg}</div>}

          {!punchedIn && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(255,255,255,0.1)', padding: '30px', textAlign: 'center', borderRadius: '15px' }}>
                    {!photo ? (
                        <>
                            <Camera size={48} color="#94a3b8" style={{ marginBottom: '15px', opacity: 0.5 }} />
                            <input type="file" accept="image/*" capture="environment" id="cam-input" style={{ display: 'none' }} onChange={(e) => setPhoto(e.target.files[0])} />
                            <label htmlFor="cam-input" className="btn" style={{ background: '#06b6d4', borderColor: '#06b6d4' }}>Take Verification Photo</label>
                        </>
                    ) : (
                        <div style={{ position: 'relative' }}>
                            <img src={URL.createObjectURL(photo)} alt="proof" style={{ width: '100%', borderRadius: '10px', height: '150px', objectFit: 'cover' }} />
                            <button onClick={() => setPhoto(null)} style={{ position: 'absolute', top: 5, right: 5, background: 'red', border: 'none', color: 'white', padding: '5px', borderRadius: '5px' }}>Retry</button>
                        </div>
                    )}
                </div>
                <button onClick={handlePunchIn} className="btn" disabled={isSubmitting} style={{ padding: '15px', fontSize: '1.1rem', background: '#7c3aed' }}>
                  {isSubmitting ? 'Syncing Geotag...' : 'PUNCH IN (GEOSYNC)'}
                </button>
            </div>
          )}

          {punchedIn && !punchedOut && (
            <form onSubmit={handlePunchOutAndSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px', color: '#34d399', fontSize: '0.85rem' }}>Active Shift since {inTime}</div>
              <textarea rows="6" placeholder="Document your activities..." value={report} onChange={(e) => setReport(e.target.value)} required />
              <button type="submit" className="btn danger" style={{ padding: '15px' }}>COMPLETE SHIFT</button>
            </form>
          )}

          {punchedOut && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <CheckCircle size={60} color="#10b981" />
              <h3 style={{ marginTop: '20px' }}>SHIFT CONFIRMED</h3>
              <p style={{ color: '#94a3b8' }}>Remote terminal log synchronized.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
