require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(__dirname, '..');

// Middleware
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Frontend files
app.get('/', (req, res) => {
    res.sendFile(path.join(ROOT, 'index.html'));
});

app.get('/style.css', (req, res) => {
    res.sendFile(path.join(ROOT, 'style.css'));
});

app.get('/script.js', (req, res) => {
    res.sendFile(path.join(ROOT, 'script.js'));
});

// API
const resumesRouter = require('./routes/resumes');
app.use('/api/resumes', resumesRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok'
    });
});

// Start locally
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
module.exports = app;
