const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || path.join(dbDir, 'resume_insight.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Failed to connect to SQLite database:', err.message);
    } else {
        console.log(`Connected to SQLite database at: ${dbPath}`);
    }
});

// Helper for single row query
function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}

// Helper for multi-row query
function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

// Helper for run (INSERT, UPDATE, DELETE)
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

// Initialize tables and migrations
db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON');
    db.run('PRAGMA journal_mode = WAL');

    // Students table
    db.run(`
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            education TEXT,
            avatar TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Resumes table
    db.run(`
        CREATE TABLE IF NOT EXISTS resumes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER,
            name TEXT NOT NULL,
            education TEXT,
            file_name TEXT NOT NULL,
            file_size INTEGER DEFAULT 0,
            extracted_text TEXT,
            skills TEXT,
            projects TEXT,
            certifications TEXT,
            achievements TEXT,
            overall_score INTEGER NOT NULL DEFAULT 0,
            skills_score INTEGER NOT NULL DEFAULT 0,
            projects_score INTEGER NOT NULL DEFAULT 0,
            certifications_score INTEGER NOT NULL DEFAULT 0,
            achievements_score INTEGER NOT NULL DEFAULT 0,
            quality_score INTEGER NOT NULL DEFAULT 0,
            ats_score INTEGER NOT NULL DEFAULT 0,
            score_status TEXT,
            score_message TEXT,
            strengths TEXT,
            improvements TEXT,
            recommendations TEXT,
            target_role TEXT,
            target_jd TEXT,
            jd_match_score INTEGER,
            missing_skills TEXT,
            matched_skills TEXT,
            ai_critique TEXT,
            status TEXT DEFAULT 'Analyzed',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
        )
    `);

    // Run safe migrations in case table existed previously without new columns
    const columnsToAdd = [
        'target_role TEXT',
        'target_jd TEXT',
        'jd_match_score INTEGER',
        'missing_skills TEXT',
        'matched_skills TEXT',
        'ai_critique TEXT'
    ];

    columnsToAdd.forEach(colDef => {
        const colName = colDef.split(' ')[0];
        db.run(`ALTER TABLE resumes ADD COLUMN ${colDef}`, (err) => {
            // Ignore error if column already exists
        });
    });
});

/**
 * Saves or updates student record and inserts the resume analysis.
 */
async function saveResumeRecord(data) {
    const studentName = data.name && data.name !== 'Not available' ? data.name : 'Anonymous Student';
    const education = data.education || 'Not available';
    const avatar = studentName.trim().charAt(0).toUpperCase();

    // Check if student exists or create
    let student = await get('SELECT * FROM students WHERE LOWER(name) = LOWER(?)', [studentName]);
    let studentId;
    if (!student) {
        const studentRes = await run(
            'INSERT INTO students (name, education, avatar) VALUES (?, ?, ?)',
            [studentName, education, avatar]
        );
        studentId = studentRes.lastID;
    } else {
        studentId = student.id;
        if (education && education !== 'Not available') {
            await run('UPDATE students SET education = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [education, studentId]);
        }
    }

    const scores = data.scores || {};
    const strengthsJson = JSON.stringify(data.strengths || []);
    const improvementsJson = JSON.stringify(data.improvements || []);
    const recommendationsJson = JSON.stringify(data.recommendations || []);
    const missingSkillsJson = JSON.stringify(data.missingSkills || []);
    const matchedSkillsJson = JSON.stringify(data.matchedSkills || []);
    const aiCritiqueJson = JSON.stringify(data.aiCritique || null);

    const insertResult = await run(`
        INSERT INTO resumes (
            student_id, name, education, file_name, file_size, extracted_text,
            skills, projects, certifications, achievements,
            overall_score, skills_score, projects_score, certifications_score, achievements_score,
            quality_score, ats_score, score_status, score_message,
            strengths, improvements, recommendations,
            target_role, target_jd, jd_match_score, missing_skills, matched_skills, ai_critique,
            status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        studentId,
        studentName,
        education,
        data.fileName || 'resume.pdf',
        data.fileSize || 0,
        data.text || '',
        data.skills || 'Not available',
        typeof data.projects === 'object' ? JSON.stringify(data.projects) : (data.projects || 'Not available'),
        typeof data.certifications === 'object' ? JSON.stringify(data.certifications) : (data.certifications || 'No data available'),
        typeof data.achievements === 'object' ? JSON.stringify(data.achievements) : (data.achievements || 'No data available'),
        scores.overall || 0,
        scores.skills || 0,
        scores.projects || 0,
        scores.certifications || 0,
        scores.achievements || 0,
        scores.quality || 0,
        scores.ats || 0,
        data.scoreStatus || '',
        data.scoreMessage || '',
        strengthsJson,
        improvementsJson,
        recommendationsJson,
        data.targetRole || null,
        data.targetJD || null,
        data.jdMatchScore !== undefined ? data.jdMatchScore : null,
        missingSkillsJson,
        matchedSkillsJson,
        aiCritiqueJson,
        data.status || 'Analyzed'
    ]);

    return getResumeById(insertResult.lastID);
}

