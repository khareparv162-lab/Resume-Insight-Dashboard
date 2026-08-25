# Resume Insight & AI Dashboard

An end-to-end intelligent Resume Analyzer, ATS Keyword Matcher, Student Scoreboard, and Admin Analytics Dashboard with a persistent SQLite database, Express REST API backend, and Gemini AI integration.

---

## 🌟 Key Features

1. **Universal Resume Extraction & Parsing**:
   - Universal name extraction and university/degree pattern matching across institutions (IIT, NIT, SRM, MIT, etc.).
   - Parses technical skills, projects, certifications, and achievements directly from PDF files using PDF.js.

2. **150+ Categorized Skills Taxonomy**:
   - Automatically maps and groups detected skills into:
     - **Languages** (Python, Java, TypeScript, C++, Go, Rust, SQL...)
     - **Frontend & UI** (React, Next.js, Tailwind, Vue, Svelte...)
     - **Backend & APIs** (Node.js, Express, FastAPI, Django, Spring Boot, GraphQL...)
     - **AI / ML & Data** (PyTorch, TensorFlow, OpenCV, MediaPipe, Pandas, Scikit-learn, LLMs...)
     - **Cloud & DevOps** (AWS, Azure, Docker, Kubernetes, CI/CD, Terraform...)
     - **Databases** (PostgreSQL, MongoDB, SQLite, Redis, Supabase, Firebase...)
     - **Tools & Concepts** (Data Structures, System Design, Postman, Jest...)

3. **Job Description (JD) Keyword Matcher**:
   - Paste a target job posting to calculate an instant **ATS Keyword Match Score (0–100%)**.
   - Displays real-time **Matched Keywords** vs. **Missing Critical Keywords**.

4. **AI-Powered Resume Critique (Gemini API / Local AI)**:
   - Deep candidate profile assessment with executive summaries.
   - **Google XYZ-Formula Bullet Point Rewrites** (*"Accomplished [X], as measured by [Y], by doing [Z]"*).
   - Actionable ATS formatting and keyword optimization advice.

5. **Downloadable PDF Audit Report**:
   - Generates a branded, printable A4 audit report with complete category scorecards, feedback, and next steps via `html2pdf.js`.

6. **Student Leaderboard & Admin Analytics**:
   - Live ranked student standings with overall scores and job match fit.
   - Cohort metric tracking: Total students, uploads, completed evaluations, and average score.

7. **Persistent SQLite Database & REST API**:
   - Full relational schema with foreign keys, WAL mode, and seamless offline browser cache fallback.

---

## 🗄️ Database Schema

Database file: `data/resume_insight.db`

```
+--------------------------------+          +-----------------------------------------+
|            students            |          |                 resumes                 |
+--------------------------------+          +-----------------------------------------+
| id          INTEGER (PK, AUTO) |<----+    | id                   INTEGER (PK, AUTO) |
| name        TEXT NOT NULL      |     +--- | student_id           INTEGER (FK)       |
| education   TEXT               |          | name                 TEXT NOT NULL      |
| avatar      TEXT               |          | education            TEXT               |
| created_at  DATETIME           |          | file_name            TEXT NOT NULL      |
| updated_at  DATETIME           |          | file_size            INTEGER            |
+--------------------------------+          | extracted_text       TEXT               |
                                            | skills               TEXT               |
                                            | projects             TEXT               |
                                            | certifications       TEXT               |
                                            | achievements         TEXT               |
                                            | overall_score        INTEGER (0-100)    |
                                            | skills_score         INTEGER (0-20)     |
                                            | projects_score       INTEGER (0-20)     |
                                            | certifications_score INTEGER (0-15)     |
                                            | achievements_score   INTEGER (0-15)     |
                                            | quality_score        INTEGER (0-15)     |
                                            | ats_score            INTEGER (0-15)     |
                                            | score_status         TEXT               |
                                            | score_message        TEXT               |
                                            | strengths            TEXT (JSON)        |
                                            | improvements         TEXT (JSON)        |
                                            | recommendations      TEXT (JSON)        |
                                            | target_role          TEXT               |
                                            | target_jd            TEXT               |
                                            | jd_match_score       INTEGER            |
                                            | missing_skills       TEXT (JSON)        |
                                            | matched_skills       TEXT (JSON)        |
                                            | ai_critique          TEXT (JSON)        |
                                            | status               TEXT ('Analyzed')  |
                                            | created_at           DATETIME           |
                                            | updated_at           DATETIME           |
                                            +-----------------------------------------+
```

---

## 🚀 Getting Started

### 1. Installation
```bash
git clone https://github.com/khareparv162-lab/Resume-Insight-Dashboard.git
cd Resume-Insight-Dashboard
npm install
```

### 2. Configuration
Copy the `.env` configuration:
```bash
Copy-Item .env.example .env
```

Configuration variables (`.env`):
```env
PORT=3000
DATABASE_PATH=./data/resume_insight.db
NODE_ENV=development
# Optional: Add Google Gemini API Key for LLM-powered critiques
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run the Application
```bash
# Start server
npm start

# Or development mode with auto-reload
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 🧪 Automated Testing

Run the test suite:
```bash
# Test SQLite database operations
npm test

# Test HTTP API & AI critique routes
node test/test-server.js
```

---

## 📡 REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/resumes` | Save analyzed resume with scores, JD match, and AI critique |
| `POST` | `/api/resumes/ai-critique` | Generate Gemini / Local AI resume critique & bullet rewrites |
| `GET` | `/api/resumes` | Retrieve all student resume records |
| `GET` | `/api/resumes/:id` | Retrieve single resume analysis by ID |
| `GET` | `/api/resumes/latest` | Retrieve the most recent resume analysis |
| `GET` | `/api/resumes/leaderboard` | Retrieve ranked leaderboard sorted by score |
| `GET` | `/api/resumes/stats` | Retrieve aggregate metrics for admin dashboard |
| `DELETE` | `/api/resumes` | Clear all records from database (Admin reset) |
| `GET` | `/api/health` | Service uptime and health check |
