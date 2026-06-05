const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const adventureScreen = document.getElementById('adventureScreen');
const shopScreen = document.getElementById('shopScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const adventureBtn = document.getElementById('adventureBtn');
const shopBtn = document.getElementById('shopBtn');
const backBtn = document.getElementById('backBtn');
const backAdventureBtn = document.getElementById('backAdventureBtn');
const restartBtn = document.getElementById('restartBtn');
const homeBtn = document.getElementById('homeBtn');
const scoreDisplay = document.getElementById('scoreDisplay');
const finalScoreEl = document.getElementById('finalScore');
const bestScoreEl = document.getElementById('bestScore');
const totalCoinsEl = document.getElementById('totalCoins');
const shopCoinsEl = document.getElementById('shopCoins');
const coinsEarnedEl = document.getElementById('coinsEarned');

// ── Canvas Resize (Responsive) ─────────────────────────────────
function resizeCanvas() {
  const container = document.getElementById('gameContainer');
  const dpr = window.devicePixelRatio || 1;
  const w = container.clientWidth;
  const h = container.clientHeight;
  // Keep internal resolution at 400x600 regardless of display size
  // CSS handles scaling via width/height 100%
  canvas.width = 400;
  canvas.height = 600;
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 200));
resizeCanvas();


// ── Constants ─────────────────────────────────────────────────
const GRAVITY = 0.5;
const FLAP_POWER = -9;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const PIPE_SPEED = 2.5;
const BIRD_SIZE = 34;

// ── State ─────────────────────────────────────────────────────
let bird, pipes, score, coins, totalCoins, bestScore, gameRunning, animId, menuAnimId, frameCount;
let currentSkin = 'classic';
let ownedSkins = ['classic'];
let currentAccessories = { hat: null, glasses: null, scarf: null };
let ownedAccessories = { hat: [], glasses: [], scarf: [] };
let currentLevel = null;
let unlockedLevels = [0];
let levelScores = {};
let adventureLevels = [
  { id: 0, name: 'Sunny Morning', requiredScore: 0, targetScore: 30, theme: { sky: '#87CEEB', skyBot: '#E0F6FF', ground: '#DEB887', grass: '#9ACD32' }, icon: '☀️' },
  { id: 1, name: 'Sunset Valley', requiredScore: 30, targetScore: 60, theme: { sky: '#FF6B6B', skyBot: '#FFA07A', ground: '#8B4513', grass: '#CD853F' }, icon: '🌅' },
  { id: 2, name: 'Night City', requiredScore: 60, targetScore: 90, theme: { sky: '#2C3E50', skyBot: '#34495E', ground: '#1C1C1C', grass: '#2F4F4F' }, icon: '🌃' },
  { id: 3, name: 'Ocean Breeze', requiredScore: 90, targetScore: 120, theme: { sky: '#1E90FF', skyBot: '#00CED1', ground: '#F4A460', grass: '#FFE4B5' }, icon: '🌊' },
  { id: 4, name: 'Autumn Forest', requiredScore: 120, targetScore: 150, theme: { sky: '#FF8C00', skyBot: '#FFA500', ground: '#8B4513', grass: '#D2691E' }, icon: '🍂' },
  { id: 5, name: 'Winter Snow', requiredScore: 150, targetScore: 180, theme: { sky: '#B0E0E6', skyBot: '#E0FFFF', ground: '#FFFFFF', grass: '#F0F8FF' }, icon: '❄️' },
  { id: 6, name: 'Desert Storm', requiredScore: 180, targetScore: 220, theme: { sky: '#FFD700', skyBot: '#FFA500', ground: '#DEB887', grass: '#D2B48C' }, icon: '🏜️' },
  { id: 7, name: 'Space Journey', requiredScore: 220, targetScore: 300, theme: { sky: '#000428', skyBot: '#004e92', ground: '#2C2C54', grass: '#474787' }, icon: '🚀' }
];
let accessories = {
  hat: {
    crown: { name: 'Crown', price: 100, color: '#FFD700', type: 'crown' },
    cap: { name: 'Baseball Cap', price: 80, color: '#FF0000', type: 'cap' },
    tophat: { name: 'Top Hat', price: 120, color: '#000', type: 'tophat' },
    santa: { name: 'Santa Hat', price: 150, color: '#FF0000', type: 'santa' }
  },
  glasses: {
    cool: { name: 'Cool Shades', price: 60, color: '#000', type: 'cool' },
    round: { name: 'Round Glasses', price: 50, color: '#DAA520', type: 'round' },
    star: { name: 'Star Glasses', price: 90, color: '#FF1493', type: 'star' }
  },
  scarf: {
    red: { name: 'Red Scarf', price: 40, color: '#FF0000', type: 'scarf' },
    blue: { name: 'Blue Scarf', price: 40, color: '#0000FF', type: 'scarf' },
    rainbow: { name: 'Rainbow Scarf', price: 100, color: 'rainbow', type: 'scarf' }
  }
};
let skinColors = {
  classic: { body: '#FFD700', wing: '#FFA500', beak: '#FF6347', eye: '#000', name: 'Golden Canary' },
  robin: { body: '#E67E22', wing: '#D35400', beak: '#F39C12', eye: '#000', name: 'Robin Red' },
  bluebird: { body: '#3498DB', wing: '#2980B9', beak: '#34495E', eye: '#000', name: 'Sky Bluebird' },
  parrot: { body: '#2ECC71', wing: '#27AE60', beak: '#F39C12', eye: '#000', name: 'Emerald Parrot' },
  owl: { body: '#8B7355', wing: '#654321', beak: '#DAA520', eye: '#FFD700', name: 'Night Owl' },
  peacock: { body: '#1ABC9C', wing: '#16A085', beak: '#F39C12', eye: '#8E44AD', name: 'Peacock Royal' },
  flamingo: { body: '#FF69B4', wing: '#FF1493', beak: '#000', eye: '#000', name: 'Pink Flamingo' },
  penguin: { body: '#2C3E50', wing: '#34495E', beak: '#F39C12', eye: '#000', name: 'Emperor Penguin' },
  phoenix: { body: '#E74C3C', wing: '#C0392B', beak: '#F39C12', eye: '#FFD700', name: 'Fire Phoenix' }
};

