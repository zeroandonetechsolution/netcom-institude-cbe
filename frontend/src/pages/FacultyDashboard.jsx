import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import { LogOut, CheckCircle, Send, Building2, Clock, CalendarX2, Mail, Camera, MapPin, Loader2 } from 'lucide-react';
import { supabase } from '../supabase';

export default function FacultyDashboard() {
  const { user, setUser } = useContext(AuthContext);
  
  const [attendance, setAttendance] = useState('present');
  const [leaveReason, setLeaveReason] = useState('');
  const [report, setReport] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Punch In/Out States
  const [punchedIn, setPunchedIn] = useState(false);
  const [inTime, setInTime] = useState(null);
  const [punchedOut, setPunchedOut] = useState(false);
  const [outTime, setOutTime] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Geotag & Photo States
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null); // { lat, lng }
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    checkTodayStatus();
  }, []);

  const checkTodayStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('faculty_id', user.id)
        .eq('date', today)
        .order('id', { ascending: false })
        .limit(1)
        .single();
        
      if (data) {
        if (data.attendance_status === 'leave') {
          setAttendance('leave');
          setLeaveReason(data.leave_reason);
          setPunchedOut(true);
        } else {
          setAttendance('present');
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('zeroandone_auth_session');
    setUser(null);
  };

  const getCoordinates = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('Geolocation not supported by this browser.'));
      }
      setIsGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsGettingLocation(false);
          resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          setIsGettingLocation(false);
          reject(new Error('Position access denied. Enable GPS to punch in.'));
        }
      );
    });
  };

  const handlePunchIn = async () => {
    if (!photo) return setErrorMsg("A Geotagged Photo is MANDATORY for verification.");
    
    setIsSubmitting(true);
    setErrorMsg('');
    const time = new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });

    try {
      // 1. Get Location
      const coords = await getCoordinates();
      
      // 2. Date Check (Compare local system date vs server record)
      const localDate = new Date().toISOString().split('T')[0];
      const today = new Date().toLocaleDateString('en-CA'); // Force YYYY-MM-DD
      
      if (localDate !== today) {
        throw new Error("Date Mismatch: Your device clock must be synchronized to the current date.");
      }

      // 3. Upload Photo to bucket 'faculty-verify'
      const fileExt = photo.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('faculty-verify')
        .upload(fileName, photo);

      if (uploadError) throw new Error("Photo upload failed. Please try again.");

      const imageUrl = supabase.storage.from('faculty-verify').getPublicUrl(fileName).data.publicUrl;

      // 4. Insert Report
      const { error } = await supabase.from('reports').insert({
          faculty_id: user.id,
          date: localDate,
          attendance_status: 'present',
          in_time: time,
          image_url: imageUrl,
          latitude: coords.lat,
          longitude: coords.lng
      });
      
      if (error) throw new Error('Database rejection: Check RLS policies.');
      
      setPunchedIn(true);
      setInTime(time);
      setLocation(coords);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePunchOutAndSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    const time = new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('reports').update({
          attendance_status: 'present',
          activities: report,
          out_time: time
      }).eq('faculty_id', user.id).eq('date', today).eq('attendance_status', 'present');
      
      if (error) throw new Error('Failed to update shift log.');
      
      setPunchedOut(true);
      setOutTime(time);
      alert("Shift completed. Logged out successfully.");
      setTimeout(() => setUser(null), 1000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="loading-screen"><Loader2 className="spinner" /> Hydrating Portal...</div>;

  return (
    <div className="dashboard-root" style={{ background: 'var(--bg-color)', minHeight: '100vh', paddingBottom: '40px' }}>
      <header className="glass-panel" style={{ padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Building2 size={24} color="var(--primary-color)" />
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>VIRTUAL PORTAL — <span style={{ color: 'var(--primary-color)' }}>{user?.name}</span></h1>
        </div>
        <button onClick={handleLogout} className="btn outline">Logout</button>
      </header>

      <main className="container" style={{ marginTop: '40px' }}>
        <div className="panel animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', padding: '40px', borderRadius: '24px' }}>
          <h2 style={{ marginBottom: '25px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
            Shift Verification
            {punchedIn && <MapPin size={18} color="var(--accent-color)" />}
          </h2>

          {errorMsg && <div className="auth-error" style={{ marginBottom: '20px' }}>{errorMsg}</div>}

          {!punchedIn && !punchedOut && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ border: '2px dashed var(--border-color)', padding: '30px', textAlign: 'center', borderRadius: '15px' }}>
                    {!photo ? (
                        <>
                            <Camera size={48} color="var(--text-secondary)" style={{ marginBottom: '15px', opacity: 0.5 }} />
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '15px' }}>Photo Evidence Required for Geotagging</p>
                            <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment" 
                                id="cam-input" 
                                style={{ display: 'none' }} 
                                onChange={(e) => setPhoto(e.target.files[0])}
                            />
                            <label htmlFor="cam-input" className="btn" style={{ background: 'var(--accent-color)', borderColor: 'var(--accent-color)' }}>
                                Open Camera / Upload
                            </label>
                        </>
                    ) : (
                        <div style={{ position: 'relative' }}>
                            <img src={URL.createObjectURL(photo)} alt="verification" style={{ width: '100%', borderRadius: '10px', maxHeight: '200px', objectFit: 'cover' }} />
                            <button onClick={() => setPhoto(null)} style={{ position: 'absolute', top: 10, right: 10, background: 'red', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '5px' }}>Retry</button>
                        </div>
                    )}
                </div>

                <button 
                  onClick={handlePunchIn}
                  className="btn"
                  disabled={isSubmitting || isGettingLocation}
                  style={{ padding: '20px', fontSize: '1.2rem', fontWeight: 800, background: 'var(--primary-color)' }}
                >
                  {isSubmitting ? 'Verifying Coordinates...' : 'PUNCH IN (SYNC GEOTAG)'}
                </button>
            </div>
          )}

          {punchedIn && !punchedOut && (
            <form onSubmit={handlePunchOutAndSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '15px', borderRadius: '12px', color: '#34d399', fontSize: '0.9rem', fontWeight: 600 }}>
                ✓ Device Synchronized. Shift active since {inTime}.
              </div>
              <textarea 
                rows="6" 
                placeholder="Log your activities for the record..."
                value={report}
                onChange={(e) => setReport(e.target.value)}
                required
              />
              <button type="submit" className="btn danger" style={{ padding: '15px' }}>CLOSE SHIFT & EXIT</button>
            </form>
          )}

          {punchedOut && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <CheckCircle size={60} color="#10b981" style={{ marginBottom: '20px' }} />
              <h3>Terminal Log Locked</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>Your geotagged shift has been confirmed by the master registry.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