/**
 * Get all resume records formatted for client/admin views
 */
async function getAllResumes() {
    const rows = await all(`
        SELECT 
            r.id,
            r.student_id,
            r.name,
            r.education,
            r.file_name AS fileName,
            r.file_size AS fileSize,
            r.skills,
            r.projects,
            r.certifications,
            r.achievements,
            r.overall_score AS score,
            r.skills_score,
            r.projects_score,
            r.certifications_score,
            r.achievements_score,
            r.quality_score,
            r.ats_score,
            r.score_status,
            r.score_message,
            r.strengths,
            r.improvements,
            r.recommendations,
            r.target_role,
            r.target_jd,
            r.jd_match_score,
            r.missing_skills,
            r.matched_skills,
            r.ai_critique,
            r.status,
            r.created_at,
            s.avatar
        FROM resumes r
        LEFT JOIN students s ON r.student_id = s.id
        ORDER BY r.id DESC
    `);

    return rows.map(formatResumeRecord);
}

/**
 * Get resume record by ID
 */
async function getResumeById(id) {
    const row = await get(`
        SELECT 
            r.id,
            r.student_id,
            r.name,
            r.education,
            r.file_name AS fileName,
            r.file_size AS fileSize,
            r.extracted_text,
            r.skills,
            r.projects,
            r.certifications,
            r.achievements,
            r.overall_score AS score,
            r.skills_score,
            r.projects_score,
            r.certifications_score,
            r.achievements_score,
            r.quality_score,
            r.ats_score,
            r.score_status,
            r.score_message,
            r.strengths,
            r.improvements,
            r.recommendations,
            r.target_role,
            r.target_jd,
            r.jd_match_score,
            r.missing_skills,
            r.matched_skills,
            r.ai_critique,
            r.status,
            r.created_at,
            s.avatar
        FROM resumes r
        LEFT JOIN students s ON r.student_id = s.id
        WHERE r.id = ?
    `, [id]);

    return row ? formatResumeRecord(row) : null;
}

/**
 * Get latest resume record
 */
async function getLatestResume() {
    const row = await get(`
        SELECT 
            r.id,
            r.student_id,
            r.name,
            r.education,
            r.file_name AS fileName,
            r.file_size AS fileSize,
            r.extracted_text,
            r.skills,
            r.projects,
            r.certifications,
            r.achievements,
            r.overall_score AS score,
            r.skills_score,
            r.projects_score,
            r.certifications_score,
            r.achievements_score,
            r.quality_score,
            r.ats_score,
            r.score_status,
            r.score_message,
            r.strengths,
            r.improvements,
            r.recommendations,
            r.target_role,
            r.target_jd,
            r.jd_match_score,
            r.missing_skills,
            r.matched_skills,
            r.ai_critique,
            r.status,
            r.created_at,
            s.avatar
        FROM resumes r
        LEFT JOIN students s ON r.student_id = s.id
        ORDER BY r.id DESC
        LIMIT 1
    `);

    return row ? formatResumeRecord(row) : null;
}

/**
 * Get leaderboard ranked by highest score
 */
