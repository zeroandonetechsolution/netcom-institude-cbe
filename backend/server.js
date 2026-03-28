process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();
const https = require('https');
if (https.globalAgent) {
  https.globalAgent.options.rejectUnauthorized = false;
}
const express = require('express');
const cors = require('cors');
const db = require('./database');
const { generateWeeklyReport } = require('./ai_service');

const app = express();
app.use(cors());
app.use(express.json());

// --- Authentication Endpoint ---
app.post('/api/login', (req, res) => {
  const { id, password, role } = req.body;
  if (!id || !password || !role) return res.status(400).json({ error: 'Missing fields' });

  db.get('SELECT * FROM users WHERE id = ? AND role = ?', [id, role], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (!row || row.password !== password) return res.status(401).json({ error: 'Invalid credentials' });
    
    res.json({ id: row.id, name: row.name, role: row.role });
  });
});

// --- Faculty Endpoints ---
app.get('/api/reports/today/:faculty_id', (req, res) => {
  const { faculty_id } = req.params;
  const today = new Date().toISOString().split('T')[0];
  db.get('SELECT * FROM reports WHERE faculty_id = ? AND date = ?', [faculty_id, today], (err, row) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json({ report: row || null });
  });
});

app.post('/api/reports', (req, res) => {
  const { faculty_id, date, attendance_status, leave_reason, activities, in_time, out_time } = req.body;
  
  if (!faculty_id || !date || !attendance_status) {
    return res.status(400).json({ error: 'Missing required report fields' });
  }

  // Check if a report was already submitted for this date
  db.get('SELECT id FROM reports WHERE faculty_id = ? AND date = ?', [faculty_id, date], (err, row) => {
    if (row) {
      // Update existing record (Punch Out or subsequent save)
      const stmt = db.prepare('UPDATE reports SET attendance_status=?, leave_reason=?, activities=?, in_time=COALESCE(?, in_time), out_time=COALESCE(?, out_time) WHERE id=?');
      stmt.run([attendance_status, leave_reason || null, activities || null, in_time || null, out_time || null, row.id], function(err) {
        if (err) return res.status(500).json({ error: 'Error updating report' });
        res.json({ success: true, reportId: row.id, message: 'Report updated' });
      });
      stmt.finalize();
    } else {
      // Insert new record (Punch In or Leave submission)
      const stmt = db.prepare('INSERT INTO reports (faculty_id, date, attendance_status, leave_reason, activities, in_time, out_time) VALUES (?, ?, ?, ?, ?, ?, ?)');
      stmt.run([faculty_id, date, attendance_status, leave_reason || null, activities || null, in_time || null, out_time || null], function(err) {
        if (err) return res.status(500).json({ error: 'Error submitting report' });
        res.json({ success: true, reportId: this.lastID, message: 'Report created' });
      });
      stmt.finalize();
    }
  });
});

// --- Admin Endpoints ---
app.get('/api/users', (req, res) => {
  db.all('SELECT id, name, role FROM users WHERE role = "faculty"', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/users', (req, res) => {
  const { id, name, password } = req.body;
  if (!id || !name || !password) return res.status(400).json({ error: 'Missing fields' });
  
  db.run('INSERT INTO users (id, name, role, password) VALUES (?, ?, "faculty", ?)', [id, name, password], function(err) {
    if (err) return res.status(400).json({ error: 'User ID might already exist' });
    res.json({ success: true });
  });
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  // First delete associated reports
  db.run('DELETE FROM reports WHERE faculty_id = ?', [id], (err) => {
    db.run('DELETE FROM users WHERE id = ? AND role = "faculty"', [id], function(err2) {
      if (err2) return res.status(500).json({ error: 'Error deleting user' });
      res.json({ success: true });
    });
  });
});

app.get('/api/reports', (req, res) => {
  db.all(
    `SELECT reports.*, users.name FROM reports 
     JOIN users ON reports.faculty_id = users.id 
     ORDER BY reports.created_at DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Endpoint to manually trigger weekly AI report via Faculty panel
app.post('/api/generate-ai-report', async (req, res) => {
  try {
    const { faculty_id } = req.body;
    if (!faculty_id) return res.status(400).json({ error: 'faculty_id is required' });
    const previewUrl = await generateWeeklyReport(faculty_id);
    if (previewUrl === false) {
       return res.status(400).json({ success: false, error: 'No reports to summarize yet! Submit some daily logs first.' });
    }
    res.json({ success: true, previewUrl });
  } catch(e) {
    console.error('[CRITICAL SYSTEM ERROR]', e);
    res.status(500).json({ 
      success: false, 
      error: `SYSTEM ERROR at ${new Date().toLocaleTimeString()}: ${e.message}. This is likely caused by your computer's antivirus blocking the secure connection to AI or Email. Fix: Temporarily disable antivirus or add Node.js as an exception.`
    });
  }
});

// Serve frontend static files
const path = require('path');
const frontendPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
