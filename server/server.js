require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const resumesRouter = require('../routes/resumes');

const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Project root
const rootDir = path.join(__dirname, '..');

// Serve frontend files
app.use(express.static(rootDir));

// API routes
app.use('/api/resumes', resumesRouter);

// Homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(rootDir, 'index.html'));
});

// Local development
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
