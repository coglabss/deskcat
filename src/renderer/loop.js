const { AnimationPlayer } = require('./animation-player.js');
const { MoodModel } = require('./mood-model.js');
const { BehaviorController } = require('./behavior-controller.js');
const { Mover } = require('./mover.js');
const { AudioManager } = require('./audio-manager.js');
const { createInputHandler } = require('./input-handler.js');
const { SPRITES, CLIPS } = require('./sprite-config.js');
const { makeBrowserAudio } = require('./browser-audio.js');
const { ipcRenderer } = require('electron');

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const debug = document.getElementById('debug');
// Setting canvas.width/height resets context state, so (re)apply crisp pixel
// scaling inside resize — otherwise the upscaled sprite would look blurry.
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.imageSmoothingEnabled = false;
}
resize(); window.addEventListener('resize', resize);

// Load sprite sheet images
const images = {};
for (const [key, s] of Object.entries(SPRITES.sheets)) {
  const img = new Image(); img.src = s.src; images[key] = img;
}

const bounds = { w: window.innerWidth, h: window.innerHeight };
const footprint = { w: 64, h: 64 };
const mood = new MoodModel();
const behavior = new BehaviorController({ rng: Math.random });
const player = new AnimationPlayer(CLIPS);
const mover = new Mover({ x: bounds.w / 2, y: bounds.h - 80, speed: 70, bounds, footprint });
const audio = new AudioManager({ player: makeBrowserAudio(0.7), cooldownMs: 5000 });

let lastState = behavior.update('content', null, 0);
player.play(lastState.anim);

// Input
const inputQueue = [];
const getCatRect = () => ({ x: mover.x, y: mover.y, w: footprint.w, h: footprint.h });
createInputHandler(
  canvas,
  getCatRect,
  (ev) => inputQueue.push(ev),
  (over) => ipcRenderer.send('cat:hover', over)
);

// Tray actions + mute from the main process
ipcRenderer.on('cat:action', (_e, action) => inputQueue.push({ type: action }));
ipcRenderer.on('cat:mute', (_e, m) => audio.setMuted(m));

const particles = []; // floating emoji effects (hearts, food, zzz)
let zzzTimer = 0;
let decisionTimer = 0;
let prev = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - prev) / 1000);
  prev = now;
  const clock = new Date();

  // drain one input per frame (priority over autonomous decisions)
  const input = inputQueue.shift() || null;
  if (input) {
    if (input.type === 'drag-move') { mover.x = input.x - footprint.w / 2; mover.y = input.y - footprint.h / 2; }
    if (input.type === 'pet') { mood.pet(); spawnHearts(); }
    if (input.type === 'feed') { mood.feed(); spawnFood(); }
    if (input.type === 'play') mood.play();
    if (input.type === 'sleep') mood.energy = Math.min(mood.energy, 15);
  }

  // Decide behavior ~ every 2.5s, or immediately on a forcing input
  decisionTimer -= dt;
  const forcing = !!input && ['drag-start', 'drag-end', 'feed', 'play', 'pet', 'sleep'].includes(input.type);
  if (forcing || decisionTimer <= 0) {
    const m = mood.dominantMood(clock);
    lastState = behavior.update(m, forcing ? input : null, dt);
    player.play(lastState.anim);
    audio.cue(lastState.sound);
    // Occasional ambient meow when calm — NOT on every walk. ~4% per decision
    // (a decision is ~every 2.5s) averages a meow roughly once a minute; the
    // AudioManager cooldown still prevents any bunching.
    if (!forcing && (lastState.name === 'WANDER' || lastState.name === 'SIT') && Math.random() < 0.04) {
      audio.cue('meow');
    }
    decisionTimer = 2.5;
    if (lastState.name === 'WANDER') {
      const p = mover.randomWanderPoint();
      mover.setTarget(p.x, p.y);
    }
  }

  // Advance mood with the behavior's activity state
  mood.tick(dt, clock, lastState.moodState);

  // Movement only while wandering
  if (lastState.name === 'WANDER') mover.update(dt);
  player.update(dt);

  // Floating Zzz while asleep (every ~1.4s)
  if (lastState.name === 'SLEEP') {
    zzzTimer -= dt;
    if (zzzTimer <= 0) { spawnZzz(); zzzTimer = 1.4; }
  } else {
    zzzTimer = 0;
  }

  render(dt);
  debug.textContent = `${lastState.name} | H${mood.hunger | 0} E${mood.energy | 0} J${mood.happiness | 0}`;
  requestAnimationFrame(frame);
}

// Generic floating-emoji particle. Drifts up and fades out.
function spawnParticle(char, o = {}) {
  particles.push({
    x: mover.x + (o.dx ?? footprint.w / 2),
    y: mover.y + (o.dy ?? 0),
    char,
    vx: o.vx ?? 0,
    vy: o.vy ?? -30,
    size: o.size ?? 20,
    life: o.life ?? 1,
    maxLife: o.life ?? 1,
  });
}
function spawnHearts() {
  for (let i = 0; i < 2; i++) {
    spawnParticle('❤️', { dx: footprint.w / 2 + (Math.random() * 20 - 10), vy: -35, life: 1, size: 18 });
  }
}
function spawnFood() {
  spawnParticle('🍖', { dx: footprint.w / 2, dy: 6, vy: -24, life: 1.4, size: 24 });
}
function spawnZzz() {
  spawnParticle('💤', { dx: footprint.w * 0.62, dy: 6, vx: 10, vy: -18, life: 1.6, size: 18 });
}

function render(dt) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const clip = SPRITES.clips[lastState.anim] || SPRITES.clips.idle;
  const sheet = SPRITES.sheets[clip.sheet];
  const img = images[clip.sheet];
  const f = player.currentFrame();
  if (img && img.complete && img.naturalWidth > 0) {
    const sx = ((clip.col || 0) + f) * sheet.frameW;
    const sy = clip.row * sheet.frameH;
    ctx.save();
    // Source art faces LEFT, so mirror it when the cat is facing/moving RIGHT.
    if (mover.facing === 1) {
      ctx.translate(mover.x + footprint.w, mover.y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, sx, sy, sheet.frameW, sheet.frameH, 0, 0, footprint.w, footprint.h);
    } else {
      ctx.drawImage(img, sx, sy, sheet.frameW, sheet.frameH, mover.x, mover.y, footprint.w, footprint.h);
    }
    ctx.restore();
  } else {
    ctx.fillStyle = 'rgba(255,170,90,.9)';
    ctx.fillRect(mover.x, mover.y, footprint.w, footprint.h); // fallback block until art loads
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.font = `${p.size}px serif`;
    ctx.fillText(p.char, p.x, p.y);
    ctx.globalAlpha = 1;
  }
}

requestAnimationFrame(frame);
