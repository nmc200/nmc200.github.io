/* app.js */

// --- State Management ---
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let streak = 0;
let maxStreak = 0;

// --- DOM Elements ---
const questionText = document.getElementById('question-text');
const answerSection = document.getElementById('answer-section');
const difficultyBadge = document.getElementById('difficulty-badge');
const progressFill = document.getElementById('progress-fill');
const ballIcon = document.getElementById('ball-icon');
const currentScoreEl = document.getElementById('current-score');
const streakCountEl = document.getElementById('streak-count');
const feedbackArea = document.getElementById('feedback-area');
const feedbackMsg = document.getElementById('feedback-msg');
const factText = document.getElementById('fact-text');
const nextBtn = document.getElementById('next-btn');
const resultsScreen = document.getElementById('results-screen');
const quizCard = document.getElementById('quiz-card');

// --- Initialization ---
async function initGame() {
    try {
        const response = await fetch('questions.json');
        questions = await response.json();
        shuffleArray(questions); // Randomize question order
        showQuestion();
    } catch (error) {
        console.error("Error loading questions:", error);
        questionText.innerText = "Failed to load trivia. Check console.";
    }
}

// --- Core Logic ---
function showQuestion() {
    resetState();
    const q = questions[currentQuestionIndex];
    
    // Update UI Meta
    questionText.innerText = q.question;
    difficultyBadge.innerText = q.difficulty;
    updateProgress();

    // Render based on Type
    if (q.type === 'multiple-choice') {
        renderMultipleChoice(q);
    } else if (q.type === 'true-false') {
        renderTrueFalse(q);
    } else if (q.type === 'matching') {
        renderMatching(q);
    }
}

function renderMultipleChoice(q) {
    q.options.forEach(option => {
        const btn = document.createElement('button');
        btn.innerText = option;
        btn.onclick = () => checkAnswer(option, q.correctAnswer);
        answerSection.appendChild(btn);
    });
}

function renderTrueFalse(q) {
    [true, false].forEach(val => {
        const btn = document.createElement('button');
        btn.innerText = val ? "Verdadeiro (True)" : "Falso (False)";
        btn.onclick = () => checkAnswer(val, q.correctAnswer);
        answerSection.appendChild(btn);
    });
}

function renderMatching(q) {
    const container = document.createElement('div');
    container.className = 'matching-container';
    
    // Simplified logic: For a MVP, we show pairs and ask them to pick the right set.
    // For a Pro version, use drag-and-drop or selection logic.
    const instruction = document.createElement('p');
    instruction.innerText = "Note: In this mode, focus on the facts provided below after clicking 'Reveal'!";
    
    const revealBtn = document.createElement('button');
    revealBtn.innerText = "Check Matches";
    revealBtn.onclick = () => checkAnswer(true, true); // Auto-pass matching for this simple version
    
    answerSection.appendChild(instruction);
    answerSection.appendChild(revealBtn);
}

function checkAnswer(selected, correct) {
    const isCorrect = selected === correct;
    
    if (isCorrect) {
        score += 10;
        streak++;
        if (streak > maxStreak) maxStreak = streak;
        feedbackMsg.innerText = "GOL! (Correct)";
        feedbackMsg.style.color = "var(--brazil-green)";
        if (streak >= 3) triggerConfetti();
    } else {
        streak = 0;
        feedbackMsg.innerText = "OUT! (Incorrect)";
        feedbackMsg.style.color = "var(--error-red)";
        quizCard.classList.add('shake');
        setTimeout(() => quizCard.classList.remove('shake'), 500);
    }

    updateStats();
    showFeedback(questions[currentQuestionIndex].fact);
}

// --- UI Helpers ---
function showFeedback(fact) {
    answerSection.classList.add('hidden');
    feedbackArea.classList.remove('hidden');
    factText.innerText = fact;
}

nextBtn.onclick = () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        showResults();
    }
};

function resetState() {
    answerSection.innerHTML = '';
    answerSection.classList.remove('hidden');
    feedbackArea.classList.add('hidden');
}

function updateStats() {
    currentScoreEl.innerText = score;
    streakCountEl.innerText = streak;
}

function updateProgress() {
    const percent = ((currentQuestionIndex) / questions.length) * 100;
    progressFill.style.width = `${percent}%`;
    ballIcon.style.left = `${percent}%`;
}

function showResults() {
    quizCard.classList.add('hidden');
    resultsScreen.classList.remove('hidden');
    document.getElementById('final-score').innerText = score;
    document.getElementById('best-streak').innerText = maxStreak;
    triggerConfetti();
}

// --- Utilities ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function triggerConfetti() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#009543', '#FFD700', '#052B8E']
    });
}

initGame();