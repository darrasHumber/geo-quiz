/**
 * Flag to Capital Quiz Module - Handles the flag to capital identification quiz
 */
import BaseQuiz from "../utils/base-quiz.js";

class FlagToCapitalQuiz extends BaseQuiz {
  constructor() {
    // Initialize with the quiz type for stats and settings
    super("flag-to-capital");
  }

  /**
   * Filter countries based on flag-to-capital quiz requirements
   */
  filterCountriesData(allCountriesData) {
    // Filter countries to ensure they have all required data for this quiz
    return allCountriesData.filter(
      (country) =>
        country.name &&
        country.flags &&
        country.flags.png &&
        country.capital &&
        country.capital.length > 0 &&
        country.population
    );
  }

  /**
   * Show the start screen with settings
   */
  showStartScreen() {
    this.quizContent.innerHTML = `
     <div class="start-screen">
       <h2>Flag to Capital Quiz</h2>
       <p>Identify the capital city of the country shown by its flag!</p>
       
       <div class="quiz-settings-summary">
         <p><strong>Region:</strong> ${
           this.settings.region === "all" ? "All Regions" : this.settings.region
         }</p>
         <p><strong>Questions:</strong> ${this.settings.questionCount}</p>
         <p><strong>Difficulty:</strong> ${this.settings.difficulty}</p>
       </div>
       
       <div class="start-buttons">
         <button id="start-quiz-btn" class="btn">Start Quiz</button>
         <button id="change-settings-btn" class="btn settings-btn">Change Settings</button>
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
      const correctCapital = correctCountry.capital[0];

      // Get different capitals for options
      const capitalOptions = [correctCapital];

      // Add other random capitals as options
      randomCountries.slice(1).forEach((country) => {
        capitalOptions.push(country.capital[0]);
      });

      // Save current question data
      this.currentQuestion = {
        correctCountry,
        correctCapital,
        options: this.shuffleArray(capitalOptions),
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
    const flagUrl = correctCountry.flags.png;

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
         <img src="${flagUrl}" alt="Country Flag" class="flag-image">
         <p class="question-text">What is the capital city of this country?</p>
       </div>
       
       <div class="hint-container" id="hint-container">
         <!-- Hints will be displayed here -->
       </div>
       
       <div class="options-container">
         ${options
           .map(
             (capital) => `
           <button class="option-btn" data-capital="${capital}">
             ${capital}
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
        this.checkAnswer(event.target.dataset.capital);
      });
    });
  }

  /**
   * Show feedback when time is up
   */
  showTimeUpFeedback() {
    this.showFeedback(
      `Time's up! The answer was ${this.currentQuestion.correctCapital}`,
      false
    );
  }

  /**
   * Check if the selected answer is correct
   */
  checkAnswer(selectedCapital) {
    // Clear question timer
    if (this.questionTimer) {
      clearInterval(this.questionTimer);
    }

    const { correctCapital, correctCountry } = this.currentQuestion;
    const isCorrect = selectedCapital === correctCapital;

    // Disable all buttons to prevent multiple selections
    document.querySelectorAll(".option-btn").forEach((button) => {
      button.disabled = true;

      // Highlight correct and incorrect answers
      if (button.dataset.capital === correctCapital) {
        button.classList.add("correct");
      } else if (button.dataset.capital === selectedCapital && !isCorrect) {
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
        `Incorrect! The capital of ${correctCountry.name.common} is ${correctCapital}. -1 point`,
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

    const availableHints = [
      { id: "country", text: `Country: ${correctCountry.name.common}` },
      { id: "continent", text: `Continent: ${correctCountry.region || "N/A"}` },
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
      {
        id: "language",
        text: `Language: ${
          Object.values(correctCountry.languages || {})[0] || "N/A"
        }`,
      },
    ].filter((hint) => !this.currentHints.find((h) => h.id === hint.id));

    // Remove country hint if difficulty is hard
    if (this.settings.difficulty === "hard") {
      const countryIndex = availableHints.findIndex(
        (hint) => hint.id === "country"
      );
      if (countryIndex !== -1) {
        availableHints.splice(countryIndex, 1);
      }
    }

    return availableHints;
  }
}

export default FlagToCapitalQuiz;
