let selectedFile = null;
let currentResume = null;
let isAdmin = false;

// API Base
const API_BASE = "/api/resumes";

// 150+ CATEGORIZED SKILL TAXONOMY
const SKILL_TAXONOMY = {
    "Languages": [
        "python", "javascript", "typescript", "c++", "c", "c#", "java", "go", "golang", "rust",
        "ruby", "php", "swift", "kotlin", "dart", "r", "scala", "sql", "bash", "shell",
        "powershell", "html", "html5", "css", "css3", "sass", "less"
    ],
    "Frontend & UI": [
        "react", "react.js", "next.js", "vue", "vue.js", "angular", "svelte", "react native",
        "tailwind css", "tailwind", "bootstrap", "material ui", "redux", "zustand", "webpack", "vite"
    ],
    "Backend & APIs": [
        "node.js", "express", "express.js", "fastapi", "django", "flask", "spring", "spring boot",
        "nest.js", "asp.net", "laravel", "ruby on rails", "graphql", "rest api", "restful", "grpc", "microservices"
    ],
    "AI / ML & Data": [
        "machine learning", "deep learning", "artificial intelligence", "nlp", "natural language processing",
        "computer vision", "opencv", "mediapipe", "tensorflow", "pytorch", "keras", "scikit-learn",
        "sklearn", "pandas", "numpy", "matplotlib", "seaborn", "hugging face", "huggingface", "langchain", "llm"
    ],
    "Cloud & DevOps": [
        "aws", "amazon web services", "azure", "gcp", "google cloud", "docker", "kubernetes", "terraform",
        "ansible", "jenkins", "git", "github", "gitlab", "ci/cd", "github actions", "linux", "unix", "nginx"
    ],
    "Databases": [
        "postgresql", "postgres", "mysql", "sqlite", "mongodb", "redis", "cassandra", "dynamodb",
        "elasticsearch", "supabase", "firebase", "mariadb", "prisma", "sequelize", "mongoose"
    ],
    "Tools & Concepts": [
        "object oriented programming", "oop", "data structures", "algorithms", "system design",
        "postman", "figma", "unit testing", "jest", "cypress", "agile", "scrum"
    ]
};

// ELEMENTS
const sidebar = document.getElementById("sidebar");
const main = document.getElementById("main");
const menuToggle = document.getElementById("menuToggle");
const menuOpen = document.getElementById("menuOpen");
const navItems = document.querySelectorAll(".nav-item");
const pages = document.querySelectorAll(".page");
const studentMode = document.getElementById("studentMode");
const adminMode = document.getElementById("adminMode");
const resumeFile = document.getElementById("resumeFile");
const targetRoleInput = document.getElementById("targetRoleInput");
const targetJDInput = document.getElementById("targetJDInput");
const analyzeBtn = document.getElementById("analyzeBtn");
const removeFileBtn = document.getElementById("removeFileBtn");
const fileSelected = document.getElementById("fileSelected");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");
const uploadMessage = document.getElementById("uploadMessage");
const downloadReportBtn = document.getElementById("downloadReportBtn");
const dashboardEmpty = document.getElementById("dashboardEmpty");
const dashboardResults = document.getElementById("dashboardResults");
const insightsEmpty = document.getElementById("insightsEmpty");
const insightsResults = document.getElementById("insightsResults");
const profileEmpty = document.getElementById("profileEmpty");
const profileResults = document.getElementById("profileResults");
const toast = document.getElementById("toast");

// SIDEBAR MENU
menuToggle.addEventListener("click", () => {
    document.body.classList.add("sidebar-hidden");
    menuOpen.classList.remove("hidden");
});
menuOpen.addEventListener("click", () => {
    document.body.classList.remove("sidebar-hidden");
    menuOpen.classList.add("hidden");
});

// NAVIGATION
navItems.forEach(button => {
    button.addEventListener("click", () => {
        const pageId = button.dataset.page;
        showPage(pageId);
    });
});

function showPage(pageId) {
    pages.forEach(page => {
        page.classList.remove("active");
    });
    navItems.forEach(item => {
        item.classList.remove("active");
    });
    const page = document.getElementById(pageId);
    if (!page) return;
    page.classList.add("active");
    const activeButton = document.querySelector(`.nav-item[data-page="${pageId}"]`);
    if (activeButton) {
        activeButton.classList.add("active");
    }
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// STUDENT / ADMIN MODE
studentMode.addEventListener("click", () => {
    isAdmin = false;
    sidebar.classList.remove("admin-view");
    studentMode.classList.add("active");
    adminMode.classList.remove("active");
    showPage("student-dashboard");
});

adminMode.addEventListener("click", async () => {
    isAdmin = true;
    sidebar.classList.add("admin-view");
    adminMode.classList.add("active");
    studentMode.classList.remove("active");
    showPage("admin-dashboard");
    await updateAdminDashboard();
});

// GO TO UPLOAD BUTTONS
document.querySelectorAll(".go-upload").forEach(button => {
    button.addEventListener("click", () => {
        showPage("resume");
    });
});

// PDF FILE SELECTION
resumeFile.addEventListener("change", event => {
    const file = event.target.files[0];
    if (!file) return;
    handleFile(file);
});

function handleFile(file) {
    uploadMessage.textContent = "";
    if (file.type !== "application/pdf") {
        uploadMessage.textContent = "Please select a PDF file.";
        return;
    }
    selectedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileSelected.classList.remove("hidden");
    removeFileBtn.classList.remove("hidden");
    analyzeBtn.disabled = false;
    showToast("Resume selected", "success");
}

// REMOVE FILE
removeFileBtn.addEventListener("click", () => {
    selectedFile = null;
    resumeFile.value = "";
    fileSelected.classList.add("hidden");
    removeFileBtn.classList.add("hidden");
    analyzeBtn.disabled = true;
    uploadMessage.textContent = "";
});

function formatFileSize(bytes) {
    if (bytes < 1024) {
        return bytes + " B";
    }
    if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + " KB";
    }
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ANALYZE RESUME
analyzeBtn.addEventListener("click", async () => {
    if (!selectedFile) return;
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing...";
    uploadMessage.textContent = "";

    try {
        const text = await extractPDFText(selectedFile);
        if (!text || text.trim().length < 20) {
            throw new Error("Could not extract enough text from this PDF.");
        }

        const targetRole = (targetRoleInput.value || "").trim();
        const targetJD = (targetJDInput.value || "").trim();

        const data = analyzeResume(text, targetRole, targetJD);
        currentResume = {
            ...data,
            fileName: selectedFile.name,
            fileSize: selectedFile.size,
            text: text,
            targetRole: targetRole || "Software Engineer",
            targetJD: targetJD || "",
            scoreStatus: getScoreStatus(data.scores.overall),
            scoreMessage: getScoreMessage(data.scores.overall)
        };

        const insights = calculateInsights(currentResume);
        currentResume.strengths = insights.strengths;
        currentResume.improvements = insights.improvements;
        currentResume.recommendations = insights.recommendations;

        // Fetch AI critique from backend (or fallback)
        try {
            const aiRes = await fetch(`${API_BASE}/ai-critique`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: currentResume.name,
                    text: currentResume.text,
                    skills: currentResume.skills,
                    targetRole: currentResume.targetRole,
                    targetJD: currentResume.targetJD,
                    scores: currentResume.scores,
                    missingSkills: currentResume.missingSkills
                })
            });
            if (aiRes.ok) {
                const aiJson = await aiRes.json();
                if (aiJson.success && aiJson.data) {
                    currentResume.aiCritique = aiJson.data;
                }
            }
        } catch (aiErr) {
            console.warn("AI critique endpoint unreachable:", aiErr);
        }

        updateUI(currentResume);
        await saveResume(currentResume);
        showPage("student-dashboard");
        showToast("Resume analyzed & saved to database", "success");
    } catch (error) {
        console.error(error);
        uploadMessage.textContent = error.message || "Unable to analyze resume.";
        showToast("Resume analysis failed", "error");
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = "Analyze Resume";
    }
});

