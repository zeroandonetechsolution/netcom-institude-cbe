import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import { LogOut, CheckCircle, Building2, Clock, Camera, MapPin, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
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

  // Verification States
  const [photo, setPhoto] = useState(null);
  const [manualInTime, setManualInTime] = useState('');
  const [manualOutTime, setManualOutTime] = useState('');
  const [isManual, setIsManual] = useState(false);

  // Role Checks
  const isPrivileged = ['admin', 'coordinator', 'sub-coordinator', 'hardware engineer'].includes(user?.role?.toLowerCase());
  const isFaculty = user?.role?.toLowerCase() === 'faculty';

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

  const verifyGeotag = (file) => {
    return new Promise((resolve, reject) => {
      if (typeof window.EXIF === 'undefined') {
        return reject(new Error("Verification module loading... Try again in 2 seconds."));
      }
      
      window.EXIF.getData(file, function() {
        const lat = window.EXIF.getTag(this, "GPSLatitude");
        const lon = window.EXIF.getTag(this, "GPSLongitude");
        const dt = window.EXIF.getTag(this, "DateTimeOriginal");

        if (!lat || !lon) {
          return reject(new Error("Upload Failed! Image uploaded without Geo-Tag. Please upload the geo-tag image taked today."));
        }

        // Verify Date (Check if taken today)
        if (dt) {
          // EXIF Date is usually YYYY:MM:DD HH:MM:SS
          const datePart = dt.split(' ')[0].replace(/:/g, '-');
          const today = new Date().toISOString().split('T')[0];
          if (datePart !== today) {
            return reject(new Error("Compliance Error: Image was not taken today. Please take a fresh photo."));
          }
        }
        
        // Convert EXIF Rational Coordinates to decimal
        const latDecimal = lat[0] + lat[1]/60 + lat[2]/3600;
        const lonDecimal = lon[0] + lon[1]/60 + lon[2]/3600;
        resolve({ lat: latDecimal, lng: lonDecimal });
      });
    });
  };

  const handlePunchIn = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });

    try {
      let lat = null, lng = null, finalImageUrl = null;
      const finalTime = isManual ? manualInTime : currentTime;

      if (isFaculty) {
        if (!photo) throw new Error("Verification photo is required for Faculty punch-in.");
        
        // Deep File Verification
        const coords = await verifyGeotag(photo);
        lat = coords.lat;
        lng = coords.lng;

        // Upload to Cloud
        const fileExt = photo.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('faculty-verify').upload(fileName, photo);
        if (uploadError) throw new Error("Evidence upload failed. Reset terminal.");
        finalImageUrl = supabase.storage.from('faculty-verify').getPublicUrl(fileName).data.publicUrl;
      }

      // Sync to Database
      const localDate = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('reports').insert({
          faculty_id: user.id,
          date: localDate,
          attendance_status: 'present',
          in_time: finalTime,
          image_url: finalImageUrl,
          latitude: lat,
          longitude: lng
      });
      
      if (error) throw new Error('Terminal Sync Disconnected.');
      
      setPunchedIn(true);
      setInTime(finalTime);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePunchOut = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const currentTime = new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
    const finalTime = isManual ? manualOutTime : currentTime;

    try {
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('reports').update({
          activities: report,
          out_time: finalTime
      }).eq('faculty_id', user.id).eq('date', today).eq('attendance_status', 'present');
      
      setPunchedOut(true);
      setOutTime(finalTime);
      setTimeout(() => setUser(null), 2000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="loading-screen"><Loader2 className="spinner" /> Hydrating Portal...</div>;

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
          <h1 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'white' }}>{user.role.toUpperCase()} TERMINAL</h1>
        </div>
        <button onClick={handleLogout} className="btn outline" style={{ fontSize: '0.8rem' }}>Logout</button>
      </header>

      <main className="container" style={{ marginTop: '40px', maxWidth: '600px' }}>
        <div className="panel animate-fade-in" style={{ padding: '35px', background: 'rgba(22, 28, 45, 0.7)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Shift Management</h2>
            {isPrivileged && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', cursor: 'pointer', color: '#94a3b8' }}>
                <input type="checkbox" checked={isManual} onChange={(e) => setIsManual(e.target.checked)} />
                Manual Entry Mode
              </label>
            )}
          </div>

          {errorMsg && (
            <div className="auth-error animate-shake" style={{ marginBottom: '25px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '15px', borderRadius: '12px', fontSize: '0.9rem', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <AlertCircle size={20} />
              <span>{errorMsg}</span>
            </div>
          )}

          {!punchedIn && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                {isFaculty && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', border: '2px dashed rgba(255,255,255,0.1)', padding: '30px', textAlign: 'center', borderRadius: '15px' }}>
                        {!photo ? (
                            <>
                                <Camera size={48} color="#94a3b8" style={{ marginBottom: '15px', opacity: 0.5 }} />
                                <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '15px' }}>Mandatory Evidence: Upload Geotagged Photo</p>
                                <input type="file" accept="image/*" capture="environment" id="cam-input" style={{ display: 'none' }} onChange={(e) => setPhoto(e.target.files[0])} />
                                <label htmlFor="cam-input" className="btn" style={{ background: '#06b6d4', borderColor: '#06b6d4' }}>Take Verification Photo</label>
                            </>
                        ) : (
                            <div style={{ position: 'relative' }}>
                                <img src={URL.createObjectURL(photo)} alt="proof" style={{ width: '100%', borderRadius: '10px', height: '180px', objectFit: 'cover' }} />
                                <button onClick={() => setPhoto(null)} style={{ position: 'absolute', top: 5, right: 5, background: 'red', border: 'none', color: 'white', padding: '6px', borderRadius: '5px' }}>Retake</button>
                                <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '10px' }}>✓ Image Loaded. Verification pending.</p>
                            </div>
                        )}
                    </div>
                )}

                {isManual && isPrivileged && (
                   <div className="input-group">
                      <label>SPECIFY PUNCH-IN TIME</label>
                      <input type="time" value={manualInTime} onChange={(e) => setManualInTime(e.target.value)} required style={{ background: '#0c0e14', padding: '15px' }} />
                   </div>
                )}

                <button onClick={handlePunchIn} className="btn" disabled={isSubmitting} style={{ padding: '18px', fontSize: '1.2rem', fontWeight: 800, background: '#7c3aed' }}>
                  {isSubmitting ? 'Verifying Integrity...' : 'INITIALIZE PUNCH-IN'}
                </button>
            </div>
          )}

          {punchedIn && !punchedOut && (
            <form onSubmit={handlePunchOut} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '15px', borderRadius: '12px', color: '#34d399', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={18} /> Shift active from {inTime}
              </div>
              
              {isManual && isPrivileged && (
                 <div className="input-group">
                    <label>SPECIFY PUNCH-OUT TIME</label>
                    <input type="time" value={manualOutTime} onChange={(e) => setManualOutTime(e.target.value)} required style={{ background: '#0c0e14', padding: '15px' }} />
                 </div>
              )}

              <textarea rows="6" placeholder="Log shift telemetry and findings..." value={report} onChange={(e) => setReport(e.target.value)} required />
              <button type="submit" className="btn danger" style={{ padding: '18px', fontWeight: 800 }}>CLOSE TERMINAL LOG</button>
            </form>
          )}

          {punchedOut && (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <ShieldCheck size={72} color="#10b981" />
              <h3 style={{ marginTop: '25px', fontSize: '1.5rem', letterSpacing: '2px' }}>SHIFT CONFIRMED</h3>
              <p style={{ color: '#94a3b8', marginTop: '10px' }}>Secure registry has synchronized your activity logs.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