// ── Init ──────────────────────────────────────────────────────
function initGame() {
  bird = {
    x: 80,
    y: canvas.height / 3,
    vy: -2,
    rotation: 0
  };
  pipes = [];
  score = 0;
  coins = 0;
  frameCount = 0;
  gameRunning = false;
  bestScore = localStorage.getItem('flappyBestScore') || 0;
  totalCoins = parseInt(localStorage.getItem('flappyTotalCoins')) || 0;
  currentSkin = localStorage.getItem('flappyCurrentSkin') || 'classic';
  ownedSkins = JSON.parse(localStorage.getItem('flappyOwnedSkins')) || ['classic'];
  currentAccessories = JSON.parse(localStorage.getItem('flappyCurrentAccessories')) || { hat: null, glasses: null, scarf: null };
  ownedAccessories = JSON.parse(localStorage.getItem('flappyOwnedAccessories')) || { hat: [], glasses: [], scarf: [] };
  unlockedLevels = JSON.parse(localStorage.getItem('flappyUnlockedLevels')) || [0];
  if (!unlockedLevels.includes(1)) unlockedLevels.push(1);
  if (!unlockedLevels.includes(2)) unlockedLevels.push(2);
  localStorage.setItem('flappyUnlockedLevels', JSON.stringify(unlockedLevels));
  levelScores = JSON.parse(localStorage.getItem('flappyLevelScores')) || {};
  bestScoreEl.textContent = bestScore;
  updateCoinDisplay();
}

