/**
 * Base Quiz Module - Core functionality for all quiz types
 */
class BaseQuiz {
  constructor(quizType) {
    // Store quiz type for stats and settings
    this.quizType = quizType;

    // DOM elements
    this.quizContainer = document.getElementById("quiz-container");
    this.quizContent = document.getElementById("quiz-content");
    this.scoreElement = document.getElementById("current-score");
    this.timerElement = document.getElementById("timer");
    this.hintButton = document.getElementById("hint-btn");
    this.skipButton = document.getElementById("skip-btn");
    this.settingsButton = document.getElementById("quiz-settings-btn");
    this.quizControls = document.querySelector(".quiz-controls");
    this.quizHeader = document.querySelector(".quiz-header");

    // Quiz state
    this.currentQuestion = null;
    this.allCountries = [];
    this.filteredCountries = [];
    this.usedCountriesIndices = new Set(); // Track used countries to prevent repeating questions
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

    // Force removal of all existing timers when a new instance is created
    window.clearAllQuizTimers && window.clearAllQuizTimers();

    // Global timer tracking
    if (!window.quizTimers) {
      window.quizTimers = [];
    }

    // Load saved settings if available
    this.loadSettings();
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Use a safe approach to add event listeners
    if (this.hintButton) {
      // Remove all existing click handlers
      const newHintBtn = this.hintButton.cloneNode(true);
      if (this.hintButton.parentNode) {
        this.hintButton.parentNode.replaceChild(newHintBtn, this.hintButton);
        this.hintButton = newHintBtn;
        this.hintButton.addEventListener("click", this.showHint.bind(this));
      }
    }

    if (this.skipButton) {
      // Remove all existing click handlers
      const newSkipBtn = this.skipButton.cloneNode(true);
      if (this.skipButton.parentNode) {
        this.skipButton.parentNode.replaceChild(newSkipBtn, this.skipButton);
        this.skipButton = newSkipBtn;
        this.skipButton.addEventListener("click", this.nextQuestion.bind(this));
      }
    }
  }

  /**
   * Global timer management
   */
  registerTimer(timerId) {
    window.quizTimers.push(timerId);
    return timerId;
  }

  /**
   * Stop all timers globally
   */
  static clearAllTimers() {
    if (window.quizTimers && window.quizTimers.length > 0) {
      window.quizTimers.forEach((id) => {
        clearInterval(id);
        clearTimeout(id);
      });
      window.quizTimers = [];
    }
  }

  /**
   * Setup global timer cleanup
   */
  static setupGlobalTimerCleanup() {
    window.clearAllQuizTimers = BaseQuiz.clearAllTimers;
  }