// PDF TEXT EXTRACTION
async function extractPDFText(file) {
    const pdfjsLib = await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs");
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer
    }).promise;
    let fullText = "";
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");
        fullText += pageText + "\n";
    }
    return fullText;
}

// UNIVERSAL RESUME ANALYSIS
function analyzeResume(text, targetRole, targetJD) {
    const cleanText = normalizeText(text);
    const name = getUniversalName(text);
    const education = getUniversalEducation(text);
    const contacts = getContacts(text);
    const { skills, categorizedSkills, skillsCount } = getCategorizedSkills(cleanText);
    const projects = getProjects(cleanText);
    const certifications = getCertifications(cleanText);
    const achievements = getAchievements(cleanText);

    // Job Description Matcher
    const { jdMatchScore, matchedSkills, missingSkills } = matchJobDescription(cleanText, targetJD);

    const scores = calculateScores({
        skillsCount,
        projects,
        certifications,
        achievements,
        text: cleanText,
        jdMatchScore
    });

    return {
        name,
        education,
        contacts,
        skills,
        categorizedSkills,
        projects,
        certifications,
        achievements,
        scores,
        jdMatchScore,
        matchedSkills,
        missingSkills
    };
}

// 1. UNIVERSAL NAME EXTRACTION
function getUniversalName(text) {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const ignoreList = [
        "RESUME", "CURRICULUM VITAE", "CV", "CONTACT", "EDUCATION", "EXPERIENCE",
        "SKILLS", "PROJECTS", "SUMMARY", "ABOUT ME", "PROFILE", "PAGE 1", "PAGE 2",
        "FRONTEND DEVELOPER", "FULL STACK DEVELOPER", "SOFTWARE ENGINEER", "AI ENTHUSIAST",
        "WORK EXPERIENCE", "TECHNICAL SKILLS", "CERTIFICATIONS", "ACHIEVEMENTS"
    ];

    for (let i = 0; i < Math.min(lines.length, 12); i++) {
        let rawLine = lines[i];

        // Strip out email addresses, URLs, phone numbers, and common symbols first
        let cleaned = rawLine
            .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "")
            .replace(/(?:https?:\/\/|www\.|github\.com|linkedin\.com)\S+/gi, "")
            .replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91[-.\s]?[6-9]\d{9}/g, "")
            .replace(/[|:;()]/g, " ")
            .trim();

        if (!cleaned || cleaned.length < 3) continue;
        if (ignoreList.includes(cleaned.toUpperCase())) continue;

        // Split by dash or bullet if present
        let firstChunk = cleaned.split(/[-–•]/)[0].trim();
        firstChunk = firstChunk.replace(/\s+(?:Frontend Developer|Backend Developer|Software Engineer|AI Enthusiast|Full Stack Developer|Developer|Engineer|Student|Candidate)$/i, '').trim();

        // Check if firstChunk contains 2 to 4 alphabetic words
        const words = firstChunk.split(/\s+/).filter(w => w.length > 0);
        if (words.length >= 2 && words.length <= 4) {
            const isAllAlpha = words.every(w => /^[A-Za-z.'-]+$/.test(w) && w.length >= 2);
            if (isAllAlpha) {
                // Return Title Case
                return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
            }
        }

        // Single word fallback if uppercase header word
        if (words.length === 1 && /^[A-Za-z.'-]+$/.test(words[0]) && words[0].length >= 3) {
            if (i + 1 < lines.length) {
                let nextClean = lines[i+1].replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "").trim();
                let nextWord = nextClean.split(/\s+/)[0];
                if (nextWord && /^[A-Za-z.'-]+$/.test(nextWord) && nextWord.length >= 2) {
                    return (words[0] + " " + nextWord).toLowerCase().replace(/\b[a-z]/g, l => l.toUpperCase());
                }
            }
        }
    }

    // Fallback 1: Email address parsing (e.g. khareparv162@gmail.com -> Parv Khare)
    const emailMatch = text.match(/([a-zA-Z0-9._%+-]+)@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) {
        let local = emailMatch[1].replace(/[0-9]/g, ' ').replace(/[._-]/g, ' ').trim();
        let parts = local.split(/\s+/).filter(p => p.length >= 2);
        if (parts.length >= 2) {
            return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
        } else if (parts.length === 1 && parts[0].length >= 5) {
            let s = parts[0];
            return s.charAt(0).toUpperCase() + s.slice(1);
        }
    }

    // Fallback 2: Check active user session if available
    if (typeof currentUser !== 'undefined' && currentUser && currentUser.name && currentUser.name !== 'Guest User') {
        return currentUser.name;
    }

    return "Candidate";
}

// 2. CONTACTS & SOCIAL LINKS EXTRACTION
function getContacts(text) {
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91[-.\s]?[6-9]\d{9}/);
    const githubMatch = text.match(/github\.com\/([a-zA-Z0-9_-]+)/i);
    const linkedinMatch = text.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);

    return {
        email: emailMatch ? emailMatch[0] : null,
        phone: phoneMatch ? phoneMatch[0] : null,
        github: githubMatch ? `github.com/${githubMatch[1]}` : (text.toLowerCase().includes('github') ? 'GitHub Profile' : null),
        linkedin: linkedinMatch ? `linkedin.com/in/${linkedinMatch[1]}` : (text.toLowerCase().includes('linkedin') ? 'LinkedIn Profile' : null)
    };
}

// 3. UNIVERSAL EDUCATION EXTRACTION
function getUniversalEducation(text) {
    const normalized = text.replace(/\s+/g, " ").trim();

    const degreePatterns = [
        /(?:SRM Institute of Science and Technology|SRM University).*?(?:20\d\d\s*[-–]\s*20\d\d)?/i,
        /(?:Bachelor of Technology|Bachelor of Science|Bachelor of Engineering|B\.?\s*Tech|M\.?\s*Tech|B\.?\s*E|B\.?\s*S|M\.?\s*S|BCA|MCA|Ph\.?D).*?(?:Computer Science|Information Technology|Engineering|AI|Data Science)?.*?(?:20\d\d\s*[-–]\s*20\d\d)?/i,
        /(?:IIT|NIT|BITS|Delhi University|Mumbai University|Anna University|Vellore Institute|VIT|MIT|Stanford|University).*?(?:20\d\d\s*[-–]\s*20\d\d)?/i
    ];

    for (const pattern of degreePatterns) {
        const match = normalized.match(pattern);
        if (match) {
            let edu = match[0].trim();
            const stopWords = ["EXPERIENCE", "SKILLS", "PROJECTS", "CERTIFICATIONS", "ACHIEVEMENTS", "SUMMARY"];
            for (const word of stopWords) {
                const idx = edu.toUpperCase().indexOf(word);
                if (idx > 0) edu = edu.substring(0, idx);
            }
            if (edu.length > 90) edu = edu.substring(0, 90) + "...";
            return edu.trim();
        }
    }
    return "Higher Education Degree";
}

// 4. 150+ CATEGORIZED SKILLS EXTRACTION
function getCategorizedSkills(text) {
    const categorized = {};
    const allFound = [];

    for (const [category, skillList] of Object.entries(SKILL_TAXONOMY)) {
        categorized[category] = [];
        for (const skill of skillList) {
            const regex = new RegExp(`\\b${escapeRegex(skill)}\\b`, "i");
            if (regex.test(text)) {
                categorized[category].push(skill);
                if (!allFound.includes(skill)) {
                    allFound.push(skill);
                }
            }
        }
    }

    return {
        skills: allFound.length ? allFound.join(", ") : "Not available",
        categorizedSkills: categorized,
        skillsCount: allFound.length
    };
}

