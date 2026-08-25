const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Use temporary memory/test database for testing
process.env.DATABASE_PATH = path.join(__dirname, '../data/test_resume_insight.db');
const db = require('../server/db');

async function runTests() {
    console.log('🧪 Starting Database and Backend Tests (with Advanced Features)...\n');

    try {
        await db.clearAllData();
        console.log('✔ Cleaned test database');

        // Test 1: Verify Initial Empty State
        const initialStats = await db.getStats();
        assert.strictEqual(initialStats.totalStudents, 0);
        assert.strictEqual(initialStats.resumesUploaded, 0);
        assert.strictEqual(initialStats.resumesAnalyzed, 0);
        assert.strictEqual(initialStats.averageScore, null);
        console.log('✔ Test 1 Passed: Initial state is empty');

        // Test 2: Save Resume with JD Match and AI Critique
        const sample1 = {
            name: 'Alex Johnson',
            education: 'B.Tech in Computer Science, SRM IST',
            fileName: 'alex_resume.pdf',
            fileSize: 1048576,
            text: 'Alex Johnson Software Engineer Python React Node.js AWS Docker PostgreSQL',
            skills: 'python, react, node.js, aws, docker, postgresql',
            projects: 'CareNetra patient monitoring system',
            certifications: 'AWS Certified Cloud Practitioner',
            achievements: 'Hackathon Winner 2025',
            scores: {
                overall: 88,
                skills: 18,
                projects: 17,
                certifications: 15,
                achievements: 15,
                quality: 11,
                ats: 12
            },
            targetRole: 'Full Stack Engineer',
            targetJD: 'React Node.js Docker Kubernetes AWS PostgreSQL Redis',
            jdMatchScore: 83,
            missingSkills: ['kubernetes', 'redis'],
            matchedSkills: ['react', 'node.js', 'docker', 'aws', 'postgresql'],
            aiCritique: {
                summary: 'Strong candidate fit with solid cloud and full stack exposure.',
                bulletRewrites: [
                    {
                        before: 'Built patient monitoring system.',
                        after: 'Architected responsive healthcare monitoring dashboard in React and Node.js for 500+ users.',
                        reason: 'Strong action verbs + quantifiable metric.'
                    }
                ]
            },
            scoreStatus: 'Strong',
            scoreMessage: 'Your resume has a strong overall structure.',
            strengths: ['Good technical skill coverage.', 'Projects are present and relevant.'],
            improvements: ['ATS readiness can be improved.'],
            recommendations: ['Add Redis and Kubernetes.'],
            status: 'Analyzed'
        };

        const saved1 = await db.saveResumeRecord(sample1);
        assert.ok(saved1.id, 'Record should have generated ID');
        assert.strictEqual(saved1.name, 'Alex Johnson');
        assert.strictEqual(saved1.score, 88);
        assert.strictEqual(saved1.jdMatchScore, 83);
        assert.deepStrictEqual(saved1.missingSkills, ['kubernetes', 'redis']);
        assert.deepStrictEqual(saved1.matchedSkills, ['react', 'node.js', 'docker', 'aws', 'postgresql']);
        assert.strictEqual(saved1.aiCritique.summary, sample1.aiCritique.summary);
        console.log('✔ Test 2 Passed: Successfully saved and retrieved resume with JD match and AI critique');

        // Test 3: Leaderboard includes JD score
        const leaderboard = await db.getLeaderboard();
        assert.strictEqual(leaderboard.length, 1);
        assert.strictEqual(leaderboard[0].name, 'Alex Johnson');
        assert.strictEqual(leaderboard[0].jdScore, 83);
        console.log('✔ Test 3 Passed: Leaderboard accurately reflects candidate score and JD match');

        // Test 4: Clear all data
        await db.clearAllData();
        const finalStats = await db.getStats();
        assert.strictEqual(finalStats.totalStudents, 0);
        console.log('✔ Test 4 Passed: Cleaned database');

        console.log('\n🎉 ALL ADVANCED DATABASE TESTS PASSED SUCCESSFULLY!\n');
        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed with error:', err);
        process.exit(1);
    }
}

setTimeout(runTests, 200);
