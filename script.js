async function getQuestions(category, context, amount = 10) {
    const result = await fetch(new Date().getHours() < 12 ? "https://iblqzed-ai-backend.glitch.me" : "https://iblqzed-ai-backend2.glitch.me/", {
        body: "Give me " + amount + " " + category + " trivia questions" + (context ? (" with the context of " + context) : "") + ", and give 4 possible answers and the correct answer(s). Put the questions in a json array, where each element has a question, options, and answer property (if there are multiple correct answers, return the answer property as an array). Return it as json, without the ```json.",
        method: "POST"
    }).then(v => v.text()).catch(v => {
        Trivia.question.text(v)
    })
    const json = JSON.parse(result.trim())
    return json
}

class Trivia {
    static quizContainer = $("#quiz-container")
    static questionContainer = $("#question-container")
    static question = $("#question")
    static answers = $("#answer-btns")
    static score = $("#score")

    questions = []
    index = 0
    score = 0
    wait = false
    finished = false

    constructor(category, context) {
        this.category = category
        this.context = context
        Trivia.question.text("Loading questions...")
    }

    async start() {
        const result = await this.loadQuestions()
        if (this.finished) return this
        this.showNextQuestion()
    }

    async finish(force = false) {
        this.finished = true
        Trivia.score.text("Score: 0")
        Trivia.answers.children().remove()
        // if (!force) this.saveAttempt(this.category, this.score)
        Trivia.quizContainer.attr("hidden", true)
        $("#menu-container").attr("hidden", null)
        // Trivia.displayPreviousAttempts()
    }

    async loadQuestions(timeout = 3) {
        try {
            this.questions = (await getQuestions(this.category, this.context, $("#questions-input").val() || 10))
            this.questions = this.questions.map(v => {
                v.options = v.options
                const array = v.options
                for (let i = array.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    const temp = array[i];
                    array[i] = array[j];
                    array[j] = temp;
                }
                v.options = array
                return v
            })
        } catch (e) {
            if (timeout === 0) {
                return false
            }
            await this.loadQuestions(timeout - 1)
        }
    }

    showNextQuestion() {
        if (this.index === this.questions.length) return this.finish()
        const { question, answer, options } = this.questions[this.index++]
        Trivia.question.text(question)
        for (const option of options) {
            Trivia.answers.append(`<button>${option}</button>`).children().last().on("click", (data) => {
                if (!this.wait) this.buttonClicked($(data.target), answer)
            })
        }
    }

    buttonClicked(button, answer) {
        this.wait = true
        const text = button.text()
        Trivia.answers.children().each((index, v) => {
            const element = $(v)
            if (this.isCorrect(element.text(), answer)) element.addClass("correct")
            else element.addClass("incorrect")
        })
        if (this.isCorrect(text, answer)) this.score++
        Trivia.score.text(`Score: ${this.score}`)
        setTimeout(() => {
            Trivia.answers.children().remove()
            this.wait = false
            this.showNextQuestion()
        }, 1500)
    }

    isCorrect(text, answer) {
        if (Array.isArray(answer)) {
            if (answer.includes(text)) return true
            else return false
        } else if (text === answer) return true
        else return false
    }

    saveAttempt(category, score) {
        let attempts = JSON.parse(localStorage.getItem('quizAttempts') ?? "[]") || []
        attempts.push({ category, score })
        if (attempts.length > 5) attempts.shift()
        localStorage.setItem('quizAttempts', JSON.stringify(attempts))
    }

    static displayPreviousAttempts() {
        let attempts = JSON.parse(localStorage.getItem('quizAttempts') ?? "[]")
        $("#attempts-list").empty()
        attempts.forEach(attempt => {
            $("#attempts-list").append(`<li>${attempt.category.charAt(0).toUpperCase() + attempt.category.slice(1)} - Score: ${attempt.score}</li>`)
        })
    }
}

// Trivia.displayPreviousAttempts()

let trivia
let context
const textarea = $("#context-textarea")

$("#start-btn").on("click", (data) => {
    console.log("CLICKED")
    $("#menu-container").attr("hidden", true)
    Trivia.quizContainer.attr("hidden", null)
    const category = $("#category-input").val()
    trivia = new Trivia(category, context ? textarea.val() : null)
    trivia.start()
})

$("#add-context-btn").on('click', function () {
    if (textarea.is(":visible")) {
        context = false
        textarea.slideUp();
    } else {
        context = true
        textarea.slideDown();
    }
});

$("#end-quiz-btn").on("click", (data) => {
    trivia.finish(true)
})