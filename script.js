let selectedFile = null;
let currentResume = null;
let isAdmin = false;
let currentUser = null;

// API Base
const API_BASE = "/api/resumes";

// SKILL TAXONOMY
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
        "nest.js", "asp.net", "laravel", "ruby on rails", "graphql", "rest api", "restful",
        "grpc", "microservices"
    ],
    "AI / ML & Data": [
        "machine learning", "deep learning", "artificial intelligence", "nlp",
        "natural language processing", "computer vision", "opencv", "mediapipe",
        "tensorflow", "pytorch", "keras", "scikit-learn", "sklearn", "pandas",
        "numpy", "matplotlib", "seaborn", "hugging face", "huggingface",
        "langchain", "llm"
    ],
    "Cloud & DevOps": [
        "aws", "amazon web services", "azure", "gcp", "google cloud", "docker",
        "kubernetes", "terraform", "ansible", "jenkins", "git", "github", "gitlab",
        "ci/cd", "github actions", "linux", "unix", "nginx"
    ],
    "Databases": [
        "postgresql", "postgres", "mysql", "sqlite", "mongodb", "redis", "cassandra",
        "dynamodb", "elasticsearch", "supabase", "firebase", "mariadb", "prisma",
        "sequelize", "mongoose"
    ],
    "Tools & Concepts": [
        "object oriented programming", "oop", "data structures", "algorithms",
        "system design", "postman", "figma", "unit testing", "jest", "cypress",
        "agile", "scrum"
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
if (menuToggle) {
    menuToggle.addEventListener("click", () => {
        document.body.classList.add("sidebar-hidden");

        if (menuOpen) {
            menuOpen.classList.remove("hidden");
        }
    });
}

if (menuOpen) {
    menuOpen.addEventListener("click", () => {
        document.body.classList.remove("sidebar-hidden");
        menuOpen.classList.add("hidden");
    });
}

// NAVIGATION
navItems.forEach(button => {
    button.addEventListener("click", () => {
        const pageId = button.dataset.page;

        if (pageId) {
            showPage(pageId);
        }
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

    const activeButton = document.querySelector(
        `.nav-item[data-page="${pageId}"]`
    );

    if (activeButton) {
        activeButton.classList.add("active");
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// STUDENT / ADMIN MODE
function switchToStudentMode() {
    isAdmin = false;

    if (sidebar) {
        sidebar.classList.remove("admin-view");
    }

    if (studentMode) {
        studentMode.classList.add("active");
    }

    if (adminMode) {
        adminMode.classList.remove("active");
    }

    showPage("student-dashboard");
    closeProfileDropdown();
}

function switchToAdminMode() {
    isAdmin = true;

    if (sidebar) {
        sidebar.classList.add("admin-view");
    }

    if (adminMode) {
        adminMode.classList.add("active");
    }

    if (studentMode) {
        studentMode.classList.remove("active");
    }

    showPage("admin-dashboard");
    closeProfileDropdown();

    updateAdminDashboard();
}

if (studentMode) {
    studentMode.addEventListener("click", switchToStudentMode);
}

if (adminMode) {
    adminMode.addEventListener("click", switchToAdminMode);
}

// GO TO UPLOAD BUTTONS
document.querySelectorAll(".go-upload").forEach(button => {
    button.addEventListener("click", () => {
        showPage("resume");
    });
});

// PDF FILE SELECTION
if (resumeFile) {
    resumeFile.addEventListener("change", event => {
        const file = event.target.files[0];

        if (!file) return;

        handleFile(file);
    });
}

function handleFile(file) {
    if (uploadMessage) {
        uploadMessage.textContent = "";
    }

    if (file.type !== "application/pdf") {
        if (uploadMessage) {
            uploadMessage.textContent = "Please select a PDF file.";
        }

        return;
    }

    selectedFile = file;

    if (fileName) {
        fileName.textContent = file.name;
    }

    if (fileSize) {
        fileSize.textContent = formatFileSize(file.size);
    }

    if (fileSelected) {
        fileSelected.classList.remove("hidden");
    }

    if (removeFileBtn) {
        removeFileBtn.classList.remove("hidden");
    }

    if (analyzeBtn) {
        analyzeBtn.disabled = false;
    }

    showToast("Resume selected", "success");
}

// REMOVE FILE
if (removeFileBtn) {
    removeFileBtn.addEventListener("click", () => {
        selectedFile = null;

        if (resumeFile) {
            resumeFile.value = "";
        }

        if (fileSelected) {
            fileSelected.classList.add("hidden");
        }

        removeFileBtn.classList.add("hidden");

        if (analyzeBtn) {
            analyzeBtn.disabled = true;
        }

        if (uploadMessage) {
            uploadMessage.textContent = "";
        }
    });
}

function formatFileSize(bytes) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ANALYZE RESUME
if (analyzeBtn) {
    analyzeBtn.addEventListener("click", async () => {
        if (!selectedFile) return;

        analyzeBtn.disabled = true;
        analyzeBtn.textContent = "Analyzing...";

        if (uploadMessage) {
            uploadMessage.textContent = "";
        }

        try {
            const text = await extractPDFText(selectedFile);

            if (!text || text.trim().length < 20) {
                throw new Error(
                    "Could not extract enough text from this PDF."
                );
            }

            const targetRole = targetRoleInput
                ? targetRoleInput.value.trim()
                : "";

            const targetJD = targetJDInput
                ? targetJDInput.value.trim()
                : "";

            const data = analyzeResume(
                text,
                targetRole,
                targetJD
            );

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

            // AI CRITIQUE
            try {
                const aiRes = await fetch(
                    `${API_BASE}/ai-critique`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            name: currentResume.name,
                            text: currentResume.text,
                            skills: currentResume.skills,
                            targetRole: currentResume.targetRole,
                            targetJD: currentResume.targetJD,
                            scores: currentResume.scores,
                            missingSkills: currentResume.missingSkills
                        })
                    }
                );

                if (aiRes.ok) {
                    const aiJson = await aiRes.json();

                    if (aiJson.success && aiJson.data) {
                        currentResume.aiCritique = aiJson.data;
                    }
                }
            } catch (aiErr) {
                console.warn(
                    "AI critique endpoint unavailable:",
                    aiErr
                );
            }

            updateUI(currentResume);

            await saveResume(currentResume);

            showPage("student-dashboard");

            showToast(
                "Resume analyzed & saved successfully",
                "success"
            );
        } catch (error) {
            console.error(error);

            if (uploadMessage) {
                uploadMessage.textContent =
                    error.message ||
                    "Unable to analyze resume.";
            }

            showToast(
                "Resume analysis failed",
                "error"
            );
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = "Analyze Resume";
        }
    });
}

// PDF TEXT EXTRACTION
async function extractPDFText(file) {
    const pdfjsLib = await import(
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs"
    );

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
        data: arrayBuffer
    }).promise;

    let fullText = "";

    for (
        let pageNumber = 1;
        pageNumber <= pdf.numPages;
        pageNumber++
    ) {
        const page = await pdf.getPage(pageNumber);

        const content = await page.getTextContent();

        const pageText = content.items
            .map(item => item.str)
            .join(" ");

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

    const {
        skills,
        categorizedSkills,
        skillsCount
    } = getCategorizedSkills(cleanText);

    const projects = getProjects(text);
    const certifications = getCertifications(text);
    const achievements = getAchievements(text);

    const {
        jdMatchScore,
        matchedSkills,
        missingSkills
    } = matchJobDescription(
        cleanText,
        targetJD
    );

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

// NAME EXTRACTION
function getUniversalName(text) {
    const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    const ignoreList = [
        "RESUME",
        "CURRICULUM VITAE",
        "CV",
        "CONTACT",
        "EDUCATION",
        "SKILLS",
        "PROJECTS",
        "SUMMARY",
        "ABOUT ME",
        "PROFILE",
        "PAGE 1",
        "PAGE 2",
        "FRONTEND DEVELOPER",
        "FULL STACK DEVELOPER",
        "SOFTWARE ENGINEER",
        "AI ENTHUSIAST",
        "WORK EXPERIENCE",
        "TECHNICAL SKILLS",
        "CERTIFICATIONS",
        "ACHIEVEMENTS"
    ];

    for (
        let i = 0;
        i < Math.min(lines.length, 12);
        i++
    ) {
        let rawLine = lines[i];

        let cleaned = rawLine
            .replace(
                /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
                ""
            )
            .replace(
                /(?:https?:\/\/|www\.|github\.com|linkedin\.com)\S+/gi,
                ""
            )
            .replace(
                /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91[-.\s]?[6-9]\d{9}/g,
                ""
            )
            .replace(/[|:;()]/g, " ")
            .trim();

        if (!cleaned || cleaned.length < 3) {
            continue;
        }

        if (ignoreList.includes(cleaned.toUpperCase())) {
            continue;
        }

        let firstChunk = cleaned
            .split(/[-–•]/)[0]
            .trim();

        firstChunk = firstChunk
            .replace(
                /\s+(?:Frontend Developer|Backend Developer|Software Engineer|AI Enthusiast|Full Stack Developer|Developer|Engineer|Student|Candidate)$/i,
                ""
            )
            .trim();

        const words = firstChunk
            .split(/\s+/)
            .filter(Boolean);

        if (words.length >= 2 && words.length <= 4) {
            const isAllAlpha = words.every(word =>
                /^[A-Za-z.'-]+$/.test(word) &&
                word.length >= 2
            );

            if (isAllAlpha) {
                return words
                    .map(
                        word =>
                            word.charAt(0).toUpperCase() +
                            word.slice(1).toLowerCase()
                    )
                    .join(" ");
            }
        }
    }

    // EMAIL FALLBACK
    const emailMatch = text.match(
        /([a-zA-Z0-9._%+-]+)@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    );

    if (emailMatch) {
        const local = emailMatch[1]
            .replace(/[0-9]/g, " ")
            .replace(/[._-]/g, " ")
            .trim();

        const parts = local
            .split(/\s+/)
            .filter(part => part.length >= 2);

        if (parts.length >= 2) {
            return parts
                .map(
                    part =>
                        part.charAt(0).toUpperCase() +
                        part.slice(1).toLowerCase()
                )
                .join(" ");
        }
    }

    if (
        currentUser &&
        currentUser.name &&
        currentUser.name !== "Guest User"
    ) {
        return currentUser.name;
    }

    return "Candidate";
}

// CONTACT EXTRACTION
function getContacts(text) {
    const emailMatch = text.match(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    );

    const phoneMatch = text.match(
        /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+91[-.\s]?[6-9]\d{9}/
    );

    const githubMatch = text.match(
        /github\.com\/([a-zA-Z0-9_-]+)/i
    );

    const linkedinMatch = text.match(
        /linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i
    );

    return {
        email: emailMatch ? emailMatch[0] : null,
        phone: phoneMatch ? phoneMatch[0] : null,
        github: githubMatch
            ? `github.com/${githubMatch[1]}`
            : null,
        linkedin: linkedinMatch
            ? `linkedin.com/in/${linkedinMatch[1]}`
            : null
    };
}

// EDUCATION EXTRACTION
function getUniversalEducation(text) {
    const normalized = text
        .replace(/\s+/g, " ")
        .trim();

    const degreePatterns = [
        /(?:SRM Institute of Science and Technology|SRM University).*?(?:20\d\d\s*[-–]\s*20\d\d)?/i,

        /(?:Bachelor of Technology|Bachelor of Science|Bachelor of Engineering|B\.?\s*Tech|M\.?\s*Tech|B\.?\s*E|B\.?\s*S|M\.?\s*S|BCA|MCA|Ph\.?D).*?(?:Computer Science|Information Technology|Engineering|AI|Data Science)?.*?(?:20\d\d\s*[-–]\s*20\d\d)?/i,

        /(?:IIT|NIT|BITS|Delhi University|Mumbai University|Anna University|Vellore Institute|VIT|MIT|Stanford|University).*?(?:20\d\d\s*[-–]\s*20\d\d)?/i
    ];

    for (const pattern of degreePatterns) {
        const match = normalized.match(pattern);

        if (!match) continue;

        let education = match[0].trim();

        const stopWords = [
            "EXPERIENCE",
            "SKILLS",
            "PROJECTS",
            "CERTIFICATIONS",
            "ACHIEVEMENTS",
            "SUMMARY"
        ];

        for (const word of stopWords) {
            const index = education
                .toUpperCase()
                .indexOf(word);

            if (index > 0) {
                education = education.substring(
                    0,
                    index
                );
            }
        }

        if (education.length > 120) {
            education =
                education.substring(0, 120) +
                "...";
        }

        return education.trim();
    }

    return "No data available";
}

// SKILLS EXTRACTION
function getCategorizedSkills(text) {
    const categorized = {};
    const allFound = [];

    for (const [category, skillList] of Object.entries(
        SKILL_TAXONOMY
    )) {
        categorized[category] = [];

        for (const skill of skillList) {
            const regex = createSkillRegex(skill);

            if (regex.test(text)) {
                categorized[category].push(skill);

                if (!allFound.includes(skill)) {
                    allFound.push(skill);
                }
            }
        }
    }

    return {
        skills: allFound.length
            ? allFound.join(", ")
            : "No data available",

        categorizedSkills: categorized,

        skillsCount: allFound.length
    };
}

// BETTER SKILL REGEX
function createSkillRegex(skill) {
    return new RegExp(
        `(?<![a-zA-Z0-9])${escapeRegex(skill)}(?![a-zA-Z0-9])`,
        "i"
    );
}

// PROJECT EXTRACTION
function getProjects(text) {
    const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    const projects = [];

    let insideProjects = false;

    const sectionHeaders = [
        "education",
        "experience",
        "work experience",
        "skills",
        "technical skills",
        "certifications",
        "achievements",
        "awards",
        "summary",
        "profile",
        "contact"
    ];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (/^(projects|personal projects|academic projects|project experience)$/i.test(line)) {
            insideProjects = true;
            continue;
        }

        if (insideProjects) {
            const lower = line.toLowerCase();

            if (
                sectionHeaders.some(
                    header =>
                        lower === header ||
                        lower.startsWith(`${header}:`)
                )
            ) {
                break;
            }

            if (
                line.length >= 3 &&
                line.length <= 120
            ) {
                const cleaned = line
                    .replace(/^[•●▪◦*-]\s*/, "")
                    .trim();

                if (!cleaned) continue;

                const nextLine =
                    lines[i + 1] || "";

                const looksLikeTitle =
                    !/^[•●▪◦*-]/.test(line) &&
                    cleaned.length <= 100;

                if (looksLikeTitle) {
                    projects.push({
                        title: cleaned,
                        desc: nextLine.startsWith("•") ||
                            nextLine.startsWith("-")
                            ? nextLine.replace(
                                /^[•●▪◦*-]\s*/,
                                ""
                            )
                            : "",
                        tech: []
                    });
                }
            }
        }
    }

    return projects;
}

// CERTIFICATION EXTRACTION
function getCertifications(text) {
    const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    const certifications = [];

    let insideCertifications = false;

    for (const line of lines) {
        if (
            /^(certifications|certificates|certification)$/i.test(
                line
            )
        ) {
            insideCertifications = true;
            continue;
        }

        if (
            insideCertifications &&
            /^(projects|experience|work experience|skills|education|achievements|awards|summary)$/i.test(
                line
            )
        ) {
            break;
        }

        if (insideCertifications) {
            const cleaned = line
                .replace(/^[•●▪◦*-]\s*/, "")
                .trim();

            if (
                cleaned.length >= 4 &&
                cleaned.length <= 150
            ) {
                certifications.push(cleaned);
            }
        }
    }

    return certifications;
}

// ACHIEVEMENT EXTRACTION
function getAchievements(text) {
    const lines = text
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    const achievements = [];

    let insideAchievements = false;

    for (const line of lines) {
        if (
            /^(achievements|awards|honors|accomplishments)$/i.test(
                line
            )
        ) {
            insideAchievements = true;
            continue;
        }

        if (
            insideAchievements &&
            /^(projects|experience|work experience|skills|education|certifications|summary)$/i.test(
                line
            )
        ) {
            break;
        }

        if (insideAchievements) {
            const cleaned = line
                .replace(/^[•●▪◦*-]\s*/, "")
                .trim();

            if (
                cleaned.length >= 4 &&
                cleaned.length <= 180
            ) {
                achievements.push(cleaned);
            }
        }
    }

    return achievements;
}

// JOB DESCRIPTION MATCHER
function matchJobDescription(
    resumeText,
    jdText
) {
    if (
        !jdText ||
        jdText.trim().length < 5
    ) {
        return {
            jdMatchScore: null,
            matchedSkills: [],
            missingSkills: []
        };
    }

    const cleanJD = normalizeText(jdText);

    const jdSkills = [];

    for (const skillList of Object.values(
        SKILL_TAXONOMY
    )) {
        for (const skill of skillList) {
            const regex = createSkillRegex(skill);

            if (
                regex.test(cleanJD) &&
                !jdSkills.includes(skill)
            ) {
                jdSkills.push(skill);
            }
        }
    }

    if (!jdSkills.length) {
        return {
            jdMatchScore: 100,
            matchedSkills: [],
            missingSkills: []
        };
    }

    const matched = [];
    const missing = [];

    for (const skill of jdSkills) {
        const regex = createSkillRegex(skill);

        if (regex.test(resumeText)) {
            matched.push(skill);
        } else {
            missing.push(skill);
        }
    }

    const matchPercentage = Math.round(
        (matched.length / jdSkills.length) * 100
    );

    return {
        jdMatchScore: matchPercentage,
        matchedSkills: matched,
        missingSkills: missing
    };
}

// SCORING
function calculateScores(data) {
    const skillsScore = Math.min(
        20,
        Math.max(5, data.skillsCount * 2)
    );

    const projectCount = Array.isArray(data.projects)
        ? data.projects.length
        : 0;

    const certificationCount = Array.isArray(
        data.certifications
    )
        ? data.certifications.length
        : 0;

    const achievementCount = Array.isArray(
        data.achievements
    )
        ? data.achievements.length
        : 0;

    const projectsScore =
        projectCount > 0 ? Math.min(20, 10 + projectCount * 4) : 5;

    const certificationsScore =
        certificationCount > 0
            ? Math.min(15, 8 + certificationCount * 3)
            : 3;

    const achievementsScore =
        achievementCount > 0
            ? Math.min(15, 8 + achievementCount * 3)
            : 3;

    const qualityScore =
        data.text.length > 1200
            ? 14
            : data.text.length > 600
                ? 11
                : 7;

    const atsScore =
        data.text.length > 1000
            ? 14
            : data.text.length > 500
                ? 10
                : 7;

    const overall =
        skillsScore +
        projectsScore +
        certificationsScore +
        achievementsScore +
        qualityScore +
        atsScore;

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

// INSIGHTS
function calculateInsights(data) {
    const strengths = [];
    const improvements = [];
    const recommendations = [];

    const scores = data.scores || {};

    const skillCount = data.skills
        ? data.skills
            .split(",")
            .filter(Boolean)
            .length
        : 0;

    if (scores.skills >= 14) {
        strengths.push(
            `Strong technical coverage across ${skillCount} key technologies.`
        );
    } else {
        improvements.push(
            "Technical skill coverage can be strengthened."
        );

        recommendations.push(
            "Include relevant programming languages, frameworks and developer tools."
        );
    }

    if (scores.projects >= 15) {
        strengths.push(
            "Technical projects are present in the resume."
        );
    } else {
        improvements.push(
            "Project section could be strengthened with clearer details."
        );

        recommendations.push(
            "Add measurable outcomes, technologies used and your specific contribution to each project."
        );
    }

    if (Array.isArray(data.certifications) &&
        data.certifications.length > 0) {
        strengths.push(
            "Certifications detected."
        );
    } else {
        improvements.push(
            "No certifications detected."
        );

        recommendations.push(
            "Add relevant certifications if you have completed any."
        );
    }

    if (
        Array.isArray(data.achievements) &&
        data.achievements.length > 0
    ) {
        strengths.push(
            "Achievements and awards detected."
        );
    } else {
        improvements.push(
            "No achievements or awards detected."
        );

        recommendations.push(
            "Include hackathons, competitions, awards or other measurable achievements if applicable."
        );
    }

    if (
        data.jdMatchScore !== null &&
        data.jdMatchScore !== undefined
    ) {
        if (data.jdMatchScore >= 70) {
            strengths.push(
                `High target job keyword alignment (${data.jdMatchScore}% match).`
            );
        } else {
            improvements.push(
                `Target job keyword match is ${data.jdMatchScore}%.`
            );

            if (
                data.missingSkills &&
                data.missingSkills.length
            ) {
                recommendations.push(
                    `Consider adding relevant missing skills: ${data.missingSkills
                        .slice(0, 5)
                        .join(", ")}.`
                );
            }
        }
    }

    return {
        strengths: strengths.length
            ? strengths
            : ["Resume baseline evaluated."],

        improvements: improvements.length
            ? improvements
            : ["Minor resume polish may be beneficial."],

        recommendations: recommendations.length
            ? recommendations
            : ["Continue tailoring your resume to relevant roles."]
    };
}

// UPDATE UI
function updateUI(data) {
    if (dashboardEmpty) {
        dashboardEmpty.classList.add("hidden");
    }

    if (dashboardResults) {
        dashboardResults.classList.remove("hidden");
    }

    if (insightsEmpty) {
        insightsEmpty.classList.add("hidden");
    }

    if (insightsResults) {
        insightsResults.classList.remove("hidden");
    }

    if (profileEmpty) {
        profileEmpty.classList.add("hidden");
    }

    if (profileResults) {
        profileResults.classList.remove("hidden");
    }

    if (downloadReportBtn) {
        downloadReportBtn.classList.remove("hidden");
    }

    let displayName =
        data.name &&
            data.name !== "Not available" &&
            data.name !== "Candidate"
            ? data.name
            : currentUser &&
                currentUser.name &&
                currentUser.name !== "Guest User"
                ? currentUser.name
                : "Candidate";

    const resultName =
        document.getElementById("resultName");

    const resultEducation =
        document.getElementById("resultEducation");

    const resultTargetRole =
        document.getElementById("resultTargetRole");

    if (resultName) {
        resultName.textContent = displayName;
    }

    if (resultEducation) {
        resultEducation.textContent =
            data.education || "No data available";
    }

    if (resultTargetRole) {
        resultTargetRole.textContent =
            data.targetRole ||
            "Software Engineer";
    }

    // CONTACTS
    const contactsWrap =
        document.getElementById(
            "resultContacts"
        );

    if (contactsWrap) {
        contactsWrap.innerHTML = "";

        const contacts =
            data.contacts || {};

        let hasContacts = false;

        if (contacts.email) {
            contactsWrap.innerHTML += `
                <a href="mailto:${escapeHTML(
                contacts.email
            )}" class="contact-pill">
                    ✉ ${escapeHTML(contacts.email)}
                </a>
            `;

            hasContacts = true;
        }

        if (contacts.phone) {
            contactsWrap.innerHTML += `
                <span class="contact-pill">
                    📞 ${escapeHTML(contacts.phone)}
                </span>
            `;

            hasContacts = true;
        }

        if (contacts.github) {
            contactsWrap.innerHTML += `
                <span class="contact-pill">
                    ⚡ ${escapeHTML(contacts.github)}
                </span>
            `;

            hasContacts = true;
        }

        if (contacts.linkedin) {
            contactsWrap.innerHTML += `
                <span class="contact-pill">
                    💼 ${escapeHTML(contacts.linkedin)}
                </span>
            `;

            hasContacts = true;
        }

        if (!hasContacts) {
            contactsWrap.innerHTML = `
                <span style="color:var(--muted);font-size:12px;">
                    No data available
                </span>
            `;
        }
    }

    // OVERALL SCORE
    const overall =
        data.scores
            ? data.scores.overall
            : data.score || 0;

    const overallScore =
        document.getElementById(
            "overallScore"
        );

    const scoreStatus =
        document.getElementById(
            "scoreStatus"
        );

    const scoreMessage =
        document.getElementById(
            "scoreMessage"
        );

    if (overallScore) {
        overallScore.textContent = overall;
    }

    if (scoreStatus) {
        scoreStatus.textContent =
            data.scoreStatus ||
            getScoreStatus(overall);
    }

    if (scoreMessage) {
        scoreMessage.textContent =
            data.scoreMessage ||
            getScoreMessage(overall);
    }

    const overallScoreBar =
        document.getElementById(
            "overallScoreBar"
        );

    if (overallScoreBar) {
        overallScoreBar.style.width =
            `${Math.min(
                100,
                Math.max(5, overall)
            )}%`;
    }

    // JOB MATCH
    const jdScoreNumber =
        document.getElementById(
            "jdScoreNumber"
        );

    const jdScoreStatus =
        document.getElementById(
            "jdScoreStatus"
        );

    const jdScoreMessage =
        document.getElementById(
            "jdScoreMessage"
        );

    const jdScoreBar =
        document.getElementById(
            "jdScoreBar"
        );

    if (
        data.jdMatchScore !== null &&
        data.jdMatchScore !== undefined
    ) {
        if (jdScoreNumber) {
            jdScoreNumber.textContent =
                `${data.jdMatchScore}%`;
        }

        if (jdScoreStatus) {
            jdScoreStatus.textContent =
                data.jdMatchScore >= 75
                    ? "High Fit"
                    : data.jdMatchScore >= 50
                        ? "Moderate Fit"
                        : "Low Fit";
        }

        if (jdScoreMessage) {
            jdScoreMessage.textContent =
                `Matched against target role: ${data.targetRole || "Job Posting"}`;
        }

        if (jdScoreBar) {
            jdScoreBar.style.width =
                `${data.jdMatchScore}%`;
        }
    } else {
        if (jdScoreNumber) {
            jdScoreNumber.textContent = "—";
        }

        if (jdScoreStatus) {
            jdScoreStatus.textContent =
                "No JD Specified";
        }

        if (jdScoreMessage) {
            jdScoreMessage.textContent =
                "Paste a target Job Description to evaluate match.";
        }

        if (jdScoreBar) {
            jdScoreBar.style.width = "0%";
        }
    }

    // SYNC DASHBOARD JD
    const dashTargetRole =
        document.getElementById(
            "dashTargetRole"
        );

    const dashTargetJD =
        document.getElementById(
            "dashTargetJD"
        );

    if (
        dashTargetRole &&
        data.targetRole
    ) {
        dashTargetRole.value =
            data.targetRole;
    }

    if (
        dashTargetJD &&
        data.targetJD
    ) {
        dashTargetJD.value =
            data.targetJD;
    }

    // PROJECTS
    const projectsList =
        document.getElementById(
            "projectsList"
        );

    const projectsCountPill =
        document.getElementById(
            "projectsCountPill"
        );

    if (projectsList) {
        projectsList.innerHTML = "";

        const projects =
            Array.isArray(data.projects)
                ? data.projects
                : [];

        if (projectsCountPill) {
            projectsCountPill.textContent =
                `${projects.length} Projects`;
        }

        if (projects.length) {
            projects.forEach(project => {
                const card =
                    document.createElement(
                        "div"
                    );

                card.className =
                    "project-card";

                const techTags =
                    Array.isArray(project.tech)
                        ? project.tech
                            .map(
                                tech =>
                                    `<span class="project-tag">${escapeHTML(
                                        tech
                                    )}</span>`
                            )
                            .join("")
                        : "";

                card.innerHTML = `
                    <div class="project-card-header">
                        <span class="project-icon">📂</span>
                        <h4>${escapeHTML(
                    project.title ||
                    "Project"
                )}</h4>
                    </div>

                    ${project.desc
                        ? `<p class="project-desc">${escapeHTML(
                            project.desc
                        )}</p>`
                        : ""
                    }

                    ${techTags
                        ? `<div class="project-tags-wrap">${techTags}</div>`
                        : ""
                    }
                `;

                projectsList.appendChild(card);
            });
        } else {
            projectsList.innerHTML = `
                <p style="color:var(--muted);font-size:13px;">
                    No data available
                </p>
            `;
        }
    }

    // CERTIFICATIONS
    const certList =
        document.getElementById(
            "certificationsList"
        );

    if (certList) {
        certList.innerHTML = "";

        const certs =
            Array.isArray(data.certifications)
                ? data.certifications
                : [];

        if (certs.length) {
            certs.forEach(cert => {
                certList.innerHTML += `
                    <div class="item-pill">
                        📜 ${escapeHTML(cert)}
                    </div>
                `;
            });
        } else {
            certList.innerHTML = `
                <p style="color:var(--muted);font-size:13px;">
                    No data available
                </p>
            `;
        }
    }

    // ACHIEVEMENTS
    const achieveList =
        document.getElementById(
            "achievementsList"
        );

    if (achieveList) {
        achieveList.innerHTML = "";

        const achievements =
            Array.isArray(data.achievements)
                ? data.achievements
                : [];

        if (achievements.length) {
            achievements.forEach(
                achievement => {
                    achieveList.innerHTML += `
                        <div class="item-pill">
                            🏅 ${escapeHTML(
                        achievement
                    )}
                        </div>
                    `;
                }
            );
        } else {
            achieveList.innerHTML = `
                <p style="color:var(--muted);font-size:13px;">
                    No data available
                </p>
            `;
        }
    }

    // SKILLS
    renderSkillsTaxonomy(data);

    // CATEGORY SCORES
    const scores =
        data.scores || {};

    setText(
        "skillsScore",
        `${scores.skills || 0}/20`
    );

    setText(
        "projectsScore",
        `${scores.projects || 0}/20`
    );

    setText(
        "certificationsScore",
        `${scores.certifications || 0}/15`
    );

    setText(
        "achievementsScore",
        `${scores.achievements || 0}/15`
    );

    setText(
        "qualityScore",
        `${scores.quality || 0}/15`
    );

    setText(
        "atsScore",
        `${scores.ats || 0}/15`
    );

    setBarWidth(
        "skillsBar",
        scores.skills || 0,
        20
    );

    setBarWidth(
        "projectsBar",
        scores.projects || 0,
        20
    );

    setBarWidth(
        "certificationsBar",
        scores.certifications || 0,
        15
    );

    setBarWidth(
        "achievementsBar",
        scores.achievements || 0,
        15
    );

    setBarWidth(
        "qualityBar",
        scores.quality || 0,
        15
    );

    setBarWidth(
        "atsBar",
        scores.ats || 0,
        15
    );

    setText(
        "skillsFeedback",
        scores.skills >= 15
            ? "Strong technical breadth."
            : "Broaden technical skill coverage."
    );

    setText(
        "projectsFeedback",
        scores.projects >= 15
            ? "Projects detected."
            : "Add detailed project bullet points."
    );

    setText(
        "certificationsFeedback",
        Array.isArray(data.certifications) &&
            data.certifications.length
            ? "Certifications detected."
            : "No certifications detected."
    );

    setText(
        "achievementsFeedback",
        Array.isArray(data.achievements) &&
            data.achievements.length
            ? "Achievements detected."
            : "No achievements detected."
    );

    setText(
        "qualityFeedback",
        "Formatting and content density evaluated."
    );

    setText(
        "atsFeedback",
        "ATS keyword parsing readiness evaluated."
    );

    // PROFILE / HEADER
    setText(
        "headerName",
        displayName
    );

    setText(
        "headerAvatar",
        data.avatar ||
        getInitial(displayName)
    );

    setText(
        "profileName",
        displayName
    );

    setText(
        "profileEducation",
        data.education ||
        "No data available"
    );

    setText(
        "profileSkills",
        data.skills ||
        "No data available"
    );

    const profileProjects =
        document.getElementById(
            "profileProjects"
        );

    if (profileProjects) {
        if (
            Array.isArray(data.projects) &&
            data.projects.length
        ) {
            profileProjects.textContent =
                data.projects
                    .map(
                        project =>
                            project.title
                    )
                    .join(", ");
        } else {
            profileProjects.textContent =
                "No data available";
        }
    }

    setText(
        "profileAvatar",
        data.avatar ||
        getInitial(displayName)
    );

    updateInsights(data);
    updateAICritiqueUI(data);
    updateKeywordGapUI(data);
    renderLiveDashboardGap(data);
}

// SKILL TAXONOMY UI
function renderSkillsTaxonomy(data) {
    const grid =
        document.getElementById(
            "skillsTaxGrid"
        );

    const countPill =
        document.getElementById(
            "skillsCountPill"
        );

    if (!grid) return;

    grid.innerHTML = "";

    const categorized =
        data.categorizedSkills ||
        categorizeSkillsString(
            data.skills
        );

    let totalCount = 0;

    for (
        const [
            category,
            skillsList
        ] of Object.entries(categorized)
    ) {
        if (
            skillsList &&
            skillsList.length
        ) {
            totalCount +=
                skillsList.length;

            const categoryDiv =
                document.createElement(
                    "div"
                );

            categoryDiv.className =
                "skill-tax-category";

            categoryDiv.innerHTML = `
                <h4>
                    ${escapeHTML(category)}
                    (${skillsList.length})
                </h4>

                <div class="skill-badges-wrap">
                    ${skillsList
                        .map(
                            skill =>
                                `<span class="skill-badge">${escapeHTML(
                                    skill
                                )}</span>`
                        )
                        .join("")
                    }
                </div>
            `;

            grid.appendChild(
                categoryDiv
            );
        }
    }

    if (countPill) {
        countPill.textContent =
            `${totalCount} Skills Found`;
    }

    if (!totalCount) {
        grid.innerHTML = `
            <p style="color:var(--muted);font-size:13px;padding:8px;">
                No data available
            </p>
        `;
    }
}

function categorizeSkillsString(
    skillsStr
) {
    if (
        !skillsStr ||
        skillsStr === "No data available"
    ) {
        return {};
    }

    const cleanText =
        skillsStr.toLowerCase();

    const result = {};

    for (
        const [
            category,
            list
        ] of Object.entries(
            SKILL_TAXONOMY
        )
    ) {
        result[category] =
            list.filter(skill =>
                createSkillRegex(
                    skill
                ).test(cleanText)
            );
    }

    return result;
}

// AI CRITIQUE UI
function updateAICritiqueUI(data) {
    const critique =
        data.aiCritique;

    const summaryText =
        document.getElementById(
            "aiSummaryText"
        );

    const rewritesList =
        document.getElementById(
            "aiRewritesList"
        );

    const sourceTag =
        document.getElementById(
            "aiSourceTag"
        );

    if (!critique) {
        if (summaryText) {
            summaryText.textContent =
                `Evaluation for ${data.name || "candidate"} targeting ${data.targetRole || "Software Engineer"}.`;
        }

        if (rewritesList) {
            rewritesList.innerHTML = `
                <p style="color:#cbd5e1;font-size:12px;">
                    AI suggestions will appear after analysis.
                </p>
            `;
        }

        return;
    }

    if (
        sourceTag &&
        critique.source
    ) {
        sourceTag.textContent =
            `Powered by ${critique.source}`;
    }

    if (summaryText) {
        summaryText.textContent =
            critique.summary ||
            "Candidate profile evaluated for ATS readiness and target role alignment.";
    }

    if (rewritesList) {
        rewritesList.innerHTML = "";

        if (
            Array.isArray(
                critique.bulletRewrites
            )
        ) {
            critique.bulletRewrites.forEach(
                item => {
                    const div =
                        document.createElement(
                            "div"
                        );

                    div.className =
                        "ai-rewrite-item";

                    div.innerHTML = `
                        <div class="before">
                            ❌
                            <span>${escapeHTML(
                        item.before ||
                        ""
                    )}</span>
                        </div>

                        <div class="after">
                            ✔️
                            <span>${escapeHTML(
                        item.after ||
                        ""
                    )}</span>
                        </div>

                        <div class="reason">
                            💡
                            ${escapeHTML(
                        item.reason ||
                        ""
                    )}
                        </div>
                    `;

                    rewritesList.appendChild(
                        div
                    );
                }
            );
        }
    }
}

// KEYWORD GAP UI
function updateKeywordGapUI(data) {
    const card =
        document.getElementById(
            "keywordGapCard"
        );

    const gapScoreBadge =
        document.getElementById(
            "gapScoreBadge"
        );

    const matchedChips =
        document.getElementById(
            "matchedChips"
        );

    const missingChips =
        document.getElementById(
            "missingChips"
        );

    if (
        !card ||
        !matchedChips ||
        !missingChips
    ) {
        return;
    }

    matchedChips.innerHTML = "";
    missingChips.innerHTML = "";

    if (
        data.jdMatchScore === null ||
        data.jdMatchScore === undefined
    ) {
        card.classList.add("hidden");
        return;
    }

    card.classList.remove("hidden");

    if (gapScoreBadge) {
        gapScoreBadge.textContent =
            `${data.jdMatchScore}% Matched`;
    }

    const matched =
        data.matchedSkills || [];

    const missing =
        data.missingSkills || [];

    if (!matched.length) {
        matchedChips.innerHTML = `
            <span style="font-size:12px;color:var(--muted);">
                No matching target keywords found.
            </span>
        `;
    } else {
        matched.forEach(skill => {
            const chip =
                document.createElement(
                    "span"
                );

            chip.className =
                "chip success";

            chip.textContent =
                `✔ ${skill}`;

            matchedChips.appendChild(
                chip
            );
        });
    }

    if (!missing.length) {
        missingChips.innerHTML = `
            <span style="font-size:12px;color:var(--green);">
                Awesome! All target keywords detected.
            </span>
        `;
    } else {
        missing.forEach(skill => {
            const chip =
                document.createElement(
                    "span"
                );

            chip.className =
                "chip danger";

            chip.textContent =
                `+ ${skill}`;

            missingChips.appendChild(
                chip
            );
        });
    }
}

// INSIGHTS UI
function updateInsights(data) {
    const strengthList =
        document.getElementById(
            "strengthList"
        );

    const improvementList =
        document.getElementById(
            "improvementList"
        );

    const recommendationList =
        document.getElementById(
            "recommendationList"
        );

    if (!strengthList ||
        !improvementList ||
        !recommendationList) {
        return;
    }

    strengthList.innerHTML = "";
    improvementList.innerHTML = "";
    recommendationList.innerHTML = "";

    const insights =
        data.strengths &&
            data.improvements &&
            data.recommendations
            ? data
            : calculateInsights(data);

    renderList(
        strengthList,
        insights.strengths
    );

    renderList(
        improvementList,
        insights.improvements
    );

    insights.recommendations.forEach(
        item => {
            const div =
                document.createElement(
                    "div"
                );

            div.className =
                "recommendation";

            div.textContent = item;

            recommendationList.appendChild(
                div
            );
        }
    );
}

// LIVE DASHBOARD GAP
function renderLiveDashboardGap(data) {
    const gapCard =
        document.getElementById(
            "liveGapResults"
        );

    const matchedContainer =
        document.getElementById(
            "dashMatchedChips"
        );

    const missingContainer =
        document.getElementById(
            "dashMissingChips"
        );

    const matchedCount =
        document.getElementById(
            "liveMatchedCount"
        );

    const missingCount =
        document.getElementById(
            "liveMissingCount"
        );

    if (
        !gapCard ||
        !matchedContainer ||
        !missingContainer
    ) {
        return;
    }

    if (
        data.jdMatchScore === null ||
        data.jdMatchScore === undefined
    ) {
        gapCard.classList.add("hidden");
        return;
    }

    gapCard.classList.remove("hidden");

    const matched =
        data.matchedSkills || [];

    const missing =
        data.missingSkills || [];

    if (matchedCount) {
        matchedCount.textContent =
            matched.length;
    }

    if (missingCount) {
        missingCount.textContent =
            missing.length;
    }

    matchedContainer.innerHTML = "";
    missingContainer.innerHTML = "";

    if (!matched.length) {
        matchedContainer.innerHTML = `
            <span style="font-size:12px;color:var(--muted);">
                No matching target skills found in resume.
            </span>
        `;
    } else {
        matched.forEach(skill => {
            const chip =
                document.createElement(
                    "span"
                );

            chip.className =
                "chip success";

            chip.textContent =
                `✔ ${skill}`;

            matchedContainer.appendChild(
                chip
            );
        });
    }

    if (!missing.length) {
        missingContainer.innerHTML = `
            <span style="font-size:12px;color:var(--green);font-weight:600;">
                Perfect Match! All target skills detected.
            </span>
        `;
    } else {
        missing.forEach(skill => {
            const chip =
                document.createElement(
                    "span"
                );

            chip.className =
                "chip danger";

            chip.textContent =
                `+ ${skill}`;

            missingContainer.appendChild(
                chip
            );
        });
    }
}

// LIVE JOB MATCH
const liveMatchBtn =
    document.getElementById(
        "liveMatchBtn"
    );

if (liveMatchBtn) {
    liveMatchBtn.addEventListener(
        "click",
        async () => {
            if (
                !currentResume ||
                !currentResume.text
            ) {
                showToast(
                    "Please upload and analyze a resume first",
                    "error"
                );

                return;
            }

            const roleInput =
                document.getElementById(
                    "dashTargetRole"
                );

            const jdInput =
                document.getElementById(
                    "dashTargetJD"
                );

            const role =
                roleInput
                    ? roleInput.value.trim()
                    : "";

            const jd =
                jdInput
                    ? jdInput.value.trim()
                    : "";

            if (!jd) {
                showToast(
                    "Please enter or paste a target Job Description",
                    "error"
                );

                return;
            }

            liveMatchBtn.disabled = true;
            liveMatchBtn.textContent =
                "Matching...";

            try {
                const result =
                    matchJobDescription(
                        currentResume.text,
                        jd
                    );

                currentResume.targetRole =
                    role ||
                    currentResume.targetRole ||
                    "Software Engineer";

                currentResume.targetJD =
                    jd;

                currentResume.jdMatchScore =
                    result.jdMatchScore;

                currentResume.matchedSkills =
                    result.matchedSkills;

                currentResume.missingSkills =
                    result.missingSkills;

                const insights =
                    calculateInsights(
                        currentResume
                    );

                currentResume.strengths =
                    insights.strengths;

                currentResume.improvements =
                    insights.improvements;

                currentResume.recommendations =
                    insights.recommendations;

                updateUI(currentResume);

                await saveResume(
                    currentResume
                );

                showToast(
                    `Target Job Evaluated: ${result.jdMatchScore}% Fit!`,
                    "success"
                );
            } catch (error) {
                console.error(
                    "Live match failed:",
                    error
                );

                showToast(
                    "Failed to match Job Description",
                    "error"
                );
            } finally {
                liveMatchBtn.disabled = false;

                liveMatchBtn.textContent =
                    "⚡ Evaluate Job Match Now";
            }
        }
    );
}

// DASHBOARD PRESETS
document
    .querySelectorAll(
        ".preset-btn:not(.upload-preset)"
    )
    .forEach(btn => {
        btn.addEventListener(
            "click",
            () => {
                const role =
                    btn.dataset.role || "";

                const jd =
                    btn.dataset.jd || "";

                const dashRole =
                    document.getElementById(
                        "dashTargetRole"
                    );

                const dashJD =
                    document.getElementById(
                        "dashTargetJD"
                    );

                if (dashRole) {
                    dashRole.value = role;
                }

                if (dashJD) {
                    dashJD.value = jd;
                }

                if (
                    liveMatchBtn &&
                    currentResume
                ) {
                    liveMatchBtn.click();
                } else {
                    showToast(
                        `Loaded preset: ${role}. Upload a resume to match!`,
                        "success"
                    );
                }
            }
        );
    });

// UPLOAD PRESETS
document
    .querySelectorAll(
        ".upload-preset"
    )
    .forEach(btn => {
        btn.addEventListener(
            "click",
            () => {
                const role =
                    btn.dataset.role || "";

                const jd =
                    btn.dataset.jd || "";

                if (targetRoleInput) {
                    targetRoleInput.value =
                        role;
                }

                if (targetJDInput) {
                    targetJDInput.value =
                        jd;
                }

                showToast(
                    `Loaded preset: ${role}`,
                    "success"
                );
            }
        );
    });

// DOWNLOAD REPORT
if (downloadReportBtn) {
    downloadReportBtn.addEventListener(
        "click",
        async () => {
            if (!currentResume) {
                showToast(
                    "No analyzed resume to download",
                    "error"
                );

                return;
            }

            showToast(
                "Generating PDF report...",
                "success"
            );

            const reportEl =
                document.getElementById(
                    "printableReport"
                );

            if (!reportEl) {
                showToast(
                    "Report area not found",
                    "error"
                );

                return;
            }

            const scores =
                currentResume.scores || {};

            const projects =
                Array.isArray(
                    currentResume.projects
                )
                    ? currentResume.projects
                        .map(
                            p => p.title
                        )
                        .join(", ")
                    : "No data available";

            reportEl.innerHTML = `
                <div class="report-header">
                    <div class="report-title">
                        <h1>
                            Resume Insight & ATS Audit Report
                        </h1>

                        <p>
                            Candidate:
                            <strong>
                                ${escapeHTML(
                currentResume.name ||
                "Student"
            )}
                            </strong>
                            |
                            Target:
                            <strong>
                                ${escapeHTML(
                currentResume.targetRole ||
                "Software Engineer"
            )}
                            </strong>
                        </p>

                        <p style="font-size:12px;color:#64748b;">
                            Generated on
                            ${new Date().toLocaleDateString()}
                            |
                            File:
                            ${escapeHTML(
                currentResume.fileName ||
                "resume.pdf"
            )}
                        </p>
                    </div>

                    <div class="report-score-box">
                        <div class="score-val">
                            ${scores.overall || 0}/100
                        </div>

                        <div style="font-weight:600;color:#0f172a;">
                            ${escapeHTML(
                currentResume.scoreStatus ||
                "Analyzed"
            )}
                        </div>

                        ${currentResume.jdMatchScore !== null &&
                    currentResume.jdMatchScore !== undefined
                    ? `
                            <div style="font-size:12px;color:var(--teal);">
                                Job Match:
                                ${currentResume.jdMatchScore}%
                            </div>
                        `
                    : ""
                }
                    </div>
                </div>

                <div class="report-section">
                    <h3>
                        Candidate Information
                    </h3>

                    <p>
                        <strong>Education:</strong>
                        ${escapeHTML(
                    currentResume.education ||
                    "No data available"
                )}
                    </p>

                    <p>
                        <strong>Detected Skills:</strong>
                        ${escapeHTML(
                    currentResume.skills ||
                    "No data available"
                )}
                    </p>

                    <p>
                        <strong>Projects:</strong>
                        ${escapeHTML(
                    projects
                )}
                    </p>
                </div>

                <div class="report-section">
                    <h3>
                        Category Breakdown
                    </h3>

                    <table style="width:100%;border-collapse:collapse;margin-top:8px;">
                        <tr style="background:#f1f5f9;text-align:left;">
                            <th style="padding:6px;border:1px solid #cbd5e1;">
                                Category
                            </th>

                            <th style="padding:6px;border:1px solid #cbd5e1;">
                                Score
                            </th>
                        </tr>

                        <tr>
                            <td style="padding:6px;border:1px solid #cbd5e1;">
                                Technical Skills
                            </td>

                            <td style="padding:6px;border:1px solid #cbd5e1;">
                                ${scores.skills || 0}/20
                            </td>
                        </tr>

                        <tr>
                            <td style="padding:6px;border:1px solid #cbd5e1;">
                                Projects Depth
                            </td>

                            <td style="padding:6px;border:1px solid #cbd5e1;">
                                ${scores.projects || 0}/20
                            </td>
                        </tr>

                        <tr>
                            <td style="padding:6px;border:1px solid #cbd5e1;">
                                Certifications
                            </td>

                            <td style="padding:6px;border:1px solid #cbd5e1;">
                                ${scores.certifications || 0}/15
                            </td>
                        </tr>

                        <tr>
                            <td style="padding:6px;border:1px solid #cbd5e1;">
                                Achievements & Awards
                            </td>

                            <td style="padding:6px;border:1px solid #cbd5e1;">
                                ${scores.achievements || 0}/15
                            </td>
                        </tr>

                        <tr>
                            <td style="padding:6px;border:1px solid #cbd5e1;">
                                Resume Structure & Impact
                            </td>

                            <td style="padding:6px;border:1px solid #cbd5e1;">
                                ${scores.quality || 0}/15
                            </td>
                        </tr>

                        <tr>
                            <td style="padding:6px;border:1px solid #cbd5e1;">
                                ATS Keyword Readiness
                            </td>

                            <td style="padding:6px;border:1px solid #cbd5e1;">
                                ${scores.ats || 0}/15
                            </td>
                        </tr>
                    </table>
                </div>

                <div class="report-section">
                    <h3>
                        Strengths & Key Highlights
                    </h3>

                    <ul>
                        ${(currentResume.strengths || [])
                    .map(
                        s =>
                            `<li>${escapeHTML(
                                s
                            )}</li>`
                    )
                    .join("")}
                    </ul>
                </div>

                <div class="report-section">
                    <h3>
                        Recommendations & Next Steps
                    </h3>

                    <ul>
                        ${(currentResume.recommendations || [])
                    .map(
                        r =>
                            `<li>${escapeHTML(
                                r
                            )}</li>`
                    )
                    .join("")}
                    </ul>
                </div>
            `;

            reportEl.classList.remove(
                "hidden"
            );

            if (window.html2pdf) {
                const options = {
                    margin: 10,

                    filename:
                        `${(
                            currentResume.name ||
                            "Candidate"
                        ).replace(
                            /\s+/g,
                            "_"
                        )}_Resume_Insight_Report.pdf`,

                    image: {
                        type: "jpeg",
                        quality: 0.98
                    },

                    html2canvas: {
                        scale: 2
                    },

                    jsPDF: {
                        unit: "mm",
                        format: "a4",
                        orientation: "portrait"
                    }
                };

                try {
                    await window
                        .html2pdf()
                        .set(options)
                        .from(reportEl)
                        .save();

                    reportEl.classList.add(
                        "hidden"
                    );

                    showToast(
                        "Report PDF downloaded successfully!",
                        "success"
                    );
                } catch (error) {
                    console.error(error);

                    window.print();

                    reportEl.classList.add(
                        "hidden"
                    );
                }
            } else {
                window.print();

                reportEl.classList.add(
                    "hidden"
                );
            }
        }
    );
}

// LOCAL STORAGE
function getLocalResumes() {
    try {
        return (
            JSON.parse(
                localStorage.getItem(
                    "resumeInsightData"
                )
            ) || []
        );
    } catch {
        return [];
    }
}

function saveLocalResume(data) {
    const records =
        getLocalResumes();

    const record = {
        id:
            data.id ||
            `${data.fileName || "resume"}-${Date.now()}`,

        name:
            data.name ||
            "Anonymous",

        education:
            data.education ||
            "No data available",

        skills:
            data.skills ||
            "No data available",

        projects:
            data.projects || [],

        certifications:
            data.certifications || [],

        achievements:
            data.achievements || [],

        score:
            data.scores
                ? data.scores.overall
                : data.score || 0,

        scores:
            data.scores || {},

        jdScore:
            data.jdMatchScore !== undefined
                ? data.jdMatchScore
                : null,

        fileName:
            data.fileName ||
            "resume.pdf",

        status:
            data.status ||
            "Analyzed",

        targetRole:
            data.targetRole ||
            "Software Engineer",

        targetJD:
            data.targetJD || "",

        updatedAt:
            new Date().toISOString()
    };

    const existingIndex =
        records.findIndex(
            item =>
                item.id === record.id ||
                (
                    item.fileName ===
                    record.fileName &&
                    item.name ===
                    record.name
                )
        );

    if (existingIndex >= 0) {
        records[existingIndex] =
            record;
    } else {
        records.push(record);
    }

    localStorage.setItem(
        "resumeInsightData",
        JSON.stringify(records)
    );
}

// FETCH ALL RESUMES
async function fetchAllResumes() {
    try {
        const response =
            await fetch(API_BASE);

        if (response.ok) {
            const result =
                await response.json();

            if (
                result.success &&
                Array.isArray(
                    result.data
                )
            ) {
                localStorage.setItem(
                    "resumeInsightData",
                    JSON.stringify(
                        result.data
                    )
                );

                return result.data;
            }
        }
    } catch (error) {
        console.warn(
            "Backend API unavailable. Using localStorage:",
            error.message
        );
    }

    return getLocalResumes();
}

// SAVE RESUME
async function saveResume(data) {
    try {
        const response =
            await fetch(API_BASE, {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(data)
            });

        if (response.ok) {
            const result =
                await response.json();

            if (result.success) {
                saveLocalResume(
                    result.data ||
                    data
                );

                await updateAdminDashboard();

                return (
                    result.data ||
                    data
                );
            }
        }
    } catch (error) {
        console.warn(
            "Backend unavailable. Saving locally:",
            error.message
        );
    }

    saveLocalResume(data);

    await updateAdminDashboard();

    return data;
}

// ADMIN DASHBOARD
async function updateAdminDashboard() {
    const records =
        await fetchAllResumes();

    const analyzed =
        records.filter(
            item =>
                item.status ===
                "Analyzed"
        );

    const students =
        document.getElementById(
            "adminStudents"
        );

    const uploaded =
        document.getElementById(
            "adminUploaded"
        );

    const analyzedElement =
        document.getElementById(
            "adminAnalyzed"
        );

    const averageElement =
        document.getElementById(
            "adminAverage"
        );

    if (students) {
        students.textContent =
            records.length;
    }

    if (uploaded) {
        uploaded.textContent =
            records.length;
    }

    if (analyzedElement) {
        analyzedElement.textContent =
            analyzed.length;
    }

    if (analyzed.length) {
        const average =
            analyzed.reduce(
                (sum, item) =>
                    sum +
                    Number(
                        item.score ||
                        (
                            item.scores &&
                            item.scores.overall
                        ) ||
                        0
                    ),
                0
            ) / analyzed.length;

        if (averageElement) {
            averageElement.textContent =
                Math.round(average);
        }
    } else {
        if (averageElement) {
            averageElement.textContent =
                "—";
        }
    }

    renderAdminRows(records);
    renderStudentRows(records);
    renderLeaderboard(records);
}

// GENERIC LIST
function renderList(
    element,
    items
) {
    if (!element) return;

    if (!Array.isArray(items)) {
        return;
    }

    items.forEach(item => {
        const li =
            document.createElement(
                "li"
            );

        li.textContent = item;

        element.appendChild(li);
    });
}

// ADMIN TABLE
function renderAdminRows(records) {
    const empty =
        document.getElementById(
            "adminRecentEmpty"
        );

    const table =
        document.getElementById(
            "adminRecentTableWrapper"
        );

    const rows =
        document.getElementById(
            "adminRows"
        );

    if (!rows) return;

    rows.innerHTML = "";

    if (!records.length) {
        if (empty) {
            empty.classList.remove(
                "hidden"
            );
        }

        if (table) {
            table.classList.add(
                "hidden"
            );
        }

        return;
    }

    if (empty) {
        empty.classList.add(
            "hidden"
        );
    }

    if (table) {
        table.classList.remove(
            "hidden"
        );
    }

    records
        .slice()
        .reverse()
        .forEach(record => {
            const tr =
                document.createElement(
                    "tr"
                );

            const score =
                record.score !== undefined
                    ? record.score
                    : (
                        record.scores
                            ? record.scores.overall
                            : 0
                    );

            tr.innerHTML = `
                <td>
                    <strong>
                        ${escapeHTML(
                record.name ||
                "Anonymous"
            )}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(
                record.fileName ||
                "resume.pdf"
            )}
                </td>

                <td>
                    <span class="status-pill">
                        ${escapeHTML(
                record.status ||
                "Analyzed"
            )}
                    </span>
                </td>

                <td style="text-align:right;font-weight:700;">
                    ${score}/100
                </td>
            `;

            rows.appendChild(tr);
        });
}

// STUDENT TABLE
function renderStudentRows(records) {
    const empty =
        document.getElementById(
            "studentsEmpty"
        );

    const table =
        document.getElementById(
            "studentsTableWrapper"
        );

    const rows =
        document.getElementById(
            "studentRows"
        );

    if (!rows) return;

    rows.innerHTML = "";

    if (!records.length) {
        if (empty) {
            empty.classList.remove(
                "hidden"
            );
        }

        if (table) {
            table.classList.add(
                "hidden"
            );
        }

        return;
    }

    if (empty) {
        empty.classList.add(
            "hidden"
        );
    }

    if (table) {
        table.classList.remove(
            "hidden"
        );
    }

    records.forEach(record => {
        const tr =
            document.createElement(
                "tr"
            );

        const score =
            record.score !== undefined
                ? record.score
                : (
                    record.scores
                        ? record.scores.overall
                        : 0
                );

        tr.innerHTML = `
            <td>
                <strong>
                    ${escapeHTML(
            record.name ||
            "Anonymous"
        )}
                </strong>
            </td>

            <td>
                ${escapeHTML(
            record.education ||
            "No data available"
        )}
            </td>

            <td>
                ${escapeHTML(
            record.fileName ||
            "resume.pdf"
        )}
            </td>

            <td style="text-align:right;font-weight:700;">
                ${score}/100
            </td>
        `;

        rows.appendChild(tr);
    });
}

// LEADERBOARD
function renderLeaderboard(records) {
    const empty =
        document.getElementById(
            "leaderboardEmpty"
        );

    const wrapper =
        document.getElementById(
            "leaderboardTableWrapper"
        );

    const body =
        document.getElementById(
            "leaderboardBody"
        );

    if (!body) return;

    body.innerHTML = "";

    if (!records.length) {
        if (empty) {
            empty.classList.remove(
                "hidden"
            );
        }

        if (wrapper) {
            wrapper.classList.add(
                "hidden"
            );
        }

        return;
    }

    if (empty) {
        empty.classList.add(
            "hidden"
        );
    }

    if (wrapper) {
        wrapper.classList.remove(
            "hidden"
        );
    }

    const sorted =
        [...records].sort(
            (a, b) => {
                const scoreA =
                    a.score !== undefined
                        ? a.score
                        : (
                            a.scores
                                ? a.scores.overall
                                : 0
                        );

                const scoreB =
                    b.score !== undefined
                        ? b.score
                        : (
                            b.scores
                                ? b.scores.overall
                                : 0
                        );

                return scoreB - scoreA;
            }
        );

    sorted.forEach(
        (record, index) => {
            const tr =
                document.createElement(
                    "tr"
                );

            const rank =
                index === 0
                    ? "🥇"
                    : index === 1
                        ? "🥈"
                        : index === 2
                            ? "🥉"
                            : `${index + 1}`;

            const score =
                record.score !== undefined
                    ? record.score
                    : (
                        record.scores
                            ? record.scores.overall
                            : 0
                    );

            const jdScore =
                record.jdScore !== undefined &&
                    record.jdScore !== null
                    ? `${record.jdScore}%`
                    : "—";

            tr.innerHTML = `
                <td style="font-size:18px;text-align:center;">
                    ${rank}
                </td>

                <td>
                    <strong>
                        ${escapeHTML(
                record.name ||
                "Anonymous"
            )}
                    </strong>
                </td>

                <td>
                    ${escapeHTML(
                record.education ||
                "No data available"
            )}
                </td>

                <td>
                    ${jdScore}
                </td>

                <td style="text-align:right;font-weight:700;">
                    ${score}/100
                </td>
            `;

            body.appendChild(tr);
        }
    );
}

// CLEAR ADMIN DATA
const clearDataBtn =
    document.getElementById(
        "clearDataBtn"
    );

if (clearDataBtn) {
    clearDataBtn.addEventListener(
        "click",
        async () => {
            const confirmed =
                confirm(
                    "Clear all resume analysis data from database?"
                );

            if (!confirmed) return;

            try {
                await fetch(
                    API_BASE,
                    {
                        method: "DELETE"
                    }
                );
            } catch (error) {
                console.warn(
                    "Backend clear failed:",
                    error
                );
            }

            localStorage.removeItem(
                "resumeInsightData"
            );

            currentResume = null;

            await updateAdminDashboard();

            if (dashboardEmpty) {
                dashboardEmpty.classList.remove(
                    "hidden"
                );
            }

            if (dashboardResults) {
                dashboardResults.classList.add(
                    "hidden"
                );
            }

            if (insightsEmpty) {
                insightsEmpty.classList.remove(
                    "hidden"
                );
            }

            if (insightsResults) {
                insightsResults.classList.add(
                    "hidden"
                );
            }

            if (profileEmpty) {
                profileEmpty.classList.remove(
                    "hidden"
                );
            }

            if (profileResults) {
                profileResults.classList.add(
                    "hidden"
                );
            }

            if (downloadReportBtn) {
                downloadReportBtn.classList.add(
                    "hidden"
                );
            }

            showToast(
                "All database data cleared",
                "success"
            );
        }
    );
}

// AUTHENTICATION
function loadUserSession() {
    try {
        const stored =
            localStorage.getItem(
                "resumeInsightUser"
            );

        if (stored) {
            currentUser =
                JSON.parse(stored);

            updateUserHeaderUI();
            hideAuthModal();
        } else {
            showAuthModal();
        }
    } catch (error) {
        currentUser = null;
        showAuthModal();
    }
}

function showAuthModal() {
    const modal =
        document.getElementById(
            "authModal"
        );

    if (modal) {
        modal.classList.remove(
            "hidden"
        );
    }
}

function hideAuthModal() {
    const modal =
        document.getElementById(
            "authModal"
        );

    if (modal) {
        modal.classList.add(
            "hidden"
        );
    }
}

// USER HEADER
function updateUserHeaderUI() {
    if (!currentUser) return;

    const headerName =
        document.getElementById(
            "headerName"
        );

    const headerAvatar =
        document.getElementById(
            "headerAvatar"
        );

    const headerRole =
        document.getElementById(
            "headerRole"
        );

    if (headerName) {
        headerName.textContent =
            currentUser.name ||
            "Guest User";
    }

    if (headerAvatar) {
        headerAvatar.textContent =
            getInitial(
                currentUser.name
            );
    }

    if (headerRole) {
        headerRole.textContent =
            "ATS Evaluated";
    }

    syncProfileFromUser();
}

// AUTH TABS
const loginTab =
    document.getElementById(
        "loginTab"
    );

const signupTab =
    document.getElementById(
        "signupTab"
    );

const switchToSignup =
    document.getElementById(
        "switchToSignup"
    );

const switchToLogin =
    document.getElementById(
        "switchToLogin"
    );

if (switchToSignup) {
    switchToSignup.addEventListener(
        "click",
        () => {
            if (loginTab) {
                loginTab.classList.remove(
                    "active"
                );
            }

            if (signupTab) {
                signupTab.classList.add(
                    "active"
                );
            }
        }
    );
}

if (switchToLogin) {
    switchToLogin.addEventListener(
        "click",
        () => {
            if (signupTab) {
                signupTab.classList.remove(
                    "active"
                );
            }

            if (loginTab) {
                loginTab.classList.add(
                    "active"
                );
            }
        }
    );
}

// LOGIN
const loginBtn =
    document.getElementById(
        "loginBtn"
    );

if (loginBtn) {
    loginBtn.addEventListener(
        "click",
        () => {
            const name =
                (
                    document.getElementById(
                        "loginName"
                    )?.value || ""
                ).trim();

            const email =
                (
                    document.getElementById(
                        "loginEmail"
                    )?.value || ""
                ).trim();

            if (!name || !email) {
                showToast(
                    "Please enter your Name and Email",
                    "error"
                );

                return;
            }

            currentUser = {
                name,
                email
            };

            localStorage.setItem(
                "resumeInsightUser",
                JSON.stringify(
                    currentUser
                )
            );

            updateUserHeaderUI();
            hideAuthModal();

            showToast(
                `Welcome back, ${name}!`,
                "success"
            );
        }
    );
}

// SIGNUP
const signupBtn =
    document.getElementById(
        "signupBtn"
    );

if (signupBtn) {
    signupBtn.addEventListener(
        "click",
        () => {
            const name =
                (
                    document.getElementById(
                        "signupName"
                    )?.value || ""
                ).trim();

            const email =
                (
                    document.getElementById(
                        "signupEmail"
                    )?.value || ""
                ).trim();

            const college =
                (
                    document.getElementById(
                        "signupCollege"
                    )?.value || ""
                ).trim();

            const role =
                (
                    document.getElementById(
                        "signupRole"
                    )?.value || ""
                ).trim();

            if (!name || !email) {
                showToast(
                    "Please enter your Name and Email",
                    "error"
                );

                return;
            }

            currentUser = {
                name,
                email,
                college,
                role
            };

            localStorage.setItem(
                "resumeInsightUser",
                JSON.stringify(
                    currentUser
                )
            );

            updateUserHeaderUI();
            hideAuthModal();

            showToast(
                `Account created! Welcome, ${name}.`,
                "success"
            );
        }
    );
}

// GUEST
const guestBtn =
    document.getElementById(
        "guestBtn"
    );

if (guestBtn) {
    guestBtn.addEventListener(
        "click",
        () => {
            currentUser = {
                name: "Guest User",
                email: "guest@local",
                college: "",
                role: ""
            };

            localStorage.setItem(
                "resumeInsightUser",
                JSON.stringify(
                    currentUser
                )
            );

            updateUserHeaderUI();
            hideAuthModal();

            showToast(
                "Browsing as Guest",
                "success"
            );
        }
    );
}

// PROFILE DROPDOWN
const userBadge =
    document.querySelector(
        ".user-profile-badge"
    );

const profileDropdown =
    document.getElementById(
        "profileDropdown"
    ) ||
    document.querySelector(
        ".profile-dropdown-menu"
    );

const viewProfileBtn =
    document.getElementById(
        "viewProfileBtn"
    );

function openProfileDropdown() {
    if (!profileDropdown) return;

    profileDropdown.classList.remove(
        "hidden"
    );

    if (userBadge) {
        userBadge.classList.add(
            "open"
        );
    }

    updateProfileArrow(true);
}

function closeProfileDropdown() {
    if (!profileDropdown) return;

    profileDropdown.classList.add(
        "hidden"
    );

    if (userBadge) {
        userBadge.classList.remove(
            "open"
        );
    }

    updateProfileArrow(false);
}

function toggleProfileDropdown() {
    if (!profileDropdown) return;

    const isHidden =
        profileDropdown.classList.contains(
            "hidden"
        );

    if (isHidden) {
        openProfileDropdown();
    } else {
        closeProfileDropdown();
    }
}

function updateProfileArrow(open) {
    const arrow =
        document.getElementById(
            "profileArrow"
        );

    if (arrow) {
        arrow.textContent =
            open ? "⌃" : "⌄";
    }
}

if (userBadge) {
    userBadge.addEventListener(
        "click",
        event => {
            event.stopPropagation();
            toggleProfileDropdown();
        }
    );
}

if (viewProfileBtn) {
    viewProfileBtn.addEventListener(
        "click",
        event => {
            event.stopPropagation();

            closeProfileDropdown();

            showPage("profile");
        }
    );
}

// CLOSE DROPDOWN WHEN CLICKING OUTSIDE
document.addEventListener(
    "click",
    event => {
        if (
            profileDropdown &&
            userBadge &&
            !userBadge.contains(
                event.target
            ) &&
            !profileDropdown.contains(
                event.target
            )
        ) {
            closeProfileDropdown();
        }
    }
);

// PROFILE MODE BUTTONS
const profileStudentMode =
    document.getElementById(
        "profileStudentMode"
    );

const profileAdminMode =
    document.getElementById(
        "profileAdminMode"
    );

if (profileStudentMode) {
    profileStudentMode.addEventListener(
        "click",
        switchToStudentMode
    );
}

if (profileAdminMode) {
    profileAdminMode.addEventListener(
        "click",
        switchToAdminMode
    );
}

// EDIT PROFILE
const editProfileBtn =
    document.getElementById(
        "editProfileBtn"
    );

const editProfileModal =
    document.getElementById(
        "editProfileModal"
    );

const saveProfileBtn =
    document.getElementById(
        "saveProfileBtn"
    );

const cancelProfileBtn =
    document.getElementById(
        "cancelProfileBtn"
    );

function openEditProfileModal() {
    if (!editProfileModal) return;

    const nameInput =
        document.getElementById(
            "editName"
        );

    const eduInput =
        document.getElementById(
            "editEducation"
        );

    const roleInput =
        document.getElementById(
            "editRole"
        );

    const emailInput =
        document.getElementById(
            "editEmail"
        );

    const phoneInput =
        document.getElementById(
            "editPhone"
        );

    const githubInput =
        document.getElementById(
            "editGithub"
        );

    const linkedinInput =
        document.getElementById(
            "editLinkedin"
        );

    const activeName =
        currentResume &&
            currentResume.name &&
            currentResume.name !==
            "Candidate"
            ? currentResume.name
            : currentUser
                ? currentUser.name
                : "";

    const activeEducation =
        currentResume &&
            currentResume.education &&
            currentResume.education !==
            "No data available"
            ? currentResume.education
            : currentUser
                ? currentUser.college
                : "";

    const activeRole =
        currentResume &&
            currentResume.targetRole
            ? currentResume.targetRole
            : currentUser
                ? currentUser.role
                : "";

    const activeContacts =
        currentResume &&
            currentResume.contacts
            ? currentResume.contacts
            : {};

    if (nameInput) {
        nameInput.value =
            activeName || "";
    }

    if (eduInput) {
        eduInput.value =
            activeEducation || "";
    }

    if (roleInput) {
        roleInput.value =
            activeRole || "";
    }

    if (emailInput) {
        emailInput.value =
            activeContacts.email ||
            (
                currentUser
                    ? currentUser.email
                    : ""
            );
    }

    if (phoneInput) {
        phoneInput.value =
            activeContacts.phone ||
            "";
    }

    if (githubInput) {
        githubInput.value =
            activeContacts.github ||
            "";
    }

    if (linkedinInput) {
        linkedinInput.value =
            activeContacts.linkedin ||
            "";
    }

    editProfileModal.classList.remove(
        "hidden"
    );
}

function closeEditProfileModal() {
    if (editProfileModal) {
        editProfileModal.classList.add(
            "hidden"
        );
    }
}

if (editProfileBtn) {
    editProfileBtn.addEventListener(
        "click",
        openEditProfileModal
    );
}

if (cancelProfileBtn) {
    cancelProfileBtn.addEventListener(
        "click",
        closeEditProfileModal
    );
}

// SAVE PROFILE
if (saveProfileBtn) {
    saveProfileBtn.addEventListener(
        "click",
        async () => {
            const name =
                (
                    document.getElementById(
                        "editName"
                    )?.value || ""
                ).trim();

            const education =
                (
                    document.getElementById(
                        "editEducation"
                    )?.value || ""
                ).trim();

            const role =
                (
                    document.getElementById(
                        "editRole"
                    )?.value || ""
                ).trim();

            const email =
                (
                    document.getElementById(
                        "editEmail"
                    )?.value || ""
                ).trim();

            const phone =
                (
                    document.getElementById(
                        "editPhone"
                    )?.value || ""
                ).trim();

            const github =
                (
                    document.getElementById(
                        "editGithub"
                    )?.value || ""
                ).trim();

            const linkedin =
                (
                    document.getElementById(
                        "editLinkedin"
                    )?.value || ""
                ).trim();

            if (!name) {
                showToast(
                    "Candidate Name cannot be empty",
                    "error"
                );

                return;
            }

            currentUser = {
                ...(currentUser || {}),
                name,
                email,
                college: education,
                role
            };

            localStorage.setItem(
                "resumeInsightUser",
                JSON.stringify(
                    currentUser
                )
            );

            if (currentResume) {
                currentResume.name =
                    name;

                if (education) {
                    currentResume.education =
                        education;
                }

                if (role) {
                    currentResume.targetRole =
                        role;
                }

                currentResume.contacts = {
                    email,
                    phone,
                    github,
                    linkedin
                };

                updateUI(
                    currentResume
                );

                await saveResume(
                    currentResume
                );
            } else {
                updateUserHeaderUI();
            }

            closeEditProfileModal();

            showToast(
                "Profile updated successfully!",
                "success"
            );
        }
    );
}

// SYNC PROFILE
function syncProfileFromUser() {
    if (!currentUser) return;

    const name =
        currentUser.name ||
        "Guest User";

    setText(
        "headerName",
        name
    );

    setText(
        "headerAvatar",
        getInitial(name)
    );

    setText(
        "profileName",
        name
    );

    setText(
        "profileAvatar",
        getInitial(name)
    );

    const profileEducation =
        document.getElementById(
            "profileEducation"
        );

    if (profileEducation) {
        profileEducation.textContent =
            currentUser.college ||
            "No data available";
    }
}

// HELPERS
function normalizeText(text) {
    return String(text || "")
        .replace(/\u00a0/g, " ")
        .replace(/[|]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function escapeRegex(value) {
    return String(value).replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}

function getInitial(name) {
    if (
        !name ||
        name === "Not available" ||
        name === "No data available" ||
        name === "Candidate"
    ) {
        return "G";
    }

    return name
        .trim()
        .charAt(0)
        .toUpperCase();
}

function getScoreStatus(score) {
    if (score >= 85) {
        return "Exceptional";
    }

    if (score >= 70) {
        return "Strong";
    }

    if (score >= 50) {
        return "Good";
    }

    if (score >= 35) {
        return "Needs improvement";
    }

    return "Needs work";
}

function getScoreMessage(score) {
    if (score >= 85) {
        return "Your resume has an exceptional profile with high ATS alignment.";
    }

    if (score >= 70) {
        return "Your resume has a strong overall structure with clear technical depth.";
    }

    if (score >= 50) {
        return "Your resume is on a good track with some key improvement areas.";
    }

    return "Focus on strengthening your skills and adding measurable project outcomes.";
}

function setText(id, value) {
    const element =
        document.getElementById(id);

    if (element) {
        element.textContent =
            value;
    }
}

function setBarWidth(
    id,
    value,
    max
) {
    const element =
        document.getElementById(id);

    if (!element) return;

    const percentage =
        Math.min(
            100,
            Math.round(
                (Number(value) /
                    max) *
                100
            )
        );

    element.style.width =
        `${percentage}%`;
}

// TOAST
let toastTimer;

function showToast(
    message,
    type = ""
) {
    if (!toast) return;

    toast.textContent =
        message;

    toast.className =
        "toast";

    if (type) {
        toast.classList.add(
            type
        );
    }

    toast.classList.add(
        "show"
    );

    clearTimeout(
        toastTimer
    );

    toastTimer =
        setTimeout(() => {
            toast.classList.remove(
                "show"
            );
        }, 2500);
}

// INITIAL STATE
async function initialize() {
    if (dashboardEmpty) {
        dashboardEmpty.classList.remove(
            "hidden"
        );
    }

    if (dashboardResults) {
        dashboardResults.classList.add(
            "hidden"
        );
    }

    if (insightsEmpty) {
        insightsEmpty.classList.remove(
            "hidden"
        );
    }

    if (insightsResults) {
        insightsResults.classList.add(
            "hidden"
        );
    }

    if (profileEmpty) {
        profileEmpty.classList.remove(
            "hidden"
        );
    }

    if (profileResults) {
        profileResults.classList.add(
            "hidden"
        );
    }

    if (downloadReportBtn) {
        downloadReportBtn.classList.add(
            "hidden"
        );
    }

    loadUserSession();

    try {
        const response =
            await fetch(
                `${API_BASE}/latest`
            );

        if (response.ok) {
            const result =
                await response.json();

            if (
                result.success &&
                result.data
            ) {
                currentResume =
                    result.data;

                updateUI(
                    currentResume
                );
            }
        }
    } catch (error) {
        console.warn(
            "No latest resume available:",
            error.message
        );
    }

    await updateAdminDashboard();
}

// START APPLICATION
initialize();
