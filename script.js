let gameRunning = false;
let dropMaker = null;
let timerInterval = null;
let animationFrame = null;

let score = 0;
let timeLeft = 30;
let lives = 5;
let basketX = 0;
let activeDrops = [];

let leftPressed = false;
let rightPressed = false;
let milestonesTriggered = [];

const MAX_LIVES = 5;

const difficultySettings = {
  easy: {
    label: "Easy",
    winScore: 80,
    time: 40,
    spawnRate: 950,
    speedMin: 1.6,
    speedMax: 2.6,
    badChance: 0.18,
    pointsGood: 10,
    pointsBad: -5
  },
  normal: {
    label: "Normal",
    winScore: 120,
    time: 30,
    spawnRate: 800,
    speedMin: 2.0,
    speedMax: 3.2,
    badChance: 0.25,
    pointsGood: 10,
    pointsBad: -10
  },
  hard: {
    label: "Hard",
    winScore: 160,
    time: 24,
    spawnRate: 650,
    speedMin: 2.6,
    speedMax: 4.0,
    badChance: 0.35,
    pointsGood: 10,
    pointsBad: -15
  }
};

const milestoneMessages = [
  { score: 20, text: "Strong start — clean water is on the way." },
  { score: 50, text: "Milestone reached — more lives are being changed." },
  { score: 80, text: "Halfway there. Keep the tanker moving." },
  { score: 110, text: "Amazing momentum — almost at your goal." },
  { score: 140, text: "Final stretch. Deliver every drop you can." }
];

const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const difficultySelect = document.getElementById("difficulty");

const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const goalDisplay = document.getElementById("goal");
const livesDisplay = document.getElementById("lives");

const gameContainer = document.getElementById("game-container");
const messageDisplay = document.getElementById("message");
const milestoneDisplay = document.getElementById("milestone-message");
const basket = document.getElementById("basket");

const catchSound = document.getElementById("catch-sound");
const missSound = document.getElementById("miss-sound");
const winSound = document.getElementById("win-sound");

startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);

difficultySelect.addEventListener("change", () => {
  if (!gameRunning) {
    const settings = getCurrentDifficulty();
    goalDisplay.textContent = settings.winScore;
    timeDisplay.textContent = settings.time;
    setMessage(
      `${settings.label} selected. Reach ${settings.winScore} points in ${settings.time} seconds.`,
      "#2E9DF7"
    );
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    leftPressed = true;
    event.preventDefault();
  }

  if (event.key === "ArrowRight") {
    rightPressed = true;
    event.preventDefault();
  }
});

document.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft") {
    leftPressed = false;
  }

  if (event.key === "ArrowRight") {
    rightPressed = false;
  }
});

window.addEventListener("resize", centerTanker);

function getCurrentDifficulty() {
  return difficultySettings[difficultySelect.value];
}

function startGame() {
  if (gameRunning) return;

  const settings = getCurrentDifficulty();

  clearAllTimers();
  clearDrops();

  gameRunning = true;
  score = 0;
  timeLeft = settings.time;
  lives = MAX_LIVES;
  activeDrops = [];
  milestonesTriggered = [];
  leftPressed = false;
  rightPressed = false;

  centerTanker();
  updateDisplay();
  clearMilestone();
  setMessage(
    `${settings.label} mode started. Catch clean water and avoid polluted drops.`,
    "#159A48"
  );

  dropMaker = setInterval(createDrop, settings.spawnRate);

  timerInterval = setInterval(() => {
    if (!gameRunning) return;

    timeLeft--;
    updateDisplay();

    if (timeLeft <= 0) {
      endGame(false, "Time's up.");
    }
  }, 1000);

  gameLoop();
}

function resetGame() {
  gameRunning = false;
  clearAllTimers();
  clearDrops();

  const settings = getCurrentDifficulty();

  score = 0;
  timeLeft = settings.time;
  lives = MAX_LIVES;
  activeDrops = [];
  milestonesTriggered = [];
  leftPressed = false;
  rightPressed = false;

  centerTanker();
  updateDisplay();
  clearMilestone();
  setMessage(
    `Game reset. ${settings.label} mode is ready. Press Start to play again.`,
    "#2E9DF7"
  );
}

function gameLoop() {
  if (!gameRunning) return;

  moveTanker();
  moveDrops();
  animationFrame = requestAnimationFrame(gameLoop);
}

function centerTanker() {
  basketX = (gameContainer.clientWidth - basket.offsetWidth) / 2;
  basket.style.left = `${basketX}px`;
}

function moveTanker() {
  const speed = 9;
  const containerWidth = gameContainer.clientWidth;
  const basketWidth = basket.offsetWidth;

  if (leftPressed) basketX -= speed;
  if (rightPressed) basketX += speed;

  if (basketX < 0) basketX = 0;
  if (basketX > containerWidth - basketWidth) {
    basketX = containerWidth - basketWidth;
  }

  basket.style.left = `${basketX}px`;
}

function createDrop() {
  if (!gameRunning) return;

  const settings = getCurrentDifficulty();
  const isBad = Math.random() < settings.badChance;

  const drop = document.createElement("div");
  drop.className = isBad ? "polluted-drop" : "water-drop";

  const size = Math.random() * 16 + 34;
  const containerWidth = gameContainer.clientWidth;
  const x = Math.random() * (containerWidth - size);
  const y = -size;
  const speed =
    Math.random() * (settings.speedMax - settings.speedMin) + settings.speedMin;

  drop.style.width = `${size}px`;
  drop.style.height = `${size}px`;
  drop.style.left = `${x}px`;
  drop.style.top = `${y}px`;

  gameContainer.appendChild(drop);

  activeDrops.push({
    element: drop,
    x,
    y,
    size,
    speed,
    isBad
  });
}