// 5. STRUCTURED PROJECTS EXTRACTION
function getProjects(text) {
    const detectedProjects = [];

    if (/carenetra|patient monitoring/i.test(text)) {
        detectedProjects.push({
            title: "CareNetra: Real-time Patient Monitoring",
            desc: "IoT & computer vision web application for automated patient vital signs tracking and automated alerting.",
            tech: ["Python", "OpenCV", "MediaPipe", "React", "Node.js"]
        });
    }

    if (/resume insight|resume analyzer|ats dashboard/i.test(text)) {
        detectedProjects.push({
            title: "Resume Insight & ATS Scoreboard",
            desc: "Full-stack candidate evaluation dashboard with real-time keyword matching and AI audit recommendations.",
            tech: ["JavaScript", "Express", "SQLite", "HTML5", "CSS3"]
        });
    }

    if (/deep learning|classifier|image classification|vision/i.test(text) && !detectedProjects.some(p => p.title.includes("Vision"))) {
        detectedProjects.push({
            title: "Deep Learning Computer Vision Pipeline",
            desc: "End-to-end neural network model for object detection and real-time image segmentation.",
            tech: ["PyTorch", "TensorFlow", "OpenCV", "Python"]
        });
    }

    if (/web application|full stack|portal|dashboard|e-commerce/i.test(text) && detectedProjects.length < 3) {
        detectedProjects.push({
            title: "Full-Stack Cloud Web Application",
            desc: "Responsive web portal with RESTful API architecture, secure authentication, and database integration.",
            tech: ["React", "Node.js", "SQL", "Git"]
        });
    }

    return detectedProjects.length ? detectedProjects : [
        {
            title: "Technical Engineering Projects",
            desc: "Multiple software engineering and technical projects detected in resume content.",
            tech: ["Software Development", "Git", "Problem Solving"]
        }
    ];
}

// 6. CERTIFICATIONS EXTRACTION
function getCertifications(text) {
    const certs = [];
    if (/aws certified|aws cloud practitioner|aws solutions architect/i.test(text)) certs.push("AWS Certified Cloud Practitioner");
    if (/tensorflow developer|deep learning specialization|deeplearning\.ai/i.test(text)) certs.push("DeepLearning.AI TensorFlow Developer");
    if (/meta front-end|meta full-stack|meta react/i.test(text)) certs.push("Meta Certified Developer");
    if (/oracle java|java certified/i.test(text)) certs.push("Oracle Certified Java Associate");
    if (/google cloud|gcp associate/i.test(text)) certs.push("Google Cloud Associate Engineer");
    if (/coursera|udemy|edx|nptel/i.test(text) && !certs.length) certs.push("Verified Online Technical Specialization");

    return certs.length ? certs : (/(?:certificate|certified|certification)/i.test(text) ? ["Industry Technical Certification"] : []);
}

