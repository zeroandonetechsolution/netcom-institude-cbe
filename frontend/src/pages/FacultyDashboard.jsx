import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import { LogOut, CheckCircle, Send, Building2, Clock, CalendarX2, Mail } from 'lucide-react';
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
          setPunchedOut(true); // Treat leave as completely done for the day
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

  const handleLogout = () => {
    setUser(null);
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
  };

  const handlePunchIn = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    const time = getCurrentTime();
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('reports').insert({
          faculty_id: user.id,
          date: today,
          attendance_status: 'present',
          in_time: time
      });
      if (error) throw new Error('Failed to punch in');
      
      setPunchedIn(true);
      setInTime(time);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('reports').insert({
          faculty_id: user.id,
          date: today,
          attendance_status: 'leave',
          leave_reason: leaveReason
      });
      if (error) throw new Error('Failed to submit leave');
      setPunchedOut(true);
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
    const time = getCurrentTime();
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase.from('reports').update({
          attendance_status: 'present',
          activities: report,
          out_time: time
      }).eq('faculty_id', user.id).eq('date', today);
      
      if (error) throw new Error('Failed to punch out');
      
      setPunchedOut(true);
      setOutTime(time);
      
      // Notify and auto-logout
      alert("Report successfully submitted and Punched Out for the day! Logging out safely...");
      setTimeout(() => {
        setUser(null);
      }, 1500);
      
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateWeeklyReport = async () => {
    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-report', {
        body: { faculty_id: user.id }
      });
      if (error || !data?.success) throw new Error(data?.error || error?.message || 'AI generation failed');
      alert("Success! Your weekly summary report has been synthesized by AI and mailed to the Admin securely.");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const timeHhMm = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  const isAfter5 = parseInt(timeHhMm.split(':')[0]) >= 17;

  if (isLoading) return <div style={{padding: '50px', textAlign: 'center', color: '#fff'}}>Loading Portal...</div>;

  return (
    <div style={{ background: 'var(--bg-color)', minHeight: '100vh', paddingBottom: '40px' }}>
      <header style={{ background: 'var(--panel-bg)', borderBottom: '1px solid var(--border-color)', padding: '15px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Building2 size={28} color="var(--primary-color)" />
          <h1 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
            Netcom <span style={{ color: 'var(--primary-color)', fontWeight: '400' }}>Faculty Portal</span>
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: '500', fontSize: '0.95rem' }}>
            ID: {user?.id} | {user?.name}
          </span>
          <button onClick={handleLogout} className="btn outline" style={{ padding: '8px 16px' }}>
            <LogOut size={16} style={{ verticalAlign: 'middle', marginRight: '5px' }} /> Logout
          </button>
        </div>
      </header>

      <main className="container" style={{ marginTop: '40px' }}>
        <div className="panel animate-fade-in" style={{ maxWidth: '700px', margin: '0 auto', padding: '40px' }}>
          <h2 style={{ marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid var(--border-color)', fontSize: '1.4rem', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Daily Attendance & Reporting
            {inTime && <span style={{ fontSize: '0.9rem', color: 'var(--primary-color)', background: 'rgba(59,130,246,0.1)', padding: '4px 10px', borderRadius: '15px' }}>In Time: {inTime}</span>}
          </h2>

          {errorMsg && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '15px', borderRadius: '8px', color: '#f87171', marginBottom: '20px' }}>{errorMsg}</div>}

          {/* Screen 1: Not Punched In and Not on Leave */}
          {!punchedIn && !punchedOut && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '40px' }}>
                <button 
                  onClick={handlePunchIn}
                  disabled={isSubmitting}
                  style={{ 
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                    color: 'white', border: 'none', padding: '25px 50px', 
                    borderRadius: '16px', fontSize: '1.4rem', fontWeight: 'bold', 
                    cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)', transition: 'transform 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Clock size={40} />
                  {isSubmitting ? 'Punching in...' : 'PUNCH IN (Start Day)'}
                </button>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '30px', textAlign: 'left' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '15px', color: 'var(--text-primary)' }}>Or apply for Leave</h3>
                <form onSubmit={handleSubmitLeave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <input 
                      type="text" 
                      placeholder="Specify reason for absence today..." 
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn danger" style={{ alignSelf: 'flex-start', background: 'rgba(239, 68, 68, 0.2)' }} disabled={isSubmitting}>
                    <CalendarX2 size={16} style={{ marginRight: '8px' }}/> Submit Leave & Close Day
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Screen 2: Punched In, Needs Report and Punch Out */}
          {punchedIn && !punchedOut && (
            <form onSubmit={handlePunchOutAndSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                <p style={{ margin: 0, color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                  <CheckCircle size={20} /> You are actively logged in. Day started at {inTime}.
                </p>
              </div>

              <div className="input-group animate-fade-in" style={{ marginBottom: '0' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  <span>Daily Activity Report</span>
                  <span style={{ 
                    color: isAfter5 ? '#f87171' : 'var(--text-secondary)', 
                    fontSize: '0.85rem',
                    background: isAfter5 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)',
                    padding: '4px 8px', borderRadius: '4px', fontWeight: '500' 
                  }}>
                    {isAfter5 ? 'Past Deadline (5:00 PM)' : 'Deadline: 5:00 PM'} - Current Time: {timeHhMm}
                  </span>
                </label>
                <textarea 
                  rows="8" 
                  placeholder="Describe your academic and administrative activities for today..."
                  value={report}
                  onChange={(e) => setReport(e.target.value)}
                  required
                  style={{ resize: 'vertical', marginTop: '10px' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                style={{ 
                  marginTop: '15px', padding: '20px', fontSize: '1.1rem', fontWeight: '600',
                  background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', color: 'white',
                  border: 'none', borderRadius: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                  boxShadow: '0 8px 20px rgba(239, 68, 68, 0.3)'
                }}
              >
                <LogOut size={20} /> {isSubmitting ? 'Processing...' : 'Submit Report & PUNCH OUT'}
              </button>
            </form>
          )}

          {/* Screen 3: Day is completed (either leave or punched out) */}
          {punchedOut && (
            <div style={{ textAlign: 'center', padding: '50px 30px', background: attendance === 'present' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', border: attendance === 'present' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px' }}>
              <CheckCircle size={56} color={attendance === 'present' ? "#34d399" : "#fbbf24"} style={{ marginBottom: '20px' }} />
              <h3 style={{ color: attendance === 'present' ? "#34d399" : "#fbbf24", marginBottom: '10px', fontSize: '1.4rem' }}>
                {attendance === 'present' ? 'Shift Completed successfully' : 'Leave Recorded'}
              </h3>
              
              {attendance === 'present' ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px', marginBottom: '20px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 20px', borderRadius: '8px' }}>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PUNCH IN</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{inTime}</strong>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 20px', borderRadius: '8px' }}>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PUNCH OUT</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{outTime}</strong>
                    </div>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Your daily activities and timesheet have been securely logged for the AI summary.</p>
                </>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Reason: {leaveReason}</p>
              )}

              <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>End of Week Actions</h4>
                <button 
                  onClick={handleGenerateWeeklyReport}
                  disabled={aiGenerating}
                  style={{
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white', padding: '12px 24px', borderRadius: '8px',
                    border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
                    fontWeight: '600', opacity: aiGenerating ? 0.7 : 1
                  }}
                >
                  <Mail size={18} /> {aiGenerating ? 'Synthesizing Data...' : 'Submit Final Weekly Report'}
                </button>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Creates an AI summary of all your daily logs this week and securely emails it to Admin.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
