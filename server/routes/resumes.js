const express = require('express');
const router = express.Router();
const https = require('https');
const db = require('../db');

// Helper to call Gemini REST API
function callGeminiAPI(apiKey, prompt) {
    return new Promise((resolve, reject) => {
        const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`);
        
        const payload = JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 1000
            }
        });

        const req = https.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            },
            timeout: 10000
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.candidates && json.candidates[0] && json.candidates[0].content) {
                        resolve(json.candidates[0].content.parts[0].text);
                    } else {
                        reject(new Error(json.error ? json.error.message : 'Invalid Gemini API response'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Gemini API request timed out.'));
        });

        req.write(payload);
        req.end();
    });
}

// Fallback intelligent rule-based AI critique generator
function generateLocalAICritique(data) {
    const role = data.targetRole || 'Software Engineering / Tech Role';
    const skills = data.skills || '';
    const score = data.scores ? data.scores.overall : (data.score || 0);

    const rewrites = [
        {
            before: "Worked on projects and implemented frontend and backend features.",
            after: `Architected responsive full-stack features using ${skills.split(',').slice(0, 2).join(' & ') || 'React & Node.js'}, improving page load speed by 25% for 500+ active users.`,
            reason: "Uses strong action verb (Architected) + quantifiable metric (25% speed, 500+ users)."
        },
        {
            before: "Responsible for machine learning and data processing tasks.",
            after: `Engineered end-to-end ML data pipelines, reducing data latency by 40% using automated preprocessing workflows.`,
            reason: "Replaces passive 'Responsible for' with Google XYZ impact formula."
        }
    ];

    return {
        source: 'Local AI Heuristic Engine',
        summary: `Resume evaluated for target role "${role}". Overall ATS score is ${score}/100 with solid foundational qualifications.`,
        keyHighlights: [
            `Detected technical core: ${skills ? skills : 'General technical background'}`,
            score >= 70 ? 'Strong section distribution and formatting.' : 'Recommend structuring experience bullets with measurable metrics.',
            data.missingSkills && data.missingSkills.length > 0 
                ? `Prioritize adding missing target skills: ${data.missingSkills.slice(0, 4).join(', ')}`
                : 'Great alignment with general industry expectations.'
        ],
        bulletRewrites: rewrites,
        atsAdvice: "Use standard single-column format, avoid tables and icons, and align keywords with job descriptions."
    };
}

// POST /api/resumes/ai-critique - Generate AI-powered resume critique
router.post('/ai-critique', async (req, res) => {
    const { name, text, skills, targetRole, targetJD, scores, missingSkills } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
        try {
            const prompt = `You are a Principal Technical Recruiter and ATS Expert. Review this candidate's resume for target role "${targetRole || 'Software Engineer'}".
Resume Text:
${text ? text.slice(0, 3000) : skills}

Target Job Description:
${targetJD ? targetJD.slice(0, 1500) : 'Standard Full Stack / AI Software Engineer'}

Provide your assessment strictly in valid JSON format matching this schema:
{
  "summary": "2-3 sentence executive summary of candidate fit",
  "keyHighlights": ["Point 1", "Point 2", "Point 3"],
  "bulletRewrites": [
    {
      "before": "Original vague bullet point example",
      "after": "Optimized XYZ-formula bullet point with metrics and action verbs",
      "reason": "Why this improves ATS score"
    }
  ],
  "atsAdvice": "Crucial ATS recommendation"
}`;

            const geminiRaw = await callGeminiAPI(apiKey, prompt);
            // Clean markdown code blocks if returned
            const cleanJson = geminiRaw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            return res.json({
                success: true,
                data: {
                    source: 'Gemini 1.5 Flash',
                    ...parsed
                }
            });
        } catch (err) {
            console.warn('Gemini API call failed or timed out, falling back to local critique engine:', err.message);
        }
    }

    // Fallback if no key or API error
    const critique = generateLocalAICritique(req.body);
    res.json({
        success: true,
        data: critique
    });
});

// GET /api/resumes/stats - Get admin dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await db.getStats();
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch statistics.' });
    }
});

// GET /api/resumes/leaderboard - Get student leaderboard rankings
router.get('/leaderboard', async (req, res) => {
    try {
        const leaderboard = await db.getLeaderboard();
        res.json({ success: true, data: leaderboard });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch leaderboard.' });
    }
});

// GET /api/resumes/latest - Get the latest resume analysis
router.get('/latest', async (req, res) => {
    try {
        const latest = await db.getLatestResume();
        if (!latest) {
            return res.status(404).json({ success: false, message: 'No resume found.' });
        }
        res.json({ success: true, data: latest });
    } catch (error) {
        console.error('Error fetching latest resume:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch latest resume.' });
    }
});

// GET /api/resumes - Get all resume records
router.get('/', async (req, res) => {
    try {
        const resumes = await db.getAllResumes();
        res.json({ success: true, data: resumes });
    } catch (error) {
        console.error('Error fetching resumes:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch resumes.' });
    }
});

// GET /api/resumes/:id - Get specific resume record
router.get('/:id', async (req, res) => {
    try {
        const resume = await db.getResumeById(req.params.id);
        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found.' });
        }
        res.json({ success: true, data: resume });
    } catch (error) {
        console.error('Error fetching resume by id:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch resume.' });
    }
});

// POST /api/resumes - Save a new resume analysis
router.post('/', async (req, res) => {
    try {
        const body = req.body;
        if (!body) {
            return res.status(400).json({ success: false, error: 'Invalid payload.' });
        }

        const savedRecord = await db.saveResumeRecord(body);
        res.status(201).json({
            success: true,
            message: 'Resume analysis stored successfully.',
            data: savedRecord
        });
    } catch (error) {
        console.error('Error saving resume:', error);
        res.status(500).json({ success: false, error: 'Failed to save resume analysis.' });
    }
});

// DELETE /api/resumes - Clear all resume and student data (Admin action)
router.delete('/', async (req, res) => {
    try {
        const result = await db.clearAllData();
        res.json({ success: true, message: result.message });
    } catch (error) {
        console.error('Error clearing data:', error);
        res.status(500).json({ success: false, error: 'Failed to clear resume data.' });
    }
});

// DELETE /api/resumes/:id - Delete a specific resume
router.delete('/:id', async (req, res) => {
    try {
        const result = await db.deleteResumeById(req.params.id);
        if (!result.success) {
            return res.status(404).json({ success: false, message: 'Resume record not found.' });
        }
        res.json({ success: true, message: 'Resume record deleted successfully.' });
    } catch (error) {
        console.error('Error deleting resume:', error);
        res.status(500).json({ success: false, error: 'Failed to delete resume.' });
    }
});

module.exports = router;
