/**
 * Capital Quiz Module - Handles the capital city identification quiz
 */
class CapitalQuiz {
  constructor() {
    this.quizContainer = document.getElementById("quiz-container");
    this.quizContent = document.getElementById("quiz-content");
    this.scoreElement = document.getElementById("current-score");
    this.timerElement = document.getElementById("timer");
    this.hintButton = document.getElementById("hint-btn");
    this.skipButton = document.getElementById("skip-btn");
    this.settingsButton = document.getElementById("quiz-settings-btn");
    this.quitButton = document.getElementById("quit-btn");
    this.quizControls = document.querySelector(".quiz-controls");
    this.quizHeader = document.querySelector(".quiz-header");

    this.currentQuestion = null;
    this.allCountries = [];
    this.filteredCountries = [];
    this.score = 0;
    this.initialScore = 0;
    this.hintsUsed = 0;
    this.currentHints = [];
    this.timerInterval = null;
    this.startTime = null;
    this.questionCount = 0;
    this.questionTimer = null;
    this.questionTimeLimit = 30; // 30 seconds per question
    this.questionTimeRemaining = this.questionTimeLimit;
    this.quizStarted = false;

    // Default settings
    this.settings = {
      region: "all",
      questionCount: 10,
      difficulty: "easy",
    };

    // Load saved settings if available
    this.loadSettings();
  }

  /**
   * Initialize event listeners - called each time we start a new quiz or go to start screen
   */
  initEventListeners() {
    // Remove any existing listeners first
    this.removeEventListeners();

    // Add new listeners
    if (this.hintButton) {
      this.hintButton.onclick = () => this.showHint();
    }

    if (this.skipButton) {
      this.skipButton.onclick = () => this.nextQuestion();
    }

    // Remove the quit button event listener - we'll use only the back button
    if (this.quitButton) {
      this.quitButton.style.display = "none";
    }
  }

  /**
   * Remove event listeners
   */
  removeEventListeners() {
    if (this.hintButton) {
      this.hintButton.onclick = null;
    }

    if (this.skipButton) {
      this.skipButton.onclick = null;
    }

    if (this.quitButton) {
      this.quitButton.onclick = null;
    }
  }

  /**
   * Add back button to quiz header
   */
  addBackButton() {
    // Remove any existing back button first
    const existingBackButton = document.getElementById("back-button");
    if (existingBackButton) {
      existingBackButton.remove();
    }

    // Create back button
    const backButton = document.createElement("button");
    backButton.id = "back-button";
    backButton.className = "btn back-btn";
    backButton.innerHTML = "&larr; Back to Home";

    // Add event listener
    backButton.onclick = () => this.quitQuiz();

    // Add back button to header
    if (this.quizHeader) {
      this.quizHeader.insertBefore(backButton, this.quizHeader.firstChild);
    }
  }