function moveDrops() {
  const settings = getCurrentDifficulty();
  const containerHeight = gameContainer.clientHeight;
  const basketTop = basket.offsetTop;
  const basketLeft = basket.offsetLeft;
  const basketRight = basketLeft + basket.offsetWidth;

  for (let i = activeDrops.length - 1; i >= 0; i--) {
    const drop = activeDrops[i];
    drop.y += drop.speed;
    drop.element.style.top = `${drop.y}px`;

    const dropLeft = drop.x;
    const dropRight = drop.x + drop.size;
    const dropBottom = drop.y + drop.size;

    const caughtByTanker =
      dropBottom >= basketTop &&
      dropBottom <= basketTop + 34 &&
      dropRight >= basketLeft &&
      dropLeft <= basketRight;

    if (caughtByTanker) {
      if (drop.isBad) {
        score = Math.max(0, score + settings.pointsBad);
        lives--;
        setMessage("Polluted drop hit the tanker. Be careful.", "#F05A49");
        flashContainer("flash-bad");
      } else {
        score += settings.pointsGood;
        setMessage("Clean water collected. Great catch.", "#159A48");
        flashContainer("flash-good");
        playSound(catchSound);
      }

      updateDisplay();
      checkMilestones();
      removeDrop(i);

      if (score >= settings.winScore) {
        endGame(true);
        return;
      }

      if (lives <= 0) {
        endGame(false, "You ran out of water lives.");
        return;
      }

      continue;
    }

    if (drop.y > containerHeight) {
      if (!drop.isBad) {
        lives--;
        setMessage("You missed a clean water drop.", "#F05A49");
        playSound(missSound);
        updateDisplay();

        if (lives <= 0) {
          removeDrop(i);
          endGame(false, "You ran out of water lives.");
          return;
        }
      }

      removeDrop(i);
    }
  }
}

function removeDrop(index) {
  if (activeDrops[index]?.element) {
    activeDrops[index].element.remove();
  }
  activeDrops.splice(index, 1);
}

function clearDrops() {
  document.querySelectorAll(".water-drop, .polluted-drop").forEach((drop) => {
    drop.remove();
  });
  activeDrops = [];
}

function updateDisplay() {
  const settings = getCurrentDifficulty();

  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeLeft;
  goalDisplay.textContent = settings.winScore;

  let drops = "";
  for (let i = 0; i < lives; i++) drops += "💧";
  for (let i = lives; i < MAX_LIVES; i++) drops += "▫️";
  livesDisplay.textContent = drops;
}

function setMessage(text, color) {
  messageDisplay.textContent = text;
  messageDisplay.style.color = color;
}

function showMilestone(text) {
  milestoneDisplay.textContent = text;
  milestoneDisplay.classList.remove("milestone-pop");
  void milestoneDisplay.offsetWidth;
  milestoneDisplay.classList.add("milestone-pop");
}

function clearMilestone() {
  milestoneDisplay.textContent = "";
  milestoneDisplay.classList.remove("milestone-pop");
}

function checkMilestones() {
  for (const milestone of milestoneMessages) {
    if (score >= milestone.score && !milestonesTriggered.includes(milestone.score)) {
      milestonesTriggered.push(milestone.score);
      showMilestone(milestone.text);
    }
  }
}

function flashContainer(className) {
  gameContainer.classList.remove("flash-good", "flash-bad");
  void gameContainer.offsetWidth;
  gameContainer.classList.add(className);

  setTimeout(() => {
    gameContainer.classList.remove(className);
  }, 280);
}

function endGame(isWin = false, customMessage = "") {
  const settings = getCurrentDifficulty();

  gameRunning = false;
  clearAllTimers();
  clearDrops();

  if (isWin) {
    score = settings.winScore;
    updateDisplay();
    launchConfetti();
    playSound(winSound);
    setMessage("You filled the future. You win!", "#159A48");
    showMilestone("Mission complete — your tanker delivered safe water.");
    return;
  }

  if (customMessage) {
    setMessage(`${customMessage} Final score: ${score}.`, "#F05A49");
    showMilestone("Try again and deliver even more clean water.");
    return;
  }

  setMessage(`Game over. Final score: ${score}.`, "#F05A49");
}

function launchConfetti() {
  if (typeof confetti !== "function") return;

  confetti({
    particleCount: 140,
    spread: 80,
    origin: { y: 0.6 }
  });

  setTimeout(() => {
    confetti({
      particleCount: 90,
      spread: 110,
      origin: { y: 0.52 }
    });
  }, 260);
}

function playSound(audioElement) {
  if (!audioElement) return;

  try {
    audioElement.currentTime = 0;
    audioElement.play().catch(() => {});
  } catch (error) {}
}

function clearAllTimers() {
  clearInterval(dropMaker);
  clearInterval(timerInterval);
  cancelAnimationFrame(animationFrame);
}

updateDisplay();
requestAnimationFrame(centerTanker);
setMessage(
  "Press Start, then use the left and right arrow keys to drive the tanker.",
  "#2E9DF7"
);