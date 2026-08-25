require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const resumesRouter = require('./routes/resumes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve frontend files from project root
const frontendPath = path.join(__dirname, '..');
app.use(express.static(frontendPath));

// API routes
app.use('/api/resumes', resumesRouter);

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// API 404
app.use('/api', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found.'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);

    res.status(500).json({
        success: false,
        error: 'An unexpected server error occurred.'
    });
});

if (require.main === module) {
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log(`Resume Insight Dashboard running on port ${PORT}`);
    });
}

module.exports = app;
