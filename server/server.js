require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

const PORT = process.env.PORT || 3000;
const rootDir = path.join(__dirname, '..');

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve frontend files from project root
app.use(express.static(rootDir));

// API routes
const resumesRouter = require('./routes/resumes');
app.use('/api/resumes', resumesRouter);

// Homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(rootDir, 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Resume Insight API is running'
    });
});

// Local development
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
