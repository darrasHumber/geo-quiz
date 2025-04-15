// js/app.js
import FlagQuiz from "./modules/flag-quiz.js";

document.addEventListener("DOMContentLoaded", function () {
  // Elements
  const welcomeSection = document.getElementById("welcome-section");
  const quizContainer = document.getElementById("quiz-container");
  const quizCards = document.querySelectorAll(".quiz-card");
  const themeToggle = document.getElementById("theme-toggle");
  const profileBtn = document.getElementById("profile-btn");
  const profileModal = document.getElementById("profile-modal");
  const closeBtn = profileModal.querySelector(".close-btn");
  const resetStatsBtn = document.getElementById("reset-stats");

  // Active quiz instance
  let activeQuiz = null;

  // Initialize theme
  initTheme();

  // Update stats display
  updateStatsDisplay();

  // Add event listeners
  themeToggle.addEventListener("click", toggleTheme);

  // Quiz selection
  quizCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      const quizType = e.currentTarget.dataset.quiz;
      startQuiz(quizType);
    });
  });

  // Profile modal
  profileBtn.addEventListener("click", openProfileModal);
  closeBtn.addEventListener("click", closeProfileModal);
  window.addEventListener("click", (e) => {
    if (e.target === profileModal) {
      closeProfileModal();
    }
  });

  // Reset stats
  resetStatsBtn.addEventListener("click", confirmResetStats);

  // Theme functions
  function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    if (savedTheme === "dark") {
      document.body.setAttribute("data-theme", "dark");
    } else {
      document.body.removeAttribute("data-theme");
    }
  }

  function toggleTheme() {
    const currentTheme = document.body.hasAttribute("data-theme")
      ? "dark"
      : "light";
    const newTheme = currentTheme === "light" ? "dark" : "light";

    localStorage.setItem("theme", newTheme);

    if (newTheme === "dark") {
      document.body.setAttribute("data-theme", "dark");
    } else {
      document.body.removeAttribute("data-theme");
    }
  }

  // Profile functions
  function openProfileModal() {
    updateStatsDisplay();
    profileModal.classList.remove("hidden");
    setTimeout(() => {
      profileModal.classList.add("active");
    }, 10);
  }

  function closeProfileModal() {
    profileModal.classList.remove("active");
    setTimeout(() => {
      profileModal.classList.add("hidden");
    }, 300);
  }

  function updateStatsDisplay() {
    const stats = JSON.parse(localStorage.getItem("geoQuizStats")) || {
      flag: { bestScore: 0, gamesPlayed: 0 },
      capital: { bestScore: 0, gamesPlayed: 0 },
      size: { bestScore: 0, gamesPlayed: 0 },
      population: { bestScore: 0, gamesPlayed: 0 },
    };

    // Update each quiz stats display
    Object.keys(stats).forEach((quizType) => {
      const bestScoreElement = document.getElementById(`${quizType}-best`);
      const gamesPlayedElement = document.getElementById(`${quizType}-games`);

      if (bestScoreElement && gamesPlayedElement) {
        bestScoreElement.textContent = stats[quizType].bestScore;
        gamesPlayedElement.textContent = stats[quizType].gamesPlayed;
      }
    });

    // Update last updated timestamp
    const lastUpdatedElement = document.getElementById("last-updated");
    if (lastUpdatedElement) {
      const now = new Date();
      lastUpdatedElement.textContent = now.toLocaleString();
    }
  }

  function confirmResetStats() {
    if (
      confirm(
        "Are you sure you want to reset all your stats? This cannot be undone."
      )
    ) {
      resetStats();
    }
  }

  function resetStats() {
    localStorage.setItem(
      "geoQuizStats",
      JSON.stringify({
        flag: { bestScore: 0, gamesPlayed: 0 },
        capital: { bestScore: 0, gamesPlayed: 0 },
        size: { bestScore: 0, gamesPlayed: 0 },
        population: { bestScore: 0, gamesPlayed: 0 },
      })
    );

    updateStatsDisplay();
  }

  // Quiz functions
  function startQuiz(quizType) {
    // Hide welcome section, show quiz container
    welcomeSection.classList.add("hidden");
    quizContainer.classList.remove("hidden");

    // Set quiz title
    document.getElementById("quiz-title").textContent = getQuizTitle(quizType);

    // Initialize quiz based on type
    switch (quizType) {
      case "flag":
        activeQuiz = new FlagQuiz();
        break;
      case "capital":
        // We'll implement other quiz types later
        alert("Capital Cities quiz coming soon!");
        welcomeSection.classList.remove("hidden");
        quizContainer.classList.add("hidden");
        return;
      case "size":
        alert("Size Ranking quiz coming soon!");
        welcomeSection.classList.remove("hidden");
        quizContainer.classList.add("hidden");
        return;
      case "population":
        alert("Population quiz coming soon!");
        welcomeSection.classList.remove("hidden");
        quizContainer.classList.add("hidden");
        return;
      default:
        // Default to flag quiz
        activeQuiz = new FlagQuiz();
    }

    // Start the quiz
    activeQuiz.init();
  }

  function getQuizTitle(quizType) {
    const titles = {
      flag: "Flag Challenge",
      capital: "Capital Cities Quiz",
      size: "Size Ranking Quiz",
      population: "Population Quiz",
    };

    return titles[quizType] || "Geography Quiz";
  }
});
