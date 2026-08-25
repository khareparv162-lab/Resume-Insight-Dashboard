require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const resumesRouter = require('./routes/resumes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Serve index.html, style.css and script.js
app.use(express.static(__dirname));

// API
app.use('/api/resumes', resumesRouter);

// Home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
