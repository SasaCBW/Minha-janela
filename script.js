
"use strict";

// ==========================================
// MINHA JANELA — PROGRAMANDO SEU MUNDO
// ==========================================

const canvas = document.getElementById("worldCanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

const view = {
  x: 91,
  y: 91,
  w: 918,
  h: 515
};

// Elementos da interface
const startOverlay = document.getElementById("startOverlay");
const startButton = document.getElementById("startButton");
const overlayTitle = document.getElementById("overlayTitle");
const overlayDescription = document.getElementById("overlayDescription");

const statusText = document.getElementById("statusText");
const sceneMessage = document.getElementById("sceneMessage");
const clock = document.getElementById("clock");

const butterflyCount = document.getElementById("butterflyCount");
const visitCount = document.getElementById("visitCount");
const elapsedTime = document.getElementById("elapsedTime");

const landscapeSelect = document.getElementById("landscapeSelect");
const weatherSelect = document.getElementById("weatherSelect");
const speedRange = document.getElementById("speedRange");
const frequencyRange = document.getElementById("frequencyRange");

const speedValue = document.getElementById("speedValue");
const frequencyValue = document.getElementById("frequencyValue");

const pauseButton = document.getElementById("pauseButton");
const resetButton = document.getElementById("resetButton");
const addButterflyButton = document.getElementById("addButterflyButton");

const soundButton = document.getElementById("soundButton");
const soundIcon = document.getElementById("soundIcon");

// ==========================================
// CONFIGURAÇÕES
// ==========================================

let landscape = "meadow";
let period = "day";
let weather = "clear";

let running = false;
let paused = false;
let soundEnabled = true;

let butterflies = [];
let clouds = [];
let particles = [];
let stars = [];

let totalCreated = 0;
let totalVisits = 0;
let elapsedSeconds = 0;

let spawnTimer = 0;
let nextSpawn = 3.5;
let previousTime = 0;

let animationId = null;
let audioContext = null;

const speedNames = [
  "Muito lenta",
  "Lenta",
  "Normal",
  "Rápida",
  "Muito rápida"
];

const frequencyNames = [
  "Muito rara",
  "Rara",
  "Normal",
  "Frequente",
  "Muito frequente"
];

// ==========================================
// UTILITÁRIOS
// ==========================================

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function choose(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(remaining).padStart(2, "0")
  );
}

// ==========================================
// ÁUDIO
// ==========================================

function playTone(frequency, duration = 0.15, type = "sine") {
  if (!soundEnabled) return;

  try {
    audioContext ??= new (
      window.AudioContext || window.webkitAudioContext
    )();

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(
      0.035,
      audioContext.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);

  } catch (error) {
    console.warn("Não foi possível reproduzir o som.", error);
  }
}

function playWelcomeSound() {
  playTone(520, 0.15);

  setTimeout(() => {
    playTone(660, 0.15);
  }, 130);

  setTimeout(() => {
    playTone(790, 0.2);
  }, 260);
}

soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;

  soundIcon.textContent = soundEnabled ? "♫" : "♪";

  if (soundEnabled) {
    playTone(700);
  }
});

// ==========================================
// CRIAÇÃO DAS NUVENS
// ==========================================

function createClouds() {
  clouds = [];

  for (let i = 0; i < 8; i++) {
    clouds.push({
      x: random(0, view.w),
      y: random(25, 190),
      size: random(0.55, 1.25),
      speed: random(5, 13),
      opacity: random(0.55, 0.9)
    });
  }
}