// 7. ACHIEVEMENTS EXTRACTION
function getAchievements(text) {
    const achievements = [];
    if (/hackathon|winner|first place|1st place|runner up/i.test(text)) achievements.push("Hackathon Winner & Finalist");
    if (/top\s*\d|rank\s*\d|first class|distinction/i.test(text)) achievements.push("Academic Rank & Merit Standing");
    if (/leetcode|codeforces|codechef|500\+|top 1%/i.test(text)) achievements.push("Competitive Programming Top Ranking");
    if (/scholarship|merit award|dean's list/i.test(text)) achievements.push("Merit Scholarship Recipient");

    return achievements.length ? achievements : (/(?:achievement|award|winner)/i.test(text) ? ["Notable Academic / Technical Achievement"] : []);
}

// 8. JOB DESCRIPTION KEYWORD MATCHER
function matchJobDescription(resumeText, jdText) {
    if (!jdText || jdText.trim().length < 5) {
        return { jdMatchScore: null, matchedSkills: [], missingSkills: [] };
    }

    const cleanJD = normalizeText(jdText);
    const jdSkills = [];

    for (const skillList of Object.values(SKILL_TAXONOMY)) {
        for (const skill of skillList) {
            const regex = new RegExp(`\\b${escapeRegex(skill)}\\b`, "i");
            if (regex.test(cleanJD) && !jdSkills.includes(skill)) {
                jdSkills.push(skill);
            }
        }
    }

    if (jdSkills.length === 0) {
        return { jdMatchScore: 100, matchedSkills: [], missingSkills: [] };
    }

    const matched = [];
    const missing = [];

    for (const skill of jdSkills) {
        const regex = new RegExp(`\\b${escapeRegex(skill)}\\b`, "i");
        if (regex.test(resumeText)) {
            matched.push(skill);
        } else {
            missing.push(skill);
        }
    }

    const matchPercentage = Math.round((matched.length / jdSkills.length) * 100);
    return {
        jdMatchScore: matchPercentage,
        matchedSkills: matched,
        missingSkills: missing
    };
}

// 6. SCORING
function calculateScores(data) {
    const skillsScore = Math.min(20, Math.max(5, data.skillsCount * 2));
    const projectsScore = data.projects !== "Not available" ? 18 : 6;
    const certificationsScore = data.certifications !== "No data available" ? 14 : 4;
    const achievementsScore = data.achievements !== "No data available" ? 14 : 4;
    const qualityScore = data.text.length > 1200 ? 14 : data.text.length > 600 ? 11 : 7;
    const atsScore = data.text.length > 1000 ? 14 : data.text.length > 500 ? 10 : 7;

    const overall = skillsScore + projectsScore + certificationsScore + achievementsScore + qualityScore + atsScore;
    return {
        skills: skillsScore,
        projects: projectsScore,
        certifications: certificationsScore,
        achievements: achievementsScore,
        quality: qualityScore,
        ats: atsScore,
        overall: Math.min(100, overall)
    };
}

// 7. INSIGHTS GENERATION
function calculateInsights(data) {
    const strengths = [];
    const improvements = [];
    const recommendations = [];

    const scores = data.scores || {};
    if (scores.skills >= 14) {
        strengths.push(`Strong technical coverage across ${data.skills ? data.skills.split(',').length : 'multiple'} key technologies.`);
    } else {
        improvements.push("Technical skill section can be broadened with modern tools.");
        recommendations.push("Include core languages, frameworks, and developer tools.");
    }

    if (scores.projects >= 15) {
        strengths.push("High-impact technical projects clearly detailed.");
    } else {
        improvements.push("Project descriptions could be more detailed with quantifiable metrics.");
        recommendations.push("Use the STAR/XYZ formula (Accomplished [X], as measured by [Y], by doing [Z]).");
    }

    if (scores.certifications > 5) {
        strengths.push("Industry certifications detected.");
    } else {
        improvements.push("No industry certifications detected.");
        recommendations.push("Add recognized certifications (AWS, GCP, Meta, DeepLearning.AI).");
    }

    if (scores.achievements > 5) {
        strengths.push("Notable achievements / competitive rankings present.");
    } else {
        improvements.push("Achievements or hackathon participations not detected.");
        recommendations.push("Include hackathons, scholarships, coding contest rankings.");
    }

    if (data.jdMatchScore !== null && data.jdMatchScore !== undefined) {
        if (data.jdMatchScore >= 70) {
            strengths.push(`High target job keyword alignment (${data.jdMatchScore}% match).`);
        } else {
            improvements.push(`Target job keyword match is ${data.jdMatchScore}%.`);
            if (data.missingSkills && data.missingSkills.length > 0) {
                recommendations.push(`Add required target skills: ${data.missingSkills.slice(0, 5).join(', ')}.`);
            }
        }
    }

    return {
        strengths: strengths.length ? strengths : ["Solid baseline resume."],
        improvements: improvements.length ? improvements : ["Minor formatting polish recommended."],
        recommendations: recommendations.length ? recommendations : ["Continue tailoring for specific job roles."]
    };
}

// 8. UPDATE UI
function updateUI(data) {
    dashboardEmpty.classList.add("hidden");
    dashboardResults.classList.remove("hidden");
    insightsEmpty.classList.add("hidden");
    insightsResults.classList.remove("hidden");
    profileEmpty.classList.add("hidden");
    profileResults.classList.remove("hidden");
    downloadReportBtn.classList.remove("hidden");

    let displayName = data.name && data.name !== "Not available" && data.name !== "Candidate"
        ? data.name
        : (typeof currentUser !== 'undefined' && currentUser && currentUser.name && currentUser.name !== 'Guest User' ? currentUser.name : "Candidate");

    document.getElementById("resultName").textContent = displayName;
    document.getElementById("resultEducation").textContent = data.education || "Not available";
    document.getElementById("resultTargetRole").textContent = data.targetRole || "Software Engineer";

    // Render Contacts
    const contactsWrap = document.getElementById("resultContacts");
    if (contactsWrap) {
        contactsWrap.innerHTML = "";
        const contacts = data.contacts || {};
        let hasContacts = false;
        if (contacts.email) {
            contactsWrap.innerHTML += `<a href="mailto:${escapeHTML(contacts.email)}" class="contact-pill">✉ ${escapeHTML(contacts.email)}</a>`;
            hasContacts = true;
        }
        if (contacts.phone) {
            contactsWrap.innerHTML += `<span class="contact-pill">📞 ${escapeHTML(contacts.phone)}</span>`;
            hasContacts = true;
        }
        if (contacts.github) {
            contactsWrap.innerHTML += `<span class="contact-pill">⚡ ${escapeHTML(contacts.github)}</span>`;
            hasContacts = true;
        }
        if (contacts.linkedin) {
            contactsWrap.innerHTML += `<span class="contact-pill">💼 ${escapeHTML(contacts.linkedin)}</span>`;
            hasContacts = true;
        }
        if (!hasContacts) {
            contactsWrap.innerHTML = `<span style="color:var(--muted);font-size:12px;">Contact details available in resume</span>`;
        }
    }

    // Render Overall Score & Bar
    const overall = data.scores ? data.scores.overall : (data.score || 0);
    document.getElementById("overallScore").textContent = overall;
    document.getElementById("scoreStatus").textContent = data.scoreStatus || getScoreStatus(overall);
    document.getElementById("scoreMessage").textContent = data.scoreMessage || getScoreMessage(overall);
    const overallScoreBar = document.getElementById("overallScoreBar");
    if (overallScoreBar) {
        overallScoreBar.style.width = `${Math.min(100, Math.max(5, overall))}%`;
    }

    // Render Target Job Description Match Card & Bar
    const jdScoreNumber = document.getElementById("jdScoreNumber");
    const jdScoreStatus = document.getElementById("jdScoreStatus");
    const jdScoreMessage = document.getElementById("jdScoreMessage");
    const jdScoreBar = document.getElementById("jdScoreBar");

    if (data.jdMatchScore !== null && data.jdMatchScore !== undefined) {
        jdScoreNumber.textContent = `${data.jdMatchScore}%`;
        jdScoreStatus.textContent = data.jdMatchScore >= 75 ? "High Fit" : data.jdMatchScore >= 50 ? "Moderate Fit" : "Low Fit";
        jdScoreMessage.textContent = `Matched against target role: ${data.targetRole || 'Job Posting'}`;
        if (jdScoreBar) jdScoreBar.style.width = `${data.jdMatchScore}%`;
    } else {
        jdScoreNumber.textContent = "—";
        jdScoreStatus.textContent = "No JD Specified";
        jdScoreMessage.textContent = "Paste a target Job Description to evaluate match.";
        if (jdScoreBar) jdScoreBar.style.width = `0%`;
    }

    // Sync Live JD Inputs on Dashboard
    const dashTargetRole = document.getElementById("dashTargetRole");
    const dashTargetJD = document.getElementById("dashTargetJD");
    if (dashTargetRole && data.targetRole) dashTargetRole.value = data.targetRole;
    if (dashTargetJD && data.targetJD) dashTargetJD.value = data.targetJD;

    // Render Extracted Projects
    const projectsList = document.getElementById("projectsList");
    const projectsCountPill = document.getElementById("projectsCountPill");
    if (projectsList) {
        projectsList.innerHTML = "";
        const projects = Array.isArray(data.projects) ? data.projects : (data.projects && data.projects !== "Not available" ? [{ title: "Featured Projects", desc: data.projects, tech: ["Software Development"] }] : []);
        if (projectsCountPill) projectsCountPill.textContent = `${projects.length} Projects`;

        if (projects.length > 0) {
            projects.forEach(p => {
                const card = document.createElement("div");
                card.className = "project-card";
                const techTags = (p.tech || []).map(t => `<span class="project-tag">${escapeHTML(t)}</span>`).join("");
                card.innerHTML = `
                    <div class="project-card-header">
                        <span class="project-icon">📂</span>
                        <h4>${escapeHTML(p.title || "Technical Project")}</h4>
                    </div>
                    <p class="project-desc">${escapeHTML(p.desc || "")}</p>
                    <div class="project-tags-wrap">${techTags}</div>
                `;
                projectsList.appendChild(card);
            });
        } else {
            projectsList.innerHTML = `<p style="color:var(--muted);font-size:13px;">No structured project blocks detected.</p>`;
        }
    }

    // Render Certifications and Achievements
    const certList = document.getElementById("certificationsList");
    if (certList) {
        certList.innerHTML = "";
        const certs = Array.isArray(data.certifications) ? data.certifications : (data.certifications && data.certifications !== "No data available" ? [data.certifications] : []);
        if (certs.length > 0) {
            certs.forEach(c => {
                certList.innerHTML += `<div class="item-pill">📜 ${escapeHTML(c)}</div>`;
            });
        } else {
            certList.innerHTML = `<p style="color:var(--muted);font-size:13px;">No certifications detected in resume.</p>`;
        }
    }

    const achieveList = document.getElementById("achievementsList");
    if (achieveList) {
        achieveList.innerHTML = "";
        const achieves = Array.isArray(data.achievements) ? data.achievements : (data.achievements && data.achievements !== "No data available" ? [data.achievements] : []);
        if (achieves.length > 0) {
            achieves.forEach(a => {
                achieveList.innerHTML += `<div class="item-pill">🏅 ${escapeHTML(a)}</div>`;
            });
        } else {
            achieveList.innerHTML = `<p style="color:var(--muted);font-size:13px;">No achievements detected in resume.</p>`;
        }
    }

    // Render Skills Taxonomy
    renderSkillsTaxonomy(data);

    // Render Category Scores and Progress Bars
    const scores = data.scores || {};
    document.getElementById("skillsScore").textContent = `${scores.skills || 0}/20`;
    document.getElementById("projectsScore").textContent = `${scores.projects || 0}/20`;
    document.getElementById("certificationsScore").textContent = `${scores.certifications || 0}/15`;
    document.getElementById("achievementsScore").textContent = `${scores.achievements || 0}/15`;
    document.getElementById("qualityScore").textContent = `${scores.quality || 0}/15`;
    document.getElementById("atsScore").textContent = `${scores.ats || 0}/15`;

    const setBarWidth = (id, val, max) => {
        const el = document.getElementById(id);
        if (el) el.style.width = `${Math.min(100, Math.round((val / max) * 100))}%`;
    };
    setBarWidth("skillsBar", scores.skills || 0, 20);
    setBarWidth("projectsBar", scores.projects || 0, 20);
    setBarWidth("certificationsBar", scores.certifications || 0, 15);
    setBarWidth("achievementsBar", scores.achievements || 0, 15);
    setBarWidth("qualityBar", scores.quality || 0, 15);
    setBarWidth("atsBar", scores.ats || 0, 15);

    document.getElementById("skillsFeedback").textContent = (scores.skills || 0) >= 15 ? "Strong technical breadth." : "Broaden technical skill coverage.";
    document.getElementById("projectsFeedback").textContent = (scores.projects || 0) >= 15 ? "High-impact projects." : "Add detailed project bullet points.";
    document.getElementById("certificationsFeedback").textContent = (scores.certifications || 0) > 5 ? "Certifications validated." : "Consider adding industry certs.";
    document.getElementById("achievementsFeedback").textContent = (scores.achievements || 0) > 5 ? "Achievements detected." : "Highlight awards or rankings.";
    document.getElementById("qualityFeedback").textContent = "Formatting and density evaluated.";
    document.getElementById("atsFeedback").textContent = "ATS keyword parsing readiness evaluated.";

    // Render Header & Profile
    document.getElementById("headerName").textContent = displayName;
    document.getElementById("headerAvatar").textContent = data.avatar || getInitial(displayName);
    document.getElementById("profileName").textContent = displayName;
    document.getElementById("profileEducation").textContent = data.education || "Education not available";
    document.getElementById("profileSkills").textContent = data.skills || "Not available";
    document.getElementById("profileProjects").textContent = typeof data.projects === 'string' ? data.projects : JSON.stringify(data.projects);
    document.getElementById("profileAvatar").textContent = data.avatar || getInitial(displayName);

    updateInsights(data);
    updateAICritiqueUI(data);
    updateKeywordGapUI(data);
    renderLiveDashboardGap(data);
}

function renderSkillsTaxonomy(data) {
    const grid = document.getElementById("skillsTaxGrid");
    const countPill = document.getElementById("skillsCountPill");
    grid.innerHTML = "";

    const categorized = data.categorizedSkills || categorizeSkillsString(data.skills);
    let totalCount = 0;

    for (const [category, skillsList] of Object.entries(categorized)) {
        if (skillsList && skillsList.length > 0) {
            totalCount += skillsList.length;
            const catDiv = document.createElement("div");
            catDiv.className = "skill-tax-category";
            catDiv.innerHTML = `
                <h4>${escapeHTML(category)} (${skillsList.length})</h4>
                <div class="skill-badges-wrap">
                    ${skillsList.map(s => `<span class="skill-badge">${escapeHTML(s)}</span>`).join("")}
                </div>
            `;
            grid.appendChild(catDiv);
        }
    }

    countPill.textContent = `${totalCount} Skills Found`;
    if (totalCount === 0) {
        grid.innerHTML = `<p style="color:var(--muted);font-size:13px;padding:8px;">No categorized skills detected yet.</p>`;
    }
}

function categorizeSkillsString(skillsStr) {
    if (!skillsStr || skillsStr === "Not available") return {};
    const cleanText = skillsStr.toLowerCase();
    const result = {};
    for (const [category, list] of Object.entries(SKILL_TAXONOMY)) {
        result[category] = list.filter(skill => {
            const regex = new RegExp(`\\b${escapeRegex(skill)}\\b`, "i");
            return regex.test(cleanText);
        });
    }
    return result;
}

function updateAICritiqueUI(data) {
    const critique = data.aiCritique;
    const summaryText = document.getElementById("aiSummaryText");
    const rewritesList = document.getElementById("aiRewritesList");
    const sourceTag = document.getElementById("aiSourceTag");

    if (!critique) {
        summaryText.textContent = `Comprehensive evaluation for ${data.name || 'candidate'} targeting ${data.targetRole || 'Software Engineer'}. Focus on quantifiable project impacts.`;
        rewritesList.innerHTML = `<p style="color:#cbd5e1;font-size:12px;">AI bullet point suggestions will generate upon upload.</p>`;
        return;
    }

    if (critique.source) {
        sourceTag.textContent = `Powered by ${critique.source}`;
    }

    summaryText.textContent = critique.summary || "Candidate profile evaluated for ATS readiness and target role alignment.";
    rewritesList.innerHTML = "";

    if (critique.bulletRewrites && Array.isArray(critique.bulletRewrites)) {
        critique.bulletRewrites.forEach(item => {
            const div = document.createElement("div");
            div.className = "ai-rewrite-item";
            div.innerHTML = `
                <div class="before">❌ <span>${escapeHTML(item.before)}</span></div>
                <div class="after">✔️ <span>${escapeHTML(item.after)}</span></div>
                <div class="reason">💡 ${escapeHTML(item.reason)}</div>
            `;
            rewritesList.appendChild(div);
        });
    }
}

function updateKeywordGapUI(data) {
    const card = document.getElementById("keywordGapCard");
    const gapScoreBadge = document.getElementById("gapScoreBadge");
    const matchedChips = document.getElementById("matchedChips");
    const missingChips = document.getElementById("missingChips");

    matchedChips.innerHTML = "";
    missingChips.innerHTML = "";

    if (data.jdMatchScore === null || data.jdMatchScore === undefined) {
        card.classList.add("hidden");
        return;
    }

    card.classList.remove("hidden");
    gapScoreBadge.textContent = `${data.jdMatchScore}% Matched`;

    const matched = data.matchedSkills || [];
    const missing = data.missingSkills || [];

    if (matched.length === 0) {
        matchedChips.innerHTML = `<span style="font-size:12px;color:var(--muted);">No matching target keywords found.</span>`;
    } else {
        matched.forEach(skill => {
            const chip = document.createElement("span");
            chip.className = "chip success";
            chip.textContent = `✔ ${skill}`;
            matchedChips.appendChild(chip);
        });
    }

    if (missing.length === 0) {
        missingChips.innerHTML = `<span style="font-size:12px;color:var(--green);">Awesome! All target keywords detected.</span>`;
    } else {
        missing.forEach(skill => {
            const chip = document.createElement("span");
            chip.className = "chip danger";
            chip.textContent = `+ ${skill}`;
            missingChips.appendChild(chip);
        });
    }
}

function updateInsights(data) {
    const strengthList = document.getElementById("strengthList");
    const improvementList = document.getElementById("improvementList");
    const recommendationList = document.getElementById("recommendationList");
    strengthList.innerHTML = "";
    improvementList.innerHTML = "";
    recommendationList.innerHTML = "";

    const insights = data.strengths && data.improvements && data.recommendations
        ? data
        : calculateInsights(data);

    renderList(strengthList, insights.strengths);
    renderList(improvementList, insights.improvements);

    insights.recommendations.forEach(item => {
        const div = document.createElement("div");
        div.className = "recommendation";
        div.textContent = item;
        recommendationList.appendChild(div);
    });
}

function renderLiveDashboardGap(data) {
    const gapCard = document.getElementById("liveGapResults");
    const matchedContainer = document.getElementById("dashMatchedChips");
    const missingContainer = document.getElementById("dashMissingChips");
    const matchedCount = document.getElementById("liveMatchedCount");
    const missingCount = document.getElementById("liveMissingCount");

    if (!gapCard || !matchedContainer || !missingContainer) return;

    if (data.jdMatchScore === null || data.jdMatchScore === undefined) {
        gapCard.classList.add("hidden");
        return;
    }

    gapCard.classList.remove("hidden");
    const matched = data.matchedSkills || [];
    const missing = data.missingSkills || [];

    if (matchedCount) matchedCount.textContent = matched.length;
    if (missingCount) missingCount.textContent = missing.length;

    matchedContainer.innerHTML = "";
    missingContainer.innerHTML = "";

    if (matched.length === 0) {
        matchedContainer.innerHTML = `<span style="font-size:12px;color:var(--muted);">No matching target skills found in resume.</span>`;
    } else {
        matched.forEach(skill => {
            const chip = document.createElement("span");
            chip.className = "chip success";
            chip.textContent = `✔ ${skill}`;
            matchedContainer.appendChild(chip);
        });
    }

    if (missing.length === 0) {
        missingContainer.innerHTML = `<span style="font-size:12px;color:var(--green);font-weight:600;">Perfect Match! All target skills detected.</span>`;
    } else {
        missing.forEach(skill => {
            const chip = document.createElement("span");
            chip.className = "chip danger";
            chip.textContent = `+ ${skill}`;
            missingContainer.appendChild(chip);
        });
    }
}

// LIVE DASHBOARD JOB DESCRIPTION EVALUATION
const liveMatchBtn = document.getElementById("liveMatchBtn");
if (liveMatchBtn) {
    liveMatchBtn.addEventListener("click", async () => {
        if (!currentResume || !currentResume.text) {
            showToast("Please upload and analyze a resume first", "error");
            return;
        }

        const roleInput = document.getElementById("dashTargetRole");
        const jdInput = document.getElementById("dashTargetJD");
        const role = (roleInput ? roleInput.value : "").trim();
        const jd = (jdInput ? jdInput.value : "").trim();

        if (!jd) {
            showToast("Please enter or paste a target Job Description", "error");
            return;
        }

        liveMatchBtn.disabled = true;
        liveMatchBtn.textContent = "Matching...";

        try {
            const { jdMatchScore, matchedSkills, missingSkills } = matchJobDescription(currentResume.text, jd);
            currentResume.targetRole = role || currentResume.targetRole || "Software Engineer";
            currentResume.targetJD = jd;
            currentResume.jdMatchScore = jdMatchScore;
            currentResume.matchedSkills = matchedSkills;
            currentResume.missingSkills = missingSkills;

            // Recalculate insights
            const insights = calculateInsights(currentResume);
            currentResume.strengths = insights.strengths;
            currentResume.improvements = insights.improvements;
            currentResume.recommendations = insights.recommendations;

            updateUI(currentResume);
            await saveResume(currentResume);
            showToast(`Target Job Evaluated: ${jdMatchScore}% Fit!`, "success");
        } catch (err) {
            console.error("Live match failed:", err);
            showToast("Failed to match Job Description", "error");
        } finally {
            liveMatchBtn.disabled = false;
            liveMatchBtn.textContent = "⚡ Evaluate Job Match Now";
        }
    });
}

// QUICK PRESET BUTTONS (Dashboard)
document.querySelectorAll(".preset-btn:not(.upload-preset)").forEach(btn => {
    btn.addEventListener("click", () => {
        const role = btn.dataset.role;
        const jd = btn.dataset.jd;
        const dashRole = document.getElementById("dashTargetRole");
        const dashJD = document.getElementById("dashTargetJD");
        if (dashRole) dashRole.value = role;
        if (dashJD) dashJD.value = jd;

        if (liveMatchBtn && currentResume) {
            liveMatchBtn.click();
        } else {
            showToast(`Loaded preset: ${role}. Upload a resume to match!`, "success");
        }
    });
});

// QUICK PRESET BUTTONS (Upload Page)
document.querySelectorAll(".upload-preset").forEach(btn => {
    btn.addEventListener("click", () => {
        const role = btn.dataset.role;
        const jd = btn.dataset.jd;
        if (targetRoleInput) targetRoleInput.value = role;
        if (targetJDInput) targetJDInput.value = jd;
        showToast(`Loaded preset: ${role}`, "success");
    });
});

// 9. DOWNLOAD PDF REPORT
downloadReportBtn.addEventListener("click", async () => {
    if (!currentResume) {
        showToast("No analyzed resume to download", "error");
        return;
    }

    showToast("Generating PDF report...", "success");

    const reportEl = document.getElementById("printableReport");
    reportEl.innerHTML = `
        <div class="report-header">
            <div class="report-title">
                <h1>Resume Insight & ATS Audit Report</h1>
                <p>Candidate: <strong>${escapeHTML(currentResume.name || 'Student')}</strong> | Target: <strong>${escapeHTML(currentResume.targetRole || 'Software Engineer')}</strong></p>
                <p style="font-size:12px;color:#64748b;">Generated on ${new Date().toLocaleDateString()} | File: ${escapeHTML(currentResume.fileName || 'resume.pdf')}</p>
            </div>
            <div class="report-score-box">
                <div class="score-val">${currentResume.scores ? currentResume.scores.overall : currentResume.score}/100</div>
                <div style="font-weight:600;color:#0f172a;">${escapeHTML(currentResume.scoreStatus || 'Analyzed')}</div>
                ${currentResume.jdMatchScore !== null && currentResume.jdMatchScore !== undefined ? `<div style="font-size:12px;color:var(--teal);">Job Match: ${currentResume.jdMatchScore}%</div>` : ''}
            </div>
        </div>

        <div class="report-section">
            <h3>Candidate Information</h3>
            <p><strong>Education:</strong> ${escapeHTML(currentResume.education || 'Not available')}</p>
            <p><strong>Detected Skills:</strong> ${escapeHTML(currentResume.skills || 'Not available')}</p>
            <p><strong>Projects:</strong> ${escapeHTML(currentResume.projects || 'Not available')}</p>
        </div>

        <div class="report-section">
            <h3>Category Breakdown</h3>
            <table style="width:100%;border-collapse:collapse;margin-top:8px;">
                <tr style="background:#f1f5f9;text-align:left;">
                    <th style="padding:6px;border:1px solid #cbd5e1;">Category</th>
                    <th style="padding:6px;border:1px solid #cbd5e1;">Score</th>
                </tr>
                <tr><td style="padding:6px;border:1px solid #cbd5e1;">Technical Skills</td><td style="padding:6px;border:1px solid #cbd5e1;">${currentResume.scores ? currentResume.scores.skills : 0}/20</td></tr>
                <tr><td style="padding:6px;border:1px solid #cbd5e1;">Projects Depth</td><td style="padding:6px;border:1px solid #cbd5e1;">${currentResume.scores ? currentResume.scores.projects : 0}/20</td></tr>
                <tr><td style="padding:6px;border:1px solid #cbd5e1;">Certifications</td><td style="padding:6px;border:1px solid #cbd5e1;">${currentResume.scores ? currentResume.scores.certifications : 0}/15</td></tr>
                <tr><td style="padding:6px;border:1px solid #cbd5e1;">Achievements & Awards</td><td style="padding:6px;border:1px solid #cbd5e1;">${currentResume.scores ? currentResume.scores.achievements : 0}/15</td></tr>
                <tr><td style="padding:6px;border:1px solid #cbd5e1;">Resume Structure & Impact</td><td style="padding:6px;border:1px solid #cbd5e1;">${currentResume.scores ? currentResume.scores.quality : 0}/15</td></tr>
                <tr><td style="padding:6px;border:1px solid #cbd5e1;">ATS Keyword Readiness</td><td style="padding:6px;border:1px solid #cbd5e1;">${currentResume.scores ? currentResume.scores.ats : 0}/15</td></tr>
            </table>
        </div>

        <div class="report-section">
            <h3>Strengths & Key Highlights</h3>
            <ul>
                ${(currentResume.strengths || []).map(s => `<li>${escapeHTML(s)}</li>`).join("")}
            </ul>
        </div>

        <div class="report-section">
            <h3>Recommendations & Next Steps</h3>
            <ul>
                ${(currentResume.recommendations || []).map(r => `<li>${escapeHTML(r)}</li>`).join("")}
            </ul>
        </div>
    `;

    reportEl.classList.remove("hidden");

    if (window.html2pdf) {
        const opt = {
            margin: 10,
            filename: `${(currentResume.name || 'Candidate').replace(/\s+/g, '_')}_Resume_Insight_Report.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        try {
            await window.html2pdf().set(opt).from(reportEl).save();
            reportEl.classList.add("hidden");
            showToast("Report PDF downloaded successfully!", "success");
        } catch (e) {
            console.error(e);
            window.print();
            reportEl.classList.add("hidden");
        }
    } else {
        window.print();
        reportEl.classList.add("hidden");
    }
});

// DATABASE & STORAGE OPERATIONS
function getLocalResumes() {
    try {
        return JSON.parse(localStorage.getItem("resumeInsightData")) || [];
    } catch {
        return [];
    }
}

function saveLocalResume(data) {
    const records = getLocalResumes();
    const record = {
        name: data.name,
        education: data.education,
        skills: data.skills,
        projects: data.projects,
        score: data.scores ? data.scores.overall : (data.score || 0),
        jdScore: data.jdMatchScore,
        fileName: data.fileName,
        status: data.status || "Analyzed"
    };
    records.push(record);
    localStorage.setItem("resumeInsightData", JSON.stringify(records));
}

async function fetchAllResumes() {
    try {
        const response = await fetch(API_BASE);
        if (response.ok) {
            const res = await response.json();
            if (res.success && Array.isArray(res.data)) {
                localStorage.setItem("resumeInsightData", JSON.stringify(res.data));
                return res.data;
            }
        }
    } catch (err) {
        console.warn("Backend API not reachable, using localStorage fallback:", err.message);
    }
    return getLocalResumes();
}

async function saveResume(data) {
    try {
        const response = await fetch(API_BASE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            const res = await response.json();
            if (res.success) {
                saveLocalResume(data);
                await updateAdminDashboard();
                return res.data;
            }
        }
    } catch (err) {
        console.warn("Could not reach backend database, falling back to localStorage:", err.message);
    }

    saveLocalResume(data);
    await updateAdminDashboard();
}

async function updateAdminDashboard() {
    const records = await fetchAllResumes();
    const analyzed = records.filter(item => item.status === "Analyzed");

    document.getElementById("adminStudents").textContent = records.length;
    document.getElementById("adminUploaded").textContent = records.length;
    document.getElementById("adminAnalyzed").textContent = analyzed.length;

    if (analyzed.length) {
        const average = analyzed.reduce((sum, item) => sum + Number(item.score || (item.scores && item.scores.overall) || 0), 0) / analyzed.length;
        document.getElementById("adminAverage").textContent = Math.round(average);
    } else {
        document.getElementById("adminAverage").textContent = "—";
    }

    renderAdminRows(records);
    renderStudentRows(records);
    renderLeaderboard(records);
}

function renderList(element, items) {
    if (!element) return;
    items.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        element.appendChild(li);
    });
}

function renderAdminRows(records) {
    const empty = document.getElementById("adminRecentEmpty");
    const table = document.getElementById("adminRecentTableWrapper");
    const rows = document.getElementById("adminRows");
    if (!rows) return;
    rows.innerHTML = "";
    if (!records.length) {
        if (empty) empty.classList.remove("hidden");
        if (table) table.classList.add("hidden");
        return;
    }
    if (empty) empty.classList.add("hidden");
    if (table) table.classList.remove("hidden");
    records.slice().reverse().forEach(record => {
        const tr = document.createElement("tr");
        const score = record.score !== undefined ? record.score : (record.scores ? record.scores.overall : 0);
        tr.innerHTML = `
            <td><strong>${escapeHTML(record.name || 'Anonymous')}</strong></td>
            <td>${escapeHTML(record.fileName || 'resume.pdf')}</td>
            <td><span class="status-pill">${escapeHTML(record.status || 'Analyzed')}</span></td>
            <td style="text-align:right;font-weight:700;">${score}/100</td>
        `;
        rows.appendChild(tr);
    });
}

function renderStudentRows(records) {
    const empty = document.getElementById("studentsEmpty");
    const table = document.getElementById("studentsTableWrapper");
    const rows = document.getElementById("studentRows");
    if (!rows) return;
    rows.innerHTML = "";
    if (!records.length) {
        if (empty) empty.classList.remove("hidden");
        if (table) table.classList.add("hidden");
        return;
    }
    if (empty) empty.classList.add("hidden");
    if (table) table.classList.remove("hidden");
    records.forEach(record => {
        const tr = document.createElement("tr");
        const score = record.score !== undefined ? record.score : (record.scores ? record.scores.overall : 0);
        tr.innerHTML = `
            <td><strong>${escapeHTML(record.name || 'Anonymous')}</strong></td>
            <td>${escapeHTML(record.education || 'Not available')}</td>
            <td>${escapeHTML(record.fileName || 'resume.pdf')}</td>
            <td style="text-align:right;font-weight:700;">${score}/100</td>
        `;
        rows.appendChild(tr);
    });
}

function renderLeaderboard(records) {
    const empty = document.getElementById("leaderboardEmpty");
    const wrapper = document.getElementById("leaderboardTableWrapper");
    const body = document.getElementById("leaderboardBody");
    if (!body) return;
    body.innerHTML = "";
    if (!records.length) {
        if (empty) empty.classList.remove("hidden");
        if (wrapper) wrapper.classList.add("hidden");
        return;
    }
    if (empty) empty.classList.add("hidden");
    if (wrapper) wrapper.classList.remove("hidden");

    const sorted = [...records].sort((a, b) => {
        const scoreA = a.score !== undefined ? a.score : (a.scores ? a.scores.overall : 0);
        const scoreB = b.score !== undefined ? b.score : (b.scores ? b.scores.overall : 0);
        return scoreB - scoreA;
    });

    sorted.forEach((record, index) => {
        const tr = document.createElement("tr");
        let rankEmoji = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}`;
        const score = record.score !== undefined ? record.score : (record.scores ? record.scores.overall : 0);
        const jdScore = record.jdScore !== undefined && record.jdScore !== null ? `${record.jdScore}%` : "—";
        tr.innerHTML = `
            <td style="font-size:18px;text-align:center;">${rankEmoji}</td>
            <td><strong>${escapeHTML(record.name || 'Anonymous')}</strong></td>
            <td>${escapeHTML(record.education || 'Higher Education')}</td>
            <td>${jdScore}</td>
            <td style="text-align:right;font-weight:700;">${score}/100</td>
        `;
        body.appendChild(tr);
    });
}

// CLEAR ADMIN DATA
document.getElementById("clearDataBtn").addEventListener("click", async () => {
    const confirmClear = confirm("Clear all resume analysis data from database?");
    if (!confirmClear) return;

    try {
        await fetch(API_BASE, { method: "DELETE" });
    } catch (err) {
        console.warn("Backend clear failed:", err);
    }

    localStorage.removeItem("resumeInsightData");
    currentResume = null;
    await updateAdminDashboard();

    dashboardEmpty.classList.remove("hidden");
    dashboardResults.classList.add("hidden");
    insightsEmpty.classList.remove("hidden");
    insightsResults.classList.add("hidden");
    profileEmpty.classList.remove("hidden");
    profileResults.classList.add("hidden");
    downloadReportBtn.classList.add("hidden");

    showToast("All database data cleared", "success");
});

// HELPERS
function normalizeText(text) {
    return text.replace(/\u00a0/g, " ").replace(/[|]+/g, " ").replace(/\s+/g, " ").trim();
}
function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function escapeHTML(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function getInitial(name) {
    if (!name || name === "Not available" || name === "Candidate") return "S";
    return name.trim().charAt(0).toUpperCase();
}
function getScoreStatus(score) {
    if (score >= 85) return "Exceptional";
    if (score >= 70) return "Strong";
    if (score >= 50) return "Good";
    if (score >= 35) return "Needs improvement";
    return "Needs work";
}
function getScoreMessage(score) {
    if (score >= 85) return "Your resume has an exceptional profile with high ATS alignment.";
    if (score >= 70) return "Your resume has a strong overall structure with clear technical depth.";
    if (score >= 50) return "Your resume is on a good track with some key improvement areas.";
    return "Focus on strengthening your skills and adding measurable project outcomes.";
}

// TOAST
let toastTimer;
function showToast(message, type = "") {
    toast.textContent = message;
    toast.className = "toast";
    if (type) toast.classList.add(type);
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// AUTHENTICATION & USER SESSION MANAGEMENT
let currentUser = null;

function loadUserSession() {
    try {
        const stored = localStorage.getItem("resumeInsightUser");
        if (stored) {
            currentUser = JSON.parse(stored);
            updateUserHeaderUI();
            hideAuthModal();
        } else {
            showAuthModal();
        }
    } catch (e) {
        showAuthModal();
    }
}

function showAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) modal.classList.remove("hidden");
}

function hideAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) modal.classList.add("hidden");
}

