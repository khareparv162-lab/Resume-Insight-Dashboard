# 📋 Project Task Board & Sprint Roadmap

## 🎯 Project Goals
Build an end-to-end intelligent Resume Analyzer, ATS Keyword Matcher, Student Scoreboard, and Admin Analytics Dashboard with SQLite relational persistence, Express REST API, and Gemini AI integration.

---

## 🟢 Completed Tasks (Sprint 1 & 2)

- [x] **Repository & Architecture Setup**
  - Git repository initialization and branching strategy (`main`, `feature/mvp-release`).
  - Directory structure (`server/`, `data/`, `test/`).

- [x] **Database Engine & Schema Implementation**
  - SQLite relational database with WAL mode and foreign keys.
  - `students` table (`id`, `name`, `education`, `avatar`, `created_at`).
  - `resumes` table with 6 category scores, `target_role`, `target_jd`, `jd_match_score`, `missing_skills`, `matched_skills`, `ai_critique`.

- [x] **Backend REST API**
  - Express server on port 3000 with CORS, JSON body parser, static file serving.
  - Endpoints: `POST /api/resumes`, `POST /api/resumes/ai-critique`, `GET /api/resumes`, `GET /api/resumes/:id`, `GET /api/resumes/latest`, `GET /api/resumes/leaderboard`, `GET /api/resumes/stats`, `DELETE /api/resumes`, `GET /api/health`.

- [x] **Universal Parsing & Skill Taxonomy**
  - Multi-pass candidate name extraction stripping emails/phones.
  - Contact links parser (Email, Phone, GitHub, LinkedIn).
  - 150+ categorized technical skill dictionary.
  - Project title & technology stack extractor.

- [x] **Job Description Matcher & AI Critique**
  - ATS Keyword Match % calculator with green (matched) and red (missing) skill chips.
  - Gemini API integration with local Google XYZ-formula fallback.

- [x] **UI & User Experience Overhaul**
  - Clean SaaS design with progress bar fill tracks, medals (`🥇`, `🥈`, `🥉`), and circular score meters.
  - Auth modal overlay with Sign In, Create Account, and Guest Mode.
  - Candidate Profile editing modal (`#editProfileModal`).
  - Downloadable PDF Audit Report via `html2pdf.js`.

- [x] **Testing & Documentation**
  - Automated unit test suite (`npm test`).
  - Integration test suite (`node test/test-server.js`).
  - Comprehensive `README.md` with API documentation and schema.

---

## 🟡 In Progress / Future Backlog

- [ ] Multi-tenant organization roles (Recruiter vs Student).
- [ ] Automated email report delivery upon resume submission.