function drawCloud(cloud) {
  ctx.save();

  ctx.globalAlpha = cloud.opacity;
  ctx.translate(cloud.x, cloud.y);
  ctx.scale(cloud.size, cloud.size);

  ctx.fillStyle = period === "day"
    ? "#ffffff"
    : "#a8b5c9";

  ctx.beginPath();
  ctx.arc(-28, 3, 22, 0, Math.PI * 2);
  ctx.arc(0, -9, 30, 0, Math.PI * 2);
  ctx.arc(28, 3, 22, 0, Math.PI * 2);
  ctx.arc(5, 10, 25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ==========================================
// ESTRELAS
// ==========================================

function createStars() {
  stars = [];

  for (let i = 0; i < 100; i++) {
    stars.push({
      x: random(0, view.w),
      y: random(0, view.h * 0.65),
      size: random(1, 2.7),
      phase: random(0, Math.PI * 2)
    });
  }
}

function drawStars() {
  if (period !== "night") return;

  stars.forEach(star => {
    const opacity = 0.45 +
      Math.sin(Date.now() * 0.002 + star.phase) * 0.35;

    ctx.globalAlpha = opacity;
    ctx.fillStyle = "#ffffff";

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
}

// ==========================================
// CÉU
// ==========================================

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, view.h);

  if (period === "day") {
    gradient.addColorStop(0, "#70b8dc");
    gradient.addColorStop(0.65, "#b9dfd8");
    gradient.addColorStop(1, "#e2e7bd");
  } else {
    gradient.addColorStop(0, "#111b3b");
    gradient.addColorStop(0.65, "#35496c");
    gradient.addColorStop(1, "#65768a");
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, view.w, view.h);

  drawStars();

  if (period === "day") {
    drawSun();
  } else {
    drawMoon();
  }
}

function drawSun() {
  const x = view.w - 130;
  const y = 95;

  ctx.save();

  ctx.shadowColor = "#ffe6a0";
  ctx.shadowBlur = 35;

  ctx.fillStyle = "#ffe6a0";
  ctx.beginPath();
  ctx.arc(x, y, 37, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff5d2";
  ctx.beginPath();
  ctx.arc(x - 9, y - 8, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawMoon() {
  const x = view.w - 130;
  const y = 100;

  ctx.save();

  ctx.shadowColor = "#dce6ff";
  ctx.shadowBlur = 24;

  ctx.fillStyle = "#f3f0d4";
  ctx.beginPath();
  ctx.arc(x, y, 31, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#35496c";
  ctx.beginPath();
  ctx.arc(x + 13, y - 10, 29, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ==========================================
// MONTANHAS E MORROS
// ==========================================

function drawMountains() {
  ctx.fillStyle = period === "day" ? "#789c8b" : "#46536e";

  ctx.beginPath();
  ctx.moveTo(0, 310);
  ctx.lineTo(140, 130);
  ctx.lineTo(270, 310);
  ctx.lineTo(410, 145);
  ctx.lineTo(580, 310);
  ctx.lineTo(730, 165);
  ctx.lineTo(918, 310);
  ctx.lineTo(918, 515);
  ctx.lineTo(0, 515);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = period === "day" ? "#a8bca0" : "#596783";

  ctx.beginPath();
  ctx.moveTo(0, 360);
  ctx.quadraticCurveTo(230, 210, 440, 355);
  ctx.quadraticCurveTo(690, 230, 918, 360);
  ctx.lineTo(918, 515);
  ctx.lineTo(0, 515);
  ctx.closePath();
  ctx.fill();
}

function drawGreenHills() {
  const gradient = ctx.createLinearGradient(0, 300, 0, 515);

  if (period === "day") {
    gradient.addColorStop(0, "#80b879");
    gradient.addColorStop(1, "#467a55");
  } else {
    gradient.addColorStop(0, "#536c69");
    gradient.addColorStop(1, "#293f42");
  }

  ctx.fillStyle = gradient;

  ctx.beginPath();
  ctx.moveTo(0, 350);
  ctx.bezierCurveTo(180, 275, 280, 390, 450, 345);
  ctx.bezierCurveTo(620, 290, 750, 380, 918, 315);
  ctx.lineTo(918, 515);
  ctx.lineTo(0, 515);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = period === "day" ? "#52875b" : "#314e46";

  ctx.beginPath();
  ctx.moveTo(0, 425);
  ctx.bezierCurveTo(180, 360, 340, 440, 490, 410);
  ctx.bezierCurveTo(650, 380, 780, 430, 918, 390);
  ctx.lineTo(918, 515);
  ctx.lineTo(0, 515);
  ctx.closePath();
  ctx.fill();
}

// ==========================================
// ÁRVORES
// ==========================================

function drawTree(x, y, size = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);

  ctx.fillStyle = "#79563d";
  ctx.fillRect(-8, -65, 16, 72);

  ctx.fillStyle = period === "day" ? "#386f4b" : "#273e48";

  ctx.beginPath();
  ctx.arc(0, -82, 34, 0, Math.PI * 2);
  ctx.arc(-23, -61, 25, 0, Math.PI * 2);
  ctx.arc(24, -60, 25, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = period === "day" ? "#5b9761" : "#3a5960";

  ctx.beginPath();
  ctx.arc(-7, -92, 15, 0, Math.PI * 2);
  ctx.arc(18, -70, 13, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ==========================================
// PAISAGEM: CAMPO FLORIDO
// ==========================================

function drawMeadow() {
  drawMountains();
  drawGreenHills();

  drawTree(90, 395, 1.05);
  drawTree(780, 390, 1.25);
  drawTree(855, 405, 0.8);

  for (let i = 0; i < 55; i++) {
    const x = (i * 71 + 23) % view.w;
    const y = 400 + ((i * 37) % 105);

    ctx.fillStyle = choose(["#fff1c9", "#f5a8b7", "#fffdf0", "#e7b9ff"]);

    ctx.beginPath();
    ctx.arc(x, y, 2.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e8ce73";
    ctx.beginPath();
    ctx.arc(x, y, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ==========================================
// PAISAGEM: PRAIA
// ==========================================

function drawBeach() {
  drawSky();

  ctx.fillStyle = period === "day" ? "#b9d9c7" : "#647b85";
  ctx.fillRect(0, 285, view.w, 115);

  ctx.fillStyle = period === "day" ? "#48a9b0" : "#315c70";
  ctx.fillRect(0, 320, view.w, 195);

  for (let i = 0; i < 9; i++) {
    const y = 335 + i * 18;
    const offset = Math.sin(Date.now() * 0.001 + i) * 12;

    ctx.strokeStyle = "rgba(255,255,255,.35)";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(offset, y);
    ctx.quadraticCurveTo(
      250 + offset,
      y - 9,
      470 + offset,
      y
    );
    ctx.quadraticCurveTo(
      700 + offset,
      y + 9,
      918,
      y - 3
    );
    ctx.stroke();
  }

  ctx.fillStyle = "#e7d19d";

  ctx.beginPath();
  ctx.moveTo(0, 420);
  ctx.quadraticCurveTo(220, 385, 450, 430);
  ctx.quadraticCurveTo(690, 465, 918, 410);
  ctx.lineTo(918, 515);
  ctx.lineTo(0, 515);
  ctx.closePath();
  ctx.fill();

  drawPalm(100, 430, 1.2);
  drawPalm(820, 435, 1);
}

function drawPalm(x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);

  ctx.strokeStyle = "#8a633e";
  ctx.lineWidth = 13;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-18, -65, 3, -110);
  ctx.stroke();

  ctx.strokeStyle = "#397b51";
  ctx.lineWidth = 7;

  for (let i = 0; i < 7; i++) {
    const angle = (i / 6) * Math.PI - Math.PI / 2;

    ctx.beginPath();
    ctx.moveTo(3, -110);
    ctx.quadraticCurveTo(
      Math.cos(angle) * 42,
      -140 + Math.sin(angle) * 17,
      Math.cos(angle) * 85,
      -115 + Math.sin(angle) * 35
    );
    ctx.stroke();
  }

  ctx.restore();
}

// ==========================================
// PAISAGEM: MONTANHAS
// ==========================================

function drawMountainLandscape() {
  drawSky();

  const peaks = [
    { x: 0, y: 330 },
    { x: 140, y: 105 },
    { x: 260, y: 290 },
    { x: 410, y: 75 },
    { x: 580, y: 310 },
    { x: 720, y: 125 },
    { x: 918, y: 315 }
  ];

  ctx.fillStyle = period === "day" ? "#8196a0" : "#485c77";

  ctx.beginPath();
  ctx.moveTo(0, 515);
  peaks.forEach(point => ctx.lineTo(point.x, point.y));
  ctx.lineTo(918, 515);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f3f0e7";

  for (const point of peaks) {
    if (point.y < 150) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(point.x - 27, point.y + 48);
      ctx.lineTo(point.x - 5, point.y + 35);
      ctx.lineTo(point.x + 22, point.y + 51);
      ctx.closePath();
      ctx.fill();
    }
  }

  ctx.fillStyle = period === "day" ? "#647f69" : "#334b50";

  ctx.beginPath();
  ctx.moveTo(0, 400);
  ctx.quadraticCurveTo(300, 300, 480, 420);
  ctx.quadraticCurveTo(700, 325, 918, 390);
  ctx.lineTo(918, 515);
  ctx.lineTo(0, 515);
  ctx.closePath();
  ctx.fill();

  drawTree(100, 450, 0.85);
  drawTree(840, 450, 1);
}

// ==========================================
// PAISAGEM: CIDADE
// ==========================================

function drawCity() {
  drawSky();

  ctx.fillStyle = period === "day" ? "#83969b" : "#37465d";

  for (let i = 0; i < 13; i++) {
    const x = i * 75;
    const height = 95 + ((i * 47) % 115);
    const width = 56;

    ctx.fillRect(x, 340 - height, width, height);

    ctx.fillStyle = period === "day" ? "#e6d8b9" : "#f5d994";

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        ctx.fillRect(
          x + 10 + col * 15,
          350 - height + row * 19,
          6,
          9
        );
      }
    }

    ctx.fillStyle = period === "day" ? "#83969b" : "#37465d";
  }

  ctx.fillStyle = period === "day" ? "#7da56f" : "#3e5a52";
  ctx.fillRect(0, 390, 918, 125);

  ctx.fillStyle = "#7b8581";
  ctx.fillRect(0, 465, 918, 50);

  ctx.strokeStyle = "#e7d9a5";
  ctx.setLineDash([22, 20]);
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(0, 490);
  ctx.lineTo(918, 490);
  ctx.stroke();

  ctx.setLineDash([]);

  drawTree(90, 455, 0.8);
  drawTree(820, 455, 0.9);
}

// ==========================================
// BORBOLETAS: CLONES
// ==========================================

function createButterfly(x, y, direction) {
  if (butterflies.length >= 35) {
    sceneMessage.textContent = "Sua janela já está cheia de borboletas!";
    return;
  }

  const butterfly = {
    x,
    y,
    direction,
    size: random(0.55, 1.3),
    speed: random(24, 55),
    hue: Math.floor(random(0, 360)),
    phase: random(0, Math.PI * 2),
    wave: random(15, 40),
    age: 0,
    wingSpeed: random(6, 12)
  };

  butterflies.push(butterfly);
  totalCreated++;

  updateStatistics();

  return butterfly;
}

function spawnButterfly() {
  const direction = Math.random() > 0.5 ? 1 : -1;

  const x = direction === 1
    ? -25
    : view.w + 25;

  const y = random(65, view.h - 85);

  createButterfly(x, y, direction);
}

function addButterflyAtCenter() {
  if (!running || paused) {
    sceneMessage.textContent = "Abra a janela para adicionar borboletas.";
    return;
  }

  const butterfly = createButterfly(
    random(view.w * 0.25, view.w * 0.75),
    random(90, view.h - 100),
    Math.random() > 0.5 ? 1 : -1
  );

  if (butterfly) {
    sceneMessage.textContent = "Uma nova borboleta chegou!";
    playTone(760, 0.12);
  }
}

function drawButterfly(butterfly) {
  const wingMovement = Math.sin(
    butterfly.phase
  ) * 0.65;

  const size = butterfly.size;

  ctx.save();

  ctx.translate(butterfly.x, butterfly.y);
  ctx.scale(butterfly.direction * size, size);

  // Sombra
  ctx.fillStyle = "rgba(0,0,0,.10)";
  ctx.beginPath();
  ctx.ellipse(0, 8, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Asas superiores
  ctx.save();
  ctx.rotate(-wingMovement);

  ctx.fillStyle = `hsl(${butterfly.hue}, 85%, 66%)`;

  ctx.beginPath();
  ctx.ellipse(-9, -7, 10, 15, -0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  ctx.save();
  ctx.rotate(wingMovement);

  ctx.fillStyle = `hsl(${butterfly.hue + 35}, 85%, 72%)`;

  ctx.beginPath();
  ctx.ellipse(9, -7, 10, 15, 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Asas inferiores
  ctx.fillStyle = `hsl(${butterfly.hue + 65}, 75%, 64%)`;

  ctx.beginPath();
  ctx.ellipse(-6, 7, 7, 10, -0.3, 0, Math.PI * 2);
  ctx.ellipse(6, 7, 7, 10, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Detalhes das asas
  ctx.fillStyle = "rgba(255,255,255,.75)";
  ctx.beginPath();
  ctx.arc(-11, -8, 2, 0, Math.PI * 2);
  ctx.arc(11, -8, 2, 0, Math.PI * 2);
  ctx.fill();

  // Corpo
  ctx.fillStyle = "#3b3440";
  ctx.fillRect(-2, -11, 4, 24);

  // Antenas
  ctx.strokeStyle = "#3b3440";
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(-1, -10);
  ctx.quadraticCurveTo(-8, -20, -10, -19);

  ctx.moveTo(1, -10);
  ctx.quadraticCurveTo(8, -20, 10, -19);

  ctx.stroke();

  ctx.restore();
}

function updateButterflies(delta) {
  const speedMultiplier = Number(speedRange.value) * 0.5;

  butterflies = butterflies.filter(butterfly => {
    butterfly.age += delta / 1000;
    butterfly.phase += delta * 0.009 * butterfly.wingSpeed / 8;

    butterfly.x +=
      butterfly.direction *
      butterfly.speed *
      speedMultiplier *
      delta / 1000;

    butterfly.y +=
      Math.sin(butterfly.phase * 0.5) *
      butterfly.wave *
      delta / 1000;

    const hasLeftWindow =
      butterfly.direction === 1 && butterfly.x > view.w + 35;

    const hasRightWindow =
      butterfly.direction === -1 && butterfly.x < -35;

    if (hasLeftWindow || hasRightWindow) {
      totalVisits++;
      updateStatistics();
      return false;
    }

    return true;
  });
}

// ==========================================
// CLIMA: CHUVA E NEVE
// ==========================================

function createWeatherParticles() {
  particles = [];

  for (let i = 0; i < 110; i++) {
    particles.push({
      x: random(0, view.w),
      y: random(0, view.h),
      size: random(1.5, 4),
      speed: random(80, 190),
      drift: random(-25, 25)
    });
  }
}

function updateWeather(delta) {
  if (weather === "clear") return;

  for (const particle of particles) {
    particle.y += particle.speed * delta / 1000;

    if (weather === "rain") {
      particle.x += particle.drift * delta / 1000;
    } else {
      particle.x += Math.sin(particle.y * 0.03) * delta * 0.025;
    }

    if (particle.y > view.h + 10) {
      particle.y = -10;
      particle.x = random(0, view.w);
    }

    if (particle.x > view.w + 10) {
      particle.x = -10;
    }

    if (particle.x < -10) {
      particle.x = view.w + 10;
    }
  }
}

function drawWeather() {
  if (weather === "clear") return;

  ctx.save();

  if (weather === "rain") {
    ctx.strokeStyle = "rgba(215,235,255,.65)";
    ctx.lineWidth = 1.4;

    for (const particle of particles) {
      ctx.beginPath();
      ctx.moveTo(particle.x, particle.y);
      ctx.lineTo(particle.x - 5, particle.y + 12);
      ctx.stroke();
    }
  }

  if (weather === "snow") {
    ctx.fillStyle = "rgba(255,255,255,.9)";

    for (const particle of particles) {
      ctx.beginPath();
      ctx.arc(
        particle.x,
        particle.y,
        particle.size,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  ctx.restore();
}

// ==========================================
// ANIMAÇÃO DO CENÁRIO
// ==========================================

function updateClouds(delta) {
  clouds.forEach(cloud => {
    cloud.x += cloud.speed * delta / 1000;

    if (cloud.x > view.w + 80) {
      cloud.x = -80;
      cloud.y = random(25, 190);
    }
  });
}

// ==========================================
// DESENHO DA PAISAGEM
// ==========================================

function drawLandscape() {
  ctx.save();

  ctx.translate(view.x, view.y);

  ctx.beginPath();
  ctx.rect(0, 0, view.w, view.h);
  ctx.clip();

  drawSky();

  if (landscape !== "beach" && landscape !== "mountains" && landscape !== "city") {
    drawMeadow();
  }

  if (landscape === "beach") {
    drawBeach();
  }

  if (landscape === "mountains") {
    drawMountainLandscape();
  }

  if (landscape === "city") {
    drawCity();
  }

  // Nuvens
  if (period === "day") {
    clouds.forEach(drawCloud);
  }

  // Clima
  drawWeather();

  // Borboletas
  butterflies.forEach(drawButterfly);

  ctx.restore();
}

// ==========================================
// MOLDURA DA JANELA
// ==========================================

function drawCurtain(x, side) {
  ctx.save();

  const gradient = ctx.createLinearGradient(x, 0, x + 65, 0);
  gradient.addColorStop(0, "#e7e0d0");
  gradient.addColorStop(0.55, "#f5f0e5");
  gradient.addColorStop(1, "#d8cbb5");

  ctx.fillStyle = gradient;

  ctx.beginPath();

  if (side === "left") {
    ctx.moveTo(42, 65);
    ctx.lineTo(105, 65);
    ctx.lineTo(102, 360);
    ctx.quadraticCurveTo(85, 425, 45, 385);
  } else {
    ctx.moveTo(1058, 65);
    ctx.lineTo(995, 65);
    ctx.lineTo(998, 360);
    ctx.quadraticCurveTo(1015, 425, 1055, 385);
  }

  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawWindowFrame() {
  // Fundo da parede
  const wall = ctx.createLinearGradient(0, 0, 0, H);
  wall.addColorStop(0, "#e5ded0");
  wall.addColorStop(1, "#cfc4ae");

  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, H);

  // Textura discreta da parede
  for (let i = 0; i < 90; i++) {
    const x = (i * 137) % W;
    const y = (i * 79) % H;

    ctx.fillStyle = "rgba(105,85,63,.045)";
    ctx.fillRect(x, y, 2, 2);
  }

  // Sombra da janela
  ctx.save();
  ctx.shadowColor = "rgba(43,36,26,.4)";
  ctx.shadowBlur = 25;
  ctx.fillStyle = "#78563b";
  ctx.fillRect(46, 43, 1008, 616);
  ctx.restore();

  // Madeira externa
  const wood = ctx.createLinearGradient(0, 40, 0, 655);
  wood.addColorStop(0, "#bd9468");
  wood.addColorStop(0.45, "#9c704b");
  wood.addColorStop(1, "#6e4c34");

  ctx.fillStyle = wood;
  ctx.fillRect(47, 42, 1006, 615);

  // Borda interna
  ctx.fillStyle = "#e0c09a";
  ctx.fillRect(70, 67, 960, 548);

  // Divisórias da janela
  ctx.fillStyle = "#f0d5ae";
  ctx.fillRect(544, 85, 9, 520);
  ctx.fillRect(90, 344, 918, 9);

  // Detalhes das divisórias
  ctx.fillStyle = "rgba(93,62,38,.3)";
  ctx.fillRect(553, 85, 3, 520);
  ctx.fillRect(90, 353, 918, 3);

  // Cortinas
  drawCurtain(42, "left");
  drawCurtain(1058, "right");

  // Acabamento da parte superior
  const topWood = ctx.createLinearGradient(0, 35, 0, 95);
  topWood.addColorStop(0, "#d7b48b");
  topWood.addColorStop(1, "#916644");

  ctx.fillStyle = topWood;
  ctx.fillRect(39, 37, 1022, 52);

  // Acabamento inferior
  const sill = ctx.createLinearGradient(0, 605, 0, 665);
  sill.addColorStop(0, "#d6b28b");
  sill.addColorStop(1, "#815a3b");

  ctx.fillStyle = sill;
  ctx.fillRect(32, 605, 1036, 43);

  ctx.fillStyle = "rgba(255,255,255,.3)";
  ctx.fillRect(42, 609, 1016, 4);

  // Detalhes de madeira
  ctx.strokeStyle = "rgba(76,49,29,.22)";
  ctx.lineWidth = 1;

  for (let i = 0; i < 5; i++) {
    const y = 47 + i * 7;

    ctx.beginPath();
    ctx.moveTo(55, y);
    ctx.lineTo(1045, y);
    ctx.stroke();
  }

  // Parafusos
  ctx.fillStyle = "#e5c79f";

  [
    [61, 59],
    [1039, 59],
    [61, 625],
    [1039, 625]
  ].forEach(([x, y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ==========================================
// RENDERIZAÇÃO COMPLETA
// ==========================================

function render() {
  ctx.clearRect(0, 0, W, H);

  drawWindowFrame();
  drawLandscape();
}

// ==========================================
// CONTROLES DA SIMULAÇÃO
// ==========================================

function showOverlay(title, description, buttonText) {
  overlayTitle.textContent = title;
  overlayDescription.textContent = description;
  startButton.innerHTML = buttonText + " <span>→</span>";

  startOverlay.classList.remove("hidden");
}

function hideOverlay() {
  startOverlay.classList.add("hidden");
}

function startWorld() {
  if (paused) {
    paused = false;
    running = true;

    hideOverlay();

    pauseButton.textContent = "Ⅱ Pausar";
    statusText.textContent = "MUNDO EM MOVIMENTO";
    sceneMessage.textContent = "Sua janela está cheia de vida!";

    previousTime = performance.now();

    return;
  }

  running = true;
  paused = false;

  hideOverlay();

  pauseButton.textContent = "Ⅱ Pausar";

  statusText.textContent = "MUNDO EM MOVIMENTO";
  sceneMessage.textContent = "Observe as borboletas voando pela janela.";

  // Criar as primeiras borboletas
  for (let i = 0; i < 3; i++) {
    createButterfly(
      random(150, view.w - 150),
      random(90, view.h - 100),
      Math.random() > 0.5 ? 1 : -1
    );
  }

  nextSpawn = 1;
  previousTime = performance.now();

  playWelcomeSound();
}

function pauseWorld() {
  if (!running && !paused) {
    sceneMessage.textContent = "Clique em abrir minha janela primeiro.";
    return;
  }

  if (running) {
    running = false;
    paused = true;

    showOverlay(
      "Janela em pausa",
      "Sua paisagem está esperando. Continue quando quiser!",
      "CONTINUAR"
    );

    pauseButton.textContent = "▶ Continuar";
    statusText.textContent = "ANIMAÇÃO PAUSADA";

    sceneMessage.textContent = "Sua janela está em pausa.";
  } else {
    startWorld();
  }
}

function resetWorld(startImmediately = false) {
  butterflies = [];
  particles = [];

  totalCreated = 0;
  totalVisits = 0;
  elapsedSeconds = 0;

  spawnTimer = 0;
  nextSpawn = 3;

  running = false;
  paused = false;

  createClouds();
  createStars();
  createWeatherParticles();

  updateStatistics();

  clock.textContent = "00:00";
  elapsedTime.textContent = "00:00";

  pauseButton.textContent = "Ⅱ Pausar";

  statusText.textContent = "PRONTO PARA COMEÇAR";
  sceneMessage.textContent = "Escolha uma paisagem para começar.";

  if (startImmediately) {
    startWorld();
  } else {
    showOverlay(
      "Sua janela está esperando!",
      "Prepare-se para observar uma paisagem cheia de vida. As borboletas vão aparecer e voar pelo seu cenário.",
      "ABRIR MINHA JANELA"
    );
  }

  render();
}

// ==========================================
// ATUALIZAÇÃO DAS ESTATÍSTICAS
// ==========================================

function updateStatistics() {
  butterflyCount.textContent = totalCreated;
  visitCount.textContent = totalVisits;
  elapsedTime.textContent = formatTime(elapsedSeconds);
}

// ==========================================
// FREQUÊNCIA DE APARIÇÃO
// ==========================================

function getSpawnInterval() {
  const frequency = Number(frequencyRange.value);

  return 6 - frequency * 0.85;
}

function updateSpawnTimer(delta) {
  spawnTimer += delta / 1000;

  if (spawnTimer >= nextSpawn) {
    spawnButterfly();

    spawnTimer = 0;
    nextSpawn = getSpawnInterval() * random(0.7, 1.3);
  }
}

// ==========================================
// ATUALIZAÇÃO GERAL
// ==========================================

function update(delta) {
  if (!running || paused) return;

  updateClouds(delta);
  updateButterflies(delta);
  updateWeather(delta);
  updateSpawnTimer(delta);

  elapsedSeconds += delta / 1000;

  const formatted = formatTime(Math.floor(elapsedSeconds));

  clock.textContent = formatted;
  elapsedTime.textContent = formatted;
}

// ==========================================
// LOOP DE ANIMAÇÃO
// ==========================================

function gameLoop(timestamp) {
  const delta = previousTime
    ? Math.min(timestamp - previousTime, 40)
    : 16;

  previousTime = timestamp;

  update(delta);
  render();

  animationId = requestAnimationFrame(gameLoop);
}

// ==========================================
// EVENTOS DOS BOTÕES
// ==========================================

startButton.addEventListener("click", startWorld);

pauseButton.addEventListener("click", pauseWorld);

resetButton.addEventListener("click", () => {
  resetWorld(true);
});

addButterflyButton.addEventListener("click", addButterflyAtCenter);

// ==========================================
// TROCAR PAISAGEM
// ==========================================

landscapeSelect.addEventListener("change", event => {
  landscape = event.target.value;

  const names = {
    meadow: "Campo florido",
    beach: "Praia tropical",
    mountains: "Montanhas",
    city: "Cidade"
  };

  sceneMessage.textContent =
    "Paisagem alterada para: " + names[landscape] + ".";

  playTone(560, 0.1);

  render();
});

// ==========================================
// TROCAR DIA E NOITE
// ==========================================

document.querySelectorAll("[data-period]").forEach(button => {
  button.addEventListener("click", () => {
    period = button.dataset.period;

    document.querySelectorAll("[data-period]").forEach(item => {
      item.classList.remove("active");
    });

    button.classList.add("active");

    sceneMessage.textContent = period === "day"
      ? "O sol apareceu na sua janela!"
      : "A noite chegou à sua paisagem.";

    playTone(period === "day" ? 660 : 390, 0.15);

    render();
  });
});

// ==========================================
// TROCAR CLIMA
// ==========================================

weatherSelect.addEventListener("change", event => {
  weather = event.target.value;

  createWeatherParticles();

  const messages = {
    clear: "O céu está limpo e ensolarado.",
    rain: "Começou a chover na sua paisagem.",
    snow: "Flocos de neve estão caindo!"
  };

  sceneMessage.textContent = messages[weather];

  playTone(460, 0.1);

  render();
});

// ==========================================
// VELOCIDADE DAS BORBOLETAS
// ==========================================

speedRange.addEventListener("input", event => {
  const value = Number(event.target.value);

  speedValue.textContent = speedNames[value - 1];
});

// ==========================================
// FREQUÊNCIA DE APARIÇÃO
// ==========================================

frequencyRange.addEventListener("input", event => {
  const value = Number(event.target.value);

  frequencyValue.textContent = frequencyNames[value - 1];
});

// ==========================================
// CLICAR NA PAISAGEM PARA CRIAR BORBOLETAS
// ==========================================

canvas.addEventListener("pointerdown", event => {
  if (!running || paused) return;

  const rect = canvas.getBoundingClientRect();

  const scaleX = W / rect.width;
  const scaleY = H / rect.height;

  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;

  const localX = x - view.x;
  const localY = y - view.y;

  const insideWindow =
    localX >= 0 &&
    localX <= view.w &&
    localY >= 0 &&
    localY <= view.h;

  if (insideWindow) {
    createButterfly(
      localX,
      localY,
      Math.random() > 0.5 ? 1 : -1
    );

    playTone(740, 0.1);
    sceneMessage.textContent = "Você criou uma borboleta!";
  }
});

// ==========================================
// INICIALIZAÇÃO
// ==========================================

function initialize() {
  createClouds();
  createStars();
  createWeatherParticles();

  updateStatistics();

  speedValue.textContent = "Lenta";
  frequencyValue.textContent = "Normal";

  render();

  previousTime = performance.now();

  if (animationId === null) {
    animationId = requestAnimationFrame(gameLoop);
  }
}

initialize();
