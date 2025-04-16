/**
 * Flag Quiz Module - Handles the flag identification quiz
 */
import BaseQuiz from "../utils/base-quiz.js";

class FlagQuiz extends BaseQuiz {
  constructor() {
    // Initialize with the quiz type for stats and settings
    super("flag");
  }

  /**
   * Filter countries based on flag quiz requirements
   */
  filterCountriesData(allCountriesData) {
    // Filter countries to ensure they have all required data for flag quiz
    return allCountriesData.filter(
      (country) =>
        country.name &&
        country.flags &&
        country.flags.png &&
        country.capital &&
        country.population
    );
  }

  /**
   * Show the start screen with settings
   */
  showStartScreen() {
    this.quizContent.innerHTML = `
     <div class="start-screen">
       <h2>Flag Challenge</h2>
       <p>Test your knowledge of world flags!</p>
       
       <div class="quiz-settings-summary">
         <p><strong>Region:</strong> ${
           this.settings.region === "all" ? "All Regions" : this.settings.region
         }</p>
         <p><strong>Questions:</strong> ${this.settings.questionCount}</p>
         <p><strong>Difficulty:</strong> ${this.settings.difficulty}</p>
       </div>
       
       <div class="start-buttons">
         <button id="start-quiz-btn" class="btn">Start Quiz</button>
         <button id="change-settings-btn" class="btn settings-btn"> <span>⚙️</span> Change Settings</button>
       </div>
     </div>
   `;

    // Add event listeners
    document.getElementById("start-quiz-btn").addEventListener("click", () => {
      this.quizStarted = true;
      this.startQuiz();
    });

    document
      .getElementById("change-settings-btn")
      .addEventListener("click", () => {
        const event = new CustomEvent("openSettings");
        document.dispatchEvent(event);
      });
  }

  /**
   * Show the next question
   */
  nextQuestion() {
    // First call parent method to handle timer reset and question count
    super.nextQuestion();

    // Return if end of quiz has been reached (handled by parent)
    if (this.questionCount > this.settings.questionCount) {
      return;
    }

    try {
      // Get a random selection of countries
      const randomCountries = this.getRandomCountries(4);
      const correctCountry = randomCountries[0];
      const options = [...randomCountries];

      // Save current question data
      this.currentQuestion = {
        correctCountry,
        options: this.shuffleArray(options),
      };

      // Render the question
      this.renderQuestion();

      // Start question timer
      this.startQuestionTimer();
    } catch (error) {
      console.error("Error loading next question:", error);
      this.quizContent.innerHTML = `
       <div class="error">
         <p>Error loading next question. Please try again.</p>
         <button id="continue-btn" class="btn">Continue</button>
       </div>
     `;
      document
        .getElementById("continue-btn")
        .addEventListener("click", () => this.nextQuestion());
    }
  }

  /**
   * Render the current question
   */
  renderQuestion() {
    const { correctCountry, options } = this.currentQuestion;

    this.quizContent.innerHTML = `
     <div class="question-counter">
       Question ${this.questionCount} of ${this.settings.questionCount}
       <div class="question-timer-container">
         Time remaining: <span id="question-timer">${
           this.questionTimeLimit
         }</span> seconds
       </div>
     </div>
     <div class="flag-question">
       <div class="flag-container">
         <img src="${
           correctCountry.flags.png
         }" alt="Country Flag" class="flag-image">
       </div>
       
       <div class="hint-container" id="hint-container">
         <!-- Hints will be displayed here -->
       </div>
       
       <div class="options-container">
         ${options
           .map(
             (country) => `
           <button class="option-btn" data-code="${country.cca3}">
             ${country.name.common}
           </button>
         `
           )
           .join("")}
       </div>
     </div>
   `;

    // Add event listeners to options
    document.querySelectorAll(".option-btn").forEach((button) => {
      button.addEventListener("click", (event) => {
        this.checkAnswer(event.target.dataset.code);
      });
    });
  }

  /**
   * Show feedback when time is up
   */
  showTimeUpFeedback() {
    this.showFeedback(
      `Time's up! The answer was ${this.currentQuestion.correctCountry.name.common}`,
      false
    );
  }

  /**
   * Check if the selected answer is correct
   */
  checkAnswer(selectedCode) {
    // Clear question timer
    if (this.questionTimer) {
      clearInterval(this.questionTimer);
    }

    const { correctCountry } = this.currentQuestion;
    const isCorrect = selectedCode === correctCountry.cca3;

    // Disable all buttons to prevent multiple selections
    document.querySelectorAll(".option-btn").forEach((button) => {
      button.disabled = true;

      // Highlight correct and incorrect answers
      if (button.dataset.code === correctCountry.cca3) {
        button.classList.add("correct");
      } else if (button.dataset.code === selectedCode && !isCorrect) {
        button.classList.add("incorrect");
      }
    });

    // Update score
    if (isCorrect) {
      // Award 2 extra points for correct answer
      this.score = this.score + 2;
      this.updateScore();

      this.showFeedback(`Correct! +2 points! Your score: ${this.score}`, true);
    } else {
      // Deduct 1 point for incorrect answer
      this.score = Math.max(0, this.score - 1);
      this.updateScore();

      this.showFeedback(
        `Incorrect! The answer was ${correctCountry.name.common}. -1 point`,
        false
      );
    }

    // Show next question after delay
    setTimeout(() => {
      this.nextQuestion();
    }, 2000);
  }

  /**
   * Get available hints for the current question
   */
  getAvailableHints() {
    const { correctCountry } = this.currentQuestion;

    // List of possible hints
    return [
      {
        id: "capital",
        text: `Capital: ${correctCountry.capital?.[0] || "N/A"}`,
      },
      { id: "region", text: `Region: ${correctCountry.region || "N/A"}` },
      {
        id: "population",
        text: `Population: ${
          correctCountry.population.toLocaleString() || "N/A"
        }`,
      },
      {
        id: "area",
        text: `Area: ${correctCountry.area?.toLocaleString() || "N/A"} km²`,
      },
    ].filter((hint) => !this.currentHints.find((h) => h.id === hint.id));
  }
}

export default FlagQuiz;
