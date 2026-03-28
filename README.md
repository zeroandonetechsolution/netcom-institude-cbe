# Netcom Enterprise Faculty Portal

A completely automated, highly professional Full-Stack IT Administrative Platform designed specifically for **Netcom Computer Technologies Pvt Ltd**. This system bridges the gap between daily faculty timesheets and administrative oversight by natively integrating an AI-driven automated reporting workflow powered by Google Gemini via OpenRouter.

---

## 🚀 Key Features

### 1. Corporate Timesheet Workflow
- **Punch-In / Punch-Out Architecture:** Like a true IT tracking system, faculty securely log their exact clock-in (`in_time`) and clock-out (`out_time`) timestamps dynamically when submitting reports.
- **Leave Management System:** Bypass the attendance completely to specify absence and formal leave reasoning directly to the administration.

### 2. Dual-Role Dashboards (Frontend)
- **Admin Root Access:** Full superuser table controls to instantly Create/Delete faculty dynamically from the UI, paired with a database overview of every submitted timesheet and leave.
- **Faculty Shift Portal:** A strict daily workflow enforcing mandatory 5:00 PM submission deadlines that locks in times and protects data integrity. Intercepts empty submissions seamlessly on application Logout.

### 3. Automated AI Synthesizer (Backend)
- **Zero-Manual-Effort Weekly Reports:** Instead of manually formatting emails, faculty members press the "Submit Final Weekly Report" at the end of the week.
- **Generative Summarization:** The Node server pulls purely that specific faculty's past 7 days of logs into memory, commands **Gemini 2.5 Flash** to draft a highly professional administrative summary, and dynamically maps missing days to leave records.
- **Direct Mail Pipeline:** Bypasses local antivirus (custom TLS injection) to silently transport the AI report straight to the Administrator's real-world Gmail Inbox (`jegatheeshwar01@gmail.com`) via `nodemailer`.

---

## 💻 Tech Stack & Dependencies

**Frontend Environment (`/frontend`)**
*   **React + Vite:** Rapid compilation and fast rendering.
*   **React Router Dom:** For secure route protection separating Admin and Faculty.
*   **Lucide-React:** Enterprise-grade scalable UI iconography.
*   *Design:* Custom `index.css` running entirely on modern raw CSS Variables (Vars) ensuring dynamic Glassmorphism styling natively without heavy component libraries.

**Backend Environment (`/backend`)**
*   **Node.js / Express:** High-performance RESTful API generation handling `GET/POST/DELETE`.
*   **SQLite3:** Local persistent relational database (`users`, `reports`). Automatically builds SQL tables locally without complex cloud setups.
*   **Nodemailer:** Integrated standard email pipeline tuned securely for Gmail SMTP.
*   **node-fetch + dotenv:** For direct OpenRouter/Gemini model communications and secure credential loading.

---

## ⚙️ Installation & Setup Guide

### 1. Clone the project locally
Ensure you have the full project downloaded with the main root containing `frontend` and `backend` directories side-by-side.

### 2. Backend Initializer
1. Open a new terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install all necessary server dependencies:
   ```bash
   npm install express sqlite3 cors nodemailer dotenv node-cron
   ```
3. **Crucial:** Build an exact `.env` file in the `/backend` folder. **Never share these keys publicly.**
   ```env
   OPENROUTER_API_KEY=your_openrouter_gemini_key
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=netcominstitudecbe@gmail.com
   SMTP_PASS=clereexkdyjbprtk # Must be a 16-character Google App Password
   ADMIN_EMAIL=jegatheeshwar01@gmail.com
   ```
4. Boot the server and initialize the SQL Database:
   ```bash
   node server.js
   ```

### 3. Frontend Initializer
1. Open a **second** terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install client dependencies:
   ```bash
   npm install
   ```
3. Run the Vite Developer Server:
   ```bash
   npm run dev
   ```
4. Access the web app in your browser at: `http://localhost:5173`

---

## 🎯 How to Use the Platform

### Default System Credentials:
**Administrator Account**
*   **ID:** `admin`
*   **Password:** `netcom`

**Faculty Account (Pre-initialized)**
*   **ID:** `jega`+ 
*   **Password:** `jega`

### The Execution Workflow:
1. **The Morning Shift:** A faculty member (e.g., `jega`) navigates to the portal, inserts their ID & Password, and clicks the giant **PUNCH IN** button on the dashboard to start their active shift.
2. **The Evening Close:** At 5:00 PM, the faculty documents their tasks for the day inside the text area. They click **Submit Report & PUNCH OUT**, automatically terminating their shift timestamp securely, backing up data, and locking the UI to prevent tampering.
3. **The Week End:** On Friday afternoon, the faculty scrolls to the bottom section of their portal and selects **"Submit Final Weekly Report"**. They officially leave for the weekend while the backend securely fires an intelligent Gemini synthesis metric straight to Administrator Inbox.
4. **The Administration:** The Admin can log in at any time to verify system logs, visually observe individual timestamps on daily reports, create brand new faculty IDs securely with the UI form, or fully ban/delete faculty dynamically using Superuser actions.
