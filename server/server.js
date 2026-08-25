require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const resumesRouter = require('./routes/resumes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve static frontend files from project root
app.use(express.static(path.join(__dirname, '..')));

// API Routes
app.use('/api/resumes', resumesRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Fallback for SPA routing
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// 404 handler for API routes
app.use('/api', (req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({
        success: false,
        error: 'An unexpected server error occurred.',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(` Resume Insight Dashboard Server Running!`);
    console.log(` Local URL: http://localhost:${PORT}`);
    console.log(` API Endpoint: http://localhost:${PORT}/api/resumes`);
    console.log(`===========================================`);
});

module.exports = app;
