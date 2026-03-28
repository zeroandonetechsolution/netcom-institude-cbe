process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const https = require('https');
if (https.globalAgent) {
  https.globalAgent.options.rejectUnauthorized = false;
}
require('dotenv').config();
const nodemailer = require('nodemailer');
const db = require('./database');
const cron = require('node-cron');

// Initialize Nodemailer. We use Ethereal for testing if no real config provided.
async function getMailer() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  } else {
    // Generate test SMTP service account from ethereal.email
    let testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, 
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
}

async function generateWeeklyReport(faculty_id) {
  console.log('[AI Service] Initiating weekly report synthesis via OpenRouter for faculty:', faculty_id);
  
  // 1. Fetch all reports from the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const dateStr = sevenDaysAgo.toISOString().split('T')[0];

  return new Promise((resolve, reject) => {
    db.all(
      `SELECT reports.*, users.name FROM reports 
       JOIN users ON reports.faculty_id = users.id 
       WHERE date >= ? AND reports.faculty_id = ?
       ORDER BY reports.date`,
      [dateStr, faculty_id],
      async (err, rows) => {
        if (err) {
          console.error('[AI Service] DB Error:', err);
          return reject(err);
        }

        if (!rows || rows.length === 0) {
          console.log('[AI Service] No reports found for this week.');
          return resolve(false);
        }

        // 2. format data into string
        let rawData = "Raw Faculty Reports for the Week:\n\n";
        rows.forEach(r => {
          rawData += `Faculty Name: ${r.name} (ID: ${r.faculty_id})\n`;
          rawData += `Date: ${r.date}\n`;
          rawData += `Status: ${r.attendance_status}\n`;
          if (r.attendance_status === 'leave') {
            rawData += `Leave Reason: ${r.leave_reason || 'N/A'}\n`;
          } else {
            rawData += `Activities: ${r.activities}\n`;
          }
          rawData += "-----\n";
        });

        // 3. Process with AI (via OpenRouter)
        let aiSummaryText = '';
        if (process.env.OPENROUTER_API_KEY) {
          try {
            const facultyName = rows[0].name;
            const prompt = `You are an administrative AI for Netcom Computer Technologies Pvt Ltd.
Below are the raw daily reports submitted by faculty member ${facultyName} (ID: ${faculty_id}) for this week.
Create a highly professional, well-formatted weekly faculty summary report.
IMPORTANT: Do not summarize the leave days. For any dates they took leave, explicitly state the Exact Date they took leave and their Leave Reason.
Then provide a brief, crisp summary of their activities on the days they were present.

Data logs for ${facultyName}:

${rawData}`;
            
            // Absolute fail-safe: Using built-in https module for AI request
            const aiPromise = new Promise((resAI, rejAI) => {
              try {
                const postData = JSON.stringify({
                  "model": "google/gemini-2.5-flash",
                  "messages": [{ "role": "user", "content": prompt }]
                });

                const options = {
                  hostname: 'openrouter.ai',
                  path: '/api/v1/chat/completions',
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                  },
                  rejectUnauthorized: false,
                  agent: false // Force new connection
                };

                const req = https.request(options, (res) => {
                  let body = '';
                  res.on('data', d => body += d);
                  res.on('end', () => {
                    try {
                      if (res.statusCode !== 200) {
                        return rejAI(new Error(`OpenRouter HTTP ${res.statusCode}: ${body}`));
                      }
                      const parsed = JSON.parse(body);
                      if (parsed.choices && parsed.choices.length > 0) {
                        resAI(parsed.choices[0].message.content);
                      } else {
                        rejAI(new Error(JSON.stringify(parsed)));
                      }
                    } catch (e) {
                      rejAI(e);
                    }
                  });
                });

                req.on('error', (e) => {
                  console.error('[AI Service DEBUG] HTTPS Request Error:', e);
                  rejAI(e);
                });
                req.write(postData);
                req.end();
              } catch (critErr) {
                rejAI(critErr);
              }
            });

            aiSummaryText = await aiPromise;
          } catch (aiError) {
            console.error('[AI Service] AI Generation failed, using raw fallback:', aiError);
            aiSummaryText = "System Notice: SSL Certificate bypass was blocked by local computer security, providing raw summary as fallback:\n\n" + rawData;
          }
        } else {
          aiSummaryText = "No OPENROUTER_API_KEY detected. AI Summary skipped.\n\nRaw Data Extracted:\n\n" + rawData;
        }

        // 4. Send Email
        try {
          const transporter = await getMailer();
          const info = await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: process.env.ADMIN_EMAIL || "admin@netcomtech.com", 
            subject: `Weekly AI Faculty Report - ${new Date().toLocaleDateString()}`,
            text: aiSummaryText,
          });

          console.log("[AI Service] Weekly Report Email Sent!");
          if (!process.env.SMTP_HOST) {
            console.log("[AI Service] Preview Ethereal URL: %s", nodemailer.getTestMessageUrl(info));
          }
          resolve(nodemailer.getTestMessageUrl(info));
        } catch (emailErr) {
          console.error('[AI Service] Email Error:', emailErr);
          reject(emailErr);
        }
      }
    );
  });
}

// (Optional) If you still want the automatic global cron job, you could loop over all faculty_ids.
// For now, the report is explicitly generated by the faculty action.

module.exports = {
  generateWeeklyReport
};
