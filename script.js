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

const WIN_SCORE = 120;
const MAX_LIVES = 5;

const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const livesDisplay = document.getElementById("lives");
const gameContainer = document.getElementById("game-container");
const messageDisplay = document.getElementById("message");
const basket = document.getElementById("basket");

startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);

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

function startGame() {
  if (gameRunning) return;

  clearAllTimers();
  clearDrops();

  gameRunning = true;
  score = 0;
  timeLeft = 30;
  lives = MAX_LIVES;
  activeDrops = [];
  leftPressed = false;
  rightPressed = false;

  centerTanker();
  updateDisplay();
  setMessage("Drive the tanker with the left and right arrow keys.", "#159A48");

  dropMaker = setInterval(createDrop, 850);

  timerInterval = setInterval(() => {
    if (!gameRunning) return;

    timeLeft--;
    updateDisplay();

    if (timeLeft <= 0) {
      endGame(false);
    }
  }, 1000);

  gameLoop();
}

function resetGame() {
  gameRunning = false;
  clearAllTimers();
  clearDrops();

  score = 0;
  timeLeft = 30;
  lives = MAX_LIVES;
  activeDrops = [];
  leftPressed = false;
  rightPressed = false;

  centerTanker();
  updateDisplay();
  setMessage("Game reset. Press Start to catch the water again.", "#2E9DF7");
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
  const speed = 8;
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

  const drop = document.createElement("div");
  drop.classList.add("water-drop");

  const isBad = Math.random() < 0.25;
  drop.classList.add(isBad ? "bad-drop" : "good-drop");

  const size = Math.random() * 16 + 34;
  const containerWidth = gameContainer.clientWidth;
  const x = Math.random() * (containerWidth - size);
  const y = -size;
  const speed = Math.random() * 1.1 + 1.7;

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
      dropBottom <= basketTop + 32 &&
      dropRight >= basketLeft &&
      dropLeft <= basketRight;

    if (caughtByTanker) {
      if (drop.isBad) {
        score = Math.max(0, score - 10);
        lives--;
        setMessage("Polluted water hit the tanker. Score down.", "#F05A49");
        flashContainer("flash-bad");
      } else {
        score += 10;
        setMessage("Clean water collected. Nice catch.", "#159A48");
        flashContainer("flash-good");
      }

      updateDisplay();
      removeDrop(i);

      if (score >= WIN_SCORE) {
        endGame(true);
        return;
      }

      if (lives <= 0) {
        endGame(false, "Out of water lives.");
        return;
      }

      continue;
    }

    if (drop.y > containerHeight) {
      if (!drop.isBad) {
        lives--;
        setMessage("You missed a clean water drop.", "#F05A49");
        updateDisplay();

        if (lives <= 0) {
          endGame(false, "Out of water lives.");
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
  document.querySelectorAll(".water-drop").forEach((drop) => drop.remove());
  activeDrops = [];
}

function updateDisplay() {
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeLeft;

  let drops = "";
  for (let i = 0; i < lives; i++) drops += "💧";
  for (let i = lives; i < MAX_LIVES; i++) drops += "▫️";
  livesDisplay.textContent = drops;
}

function setMessage(text, color) {
  messageDisplay.textContent = text;
  messageDisplay.style.color = color;
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
  gameRunning = false;
  clearAllTimers();
  clearDrops();

  if (isWin) {
    score = WIN_SCORE;
    updateDisplay();
    launchConfetti();
    setMessage("You filled the future. You win!", "#159A48");
    return;
  }

  if (customMessage) {
    setMessage(`${customMessage} Final score: ${score}.`, "#F05A49");
    return;
  }

  setMessage(`Time's up. Final score: ${score}.`, "#F05A49");
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

function clearAllTimers() {
  clearInterval(dropMaker);
  clearInterval(timerInterval);
  cancelAnimationFrame(animationFrame);
}

updateDisplay();
requestAnimationFrame(centerTanker);
setMessage("Press Start, then use the left and right arrow keys to drive the tanker.", "#2E9DF7");