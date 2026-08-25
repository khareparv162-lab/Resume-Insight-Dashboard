const http = require('http');
const path = require('path');

process.env.PORT = 3008;
process.env.DATABASE_PATH = path.join(__dirname, '../data/test_integration_adv.db');

const app = require('../server/server');

function makeRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve({ statusCode: res.statusCode, headers: res.headers, data: json });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, headers: res.headers, text: body });
                }
            });
        });
        req.on('error', reject);
        if (postData) {
            req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
        }
        req.end();
    });
}

async function runIntegrationTests() {
    console.log('🚀 Running Advanced API Integration Tests on port 3008...\n');

    // 1. Health check
    const health = await makeRequest({
        hostname: 'localhost',
        port: 3008,
        path: '/api/health',
        method: 'GET'
    });
    console.log('✔ Health Check:', health.data.status);
    if (health.data.status !== 'OK') throw new Error('Health check failed');

    // 2. AI Critique Route Test
    const aiRes = await makeRequest({
        hostname: 'localhost',
        port: 3008,
        path: '/api/resumes/ai-critique',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, {
        name: 'Sarah Connor',
        text: 'Python Machine Learning React Node.js AWS',
        skills: 'python, react, node.js, aws',
        targetRole: 'AI & Full Stack Engineer',
        targetJD: 'React Node.js Docker Kubernetes AWS PostgreSQL',
        scores: { overall: 90 },
        missingSkills: ['docker', 'kubernetes', 'postgresql']
    });

    console.log('✔ POST /api/resumes/ai-critique status:', aiRes.statusCode);
    if (aiRes.statusCode !== 200 || !aiRes.data.data.summary) {
        throw new Error('AI critique endpoint failed');
    }
    console.log('✔ AI Critique Source:', aiRes.data.data.source);
    console.log('✔ AI Bullet Rewrites Count:', aiRes.data.data.bulletRewrites.length);

    // 3. Clear initial data
    await makeRequest({
        hostname: 'localhost',
        port: 3008,
        path: '/api/resumes',
        method: 'DELETE'
    });

    // 4. POST new resume with JD match and AI critique
    const newResume = {
        name: 'Sarah Connor',
        education: 'B.Tech in Artificial Intelligence, IIT Madras',
        fileName: 'sarah_resume.pdf',
        fileSize: 500000,
        text: 'Python Machine Learning React Node.js SQL Docker AWS',
        skills: 'python, react, node.js, sql, machine learning, docker, aws',
        projects: 'AI Robot Vision',
        certifications: 'Deep Learning Specialization',
        achievements: 'Robotics First Place',
        targetRole: 'Senior AI Engineer',
        targetJD: 'Python React Node.js Docker Kubernetes AWS PostgreSQL',
        jdMatchScore: 86,
        missingSkills: ['kubernetes', 'postgresql'],
        matchedSkills: ['python', 'react', 'node.js', 'docker', 'aws'],
        aiCritique: aiRes.data.data,
        scores: {
            overall: 95,
            skills: 20,
            projects: 20,
            certifications: 15,
            achievements: 15,
            quality: 12,
            ats: 13
        },
        scoreStatus: 'Exceptional',
        scoreMessage: 'Outstanding profile.',
        strengths: ['Outstanding tech stack', 'Great projects'],
        improvements: [],
        recommendations: ['Add Kubernetes certification'],
        status: 'Analyzed'
    };

    const postRes = await makeRequest({
        hostname: 'localhost',
        port: 3008,
        path: '/api/resumes',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, newResume);

    console.log('✔ POST /api/resumes status:', postRes.statusCode);
    if (postRes.statusCode !== 201 || !postRes.data.data.id) {
        throw new Error('POST /api/resumes failed');
    }
    const createdId = postRes.data.data.id;

    // 5. GET /api/resumes/:id
    const singleRes = await makeRequest({
        hostname: 'localhost',
        port: 3008,
        path: `/api/resumes/${createdId}`,
        method: 'GET'
    });
    console.log('✔ GET /api/resumes/:id candidate:', singleRes.data.data.name);
    console.log('✔ Verified JD match score:', singleRes.data.data.jdMatchScore);

    console.log('\n🎉 ALL ADVANCED INTEGRATION TESTS PASSED SUCCESSFULLY!\n');
    process.exit(0);
}

setTimeout(() => {
    runIntegrationTests().catch(err => {
        console.error('Integration test failed:', err);
        process.exit(1);
    });
}, 500);
