const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'netcom.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Initialize tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    password TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    faculty_id TEXT NOT NULL,
    date TEXT NOT NULL,
    attendance_status TEXT NOT NULL,
    leave_reason TEXT,
    activities TEXT,
    in_time TEXT,
    out_time TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(faculty_id) REFERENCES users(id)
  )`);

  // Add or update requested credentials
  const insertUser = db.prepare('INSERT OR REPLACE INTO users (id, name, role, password) VALUES (?, ?, ?, ?)');
  insertUser.run('admin', 'Netcom Admin', 'admin', 'netcom');
  insertUser.run('jega', 'Jegatheeshwar', 'faculty', 'jega');
  insertUser.finalize();
});

module.exports = db;