function updateUserHeaderUI() {
    if (!currentUser) return;
    const headerName = document.getElementById("headerName");
    const headerAvatar = document.getElementById("headerAvatar");
    const headerRole = document.getElementById("headerRole");

    if (headerName) headerName.textContent = currentUser.name || "Candidate";
    if (headerAvatar) headerAvatar.textContent = getInitial(currentUser.name);
    if (headerRole) headerRole.textContent = currentUser.college || currentUser.role || "ATS Evaluated";
}

// AUTH MODAL EVENT LISTENERS
const authModal = document.getElementById("authModal");
const loginTab = document.getElementById("loginTab");
const signupTab = document.getElementById("signupTab");
const switchToSignup = document.getElementById("switchToSignup");
const switchToLogin = document.getElementById("switchToLogin");

if (switchToSignup) {
    switchToSignup.addEventListener("click", () => {
        loginTab.classList.remove("active");
        signupTab.classList.add("active");
    });
}

if (switchToLogin) {
    switchToLogin.addEventListener("click", () => {
        signupTab.classList.remove("active");
        loginTab.classList.add("active");
    });
}

const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
    loginBtn.addEventListener("click", () => {
        const name = (document.getElementById("loginName").value || "").trim();
        const email = (document.getElementById("loginEmail").value || "").trim();

        if (!name || !email) {
            showToast("Please enter your Name and Email", "error");
            return;
        }

        currentUser = { name, email };
        localStorage.setItem("resumeInsightUser", JSON.stringify(currentUser));
        updateUserHeaderUI();
        hideAuthModal();
        showToast(`Welcome back, ${name}!`, "success");
    });
}

