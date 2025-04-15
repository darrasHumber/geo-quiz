import FlagQuiz from "./modules/flag-quiz.js";
import CapitalQuiz from "./modules/capital-quiz.js";

document.addEventListener("DOMContentLoaded", function () {
  const welcomeSection = document.getElementById("welcome-section");
  const quizContainer = document.getElementById("quiz-container");
  const quizCards = document.querySelectorAll(".quiz-card");
  const themeToggle = document.getElementById("theme-toggle");
  const profileBtn = document.getElementById("profile-btn");
  const profileModal = document.getElementById("profile-modal");
  const settingsModal = document.getElementById("settings-modal");
  const closeProfileBtn = profileModal.querySelector(".close-btn");
  const resetStatsBtn = document.getElementById("reset-stats");
  const questionSlider = document.getElementById("question-count-slider");
  const questionDisplay = document.getElementById("question-count-display");

  let activeQuiz = null;

  initTheme();
  updateStatsDisplay();

  // Event listeners
  themeToggle.addEventListener("click", toggleTheme);

  quizCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      startQuiz(e.currentTarget.dataset.quiz);
    });
  });

  profileBtn.addEventListener("click", openProfileModal);
  closeProfileBtn.addEventListener("click", closeProfileModal);

  if (settingsModal) {
    const closeSettingsBtn = settingsModal.querySelector(".close-btn");
    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener("click", closeSettingsModal);
    }

    const applySettingsBtn = document.getElementById("apply-settings");
    if (applySettingsBtn) {
      applySettingsBtn.addEventListener("click", applySettings);
    }
  }

  if (questionSlider && questionDisplay) {
    questionSlider.addEventListener("input", function () {
      questionDisplay.textContent = this.value + " Questions";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === profileModal) closeProfileModal();
    if (e.target === settingsModal) closeSettingsModal();
  });

  document.addEventListener("openSettings", openSettingsModal);
  resetStatsBtn.addEventListener("click", confirmResetStats);

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

  function openProfileModal() {
    updateStatsDisplay();
    profileModal.classList.remove("hidden");
    setTimeout(() => profileModal.classList.add("active"), 10);
  }

  function closeProfileModal() {
    profileModal.classList.remove("active");
    setTimeout(() => profileModal.classList.add("hidden"), 300);
  }

  function openSettingsModal() {
    if (!settingsModal || !activeQuiz) return;

    const currentSettings = activeQuiz.settings;

    // Region selection
    document.querySelectorAll('input[name="region"]').forEach((radio) => {
      radio.checked = radio.value === currentSettings.region;
    });

    // Question count
    if (questionSlider && questionDisplay) {
      questionSlider.value = currentSettings.questionCount;
      questionDisplay.textContent = `${currentSettings.questionCount} Questions`;
    }

    // Difficulty
    document.querySelectorAll('input[name="difficulty"]').forEach((radio) => {
      radio.checked = radio.value === currentSettings.difficulty;
    });

    settingsModal.classList.remove("hidden");
    setTimeout(() => settingsModal.classList.add("active"), 10);
  }

  function closeSettingsModal() {
    if (!settingsModal) return;
    settingsModal.classList.remove("active");
    setTimeout(() => settingsModal.classList.add("hidden"), 300);
  }

  function applySettings() {
    if (!activeQuiz) return;

    const regionValue =
      document.querySelector('input[name="region"]:checked')?.value || "all";
    const questionCount = questionSlider ? parseInt(questionSlider.value) : 10;
    const difficultyValue =
      document.querySelector('input[name="difficulty"]:checked')?.value ||
      "easy";

    activeQuiz.updateSettings({
      region: regionValue,
      questionCount: questionCount,
      difficulty: difficultyValue,
    });

    closeSettingsModal();
  }

  function updateStatsDisplay() {
    const stats = JSON.parse(localStorage.getItem("geoQuizStats")) || {
      flag: { bestScore: 0, gamesPlayed: 0 },
      capital: { bestScore: 0, gamesPlayed: 0 },
      size: { bestScore: 0, gamesPlayed: 0 },
      population: { bestScore: 0, gamesPlayed: 0 },
    };

    Object.keys(stats).forEach((quizType) => {
      const bestScoreElement = document.getElementById(`${quizType}-best`);
      const gamesPlayedElement = document.getElementById(`${quizType}-games`);

      if (bestScoreElement && gamesPlayedElement) {
        bestScoreElement.textContent = stats[quizType].bestScore;
        gamesPlayedElement.textContent = stats[quizType].gamesPlayed;
      }
    });

    const lastUpdatedElement = document.getElementById("last-updated");
    if (lastUpdatedElement) {
      lastUpdatedElement.textContent = new Date().toLocaleString();
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

  function startQuiz(quizType) {
    welcomeSection.classList.add("hidden");
    quizContainer.classList.remove("hidden");
    document.getElementById("quiz-title").textContent = getQuizTitle(quizType);

    switch (quizType) {
      case "flag":
        activeQuiz = new FlagQuiz();
        break;
      case "capital":
        activeQuiz = new CapitalQuiz();
        break;
      case "size":
      case "population":
        alert(`${getQuizTitle(quizType)} coming soon!`);
        welcomeSection.classList.remove("hidden");
        quizContainer.classList.add("hidden");
        return;
      default:
        activeQuiz = new FlagQuiz();
    }

    const settingsBtn = document.getElementById("quiz-settings-btn");
    if (settingsBtn) {
      const newSettingsBtn = settingsBtn.cloneNode(true);
      settingsBtn.parentNode.replaceChild(newSettingsBtn, settingsBtn);
      newSettingsBtn.addEventListener("click", openSettingsModal);
    }

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