// ── Bird Draw ─────────────────────────────────────────────────
function drawBird() {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate((bird.rotation * Math.PI) / 180);

  const colors = skinColors[currentSkin];

  // Scarf (behind body)
  if (currentAccessories.scarf) {
    const scarf = accessories.scarf[currentAccessories.scarf];
    drawScarf(scarf);
  }

  // Body
  ctx.fillStyle = colors.body;
  ctx.beginPath();
  ctx.ellipse(0, 0, BIRD_SIZE / 2, BIRD_SIZE / 2.3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wing
  const wingFlap = Math.sin(frameCount * 0.3) * 5;
  ctx.fillStyle = colors.wing;
  ctx.beginPath();
  ctx.ellipse(-8, wingFlap, 12, 8, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(8, -5, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(10, -5, 3, 0, Math.PI * 2);
  ctx.fill();

  // Glasses
  if (currentAccessories.glasses) {
    const glasses = accessories.glasses[currentAccessories.glasses];
    drawGlasses(glasses);
  }

  // Beak
  ctx.fillStyle = colors.beak;
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(22, -2);
  ctx.lineTo(22, 2);
  ctx.closePath();
  ctx.fill();

  // Hat
  if (currentAccessories.hat) {
    const hat = accessories.hat[currentAccessories.hat];
    drawHat(hat);
  }

  ctx.restore();
}

// ── Draw Accessories ──────────────────────────────────────────
function drawHat(hat) {
  ctx.fillStyle = hat.color;
  
  if (hat.type === 'crown') {
    // Crown
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(-8, -20, 16, 6);
    for (let i = -6; i <= 6; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i - 3, -20);
      ctx.lineTo(i, -26);
      ctx.lineTo(i + 3, -20);
      ctx.closePath();
      ctx.fill();
    }
    // Jewels
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.arc(0, -17, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (hat.type === 'cap') {
    // Baseball cap
    ctx.fillStyle = hat.color;
    ctx.beginPath();
    ctx.ellipse(0, -14, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(8, -14, 8, 3);
  } else if (hat.type === 'tophat') {
    // Top hat
    ctx.fillStyle = '#000';
    ctx.fillRect(-6, -26, 12, 10);
    ctx.fillRect(-9, -17, 18, 3);
  } else if (hat.type === 'santa') {
    // Santa hat
    ctx.fillStyle = '#FF0000';
    ctx.beginPath();
    ctx.moveTo(-8, -14);
    ctx.lineTo(0, -26);
    ctx.lineTo(8, -14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.fillRect(-8, -14, 16, 3);
    ctx.beginPath();
    ctx.arc(0, -26, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGlasses(glasses) {
  ctx.strokeStyle = glasses.color;
  ctx.lineWidth = 2;
  
  if (glasses.type === 'cool') {
    // Sunglasses
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(3, -8, 8, 5);
    ctx.fillRect(-11, -8, 8, 5);
    ctx.strokeRect(3, -8, 8, 5);
    ctx.strokeRect(-11, -8, 8, 5);
    ctx.beginPath();
    ctx.moveTo(3, -5);
    ctx.lineTo(-3, -5);
    ctx.stroke();
  } else if (glasses.type === 'round') {
    // Round glasses
    ctx.beginPath();
    ctx.arc(8, -5, 4, 0, Math.PI * 2);
    ctx.arc(-2, -5, 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4, -5);
    ctx.lineTo(2, -5);
    ctx.stroke();
  } else if (glasses.type === 'star') {
    // Star glasses
    ctx.fillStyle = glasses.color;
    ctx.globalAlpha = 0.6;
    drawStar(8, -5, 5, 5, 0.5);
    drawStar(-2, -5, 5, 5, 0.5);
    ctx.globalAlpha = 1;
  }
}

function drawScarf(scarf) {
  if (scarf.color === 'rainbow') {
    const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'];
    colors.forEach((color, i) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 8, 12 + i, 0.2, Math.PI - 0.2);
      ctx.stroke();
    });
  } else {
    ctx.strokeStyle = scarf.color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 8, 12, 0.2, Math.PI - 0.2);
    ctx.stroke();
    // Scarf ends
    ctx.fillStyle = scarf.color;
    ctx.fillRect(-14, 10, 4, 8);
    ctx.fillRect(10, 10, 4, 8);
  }
}

function drawStar(cx, cy, spikes, outerRadius, innerRadius) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}

// ── Background ────────────────────────────────────────────────
function drawBackground() {
  let theme;
  if (currentLevel !== null) {
    theme = adventureLevels[currentLevel].theme;
  } else {
    theme = { sky: '#87CEEB', skyBot: '#E0F6FF', ground: '#DEB887', grass: '#9ACD32' };
  }
  
  // Sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.7);
  skyGrad.addColorStop(0, theme.sky);
  skyGrad.addColorStop(1, theme.skyBot);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height * 0.7);

  // Ground
  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);
  
  // Grass stripe
  ctx.fillStyle = theme.grass;
  ctx.fillRect(0, canvas.height * 0.7, canvas.width, 15);

  // Ground pattern
  ctx.fillStyle = theme.ground;
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < canvas.width; i += 30) {
    ctx.fillRect(i + (frameCount % 30), canvas.height * 0.7 + 15, 15, 15);
  }
  ctx.globalAlpha = 1;
}

// ── Clouds ────────────────────────────────────────────────────
function drawClouds() {
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  const cloudPositions = [
    { x: (frameCount * 0.3) % (canvas.width + 100) - 50, y: 80 },
    { x: (frameCount * 0.5) % (canvas.width + 100) - 50, y: 150 },
    { x: (frameCount * 0.2) % (canvas.width + 100) - 50, y: 220 }
  ];
  
  cloudPositions.forEach(cloud => {
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, 20, 0, Math.PI * 2);
    ctx.arc(cloud.x + 20, cloud.y, 25, 0, Math.PI * 2);
    ctx.arc(cloud.x + 40, cloud.y, 20, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ── Draw Bird in Shop ───────────────────────────────────────
function drawShopBird(canvasId, skinName) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const colors = skinColors[skinName];
  const centerX = 40;
  const centerY = 40;
  
  ctx.clearRect(0, 0, 80, 80);
  ctx.save();
  ctx.translate(centerX, centerY);
  
  // Body
  ctx.fillStyle = colors.body;
  ctx.beginPath();
  ctx.ellipse(0, 5, 18, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Head
  ctx.beginPath();
  ctx.ellipse(0, -8, 13, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Wing
  ctx.fillStyle = colors.wing;
  ctx.beginPath();
  ctx.ellipse(-10, 5, 10, 7, -0.5, 0, Math.PI * 2);
  ctx.fill();
  
  // Tail
  ctx.fillStyle = colors.wing;
  ctx.beginPath();
  ctx.moveTo(-15, 10);
  ctx.lineTo(-25, 8);
  ctx.lineTo(-22, 15);
  ctx.closePath();
  ctx.fill();
  
  // Beak
  ctx.fillStyle = colors.beak;
  ctx.beginPath();
  ctx.moveTo(12, -8);
  ctx.lineTo(18, -9);
  ctx.lineTo(18, -7);
  ctx.closePath();
  ctx.fill();
  
  // Eye
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(6, -10, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(7, -10, 2, 0, Math.PI * 2);
  ctx.fill();
  
  // Special features based on bird type
  if (skinName === 'owl') {
    // Owl tufts
    ctx.fillStyle = colors.body;
    ctx.beginPath();
    ctx.moveTo(-5, -18);
    ctx.lineTo(-8, -22);
    ctx.lineTo(-3, -20);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(5, -18);
    ctx.lineTo(8, -22);
    ctx.lineTo(3, -20);
    ctx.closePath();
    ctx.fill();
  } else if (skinName === 'peacock') {
    // Peacock crest
    ctx.strokeStyle = colors.wing;
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 3, -18);
      ctx.lineTo(i * 3, -24);
      ctx.stroke();
      ctx.fillStyle = colors.wing;
      ctx.beginPath();
      ctx.arc(i * 3, -25, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (skinName === 'phoenix') {
    // Phoenix flames
    ctx.fillStyle = '#ff6348';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(-18, 12);
    ctx.lineTo(-22, 18);
    ctx.lineTo(-15, 15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(-20, 15);
    ctx.lineTo(-24, 20);
    ctx.lineTo(-18, 18);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (skinName === 'toucan') {
    // Toucan large beak
    ctx.fillStyle = colors.beak;
    ctx.beginPath();
    ctx.ellipse(15, -8, 8, 5, 0, -Math.PI/2, Math.PI/2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (skinName === 'eagle') {
    // Eagle sharp look
    ctx.strokeStyle = '#F39C12';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(10, -12);
    ctx.lineTo(12, -14);
    ctx.stroke();
  }
  
  ctx.restore();
}

// ── Coin ──────────────────────────────────────────────────────
function drawCoin(x, y) {
  const coinRadius = 15;
  const spin = (frameCount * 0.1) % (Math.PI * 2);
  
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  
  // Outer circle
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(0, 0, coinRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // Inner circle
  ctx.fillStyle = '#FFA500';
  ctx.beginPath();
  ctx.arc(0, 0, coinRadius - 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Shine
  ctx.fillStyle = '#FFFF00';
  ctx.beginPath();
  ctx.arc(-4, -4, 4, 0, Math.PI * 2);
  ctx.fill();
  
  // Symbol
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', 0, 0);
  
  ctx.restore();
}

// ── Pipes ─────────────────────────────────────────────────────
function drawPipe(pipe) {
  const pipeColor = '#2ECC40';
  const pipeHighlight = '#3DED50';
  const pipeBorder = '#228B22';

  // Draw coin if exists
  if (pipe.hasCoin && !pipe.coinCollected) {
    const coinX = pipe.x + PIPE_WIDTH / 2;
    const coinY = pipe.top + PIPE_GAP / 2;
    drawCoin(coinX, coinY);
  }

  // Top pipe
  ctx.fillStyle = pipeColor;
  ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
  
  // Top pipe cap
  ctx.fillStyle = pipeBorder;
  ctx.fillRect(pipe.x - 5, pipe.top - 30, PIPE_WIDTH + 10, 30);
  ctx.fillStyle = pipeHighlight;
  ctx.fillRect(pipe.x - 5, pipe.top - 30, 8, 30);

  // Bottom pipe
  ctx.fillStyle = pipeColor;
  ctx.fillRect(pipe.x, pipe.bottom, PIPE_WIDTH, canvas.height - pipe.bottom);
  
  // Bottom pipe cap
  ctx.fillStyle = pipeBorder;
  ctx.fillRect(pipe.x - 5, pipe.bottom, PIPE_WIDTH + 10, 30);
  ctx.fillStyle = pipeHighlight;
  ctx.fillRect(pipe.x - 5, pipe.bottom, 8, 30);

  // Pipe texture
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 2;
  for (let i = 0; i < pipe.top; i += 20) {
    ctx.beginPath();
    ctx.moveTo(pipe.x, i);
    ctx.lineTo(pipe.x + PIPE_WIDTH, i);
    ctx.stroke();
  }
  for (let i = pipe.bottom; i < canvas.height; i += 20) {
    ctx.beginPath();
    ctx.moveTo(pipe.x, i);
    ctx.lineTo(pipe.x + PIPE_WIDTH, i);
    ctx.stroke();
  }
}

// ── Spawn Pipe ────────────────────────────────────────────────
function spawnPipe() {
  const minTop = 80;
  const maxTop = canvas.height * 0.7 - PIPE_GAP - 80;
  const top = Math.random() * (maxTop - minTop) + minTop;
  pipes.push({
    x: canvas.width,
    top: top,
    bottom: top + PIPE_GAP,
    scored: false,
    hasCoin: true,
    coinCollected: false
  });
}

// ── Collision ─────────────────────────────────────────────────
function checkCollision() {
  // Ground & ceiling
  if (bird.y + BIRD_SIZE / 2 >= canvas.height * 0.7 || bird.y - BIRD_SIZE / 2 <= 0) {
    return true;
  }

  // Pipes
  for (const pipe of pipes) {
    if (
      bird.x + BIRD_SIZE / 2 > pipe.x &&
      bird.x - BIRD_SIZE / 2 < pipe.x + PIPE_WIDTH
    ) {
      if (bird.y - BIRD_SIZE / 2 < pipe.top || bird.y + BIRD_SIZE / 2 > pipe.bottom) {
        return true;
      }
    }
  }
  return false;
}

// ── Flap ──────────────────────────────────────────────────────
function flap() {
  if (!gameRunning) return;
  bird.vy = FLAP_POWER;
}

// ── Menu Loop ─────────────────────────────────────────────────
function menuLoop() {
  if (gameRunning) return;
  frameCount++;

  // Hover effect for bird y-position and rotation
  bird.y = canvas.height / 3.2 + Math.sin(frameCount * 0.05) * 12;
  bird.rotation = Math.sin(frameCount * 0.05) * 6;

  // Draw background, clouds, and bird
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawClouds();
  drawBird();

  menuAnimId = requestAnimationFrame(menuLoop);
}

// ── Game Loop ─────────────────────────────────────────────────
function gameLoop() {
  if (!gameRunning) return;
  frameCount++;

  // Spawn pipes
  if (frameCount % 90 === 0) spawnPipe();

  // Update bird
  bird.vy += GRAVITY;
  bird.y += bird.vy;
  bird.rotation = Math.min(Math.max(bird.vy * 3, -30), 90);

  // Update pipes
  pipes.forEach(pipe => {
    pipe.x -= PIPE_SPEED;
    
    // Score
    if (!pipe.scored && pipe.x + PIPE_WIDTH < bird.x) {
      pipe.scored = true;
      score++;
      scoreDisplay.textContent = score;
    }
    
    // Collect coin
    if (pipe.hasCoin && !pipe.coinCollected) {
      const coinX = pipe.x + PIPE_WIDTH / 2;
      const coinY = pipe.top + PIPE_GAP / 2;
      const distance = Math.sqrt((bird.x - coinX) ** 2 + (bird.y - coinY) ** 2);
      if (distance < 25) {
        pipe.coinCollected = true;
        coins++;
        score += 5;
        scoreDisplay.textContent = score;
      }
    }
  });
  pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > 0);

  // Check collision
  if (checkCollision()) {
    gameOver();
    return;
  }

  // Draw
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawClouds();
  pipes.forEach(drawPipe);
  drawBird();

  animId = requestAnimationFrame(gameLoop);
}

// ── Game Over ─────────────────────────────────────────────────
function gameOver() {
  gameRunning = false;
  cancelAnimationFrame(animId);
  
  // Save total coins
  totalCoins += coins;
  localStorage.setItem('flappyTotalCoins', totalCoins);
  
  // Save best score
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('flappyBestScore', bestScore);
  }
  
  // Check adventure level completion
  if (currentLevel !== null) {
    const level = adventureLevels[currentLevel];
    const prevBest = levelScores[currentLevel] || 0;
    
    if (score > prevBest) {
      levelScores[currentLevel] = score;
      localStorage.setItem('flappyLevelScores', JSON.stringify(levelScores));
    }
    
    // Unlock next level if target reached
    if (score >= level.targetScore && currentLevel < adventureLevels.length - 1) {
      const nextLevel = currentLevel + 1;
      if (!unlockedLevels.includes(nextLevel)) {
        unlockedLevels.push(nextLevel);
        localStorage.setItem('flappyUnlockedLevels', JSON.stringify(unlockedLevels));
      }
    }
  }

  finalScoreEl.innerHTML = `${score} <span style="color:#FFD700; font-size:0.9rem">(${coins} 🪙)</span>`;
  coinsEarnedEl.textContent = coins;
  bestScoreEl.textContent = bestScore;
  scoreDisplay.classList.remove('active');
  gameOverScreen.style.display = 'flex';
}

// ── Start Game ────────────────────────────────────────────────
function startGame(levelId = null) {
  if (menuAnimId) cancelAnimationFrame(menuAnimId);
  startScreen.style.display = 'none';
  adventureScreen.style.display = 'none';
  shopScreen.style.display = 'none';
  gameOverScreen.style.display = 'none';
  scoreDisplay.classList.add('active');
  scoreDisplay.textContent = '0';
  currentLevel = levelId;
  initGame();
  gameRunning = true;
  gameLoop();
}

// ── Shop Functions ────────────────────────────────────────────
function updateCoinDisplay() {
  totalCoinsEl.textContent = totalCoins;
  shopCoinsEl.textContent = totalCoins;
}

function openShop() {
  startScreen.style.display = 'none';
  shopScreen.style.display = 'flex';
  updateCoinDisplay();
  renderShop();
  renderAccessories();
  
  // Draw all bird previews
  setTimeout(() => {
    Object.keys(skinColors).forEach(skin => {
      drawShopBird(`preview-${skin}`, skin);
    });
  }, 100);
}

function closeShop() {
  shopScreen.style.display = 'none';
  startScreen.style.display = 'flex';
  updateCoinDisplay();
}

// ── Adventure Functions ──────────────────────────────────────
function openAdventure() {
  startScreen.style.display = 'none';
  adventureScreen.style.display = 'flex';
  renderAdventure();
}

function closeAdventure() {
  adventureScreen.style.display = 'none';
  startScreen.style.display = 'flex';
}

function renderAdventure() {
  const container = document.getElementById('adventure-levels');
  container.innerHTML = '';
  
  adventureLevels.forEach(level => {
    const isUnlocked = level.id <= 2 || unlockedLevels.includes(level.id);
    const bestScore = levelScores[level.id] || 0;
    const completed = bestScore >= level.targetScore;
    
    const card = document.createElement('div');
    card.className = `level-card ${isUnlocked ? 'unlocked' : 'locked'} ${completed ? 'completed' : ''}`;
    card.innerHTML = `
      <div class="level-icon">${level.icon}</div>
      <div class="level-name">${level.name}</div>
      <div class="level-info">
        ${isUnlocked ? `
          <div class="level-target">Target: ${level.targetScore}</div>
          <div class="level-best">Best: ${bestScore}</div>
        ` : `
          <div class="level-locked">🔒 Locked</div>
          <div class="level-require">Need: ${level.requiredScore}</div>
        `}
      </div>
      ${isUnlocked ? `<button class="btn-level" onclick="startGame(${level.id})">Play</button>` : `<button class="btn-level" disabled>🔒</button>`}
    `;
    container.appendChild(card);
  });
}

function renderShop() {
  const skinPrices = { 
    classic: 0, robin: 30, bluebird: 30, parrot: 30, 
    owl: 30, peacock: 30, flamingo: 30, penguin: 30, phoenix: 30
  };
  const cards = document.querySelectorAll('.skin-card');
  
  cards.forEach(card => {
    const skin = card.dataset.skin;
    const btn = card.querySelector('button');
    const isOwned = ownedSkins.includes(skin);
    const price = skinPrices[skin];
    
    if (isOwned) {
      card.classList.add('owned');
      btn.className = 'btn-select';
      btn.textContent = currentSkin === skin ? 'Digunakan' : 'Pilih';
      if (currentSkin === skin) btn.classList.add('selected');
      btn.onclick = () => selectSkin(skin);
    } else {
      card.classList.remove('owned');
      btn.className = 'btn-buy';
      btn.textContent = totalCoins >= price ? 'Beli' : '🔒 Terkunci';
      btn.disabled = totalCoins < price;
      btn.onclick = () => buySkin(skin, price);
    }
  });
}

function buySkin(skin, price) {
  if (totalCoins >= price && !ownedSkins.includes(skin)) {
    totalCoins -= price;
    ownedSkins.push(skin);
    localStorage.setItem('flappyTotalCoins', totalCoins);
    localStorage.setItem('flappyOwnedSkins', JSON.stringify(ownedSkins));
    selectSkin(skin);
    updateCoinDisplay();
    renderShop();
  }
}

function selectSkin(skin) {
  if (ownedSkins.includes(skin)) {
    currentSkin = skin;
    localStorage.setItem('flappyCurrentSkin', skin);
    renderShop();
  }
}

function buyAccessory(type, id, price) {
  if (totalCoins >= price && !ownedAccessories[type].includes(id)) {
    totalCoins -= price;
    ownedAccessories[type].push(id);
    localStorage.setItem('flappyTotalCoins', totalCoins);
    localStorage.setItem('flappyOwnedAccessories', JSON.stringify(ownedAccessories));
    selectAccessory(type, id);
    updateCoinDisplay();
    renderAccessories();
  }
}

function selectAccessory(type, id) {
  if (ownedAccessories[type].includes(id)) {
    currentAccessories[type] = id;
    localStorage.setItem('flappyCurrentAccessories', JSON.stringify(currentAccessories));
    renderAccessories();
  }
}

function removeAccessory(type) {
  currentAccessories[type] = null;
  localStorage.setItem('flappyCurrentAccessories', JSON.stringify(currentAccessories));
  renderAccessories();
}

function renderAccessories() {
  ['hat', 'glasses', 'scarf'].forEach(type => {
    const container = document.getElementById(`${type}-list`);
    if (!container) return;
    container.innerHTML = '';
    
    Object.keys(accessories[type]).forEach(id => {
      const acc = accessories[type][id];
      const owned = ownedAccessories[type].includes(id);
      const selected = currentAccessories[type] === id;
      
      const card = document.createElement('div');
      card.className = `acc-card ${owned ? 'owned' : ''}`;
      card.innerHTML = `
        <canvas class="acc-preview" id="acc-${type}-${id}" width="60" height="60"></canvas>
        <div class="acc-name">${acc.name}</div>
        <div class="acc-price">${owned ? '✅ Dimiliki' : '🪙 ' + acc.price}</div>
        <button class="btn-acc ${selected ? 'selected' : ''}" 
                ${!owned && totalCoins < acc.price ? 'disabled' : ''}>
          ${owned ? (selected ? 'Dipakai' : 'Pakai') : (totalCoins >= acc.price ? 'Beli' : '🔒')}
        </button>
      `;
      
      const btn = card.querySelector('button');
      if (owned) {
        btn.onclick = () => selectAccessory(type, id);
      } else {
        btn.onclick = () => buyAccessory(type, id, acc.price);
      }
      
      container.appendChild(card);
      
      // Draw accessory preview
      setTimeout(() => drawAccessoryPreview(type, id, acc), 10);
    });
    
    // Add remove button if something is equipped
    if (currentAccessories[type]) {
      const removeCard = document.createElement('div');
      removeCard.className = 'acc-card';
      removeCard.innerHTML = `
        <canvas class="acc-preview" width="60" height="60"></canvas>
        <div class="acc-name">No ${type}</div>
        <div class="acc-price">Remove</div>
        <button class="btn-acc">Lepas</button>
      `;
      removeCard.querySelector('button').onclick = () => removeAccessory(type);
      container.insertBefore(removeCard, container.firstChild);
      
      // Draw X on remove card
      const canvas = removeCard.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(15, 15);
      ctx.lineTo(45, 45);
      ctx.moveTo(45, 15);
      ctx.lineTo(15, 45);
      ctx.stroke();
    }
  });
}

function drawAccessoryPreview(type, id, acc) {
  const canvas = document.getElementById(`acc-${type}-${id}`);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const centerX = 30;
  const centerY = 30;
  
  ctx.clearRect(0, 0, 60, 60);
  ctx.save();
  ctx.translate(centerX, centerY);
  
  if (type === 'hat') {
    if (id === 'crown') {
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(-12, 5, 24, 8);
      for (let i = -8; i <= 8; i += 8) {
        ctx.beginPath();
        ctx.moveTo(i - 4, 5);
        ctx.lineTo(i, -3);
        ctx.lineTo(i + 4, 5);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(0, 8, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (id === 'cap') {
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(12, 0, 10, 4);
    } else if (id === 'tophat') {
      ctx.fillStyle = '#000';
      ctx.fillRect(-8, -8, 16, 14);
      ctx.fillRect(-12, 6, 24, 4);
    } else if (id === 'santa') {
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(0, -14);
      ctx.lineTo(12, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#FFF';
      ctx.fillRect(-12, 0, 24, 4);
      ctx.beginPath();
      ctx.arc(0, -14, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (type === 'glasses') {
    if (id === 'cool') {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(4, -4, 10, 7);
      ctx.fillRect(-14, -4, 10, 7);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(4, -4, 10, 7);
      ctx.strokeRect(-14, -4, 10, 7);
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(-4, 0);
      ctx.stroke();
    } else if (id === 'round') {
      ctx.strokeStyle = '#DAA520';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(8, 0, 6, 0, Math.PI * 2);
      ctx.arc(-8, 0, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(-2, 0);
      ctx.stroke();
    } else if (id === 'star') {
      ctx.fillStyle = '#FF1493';
      drawStarPreview(ctx, 8, 0, 5, 7, 3);
      drawStarPreview(ctx, -8, 0, 5, 7, 3);
    }
  } else if (type === 'scarf') {
    if (id === 'rainbow') {
      const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#8B00FF'];
      colors.forEach((color, i) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 8, 14 + i, 0.3, Math.PI - 0.3);
        ctx.stroke();
      });
    } else {
      ctx.strokeStyle = acc.color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 8, 14, 0.3, Math.PI - 0.3);
      ctx.stroke();
      ctx.fillStyle = acc.color;
      ctx.fillRect(-18, 10, 5, 10);
      ctx.fillRect(13, 10, 5, 10);
    }
  }
  
  ctx.restore();
}

function drawStarPreview(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}

// ── Event Listeners ───────────────────────────────────────────
startBtn.addEventListener('click', () => startGame());
adventureBtn.addEventListener('click', openAdventure);
shopBtn.addEventListener('click', openShop);
backBtn.addEventListener('click', closeShop);
backAdventureBtn.addEventListener('click', closeAdventure);
restartBtn.addEventListener('click', () => startGame(currentLevel));
homeBtn.addEventListener('click', () => {
  gameRunning = false;
  cancelAnimationFrame(animId);
  gameOverScreen.style.display = 'none';
  startScreen.style.display = 'flex';
  scoreDisplay.classList.remove('active');
  updateCoinDisplay();
  initGame();
  menuLoop();
});

document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (!gameRunning && startScreen.style.display !== 'none') {
      startGame();
    } else {
      flap();
    }
  }
});

canvas.addEventListener('click', flap);
canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  flap();
}, { passive: false });

// ── Initialize ────────────────────────────────────────────────
initGame();
menuLoop();


// ── Tab Switching ─────────────────────────────────────────────
function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  
  document.getElementById(`${tabName}-tab`).classList.add('active');
  event.target.classList.add('active');
}