  /**
   * Quit quiz and return to home screen
   */
  quitQuiz() {
    if (
      confirm(
        "Are you sure you want to quit this quiz? Your progress may be lost."
      )
    ) {
      // Stop timers
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }

      if (this.questionTimer) {
        clearInterval(this.questionTimer);
        this.questionTimer = null;
      }

      // Reset quiz state
      this.quizStarted = false;

      // Return to home screen
      document.getElementById("quiz-container").classList.add("hidden");
      document.getElementById("welcome-section").classList.remove("hidden");
    }
  }

  /**
   * Update quiz settings and restart
   */
  updateSettings(newSettings) {
    // Update settings
    if (newSettings.region) this.settings.region = newSettings.region;
    if (newSettings.questionCount)
      this.settings.questionCount = newSettings.questionCount;
    if (newSettings.difficulty)
      this.settings.difficulty = newSettings.difficulty;

    // Save settings
    this.saveSettings();

    // Filter countries based on new settings
    this.filterCountries();

    // If the quiz has already started, restart it with new settings
    if (this.quizStarted) {
      this.startQuiz();
    } else {
      // Otherwise just show the start screen with updated settings
      this.showStartScreen();
    }
  }

  /**
   * Load saved settings from localStorage
   */
  loadSettings() {
    const savedSettings = localStorage.getItem("capitalQuizSettings");
    if (savedSettings) {
      try {
        this.settings = JSON.parse(savedSettings);
      } catch (e) {
        console.error("Error parsing saved settings:", e);
      }
    }
  }

  /**
   * Save settings to localStorage
   */
  saveSettings() {
    localStorage.setItem("capitalQuizSettings", JSON.stringify(this.settings));
  }

  /**
   * Filter countries based on selected region
   */
  filterCountries() {
    if (this.settings.region === "all") {
      this.filteredCountries = [...this.allCountries];
    } else {
      this.filteredCountries = this.allCountries.filter(
        (country) => country.region === this.settings.region
      );
    }

    // Ensure we have enough countries for the quiz
    if (this.filteredCountries.length < 4) {
      alert(
        `Not enough countries in ${this.settings.region} region. Using all countries instead.`
      );
      this.settings.region = "all";
      this.filteredCountries = [...this.allCountries];
    }
  }

  /**
   * Initialize the quiz
   */
  async init() {
    try {
      // Show loading state
      this.quizContent.innerHTML =
        '<div class="loading">Loading countries...</div>';

      // Load countries using fetch
      const response = await fetch("https://restcountries.com/v3.1/all");
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const allCountriesData = await response.json();

      // Filter countries to ensure they have all required data
      this.allCountries = allCountriesData.filter(
        (country) =>
          country.name &&
          country.capital &&
          country.capital.length > 0 &&
          country.population
      );

      // Apply region filter
      this.filterCountries();

      // Add back button to quiz header
      this.addBackButton();

      // Hide quiz controls initially (they should only show during active quiz)
      if (this.quizControls) {
        this.quizControls.classList.add("hidden");
      }

      // Show start screen
      this.showStartScreen();
    } catch (error) {
      console.error("Error loading quiz data:", error);
      this.quizContent.innerHTML = `
          <div class="error">
            <p>Error loading quiz data. Please try again.</p>
            <button id="retry-btn" class="btn">Retry</button>
          </div>
        `;
      document.getElementById("retry-btn").onclick = () => this.init();
    }
  }

  /**
   * Show the start screen with settings
   */
  showStartScreen() {
    this.quizContent.innerHTML = `
      <div class="start-screen">
        <h2>Capital Cities Quiz</h2>
        <p>Test your knowledge of world capitals!</p>
        
        <div class="quiz-settings-summary">
          <p><strong>Region:</strong> ${
            this.settings.region === "all"
              ? "All Regions"
              : this.settings.region
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
    document.getElementById("start-quiz-btn").onclick = () => {
      this.quizStarted = true;
      this.startQuiz();
    };

    document.getElementById("change-settings-btn").onclick = () => {
      const event = new CustomEvent("openSettings");
      document.dispatchEvent(event);
    };
  }

  /**
   * Start the quiz
   */
  startQuiz() {
    // Reset quiz state
    this.score = this.settings.questionCount; // Initialize score to number of questions
    this.initialScore = this.settings.questionCount;
    this.hintsUsed = 0;
    this.questionCount = 0;
    this.updateScore();

    // Initialize event listeners for quiz controls
    this.initEventListeners();

    // Show quiz controls for the active quiz
    if (this.quizControls) {
      this.quizControls.classList.remove("hidden");
    }

    // Start timer
    this.startTimer();

    // Load first question
    this.nextQuestion();
  }

  /**
   * Start the question timer
   */
  startQuestionTimer() {
    // Clear any existing timer
    if (this.questionTimer) {
      clearInterval(this.questionTimer);
    }

    // Reset timer
    this.questionTimeRemaining = this.questionTimeLimit;
    this.updateQuestionTimerDisplay();

    // Start new timer
    this.questionTimer = setInterval(() => {
      this.questionTimeRemaining--;
      this.updateQuestionTimerDisplay();

      // Move to next question when time is up
      if (this.questionTimeRemaining <= 0) {
        clearInterval(this.questionTimer);
        this.showFeedback(
          `Time's up! The answer was ${this.currentQuestion.correctCountry.name.common}`,
          false
        );

        // Show next question after delay
        setTimeout(() => {
          this.nextQuestion();
        }, 2000);
      }
    }, 1000);
  }

  /**
   * Update question timer display
   */
  updateQuestionTimerDisplay() {
    const timerDisplay = document.getElementById("question-timer");
    if (timerDisplay) {
      timerDisplay.textContent = this.questionTimeRemaining;

      // Add warning class when time is running low
      if (this.questionTimeRemaining <= 10) {
        timerDisplay.classList.add("timer-warning");
      } else {
        timerDisplay.classList.remove("timer-warning");
      }

      // Add critical class when time is very low
      if (this.questionTimeRemaining <= 5) {
        timerDisplay.classList.add("timer-critical");
      } else {
        timerDisplay.classList.remove("timer-critical");
      }
    }
  }

  /**
   * Show the next question
   */
  async nextQuestion() {
    // Clear any existing question timer
    if (this.questionTimer) {
      clearInterval(this.questionTimer);
    }

    // Clear any existing hints
    this.currentHints = [];

    // Check if we've reached the maximum number of questions
    if (this.questionCount >= this.settings.questionCount) {
      this.endQuiz();
      return;
    }

    this.questionCount++;

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
      document.getElementById("continue-btn").onclick = () =>
        this.nextQuestion();
    }
  }

  /**
   * Get random countries from the filtered data
   */
  getRandomCountries(count) {
    const shuffled = [...this.filteredCountries].sort(
      () => 0.5 - Math.random()
    );
    return shuffled.slice(0, count);
  }

  /**
   * Render the current question
   */
  renderQuestion() {
    const { correctCountry, options } = this.currentQuestion;
    const capital = correctCountry.capital[0];

    this.quizContent.innerHTML = `
        <div class="question-counter">
          Question ${this.questionCount} of ${this.settings.questionCount}
          <div class="question-timer-container">
            Time remaining: <span id="question-timer">${
              this.questionTimeLimit
            }</span> seconds
          </div>
        </div>
        <div class="capital-question">
          <div class="capital-container">
            <h2 class="capital-name">${capital}</h2>
            <p class="question-text">Which country has this capital city?</p>
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
      button.onclick = (event) => {
        this.checkAnswer(event.target.dataset.code);
      };
    });
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
   * Show a hint for the current question
   */
  showHint() {
    const { correctCountry } = this.currentQuestion;
    const hintContainer = document.getElementById("hint-container");

    // Only allow hints if we have score to spend and haven't used all hints
    if (this.score <= 0 || this.currentHints.length >= 3) {
      if (this.score <= 0) {
        alert("You need at least 1 point to get a hint.");
      } else {
        alert("You've used all available hints for this question.");
      }
      return;
    }

    // List of possible hints
    const availableHints = [
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

    if (availableHints.length === 0) {
      alert("No more hints available for this question.");
      return;
    }

    // Select a random hint
    const randomHint =
      availableHints[Math.floor(Math.random() * availableHints.length)];
    this.currentHints.push(randomHint);

    // Deduct point for hint
    this.score = Math.max(0, this.score - 1);
    this.updateScore();

    // Display the hint
    hintContainer.innerHTML += `
        <div class="hint">
          <span class="hint-icon">💡</span> ${randomHint.text}
        </div>
      `;
  }

  /**
   * Show feedback after answering
   */
  showFeedback(message, isCorrect) {
    const feedbackDiv = document.createElement("div");
    feedbackDiv.className = `feedback ${isCorrect ? "correct" : "incorrect"}`;
    feedbackDiv.textContent = message;

    document.body.appendChild(feedbackDiv);

    // Remove the feedback after animation completes
    setTimeout(() => {
      if (document.body.contains(feedbackDiv)) {
        document.body.removeChild(feedbackDiv);
      }
    }, 2000);
  }

  /**
   * Update the score display
   */
  updateScore() {
    this.scoreElement.textContent = this.score;
  }

  /**
   * Start the quiz timer
   */
  startTimer() {
    // Clear any existing timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.startTime = Date.now();

    this.timerInterval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;

      this.timerElement.textContent = `${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }, 1000);
  }

  /**
   * End the quiz
   */
  endQuiz() {
    // Stop all timers
    clearInterval(this.timerInterval);
    clearInterval(this.questionTimer);

    // Calculate final time
    const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    // Calculate maximum possible score
    const maxPossibleScore =
      this.initialScore + 2 * this.settings.questionCount;

    // Save stats to localStorage
    this.saveStats();

    // Hide quiz controls when quiz is complete
    if (this.quizControls) {
      this.quizControls.classList.add("hidden");
    }

    // Show results
    this.quizContent.innerHTML = `
        <div class="quiz-results">
          <h2>Quiz Complete!</h2>
          <p>Your final score: ${this.score}/${maxPossibleScore}</p>
          <p>Time taken: ${minutes}m ${seconds}s</p>
          <p>Region: ${
            this.settings.region === "all"
              ? "All Regions"
              : this.settings.region
          }</p>
          <p>Questions: ${this.settings.questionCount}</p>
          <p>Difficulty: ${this.settings.difficulty}</p>
          <div class="result-buttons">
            <button id="play-again-btn" class="btn">Play Again</button>
            <button id="change-settings-btn" class="btn">Change Settings</button>
            <button id="home-btn" class="btn">Back to Home</button>
          </div>
        </div>
      `;

    // Use onclick instead of addEventListener to prevent multiple bindings
    document.getElementById("play-again-btn").onclick = () => this.startQuiz();
    document.getElementById("change-settings-btn").onclick = () => {
      const event = new CustomEvent("openSettings");
      document.dispatchEvent(event);
    };
    document.getElementById("home-btn").onclick = () => {
      document.getElementById("quiz-container").classList.add("hidden");
      document.getElementById("welcome-section").classList.remove("hidden");
    };
  }

  /**
   * Save quiz stats to localStorage
   */
  saveStats() {
    const statsKey = "geoQuizStats";
    let stats = JSON.parse(localStorage.getItem(statsKey)) || {};

    // Initialize capital quiz stats if not exist
    if (!stats.capital) {
      stats.capital = { bestScore: 0, gamesPlayed: 0 };
    }

    // Update stats
    stats.capital.gamesPlayed += 1;
    if (this.score > stats.capital.bestScore) {
      stats.capital.bestScore = this.score;
    }

    // Save updated stats
    localStorage.setItem(statsKey, JSON.stringify(stats));
  }

  /**
   * Utility method to shuffle an array
   */
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

export default CapitalQuiz;