  /**
   * Add back button to quiz header
   */
  addBackButton() {
    // Check if back button already exists
    if (document.getElementById("back-button")) {
      return;
    }

    // Create back button
    const backButton = document.createElement("button");
    backButton.id = "back-button";
    backButton.className = "btn back-btn";
    backButton.innerHTML = "&larr; Back to Home";

    // Add event listener
    backButton.addEventListener("click", this.quitQuiz.bind(this));

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
        "Are you sure you want to quit this quiz? Your progress will be lost."
      )
    ) {
      // Stop all timers
      BaseQuiz.clearAllTimers();

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

    // Stop all timers
    BaseQuiz.clearAllTimers();

    // Reset used countries
    this.usedCountriesIndices.clear();

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
    const settingsKey = `${this.quizType}QuizSettings`;
    const savedSettings = localStorage.getItem(settingsKey);
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
    const settingsKey = `${this.quizType}QuizSettings`;
    localStorage.setItem(settingsKey, JSON.stringify(this.settings));
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

    // Reset used countries when filter changes
    this.usedCountriesIndices.clear();
  }

  /**
   * Initialize the quiz
   */
  async init() {
    try {
      // Stop all timers first
      BaseQuiz.clearAllTimers();

      // Initialize event listeners
      this.initEventListeners();

      // Reset used countries
      this.usedCountriesIndices.clear();

      // Show loading state
      this.quizContent.innerHTML =
        '<div class="loading">Loading countries...</div>';

      // Load countries using fetch
      const response = await fetch("https://restcountries.com/v3.1/all");
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const allCountriesData = await response.json();

      // Filter countries according to quiz-specific requirements
      this.allCountries = this.filterCountriesData(allCountriesData);

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

      // Safely add click handler
      const retryBtn = document.getElementById("retry-btn");
      if (retryBtn) {
        retryBtn.addEventListener("click", this.init.bind(this));
      }
    }
  }

  /**
   * Filter countries based on quiz-specific requirements
   * Override this method in each quiz class
   */
  filterCountriesData(allCountriesData) {
    // By default, just return countries with name
    return allCountriesData.filter((country) => country.name);
  }

  /**
   * Show the start screen with settings
   * Override this method in each quiz class
   */
  showStartScreen() {
    // This should be implemented by each specific quiz type
    console.warn("showStartScreen not implemented in BaseQuiz");
  }

  /**
   * Start the quiz
   */
  startQuiz() {
    // First, stop all timers
    BaseQuiz.clearAllTimers();

    // Reset quiz state
    this.score = this.settings.questionCount; // Initialize score to number of questions
    this.initialScore = this.settings.questionCount;
    this.hintsUsed = 0;
    this.questionCount = 0;
    this.updateScore();
    this.usedCountriesIndices.clear(); // Reset used countries tracking

    // Reset quiz started flag
    this.quizStarted = true;

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
    // First, clear any existing question timer
    if (this.questionTimer) {
      clearInterval(this.questionTimer);
      this.questionTimer = null;
    }

    // Reset timer
    this.questionTimeRemaining = this.questionTimeLimit;
    this.updateQuestionTimerDisplay();

    // Create a new timer with a safe reference
    const self = this;
    const newTimer = setInterval(function () {
      self.questionTimeRemaining--;
      self.updateQuestionTimerDisplay();

      // Move to next question when time is up
      if (self.questionTimeRemaining <= 0) {
        clearInterval(self.questionTimer);
        self.questionTimer = null;
        self.showTimeUpFeedback();

        // Show next question after delay
        const timeoutId = setTimeout(function () {
          self.nextQuestion();
        }, 2000);

        // Register the timeout
        self.registerTimer(timeoutId);
      }
    }, 1000);

    // Store and register the timer
    this.questionTimer = this.registerTimer(newTimer);
  }

  /**
   * Show feedback when time is up
   * Override this method in each quiz class
   */
  showTimeUpFeedback() {
    // This should be implemented by each specific quiz type
    console.warn("showTimeUpFeedback not implemented in BaseQuiz");
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
   * This method should be overridden by each quiz type
   */
  nextQuestion() {
    // First, clear any existing question timer
    if (this.questionTimer) {
      clearInterval(this.questionTimer);
      this.questionTimer = null;
    }

    // Clear any existing hints
    this.currentHints = [];

    // Increment question count
    this.questionCount++;

    // Check if we've reached the maximum number of questions
    if (this.questionCount > this.settings.questionCount) {
      this.endQuiz();
      return false; // Signal that no more questions should be shown
    }

    return true; // Signal that we should continue with the next question
  }

  /**
   * Get random countries from the filtered data without repeating
   */
  getRandomCountries(count) {
    // Check if we're running out of unused countries
    if (
      this.usedCountriesIndices.size >=
      this.filteredCountries.length - count
    ) {
      this.usedCountriesIndices.clear(); // Reset if we're running out of countries
    }

    // First select the correct answer (country that hasn't been used yet)
    const result = [];
    const availableIndices = [];

    // Build list of unused indices
    for (let i = 0; i < this.filteredCountries.length; i++) {
      if (!this.usedCountriesIndices.has(i)) {
        availableIndices.push(i);
      }
    }

    // If no unused countries, just use all filtered countries
    if (availableIndices.length === 0) {
      const shuffled = [...this.filteredCountries].sort(
        () => 0.5 - Math.random()
      );
      return shuffled.slice(0, count);
    }

    // Select an unused country for the correct answer
    const randomUnusedIndex =
      availableIndices[Math.floor(Math.random() * availableIndices.length)];
    result.push(this.filteredCountries[randomUnusedIndex]);
    this.usedCountriesIndices.add(randomUnusedIndex); // Mark as used

    // Add remaining options (these can be repeated from previous questions)
    const otherOptions = this.filteredCountries.filter(
      (country) =>
        !result.some((selectedCountry) => selectedCountry.cca3 === country.cca3)
    );

    const shuffledOptions = this.shuffleArray(otherOptions);
    result.push(...shuffledOptions.slice(0, count - 1));

    return result;
  }

  /**
   * Show a hint for the current question
   * Parts of this may need to be overridden in specific quiz classes
   */
  showHint() {
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

    // Get available hints - should be implemented in each quiz class
    const availableHints = this.getAvailableHints();

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
    if (hintContainer) {
      hintContainer.innerHTML += `
          <div class="hint">
            <span class="hint-icon">💡</span> ${randomHint.text}
          </div>
        `;
    }
  }

  /**
   * Get available hints for the current question
   * This should be overridden in each quiz class
   */
  getAvailableHints() {
    return [];
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
    const timeoutId = setTimeout(() => {
      if (document.body.contains(feedbackDiv)) {
        document.body.removeChild(feedbackDiv);
      }
    }, 2000);

    // Register the timeout
    this.registerTimer(timeoutId);
  }

  /**
   * Update the score display
   */
  updateScore() {
    if (this.scoreElement) {
      this.scoreElement.textContent = this.score;
    }
  }

  /**
   * Start the quiz timer
   */
  startTimer() {
    // First clear any existing timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.startTime = Date.now();

    // Create a new timer with a safe reference
    const self = this;
    const newTimer = setInterval(function () {
      const elapsedSeconds = Math.floor((Date.now() - self.startTime) / 1000);
      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;

      if (self.timerElement) {
        self.timerElement.textContent = `${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      }
    }, 1000);

    // Store and register the timer
    this.timerInterval = this.registerTimer(newTimer);
  }

  /**
   * End the quiz
   */
  endQuiz() {
    // Stop all timers
    BaseQuiz.clearAllTimers();

    // Calculate final time
    const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    // Calculate maximum possible score (initial + 2 points per correct answer)
    const maxPossibleScore =
      this.initialScore + 2 * this.settings.questionCount;

    // Calculate percentage score - ADD THIS
    const percentageScore = Math.round((this.score / maxPossibleScore) * 100);

    // Save stats to localStorage
    this.saveStats(percentageScore); // MODIFY THIS

    // Hide quiz controls when quiz is complete
    if (this.quizControls) {
      this.quizControls.classList.add("hidden");
    }

    // Reset quiz started flag
    this.quizStarted = false;

    // Show results
    this.quizContent.innerHTML = `
        <div class="quiz-results">
          <h2>Quiz Complete!</h2>
          <p>Your final score: ${
            this.score
          }/${maxPossibleScore} (${percentageScore}%)</p>
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

    // Add event listeners (safely)
    setTimeout(() => {
      const playAgainBtn = document.getElementById("play-again-btn");
      if (playAgainBtn) {
        playAgainBtn.addEventListener("click", () => {
          this.startQuiz();
        });
      }

      const changeSettingsBtn = document.getElementById("change-settings-btn");
      if (changeSettingsBtn) {
        changeSettingsBtn.addEventListener("click", () => {
          const event = new CustomEvent("openSettings");
          document.dispatchEvent(event);
        });
      }

      const homeBtn = document.getElementById("home-btn");
      if (homeBtn) {
        homeBtn.addEventListener("click", () => {
          document.getElementById("quiz-container").classList.add("hidden");
          document.getElementById("welcome-section").classList.remove("hidden");
        });
      }
    }, 0);

    // Rest of your method remains the same...
  }

  /**
   * Save quiz stats to localStorage
   */
  saveStats(percentageScore) {
    const statsKey = "geoQuizStats";
    let stats = JSON.parse(localStorage.getItem(statsKey)) || {};

    // Initialize quiz-specific stats if not exist
    if (!stats[this.quizType]) {
      stats[this.quizType] = {
        bestScore: 0,
        bestPercentage: 0,
        gamesPlayed: 0,
      };
    }

    // Update stats
    stats[this.quizType].gamesPlayed += 1;
    if (this.score > stats[this.quizType].bestScore) {
      stats[this.quizType].bestScore = this.score;
    }

    // Update percentage score
    if (percentageScore > (stats[this.quizType].bestPercentage || 0)) {
      stats[this.quizType].bestPercentage = percentageScore;
    }

    // Save updated stats
    localStorage.setItem(statsKey, JSON.stringify(stats));
  }

  /**
   * Utility method to shuffle an array
   */
  shuffleArray(array) {
    const newArray = [...array]; // Create a copy to avoid mutating the original
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }
}

// Setup global timer cleanup on load
BaseQuiz.setupGlobalTimerCleanup();

export default BaseQuiz;