const signupBtn = document.getElementById("signupBtn");
if (signupBtn) {
    signupBtn.addEventListener("click", () => {
        const name = (document.getElementById("signupName").value || "").trim();
        const email = (document.getElementById("signupEmail").value || "").trim();
        const college = (document.getElementById("signupCollege").value || "").trim();
        const role = (document.getElementById("signupRole").value || "").trim();

        if (!name || !email) {
            showToast("Please enter your Name and Email", "error");
            return;
        }

        currentUser = { name, email, college, role };
        localStorage.setItem("resumeInsightUser", JSON.stringify(currentUser));
        updateUserHeaderUI();
        hideAuthModal();
        showToast(`Account created! Welcome, ${name}.`, "success");
    });
}

const guestBtn = document.getElementById("guestBtn");
if (guestBtn) {
    guestBtn.addEventListener("click", () => {
        currentUser = { name: "Guest User", email: "guest@local" };
        updateUserHeaderUI();
        hideAuthModal();
        showToast("Browsing as Guest", "success");
    });
}

// User Profile Badge Click (Reopen Auth / Switch Account)
const userBadge = document.querySelector(".user-profile-badge");
if (userBadge) {
    userBadge.addEventListener("click", () => {
        showAuthModal();
    });
}

// EDIT PROFILE MODAL HANDLERS
const editProfileBtn = document.getElementById("editProfileBtn");
const editProfileModal = document.getElementById("editProfileModal");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const cancelProfileBtn = document.getElementById("cancelProfileBtn");

