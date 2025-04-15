document.addEventListener("DOMContentLoaded", function () {
  // Get DOM elements
  const themeToggle = document.getElementById("theme-toggle");
  const profileBtn = document.getElementById("profile-btn");
  const profileModal = document.getElementById("profile-modal");
  const closeBtn = document.querySelector(".close-btn");
  const resetStatsBtn = document.getElementById("reset-stats");
  const quizCards = document.querySelectorAll(".quiz-card");

  // Theme handling
  function loadTheme() {
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

  // Profile modal handling
  function openProfileModal() {
    profileModal.classList.remove("hidden");
  }

  function closeProfileModal() {
    profileModal.classList.add("hidden");
  }

  // Event listeners
  themeToggle.addEventListener("click", toggleTheme);
  profileBtn.addEventListener("click", openProfileModal);
  closeBtn.addEventListener("click", closeProfileModal);

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === profileModal) {
      closeProfileModal();
    }
  });

  // Initialize theme
  loadTheme();
});
