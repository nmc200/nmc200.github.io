const questionElement = document.getElementById("question-text");
const answerButtons = document.getElementById("answer-buttons");
const nextButton = document.getElementById("next-btn");

let currentQuestionIndex = 0;
let score = 0;
let quizQuestions = [];

async function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    
    try {
        const response = await fetch('questions.json');
        quizQuestions = await response.json();
        showQuestion();
    } catch (error) {
        console.error("Error loading questions.json. Check file path.", error);
        questionElement.innerText = "Error loading questions.";
    }
}

function showQuestion() {
    resetState();
    let currentQuestion = quizQuestions[currentQuestionIndex];
    questionElement.innerText = currentQuestion.question;

    currentQuestion.answers.forEach(answer => {
        const button = document.createElement("button");
        button.innerText = answer.text;
        button.classList.add("btn");
        if (answer.correct) { button.dataset.correct = answer.correct; }
        button.addEventListener("click", selectAnswer);
        answerButtons.appendChild(button);
    });
}

function resetState() {
    nextButton.style.display = "none";
    while (answerButtons.firstChild) {
        answerButtons.removeChild(answerButtons.firstChild);
    }
}

function selectAnswer(e) {
    const selectedBtn = e.target;
    const isCorrect = selectedBtn.dataset.correct === "true";
    if (isCorrect) {
        selectedBtn.classList.add("correct");
        score++;
    } else {
        selectedBtn.classList.add("wrong");
    }
    Array.from(answerButtons.children).forEach(button => {
        if (button.dataset.correct === "true") {
            button.classList.add("correct");
        }
        button.disabled = true;
    });
    nextButton.style.display = "block";
}

nextButton.addEventListener("click", () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizQuestions.length) {
        showQuestion();
    } else {
        questionElement.innerText = `Final Score: ${score} out of ${quizQuestions.length}!`;
        resetState();
        nextButton.innerText = "Restart Trivia";
        nextButton.style.display = "block";
        nextButton.onclick = () => { location.reload(); };
    }
});

startQuiz();