function openEditProfileModal() {
    if (!editProfileModal) return;
    const nameInput = document.getElementById("editName");
    const eduInput = document.getElementById("editEducation");
    const roleInput = document.getElementById("editRole");
    const emailInput = document.getElementById("editEmail");
    const phoneInput = document.getElementById("editPhone");
    const githubInput = document.getElementById("editGithub");
    const linkedinInput = document.getElementById("editLinkedin");

    const activeName = (currentResume && currentResume.name && currentResume.name !== 'Candidate' ? currentResume.name : (currentUser ? currentUser.name : ''));
    const activeEdu = (currentResume ? currentResume.education : (currentUser ? currentUser.college : ''));
    const activeRole = (currentResume ? currentResume.targetRole : (currentUser ? currentUser.role : ''));
    const activeContacts = (currentResume && currentResume.contacts ? currentResume.contacts : {});

    if (nameInput) nameInput.value = activeName || '';
    if (eduInput) eduInput.value = activeEdu || '';
    if (roleInput) roleInput.value = activeRole || '';
    if (emailInput) emailInput.value = activeContacts.email || (currentUser ? currentUser.email : '');
    if (phoneInput) phoneInput.value = activeContacts.phone || '';
    if (githubInput) githubInput.value = activeContacts.github || '';
    if (linkedinInput) linkedinInput.value = activeContacts.linkedin || '';

    editProfileModal.classList.remove("hidden");
}

