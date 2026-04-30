// ==========================================================================
// 1. State Management
// ==========================================================================
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let sessionXp = 0;

// User Stats (Loaded from LocalStorage)
let userStats = {
    streak: 0,
    xp: 0,
    totalAnswered: 0,
    lastStudyDate: null
};

// ==========================================================================
// 2. DOM Elements
// ==========================================================================
// Screens
const welcomeScreen = document.getElementById('welcome-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultsScreen = document.getElementById('results-screen');

// Gamification UI
const streakCountEl = document.getElementById('streak-count');
const xpCountEl = document.getElementById('xp-count');
const userRankEl = document.getElementById('user-rank');
const lifetimeAnsweredEl = document.getElementById('lifetime-answered');
const progressBar = document.getElementById('progress-bar');

// Quiz UI
const qArea = document.getElementById('q-area');
const qSkill = document.getElementById('q-skill');
const qRef = document.getElementById('q-ref');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');

// TBS UI
const tbsContainer = document.getElementById('tbs-container');
const tbsScenario = document.getElementById('tbs-scenario');
const exhibitsList = document.getElementById('exhibits-list');

// Feedback UI
const feedbackArea = document.getElementById('feedback-area');
const feedbackTitle = document.getElementById('feedback-title');
const feedbackExplanation = document.getElementById('feedback-explanation');
const feedbackRationale = document.getElementById('feedback-rationale');
const protipText = document.getElementById('protip-text');
const nextBtn = document.getElementById('next-btn');

// Buttons
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// ==========================================================================
// 3. Initialization & Data Fetching
// ==========================================================================
async function initApp() {
    loadUserStats();
    updateDashboardUI();

    try {
        const response = await fetch('questions.json');
        questions = await response.json();
        
        // Event Listeners
        startBtn.addEventListener('click', startSession);
        nextBtn.addEventListener('click', handleNextQuestion);
        restartBtn.addEventListener('click', () => location.reload());
        
    } catch (error) {
        console.error("Failed to load questions:", error);
        questionText.innerText = "Error loading questions. Make sure you are running this on a local server.";
    }
}

// ==========================================================================
// 4. Gamification & LocalStorage Logic
// ==========================================================================
function loadUserStats() {
    const savedStats = localStorage.getItem('iscUserStats');
    if (savedStats) {
        userStats = JSON.parse(savedStats);
        checkStreak();
    }
}

function saveUserStats() {
    localStorage.setItem('iscUserStats', JSON.stringify(userStats));
}

function checkStreak() {
    const today = new Date().toDateString();
    if (userStats.lastStudyDate) {
        const lastDate = new Date(userStats.lastStudyDate);
        const currentDate = new Date(today);
        const diffTime = Math.abs(currentDate - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays === 1) {
            // Keep streak alive, handled upon completion
        } else if (diffDays > 1) {
            userStats.streak = 0; // Lost streak
        }
    }
}

function calculateRank(xp) {
    if (xp < 500) return "IT Associate";
    if (xp < 1500) return "Security Specialist";
    if (xp < 3000) return "Audit Manager";
    return "ISC Lead";
}

function updateDashboardUI() {
    streakCountEl.innerText = userStats.streak;
    xpCountEl.innerText = userStats.xp;
    userRankEl.innerText = calculateRank(userStats.xp);
    lifetimeAnsweredEl.innerText = userStats.totalAnswered;
}

// ==========================================================================
// 5. Core Quiz Logic
// ==========================================================================
function startSession() {
    welcomeScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    sessionXp = 0;
    score = 0;
    currentQuestionIndex = 0;
    renderQuestion();
}

function renderQuestion() {
    const q = questions[currentQuestionIndex];
    
    // Reset UI
    optionsContainer.innerHTML = '';
    feedbackArea.classList.add('hidden');
    feedbackArea.classList.remove('success-border', 'error-border');
    
    // Update Progress Bar
    const progressPercent = (currentQuestionIndex / questions.length) * 100;
    progressBar.style.width = `${progressPercent}%`;

    // Populate Metadata
    qArea.innerText = q.area;
    qSkill.innerText = q.skillLevel;
    qRef.innerText = q.blueprintRef;
    questionText.innerText = q.question;

    // Handle Task-Based Simulations (TBS)
    if (q.type === 'TBS') {
        tbsContainer.classList.remove('hidden');
        tbsScenario.innerText = q.scenario;
        exhibitsList.innerHTML = q.exhibits.map(exhibit => 
            `<div class="exhibit-item"><strong>${exhibit.title}:</strong><br>${exhibit.content}</div>`
        ).join('');
    } else {
        tbsContainer.classList.add('hidden');
    }

    // Render Options
    q.options.forEach(option => {
        const btn = document.createElement('button');
        btn.classList.add('option-btn');
        btn.innerText = `${option.id}. ${option.text}`;
        btn.onclick = () => handleAnswer(option.id, btn);
        optionsContainer.appendChild(btn);
    });
}

function handleAnswer(selectedId, selectedBtn) {
    const q = questions[currentQuestionIndex];
    const isCorrect = selectedId === q.correctAnswer;
    
    // Disable all buttons
    const allButtons = optionsContainer.querySelectorAll('.option-btn');
    allButtons.forEach(btn => btn.disabled = true);

    // Highlight Answers
    if (isCorrect) {
        selectedBtn.classList.add('correct');
        feedbackArea.classList.add('success-border');
        feedbackTitle.innerText = "Correct! ✅";
        score++;
        sessionXp += 50; // 50 XP for a right answer
    } else {
        selectedBtn.classList.add('incorrect');
        feedbackArea.classList.add('error-border');
        feedbackTitle.innerText = "Incorrect ❌";
        
        // Find and highlight the correct button
        allButtons.forEach(btn => {
            if (btn.innerText.startsWith(q.correctAnswer)) {
                btn.classList.add('correct');
            }
        });
    }

    // Show Feedback Details
    feedbackExplanation.innerText = q.explanation;
    feedbackRationale.innerText = q.rationale[selectedId];
    protipText.innerText = q.proTip;
    
    // Reveal Feedback Area
    feedbackArea.classList.remove('hidden');
    
    // Scroll to feedback (nice UX touch)
    feedbackArea.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Update global stats
    userStats.totalAnswered++;
}

function handleNextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        renderQuestion();
    } else {
        finishSession();
    }
}

// ==========================================================================
// 6. Finishing & Celebrations
// ==========================================================================
function finishSession() {
    quizScreen.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
    
    // Final Progress Bar Update
    progressBar.style.width = '100%';

    // Update Gamification Data
    userStats.xp += sessionXp;
    
    const today = new Date().toDateString();
    if (userStats.lastStudyDate !== today) {
        userStats.streak++;
        userStats.lastStudyDate = today;
    }
    
    saveUserStats();
    updateDashboardUI();

    // Update Results UI
    document.getElementById('final-score').innerText = `${score}/${questions.length}`;
    document.getElementById('xp-earned').innerHTML = `You earned <strong>+${sessionXp} XP</strong> this session!`;

    // Trigger Confetti if score is good (>70%)
    const passRate = score / questions.length;
    if (passRate >= 0.7) {
        triggerConfetti();
    }
}

function triggerConfetti() {
    if (typeof confetti === 'function') {
        const duration = 3000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#0ea5e9', '#10b981', '#fbbf24']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#0ea5e9', '#10b981', '#fbbf24']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }
}

// Boot the app
initApp();