async function getLeaderboard() {
    const rows = await all(`
        SELECT 
            r.id,
            r.name,
            r.education,
            r.file_name AS fileName,
            MAX(r.overall_score) AS score,
            r.jd_match_score AS jdScore,
            s.avatar,
            r.created_at
        FROM resumes r
        LEFT JOIN students s ON r.student_id = s.id
        WHERE r.status = 'Analyzed'
        GROUP BY r.name
        ORDER BY score DESC, r.created_at ASC
    `);

    return rows;
}

/**
 * Get aggregate statistics for admin dashboard
 */
async function getStats() {
    const totalStudentsRow = await get('SELECT COUNT(DISTINCT id) AS count FROM students');
    const totalUploadedRow = await get('SELECT COUNT(*) AS count FROM resumes');
    const totalAnalyzedRow = await get("SELECT COUNT(*) AS count FROM resumes WHERE status = 'Analyzed'");
    const avgScoreRow = await get("SELECT AVG(overall_score) AS avgScore FROM resumes WHERE status = 'Analyzed'");

    return {
        totalStudents: totalStudentsRow ? totalStudentsRow.count : 0,
        resumesUploaded: totalUploadedRow ? totalUploadedRow.count : 0,
        resumesAnalyzed: totalAnalyzedRow ? totalAnalyzedRow.count : 0,
        averageScore: avgScoreRow && avgScoreRow.avgScore !== null ? Math.round(avgScoreRow.avgScore) : null
    };
}

/**
 * Clear all data from the database
 */
async function clearAllData() {
    await run('DELETE FROM resumes');
    await run('DELETE FROM students');
    return { success: true, message: 'All resume and student data cleared.' };
}

/**
 * Delete a single resume
 */
async function deleteResumeById(id) {
    const res = await run('DELETE FROM resumes WHERE id = ?', [id]);
    return { success: res.changes > 0 };
}

function formatResumeRecord(row) {
    let strengths = [];
    let improvements = [];
    let recommendations = [];
    let missingSkills = [];
    let matchedSkills = [];
    let aiCritique = null;

    try { strengths = JSON.parse(row.strengths || '[]'); } catch(e) {}
    try { improvements = JSON.parse(row.improvements || '[]'); } catch(e) {}
    try { recommendations = JSON.parse(row.recommendations || '[]'); } catch(e) {}
    try { missingSkills = JSON.parse(row.missing_skills || '[]'); } catch(e) {}
    try { matchedSkills = JSON.parse(row.matched_skills || '[]'); } catch(e) {}
    try { aiCritique = JSON.parse(row.ai_critique || 'null'); } catch(e) {}

    let projects = row.projects;
    let certifications = row.certifications;
    let achievements = row.achievements;
    try { if (row.projects && (row.projects.startsWith('[') || row.projects.startsWith('{'))) projects = JSON.parse(row.projects); } catch(e) {}
    try { if (row.certifications && (row.certifications.startsWith('[') || row.certifications.startsWith('{'))) certifications = JSON.parse(row.certifications); } catch(e) {}
    try { if (row.achievements && (row.achievements.startsWith('[') || row.achievements.startsWith('{'))) achievements = JSON.parse(row.achievements); } catch(e) {}

    return {
        id: row.id,
        studentId: row.student_id,
        name: row.name,
        education: row.education,
        fileName: row.fileName,
        fileSize: row.fileSize,
        skills: row.skills,
        projects: projects,
        certifications: certifications,
        achievements: achievements,
        score: row.score,
        scores: {
            overall: row.score,
            skills: row.skills_score,
            projects: row.projects_score,
            certifications: row.certifications_score,
            achievements: row.achievements_score,
            quality: row.quality_score,
            ats: row.ats_score
        },
        scoreStatus: row.score_status,
        scoreMessage: row.score_message,
        strengths,
        improvements,
        recommendations,
        targetRole: row.target_role,
        targetJD: row.target_jd,
        jdMatchScore: row.jd_match_score,
        missingSkills,
        matchedSkills,
        aiCritique,
        status: row.status,
        avatar: row.avatar || (row.name ? row.name.charAt(0).toUpperCase() : 'S'),
        createdAt: row.created_at
    };
}

module.exports = {
    db,
    query: all,
    get,
    run,
    saveResumeRecord,
    getAllResumes,
    getResumeById,
    getLatestResume,
    getLeaderboard,
    getStats,
    clearAllData,
    deleteResumeById
};