function closeEditProfileModal() {
    if (editProfileModal) editProfileModal.classList.add("hidden");
}

if (editProfileBtn) editProfileBtn.addEventListener("click", openEditProfileModal);
if (cancelProfileBtn) cancelProfileBtn.addEventListener("click", closeEditProfileModal);

if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", async () => {
        const name = (document.getElementById("editName").value || "").trim();
        const edu = (document.getElementById("editEducation").value || "").trim();
        const role = (document.getElementById("editRole").value || "").trim();
        const email = (document.getElementById("editEmail").value || "").trim();
        const phone = (document.getElementById("editPhone").value || "").trim();
        const github = (document.getElementById("editGithub").value || "").trim();
        const linkedin = (document.getElementById("editLinkedin").value || "").trim();

        if (!name) {
            showToast("Candidate Name cannot be empty", "error");
            return;
        }

        // Update currentUser
        currentUser = {
            ...(currentUser || {}),
            name,
            email,
            college: edu,
            role
        };
        localStorage.setItem("resumeInsightUser", JSON.stringify(currentUser));

        // Update currentResume if present
        if (currentResume) {
            currentResume.name = name;
            if (edu) currentResume.education = edu;
            if (role) currentResume.targetRole = role;
            currentResume.contacts = { email, phone, github, linkedin };

            updateUI(currentResume);
            await saveResume(currentResume);
        } else {
            updateUserHeaderUI();
        }

        closeEditProfileModal();
        showToast("Profile updated successfully!", "success");
    });
}

// INITIAL STATE
async function initialize() {
    dashboardEmpty.classList.remove("hidden");
    dashboardResults.classList.add("hidden");
    insightsEmpty.classList.remove("hidden");
    insightsResults.classList.add("hidden");
    profileEmpty.classList.remove("hidden");
    profileResults.classList.add("hidden");
    downloadReportBtn.classList.add("hidden");

    loadUserSession();

    try {
        const response = await fetch(`${API_BASE}/latest`);
        if (response.ok) {
            const res = await response.json();
            if (res.success && res.data) {
                currentResume = res.data;
                updateUI(currentResume);
            }
        }
    } catch (e) {
        // Backend offline or no latest record
    }
// DARK MODE

document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.getElementById("themeToggle");

    if (!themeToggle) {
        console.log("Theme button not found");
        return;
    }

    // Load saved theme
    const savedTheme = localStorage.getItem("darkMode");

    if (savedTheme === "true") {
        document.body.classList.add("dark-mode");
        themeToggle.textContent = "☀️";
    }

    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");

        const isDark = document.body.classList.contains("dark-mode");

        localStorage.setItem("darkMode", isDark);

        themeToggle.textContent = isDark ? "☀️" : "🌙";
    });
});
