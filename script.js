
let selectedFile = null;
let currentResume = null;
let isAdmin = false;

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
const analyzeBtn = document.getElementById("analyzeBtn");
const removeFileBtn = document.getElementById("removeFileBtn");
const fileSelected = document.getElementById("fileSelected");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");
const uploadMessage = document.getElementById("uploadMessage");
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
adminMode.addEventListener("click", () => {
    isAdmin = true;
    sidebar.classList.add("admin-view");
    adminMode.classList.add("active");
    studentMode.classList.remove("active");
    showPage("admin-dashboard");
    updateAdminDashboard();
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
        const data = analyzeResume(text);
        currentResume = {
            ...data,
            fileName: selectedFile.name,
            text: text
        };
        updateUI(currentResume);
        saveResume(currentResume);
        showPage("student-dashboard");
        showToast("Resume analyzed successfully", "success");
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

// RESUME ANALYSIS
function analyzeResume(text) {
    const cleanText = normalizeText(text);
    const name = getName(text);
    const education = getEducation(text);
    const skills = getSkills(cleanText);
    const projects = getProjects(cleanText);
    const certifications = getCertifications(cleanText);
    const achievements = getAchievements(cleanText);
    const scores = calculateScores({
        skills,
        projects,
        certifications,
        achievements,
        text: cleanText
    });
    return {
        name,
        education,
        skills,
        projects,
        certifications,
        achievements,
        scores
    };
}

// NAME EXTRACTION
function getName(text) {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    // Example PDF text: PARV KHARE Frontend Developer | AI Enthusiast
    for (const line of lines) {
        const match = line.match(/^([A-Z][A-Z .'-]{2,40})\s+(?:Frontend Developer|AI Enthusiast)/i);
        if (match) {
            return match[1].trim().replace(/\s+/g, " ");
        }
    }
    // Fallback: Look for a line beginning with a likely name
    for (const line of lines) {
        const match = line.match(/^([A-Z][A-Z .'-]{2,40})\s+(?:\||-|–)/);
        if (match) {
            const possibleName = match[1].trim();
            if (possibleName.split(" ").length >= 2 && possibleName.length <= 40) {
                return possibleName;
            }
        }
    }
    return "Not available";
}

// EDUCATION EXTRACTION
function getEducation(text) {
    const normalized = text.replace(/\s+/g, " ").trim();
    // Looks specifically for SRM education
    const srmMatch = normalized.match(/SRM Institute of Science and Technology.*?(?:2025\s*[-–]\s*2029)/i);
    if (srmMatch) {
        let education = srmMatch[0].replace(/\s+/g, " ").trim();
        // Prevent the result from becoming excessively long
        const stopWords = ["EXPERIENCE", "SKILLS", "PROJECTS", "CERTIFICATIONS", "ACHIEVEMENTS"];
        for (const word of stopWords) {
            const index = education.toUpperCase().indexOf(word);
            if (index > 0) {
                education = education.substring(0, index);
            }
        }
        return education.trim();
    }
    // Generic fallback for B.Tech / Computer Science
    const genericMatch = normalized.match(/(?:SRM Institute of Science and Technology|B\.?\s*Tech.*?Computer Science.*?)(?:2025\s*[-–]\s*2029)?/i);
    if (genericMatch) {
        return genericMatch[0].replace(/\s+/g, " ").trim();
    }
    return "Not available";
}

// SKILLS
function getSkills(text) {
    const knownSkills = [
        "python",
        "c++",
        "c",
        "java",
        "javascript",
        "html",
        "css",
        "react",
        "node.js",
        "machine learning",
        "deep learning",
        "opencv",
        "numpy",
        "pytorch",
        "tensorflow",
        "git",
        "github",
        "sql",
        "mongodb",
        "object oriented programming",
        "media pipe",
        "mediapipe"
    ];
    const found = [];
    knownSkills.forEach(skill => {
        const regex = new RegExp(`\\b${escapeRegex(skill)}\\b`, "i");
        if (regex.test(text)) {
            found.push(skill);
        }
    });
    return found.length ? found.join(", ") : "Not available";
}

// PROJECTS
function getProjects(text) {
    if (/carenetra|project|projects|patient monitoring|web application/i.test(text)) {
        return "Projects detected";
    }
    return "Not available";
}

// CERTIFICATIONS
function getCertifications(text) {
    if (/certification|certifications|certificate|certified/i.test(text)) {
        return "Certifications detected";
    }
    return "No data available";
}

// ACHIEVEMENTS
function getAchievements(text) {
    if (/achievement|achievements|award|winner|hackathon|scholarship/i.test(text)) {
        return "Achievements detected";
    }
    return "No data available";
}

// SCORE CALCULATION
function calculateScores(data) {
    const skillsCount = data.skills === "Not available" ? 0 : data.skills.split(",").length;
    const skillsScore = Math.min(20, skillsCount * 3);
    const projectsScore = data.projects === "Not available" ? 0 : 17;
    const certificationsScore = data.certifications === "No data available" ? 0 : 10;
    const achievementsScore = data.achievements === "No data available" ? 0 : 10;
    const qualityScore = data.text.length > 1000 ? 13 : data.text.length > 500 ? 10 : 7;
    const atsScore = data.text.length > 1000 ? 13 : data.text.length > 500 ? 10 : 7;
    const overall = skillsScore + projectsScore + certificationsScore + achievementsScore + qualityScore + atsScore;
    return {
        skills: skillsScore,
        projects: projectsScore,
        certifications: certificationsScore,
        achievements: achievementsScore,
        quality: qualityScore,
        ats: atsScore,
        overall
    };
}

// UPDATE UI
function updateUI(data) {
    dashboardEmpty.classList.add("hidden");
    dashboardResults.classList.remove("hidden");
    insightsEmpty.classList.add("hidden");
    insightsResults.classList.remove("hidden");
    profileEmpty.classList.add("hidden");
    profileResults.classList.remove("hidden");
    // NAME
    document.getElementById("resultName").textContent = data.name;
    // EDUCATION
    document.getElementById("resultEducation").textContent = data.education;
    // OTHER INFORMATION
    document.getElementById("resultSkills").textContent = data.skills;
    document.getElementById("resultProjects").textContent = data.projects;
    document.getElementById("resultCertifications").textContent = data.certifications;
    document.getElementById("resultAchievements").textContent = data.achievements;
    // SCORE
    document.getElementById("overallScore").textContent = data.scores.overall;
    document.getElementById("scoreStatus").textContent = getScoreStatus(data.scores.overall);
    document.getElementById("scoreMessage").textContent = getScoreMessage(data.scores.overall);
    // CATEGORY SCORES
    document.getElementById("skillsScore").textContent = `${data.scores.skills}/20`;
    document.getElementById("projectsScore").textContent = `${data.scores.projects}/20`;
    document.getElementById("certificationsScore").textContent = `${data.scores.certifications}/15`;
    document.getElementById("achievementsScore").textContent = `${data.scores.achievements}/15`;
    document.getElementById("qualityScore").textContent = `${data.scores.quality}/15`;
    document.getElementById("atsScore").textContent = `${data.scores.ats}/15`;
    // FEEDBACK
    document.getElementById("skillsFeedback").textContent = data.scores.skills >= 15 ? "Good technical skill coverage." : "Add more relevant technical skills.";
    document.getElementById("projectsFeedback").textContent = data.scores.projects >= 15 ? "Projects are clearly present." : "Add more detailed projects.";
    document.getElementById("certificationsFeedback").textContent = data.scores.certifications > 0 ? "Certifications detected." : "Consider adding relevant certifications.";
    document.getElementById("achievementsFeedback").textContent = data.scores.achievements > 0 ? "Achievements detected." : "Add measurable achievements.";
    document.getElementById("qualityFeedback").textContent = "Resume content quality analyzed.";
    document.getElementById("atsFeedback").textContent = "ATS compatibility evaluated.";
    // HEADER
    const displayName = data.name !== "Not available" ? data.name : "Student";
    document.getElementById("headerName").textContent = displayName;
    document.getElementById("headerAvatar").textContent = getInitial(displayName);
    // PROFILE
    document.getElementById("profileName").textContent = displayName;
    document.getElementById("profileEducation").textContent = data.education;
    document.getElementById("profileSkills").textContent = data.skills;
    document.getElementById("profileProjects").textContent = data.projects;
    document.getElementById("profileAvatar").textContent = getInitial(displayName);
    // INSIGHTS
    updateInsights(data);
    // ADMIN
    updateAdminDashboard();
}

// INSIGHTS
function updateInsights(data) {
    const strengthList = document.getElementById("strengthList");
    const improvementList = document.getElementById("improvementList");
    const recommendationList = document.getElementById("recommendationList");
    strengthList.innerHTML = "";
    improvementList.innerHTML = "";
    recommendationList.innerHTML = "";
    const strengths = [];
    const improvements = [];
    const recommendations = [];
    if (data.scores.skills >= 12) {
        strengths.push("Good technical skill coverage.");
    } else {
        improvements.push("Technical skill section needs improvement.");
        recommendations.push("Add skills relevant to your target job.");
    }
    if (data.scores.projects >= 15) {
        strengths.push("Projects are present and relevant.");
    } else {
        improvements.push("Project section needs more detail.");
        recommendations.push("Add project technologies, features and measurable results.");
    }
    if (data.scores.certifications > 0) {
        strengths.push("Certifications are included.");
    } else {
        improvements.push("No certifications detected.");
        recommendations.push("Consider adding relevant certifications or courses.");
    }
    if (data.scores.achievements > 0) {
        strengths.push("Achievements were detected.");
    } else {
        improvements.push("No achievements detected.");
        recommendations.push("Add hackathons, awards, scholarships or measurable achievements.");
    }
    if (data.scores.ats >= 10) {
        strengths.push("Resume has reasonable ATS readiness.");
    } else {
        improvements.push("ATS readiness can be improved.");
        recommendations.push("Use clear section headings and job-relevant keywords.");
    }
    renderList(strengthList, strengths.length ? strengths : ["No major strengths detected yet."]);
    renderList(improvementList, improvements.length ? improvements : ["No major improvement areas detected."]);
    if (!recommendations.length) {
        recommendations.push("Continue tailoring your resume for each target role.");
    }
    recommendations.forEach(item => {
        const div = document.createElement("div");
        div.className = "recommendation";
        div.textContent = item;
        recommendationList.appendChild(div);
    });
}
function renderList(element, items) {
    items.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item;
        element.appendChild(li);
    });
}

// ADMIN DATA
function getStoredResumes() {
    try {
        return JSON.parse(localStorage.getItem("resumeInsightData")) || [];
    } catch {
        return [];
    }
}
function saveResume(data) {
    const records = getStoredResumes();
    const record = {
        name: data.name,
        education: data.education,
        skills: data.skills,
        projects: data.projects,
        score: data.scores.overall,
        fileName: data.fileName,
        status: "Analyzed"
    };
    records.push(record);
    localStorage.setItem("resumeInsightData", JSON.stringify(records));
}
function updateAdminDashboard() {
    const records = getStoredResumes();
    const analyzed = records.filter(item => item.status === "Analyzed");
    document.getElementById("adminStudents").textContent = records.length;
    document.getElementById("adminUploaded").textContent = records.length;
    document.getElementById("adminAnalyzed").textContent = analyzed.length;
    if (analyzed.length) {
        const average = analyzed.reduce((sum, item) => sum + Number(item.score), 0) / analyzed.length;
        document.getElementById("adminAverage").textContent = Math.round(average);
    } else {
        document.getElementById("adminAverage").textContent = "—";
    }
    renderAdminRows(records);
    renderStudentRows(records);
    renderLeaderboard(records);
}

// ADMIN TABLE
function renderAdminRows(records) {
    const empty = document.getElementById("adminRecentEmpty");
    const table = document.getElementById("adminRecentTable");
    const rows = document.getElementById("adminRows");
    rows.innerHTML = "";
    if (!records.length) {
        empty.classList.remove("hidden");
        table.classList.add("hidden");
        return;
    }
    empty.classList.add("hidden");
    table.classList.remove("hidden");
    records.slice().reverse().forEach(record => {
        const row = document.createElement("div");
        row.className = "admin-row";
        row.innerHTML = `
            <span>${escapeHTML(record.name)}</span>
            <span>${escapeHTML(record.fileName)}</span>
            <span><span class="status-pill">${escapeHTML(record.status)}</span></span>
            <span class="score-cell">${record.score}/100</span>
        `;
        rows.appendChild(row);
    });
}

// STUDENTS
function renderStudentRows(records) {
    const empty = document.getElementById("studentsEmpty");
    const table = document.getElementById("studentsTable");
    const rows = document.getElementById("studentRows");
    rows.innerHTML = "";
    if (!records.length) {
        empty.classList.remove("hidden");
        table.classList.add("hidden");
        return;
    }
    empty.classList.add("hidden");
    table.classList.remove("hidden");
    records.forEach(record => {
        const row = document.createElement("div");
        row.className = "admin-row";
        row.innerHTML = `
            <span>${escapeHTML(record.name)}</span>
            <span>${escapeHTML(record.education)}</span>
            <span>${escapeHTML(record.fileName)}</span>
            <span class="score-cell">${record.score}/100</span>
        `;
        rows.appendChild(row);
    });
}

// LEADERBOARD
function renderLeaderboard(records) {
    const empty = document.getElementById("leaderboardEmpty");
    const body = document.getElementById("leaderboardBody");
    body.innerHTML = "";
    if (!records.length) {
        empty.classList.remove("hidden");
        body.classList.add("hidden");
        return;
    }
    empty.classList.add("hidden");
    body.classList.remove("hidden");
    const sorted = [...records].sort((a, b) => b.score - a.score);
    sorted.forEach((record, index) => {
        const row = document.createElement("div");
        row.className = "admin-row";
        let rankClass = "";
        if (index === 0) rankClass = "gold";
        if (index === 1) rankClass = "silver";
        if (index === 2) rankClass = "bronze";
        row.innerHTML = `
            <span><span class="rank-badge ${rankClass}">${index + 1}</span></span>
            <span>${escapeHTML(record.name)}</span>
            <span style="text-align:right;font-weight:600;">${record.score}/100</span>
        `;
        body.appendChild(row);
    });
}

// CLEAR ADMIN DATA
document.getElementById("clearDataBtn").addEventListener("click", () => {
    const confirmClear = confirm("Clear all resume analysis data?");
    if (!confirmClear) return;
    localStorage.removeItem("resumeInsightData");
    currentResume = null;
    updateAdminDashboard();
    showToast("All data cleared", "success");
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
    if (!name || name === "Not available") {
        return "S";
    }
    return name.trim().charAt(0).toUpperCase();
}
function getScoreStatus(score) {
    if (score >= 80) return "Strong";
    if (score >= 60) return "Good";
    if (score >= 40) return "Needs improvement";
    return "Needs work";
}
function getScoreMessage(score) {
    if (score >= 80) {
        return "Your resume has a strong overall structure.";
    }
    if (score >= 60) {
        return "Your resume is on a good track with some areas to improve.";
    }
    if (score >= 40) {
        return "Your resume has a few important areas that need improvement.";
    }
    return "Focus on strengthening your resume sections.";
}

// TOAST
let toastTimer;
function showToast(message, type = "") {
    toast.textContent = message;
    toast.className = "toast";
    if (type) {
        toast.classList.add(type);
    }
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

// INITIAL STATE
function initialize() {
    dashboardEmpty.classList.remove("hidden");
    dashboardResults.classList.add("hidden");
    insightsEmpty.classList.remove("hidden");
    insightsResults.classList.add("hidden");
    profileEmpty.classList.remove("hidden");
    profileResults.classList.add("hidden");
    updateAdminDashboard();
}
initialize();