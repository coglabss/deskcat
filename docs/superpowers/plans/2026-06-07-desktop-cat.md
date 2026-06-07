# Desktop Cat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a cute, free-roaming animated desktop cat for Windows that has moods, makes real cat sounds, and can be petted/dragged/fed — running as a transparent always-on-top Electron overlay.

**Architecture:** Electron app with a main process (transparent click-through overlay window, system tray, autostart) and a renderer process (the "cat world": pure-logic mood + behavior modules driving a sprite animation/movement/audio engine). The pure-logic modules (MoodModel, BehaviorController, AnimationPlayer, AudioManager) are unit-tested with Jest; the Electron glue is verified manually.

**Tech Stack:** Electron, vanilla JS + Canvas, electron-store, Jest. Art: "Cat Pack" by octopusinkus. Audio: CC0 cat sounds.

---

## Plan Revision Note (2026-06-07, during execution)

**Module system:** All modules use **CommonJS** (`module.exports` / `require`) consistently —
both the jest-tested logic modules AND the renderer files. The renderer (`index.html`) loads
`loop.js` as a plain `<script src="./loop.js">` (NOT `type="module"`), and the Electron
overlay window is created with `webPreferences: { nodeIntegration: true, contextIsolation:
false }` so the renderer can `require()` local modules and `require('electron').ipcRenderer`
directly. This replaces the original draft's ES-module `import`/`export` in `loop.js`,
`sprite-config.js`, `browser-audio.js`, `input-handler.js`, and the `preload.js` +
`contextBridge` bridge (dropped). Rationale: ES `import` and CommonJS `require` cannot mix
without a bundler; keeping one system (CommonJS) avoids a build step. `nodeIntegration: true`
is acceptable here because the app only ever loads bundled local files (no remote content).
IPC: renderer uses `ipcRenderer.send('cat:hover', over)` and `ipcRenderer.on('cat:action'|
'cat:mute', ...)`; main uses `ipcMain.on('cat:hover')` and `win.webContents.send(...)`.

---

## File Structure

```
desktop-cat/
  package.json
  jest.config.js
  src/
    main/
      main.js              # app bootstrap, single-instance lock, wiring
      overlay-window.js    # transparent always-on-top overlay BrowserWindow
      passthrough.js       # mouse click-through toggling
      tray.js              # system-tray icon + menu
      autostart.js         # login-item wrapper
    renderer/
      index.html           # canvas host, loads loop.js
      loop.js              # rAF loop wiring all modules
      mood-model.js        # stats -> dominant mood (PURE)
      behavior-controller.js # mood+input -> state (PURE)
      mover.js             # position/walking (PURE-ish)
      animation-player.js  # sprite frame math (PURE)
      audio-manager.js     # mood/event -> sound w/ cooldowns
      input-handler.js     # pointer -> drag/pet/play + hit-test
      sprite-config.js     # frame metadata for octopusinkus sheets
      settings.js          # electron-store wrapper (renderer side via preload/ipc)
  assets/
    cats/                  # octopusinkus sprite sheets (manual download)
    sounds/                # CC0 cat audio (manual download)
    tray-icon.png
  test/
    animation-player.test.js
    mood-model.test.js
    behavior-controller.test.js
    audio-manager.test.js
    mover.test.js
```

---

## Task 0: Asset Acquisition (manual prep — do first)

**No code.** These downloads can't be scripted (license click-through).

- [ ] **Step 1:** Download "Cat Pack" by octopusinkus from https://octopusinkus.itch.io/cat-pack (name-your-price; $0 is allowed). Unzip the sprite-sheet PNGs into `assets/cats/`. Note one cat color's sheet filenames and, for each animation (idle, walk, run, sit, sit-to-stand, paw/lick, yarn-play, sleep), its frame width/height and frame count — you'll enter these in `sprite-config.js` in Task 9.
- [ ] **Step 2:** Download CC0 cat sounds from https://freesound.org (filter License = "Creative Commons 0") or https://pixabay.com/sound-effects/search/cat/ . Save as `assets/sounds/meow.mp3`, `beg.mp3`, `purr.mp3`, `snore.mp3`, `chirp.mp3`, `grumpy.mp3`. Keep each short (<2s except purr/snore).
- [ ] **Step 3:** Save any 32×32 PNG as `assets/tray-icon.png` (placeholder is fine; can use one cat idle frame).

---

## Task 1: Project scaffolding + Electron "hello window"

**Files:**
- Create: `package.json`, `jest.config.js`, `src/main/main.js`, `src/renderer/index.html`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "desktop-cat",
  "version": "0.1.0",
  "description": "A cute free-roaming desktop pet cat",
  "main": "src/main/main.js",
  "scripts": {
    "start": "electron .",
    "test": "jest"
  },
  "devDependencies": {
    "electron": "^31.0.0",
    "jest": "^29.7.0"
  },
  "dependencies": {
    "electron-store": "^8.2.0"
  }
}
```

- [ ] **Step 2: Create `jest.config.js`**

```js
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.js'],
};
```

- [ ] **Step 3: Create minimal `src/renderer/index.html`**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    html, body { margin: 0; padding: 0; overflow: hidden; background: transparent; }
    #stage { position: fixed; inset: 0; }
    #debug { position: fixed; top: 8px; left: 8px; color: #0f0; font: 14px monospace; }
  </style>
</head>
<body>
  <canvas id="stage"></canvas>
  <div id="debug">cat booting…</div>
  <script type="module" src="./loop.js"></script>
</body>
</html>
```

- [ ] **Step 4: Create minimal `src/main/main.js` (window only for now)**

```js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: { contextIsolation: true },
  });
  win.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
```

- [ ] **Step 5: Create a stub `src/renderer/loop.js` so the page loads**

```js
document.getElementById('debug').textContent = 'cat alive (stub loop)';
```

- [ ] **Step 6: Install and run**

Run: `npm install`
Run: `npm start`
Expected: a normal window opens showing green text "cat alive (stub loop)".

- [ ] **Step 7: Commit**

```bash
git add package.json jest.config.js src/main/main.js src/renderer/index.html src/renderer/loop.js
git commit -m "feat: scaffold Electron app with hello window"
```

---

## Task 2: AnimationPlayer (PURE, TDD)

Computes which sprite frame to show given elapsed time. Knows nothing about canvas.

**Files:**
- Create: `src/renderer/animation-player.js`
- Test: `test/animation-player.test.js`

- [ ] **Step 1: Write the failing test**

```js
const { AnimationPlayer } = require('../src/renderer/animation-player.js');

// A "clip" = { name, frames, fps, loop }
const clips = {
  walk: { frames: 4, fps: 10, loop: true },
  sleep: { frames: 2, fps: 2, loop: true },
  pounce: { frames: 3, fps: 6, loop: false },
};

test('starts on frame 0', () => {
  const p = new AnimationPlayer(clips);
  p.play('walk');
  expect(p.currentFrame()).toBe(0);
});

test('advances frames by elapsed time', () => {
  const p = new AnimationPlayer(clips);
  p.play('walk');           // 10 fps => 0.1s per frame
  p.update(0.1);
  expect(p.currentFrame()).toBe(1);
  p.update(0.25);           // +2.5 frames => total frame 3
  expect(p.currentFrame()).toBe(3);
});

test('loops when loop=true', () => {
  const p = new AnimationPlayer(clips);
  p.play('walk');
  p.update(0.4);            // exactly 4 frames -> wraps to 0
  expect(p.currentFrame()).toBe(0);
});

test('one-shot clamps to last frame and reports done', () => {
  const p = new AnimationPlayer(clips);
  p.play('pounce');         // 3 frames @6fps
  p.update(1.0);
  expect(p.currentFrame()).toBe(2);
  expect(p.isDone()).toBe(true);
});

test('play() restarts the clip', () => {
  const p = new AnimationPlayer(clips);
  p.play('walk'); p.update(0.2);
  p.play('walk');
  expect(p.currentFrame()).toBe(0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- animation-player`
Expected: FAIL — "Cannot find module '../src/renderer/animation-player.js'".

- [ ] **Step 3: Write minimal implementation**

```js
class AnimationPlayer {
  constructor(clips) {
    this.clips = clips;
    this.name = null;
    this.elapsed = 0;
  }
  play(name) {
    if (!this.clips[name]) throw new Error(`unknown clip: ${name}`);
    this.name = name;
    this.elapsed = 0;
  }
  update(dt) {
    if (this.name) this.elapsed += dt;
  }
  currentFrame() {
    const c = this.clips[this.name];
    if (!c) return 0;
    const raw = Math.floor(this.elapsed * c.fps);
    if (c.loop) return raw % c.frames;
    return Math.min(raw, c.frames - 1);
  }
  isDone() {
    const c = this.clips[this.name];
    if (!c || c.loop) return false;
    return Math.floor(this.elapsed * c.fps) >= c.frames - 1;
  }
}

module.exports = { AnimationPlayer };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- animation-player`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/renderer/animation-player.js test/animation-player.test.js
git commit -m "feat: AnimationPlayer with looped + one-shot clips"
```

---

## Task 3: MoodModel (PURE, TDD)

Holds hunger/energy/happiness, ticks them over time, exposes the dominant mood.

**Files:**
- Create: `src/renderer/mood-model.js`
- Test: `test/mood-model.test.js`

- [ ] **Step 1: Write the failing test**

```js
const { MoodModel } = require('../src/renderer/mood-model.js');

const noon = new Date('2026-06-07T12:00:00');
const night = new Date('2026-06-07T23:30:00');

test('defaults to content', () => {
  const m = new MoodModel();
  expect(m.dominantMood(noon)).toBe('content');
});

test('hunger rises over time and triggers hungry', () => {
  const m = new MoodModel({ hunger: 0 });
  m.tick(1000, noon, 'active');     // long time -> hunger maxes
  expect(m.hunger).toBeGreaterThanOrEqual(80);
  expect(m.dominantMood(noon)).toBe('hungry');
});

test('feed() resets hunger', () => {
  const m = new MoodModel({ hunger: 90 });
  m.feed();
  expect(m.hunger).toBeLessThanOrEqual(10);
  expect(m.dominantMood(noon)).not.toBe('hungry');
});

test('staying active drains energy into sleepy', () => {
  const m = new MoodModel({ energy: 100, hunger: 0 });
  m.tick(1000, noon, 'active');
  expect(m.energy).toBeLessThanOrEqual(20);
  expect(m.dominantMood(noon)).toBe('sleepy');
});

test('sleeping recovers energy', () => {
  const m = new MoodModel({ energy: 5, hunger: 0 });
  m.tick(1000, noon, 'sleeping');
  expect(m.energy).toBeGreaterThanOrEqual(80);
});

test('night lowers the sleepy threshold', () => {
  const m = new MoodModel({ energy: 45, hunger: 0, happiness: 50 });
  expect(m.dominantMood(noon)).not.toBe('sleepy'); // 45 ok in daytime
  expect(m.dominantMood(night)).toBe('sleepy');    // 45 sleepy at night
});

test('pet() and play() raise happiness; play costs energy', () => {
  const m = new MoodModel({ happiness: 0, energy: 50 });
  m.pet();
  expect(m.happiness).toBeGreaterThan(0);
  const before = m.energy;
  m.play();
  expect(m.energy).toBeLessThan(before);
});

test('playful when happy and rested', () => {
  const m = new MoodModel({ hunger: 0, energy: 80, happiness: 90 });
  expect(m.dominantMood(noon)).toBe('playful');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- mood-model`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```js
const clamp = (v) => Math.max(0, Math.min(100, v));

const RATES = {
  hungerPerSec: 0.3,    // ~5.5 min to get hungry from full
  energyDrainPerSec: 0.25,
  energyRecoverPerSec: 0.5,
  energyRestPerSec: 0.05,
  happinessDecayPerSec: 0.05,
};

class MoodModel {
  constructor(init = {}) {
    this.hunger = init.hunger ?? 20;
    this.energy = init.energy ?? 80;
    this.happiness = init.happiness ?? 70;
  }

  // state: 'active' | 'resting' | 'sleeping'
  tick(dtSeconds, now, state = 'resting') {
    this.hunger = clamp(this.hunger + RATES.hungerPerSec * dtSeconds);
    this.happiness = clamp(this.happiness - RATES.happinessDecayPerSec * dtSeconds);
    if (state === 'sleeping') {
      this.energy = clamp(this.energy + RATES.energyRecoverPerSec * dtSeconds);
    } else if (state === 'active') {
      this.energy = clamp(this.energy - RATES.energyDrainPerSec * dtSeconds);
    } else {
      this.energy = clamp(this.energy + RATES.energyRestPerSec * dtSeconds);
    }
  }

  feed() { this.hunger = clamp(this.hunger - 90); this.happiness = clamp(this.happiness + 10); }
  pet() { this.happiness = clamp(this.happiness + 15); }
  play() { this.happiness = clamp(this.happiness + 20); this.energy = clamp(this.energy - 10); }

  isNight(now) { const h = now.getHours(); return h >= 22 || h < 6; }

  dominantMood(now) {
    if (this.hunger >= 80) return 'hungry';
    if (this.energy <= 20) return 'sleepy';
    if (this.isNight(now) && this.energy < 50) return 'sleepy';
    if (this.energy <= 40) return 'tired';
    if (this.happiness >= 60 && this.energy >= 50) return 'playful';
    return 'content';
  }
}

module.exports = { MoodModel };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- mood-model`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/mood-model.js test/mood-model.test.js
git commit -m "feat: MoodModel stats and dominant-mood logic"
```

---

## Task 4: BehaviorController (PURE, TDD)

Maps mood + input + randomness to a behavior state with an animation + sound cue. RNG and
"pick a wander point" are injected so it's deterministic in tests.

**Files:**
- Create: `src/renderer/behavior-controller.js`
- Test: `test/behavior-controller.test.js`

- [ ] **Step 1: Write the failing test**

```js
const { BehaviorController } = require('../src/renderer/behavior-controller.js');

// deterministic RNG returning a fixed value
const rng = (v) => () => v;

test('drag input forces DRAGGED', () => {
  const b = new BehaviorController({ rng: rng(0.5) });
  const s = b.update('content', { type: 'drag-start' }, 0.1);
  expect(s.name).toBe('DRAGGED');
  expect(s.anim).toBe('idle');
  expect(s.moodState).toBe('active');
});

test('feed input forces EAT', () => {
  const b = new BehaviorController({ rng: rng(0.5) });
  const s = b.update('hungry', { type: 'feed' }, 0.1);
  expect(s.name).toBe('EAT');
});

test('hungry mood begs', () => {
  const b = new BehaviorController({ rng: rng(0.99) });
  const s = b.update('hungry', null, 0.1);
  expect(s.name).toBe('BEG');
  expect(s.sound).toBe('beg');
});

test('sleepy mood sleeps and reports sleeping state', () => {
  const b = new BehaviorController({ rng: rng(0.99) });
  const s = b.update('sleepy', null, 0.1);
  expect(s.name).toBe('SLEEP');
  expect(s.anim).toBe('sleep');
  expect(s.sound).toBe('snore');
  expect(s.moodState).toBe('sleeping');
});

test('play input forces PLAY', () => {
  const b = new BehaviorController({ rng: rng(0.5) });
  const s = b.update('content', { type: 'play' }, 0.1);
  expect(s.name).toBe('PLAY');
  expect(s.moodState).toBe('active');
});

test('pet input gives a transient PET_REACT', () => {
  const b = new BehaviorController({ rng: rng(0.5) });
  const s = b.update('content', { type: 'pet' }, 0.1);
  expect(s.name).toBe('PET_REACT');
  expect(s.sound).toBe('purr');
});

test('content mood eventually wanders (low rng) or sits (high rng)', () => {
  const wander = new BehaviorController({ rng: rng(0.0) }).update('content', null, 0.1);
  expect(wander.name).toBe('WANDER');
  const sit = new BehaviorController({ rng: rng(0.99) }).update('content', null, 0.1);
  expect(sit.name).toBe('SIT');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- behavior-controller`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```js
// State shape: { name, anim, sound|null, moodState, transient? }
const STATES = {
  DRAGGED:   { name: 'DRAGGED',   anim: 'idle',  sound: null,    moodState: 'active' },
  EAT:       { name: 'EAT',       anim: 'lick',  sound: 'chirp', moodState: 'active' },
  BEG:       { name: 'BEG',       anim: 'paw',   sound: 'beg',   moodState: 'resting' },
  SLEEP:     { name: 'SLEEP',     anim: 'sleep', sound: 'snore', moodState: 'sleeping' },
  REST:      { name: 'REST',      anim: 'sit',   sound: 'purr',  moodState: 'resting' },
  PLAY:      { name: 'PLAY',      anim: 'yarn',  sound: 'chirp', moodState: 'active' },
  WANDER:    { name: 'WANDER',    anim: 'walk',  sound: 'meow',  moodState: 'active' },
  SIT:       { name: 'SIT',       anim: 'sit',   sound: null,    moodState: 'resting' },
  PET_REACT: { name: 'PET_REACT', anim: 'sit',   sound: 'purr',  moodState: 'resting', transient: true },
};

class BehaviorController {
  constructor({ rng = Math.random } = {}) {
    this.rng = rng;
    this.current = STATES.SIT;
  }

  update(mood, input, _dt) {
    if (input) {
      switch (input.type) {
        case 'drag-start': return (this.current = STATES.DRAGGED);
        case 'feed':       return (this.current = STATES.EAT);
        case 'play':       return (this.current = STATES.PLAY);
        case 'pet':        return STATES.PET_REACT; // transient, doesn't replace current
      }
    }
    switch (mood) {
      case 'hungry':  return (this.current = STATES.BEG);
      case 'sleepy':  return (this.current = STATES.SLEEP);
      case 'tired':   return (this.current = STATES.REST);
      case 'playful': return (this.current = STATES.PLAY);
      default:        return (this.current = this.rng() < 0.5 ? STATES.WANDER : STATES.SIT);
    }
  }
}

module.exports = { BehaviorController, STATES };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- behavior-controller`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/behavior-controller.js test/behavior-controller.test.js
git commit -m "feat: BehaviorController mapping mood+input to states"
```

---

## Task 5: Mover (PURE, TDD)

Owns x/y position and walks toward a target, flips facing, clamps to bounds, picks wander
points.

**Files:**
- Create: `src/renderer/mover.js`
- Test: `test/mover.test.js`

- [ ] **Step 1: Write the failing test**

```js
const { Mover } = require('../src/renderer/mover.js');

const bounds = { w: 1000, h: 800 };

test('walks toward target and faces right', () => {
  const m = new Mover({ x: 0, y: 0, speed: 100, bounds });
  m.setTarget(50, 0);
  m.update(0.1);            // 100px/s * 0.1s = 10px
  expect(m.x).toBeCloseTo(10);
  expect(m.facing).toBe(1); // right
});

test('faces left when target is left', () => {
  const m = new Mover({ x: 100, y: 0, speed: 100, bounds });
  m.setTarget(0, 0);
  m.update(0.1);
  expect(m.facing).toBe(-1);
});

test('stops at target and reports arrived', () => {
  const m = new Mover({ x: 0, y: 0, speed: 100, bounds });
  m.setTarget(5, 0);
  m.update(1.0);            // would overshoot -> clamp to target
  expect(m.x).toBeCloseTo(5);
  expect(m.arrived()).toBe(true);
});

test('clamps position within bounds', () => {
  const m = new Mover({ x: 990, y: 790, speed: 100, bounds, footprint: { w: 64, h: 64 } });
  m.setTarget(5000, 5000);
  m.update(1.0);
  expect(m.x).toBeLessThanOrEqual(bounds.w - 64);
  expect(m.y).toBeLessThanOrEqual(bounds.h - 64);
});

test('randomWanderPoint stays in bounds (uses injected rng)', () => {
  const m = new Mover({ x: 0, y: 0, speed: 100, bounds, footprint: { w: 64, h: 64 } });
  const p = m.randomWanderPoint(() => 1.0);
  expect(p.x).toBeLessThanOrEqual(bounds.w - 64);
  expect(p.y).toBeLessThanOrEqual(bounds.h - 64);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- mover`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```js
class Mover {
  constructor({ x = 0, y = 0, speed = 80, bounds, footprint = { w: 64, h: 64 } }) {
    this.x = x; this.y = y; this.speed = speed;
    this.bounds = bounds; this.footprint = footprint;
    this.tx = x; this.ty = y; this.facing = 1;
  }
  setTarget(x, y) {
    this.tx = x; this.ty = y;
    if (x !== this.x) this.facing = x > this.x ? 1 : -1;
  }
  update(dt) {
    const dx = this.tx - this.x, dy = this.ty - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt;
    if (dist <= step || dist === 0) { this.x = this.tx; this.y = this.ty; }
    else { this.x += (dx / dist) * step; this.y += (dy / dist) * step; }
    this._clamp();
  }
  _clamp() {
    const maxX = this.bounds.w - this.footprint.w;
    const maxY = this.bounds.h - this.footprint.h;
    this.x = Math.max(0, Math.min(maxX, this.x));
    this.y = Math.max(0, Math.min(maxY, this.y));
  }
  arrived() { return Math.hypot(this.tx - this.x, this.ty - this.y) < 0.5; }
  randomWanderPoint(rng = Math.random) {
    const maxX = this.bounds.w - this.footprint.w;
    const maxY = this.bounds.h - this.footprint.h;
    return { x: rng() * maxX, y: rng() * maxY };
  }
}

module.exports = { Mover };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- mover`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/mover.js test/mover.test.js
git commit -m "feat: Mover walking, facing, bounds clamp, wander points"
```

---

## Task 6: AudioManager (TDD with a fake player)

Maps sound cues to playback, enforcing per-sound cooldowns so the cat never spams noise.
Audio playback is injected so it's testable in Node.

**Files:**
- Create: `src/renderer/audio-manager.js`
- Test: `test/audio-manager.test.js`

- [ ] **Step 1: Write the failing test**

```js
const { AudioManager } = require('../src/renderer/audio-manager.js');

function fake() {
  const played = [];
  return { play: (name) => played.push(name), played };
}

test('plays a cue', () => {
  const f = fake();
  const a = new AudioManager({ player: f, cooldownMs: 1000, now: () => 0 });
  a.cue('meow');
  expect(f.played).toEqual(['meow']);
});

test('respects per-sound cooldown', () => {
  const f = fake();
  let t = 0;
  const a = new AudioManager({ player: f, cooldownMs: 1000, now: () => t });
  a.cue('meow');        // t=0 plays
  t = 500; a.cue('meow'); // within cooldown -> ignored
  t = 1500; a.cue('meow'); // cooldown elapsed -> plays
  expect(f.played).toEqual(['meow', 'meow']);
});

test('different sounds have independent cooldowns', () => {
  const f = fake();
  const a = new AudioManager({ player: f, cooldownMs: 1000, now: () => 0 });
  a.cue('meow'); a.cue('purr');
  expect(f.played).toEqual(['meow', 'purr']);
});

test('null cue plays nothing', () => {
  const f = fake();
  const a = new AudioManager({ player: f, cooldownMs: 1000, now: () => 0 });
  a.cue(null);
  expect(f.played).toEqual([]);
});

test('muted plays nothing', () => {
  const f = fake();
  const a = new AudioManager({ player: f, cooldownMs: 1000, now: () => 0, muted: true });
  a.cue('meow');
  expect(f.played).toEqual([]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- audio-manager`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```js
class AudioManager {
  constructor({ player, cooldownMs = 4000, now = () => Date.now(), muted = false } = {}) {
    this.player = player;
    this.cooldownMs = cooldownMs;
    this.now = now;
    this.muted = muted;
    this.lastPlayed = {}; // name -> timestamp
  }
  setMuted(m) { this.muted = m; }
  cue(name) {
    if (!name || this.muted) return;
    const t = this.now();
    const last = this.lastPlayed[name];
    if (last !== undefined && t - last < this.cooldownMs) return;
    this.lastPlayed[name] = t;
    this.player.play(name);
  }
}

module.exports = { AudioManager };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- audio-manager`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/renderer/audio-manager.js test/audio-manager.test.js
git commit -m "feat: AudioManager with per-sound cooldowns and mute"
```

---

## Task 7: Sprite config + browser audio player

Concrete glue (not unit-tested): the real frame metadata and a browser `Audio` wrapper.

**Files:**
- Create: `src/renderer/sprite-config.js`, `src/renderer/browser-audio.js`

- [ ] **Step 1: Create `src/renderer/sprite-config.js`**

> Fill `frames`, `fps`, `loop`, and sheet `src`/`frameW`/`frameH` from the values you noted
> in Task 0. The keys MUST match the `anim` names used in BehaviorController
> (`idle, walk, run, sit, lick, paw, yarn, sleep`). Example shape:

```js
// Each clip: which sheet image, frame size, frame count, fps, loop.
export const SPRITES = {
  sheets: {
    main: { src: '../../assets/cats/cat-orange.png', frameW: 32, frameH: 32 },
  },
  clips: {
    idle:  { sheet: 'main', row: 0, frames: 4, fps: 6,  loop: true },
    walk:  { sheet: 'main', row: 1, frames: 4, fps: 10, loop: true },
    run:   { sheet: 'main', row: 2, frames: 4, fps: 14, loop: true },
    sit:   { sheet: 'main', row: 3, frames: 2, fps: 3,  loop: true },
    lick:  { sheet: 'main', row: 4, frames: 4, fps: 8,  loop: true },
    paw:   { sheet: 'main', row: 5, frames: 4, fps: 8,  loop: true },
    yarn:  { sheet: 'main', row: 6, frames: 4, fps: 12, loop: true },
    sleep: { sheet: 'main', row: 7, frames: 2, fps: 2,  loop: true },
  },
};

// AnimationPlayer only needs {frames, fps, loop} per clip:
export const CLIPS = Object.fromEntries(
  Object.entries(SPRITES.clips).map(([k, v]) => [k, { frames: v.frames, fps: v.fps, loop: v.loop }])
);
```

- [ ] **Step 2: Create `src/renderer/browser-audio.js`**

```js
// Real audio player for the renderer; satisfies AudioManager's { play(name) } contract.
const FILES = {
  meow: 'meow.mp3', beg: 'beg.mp3', purr: 'purr.mp3',
  snore: 'snore.mp3', chirp: 'chirp.mp3', grumpy: 'grumpy.mp3',
};

export function makeBrowserAudio(volume = 0.7) {
  const cache = {};
  for (const [k, f] of Object.entries(FILES)) {
    const a = new Audio(`../../assets/sounds/${f}`);
    a.volume = volume;
    cache[k] = a;
  }
  return {
    setVolume(v) { for (const a of Object.values(cache)) a.volume = v; },
    play(name) {
      const a = cache[name];
      if (!a) return;
      try { a.currentTime = 0; a.play().catch(() => {}); } catch (_) {}
    },
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/renderer/sprite-config.js src/renderer/browser-audio.js
git commit -m "feat: sprite frame config and browser audio player"
```

---

## Task 8: InputHandler (drag / pet / play + hit-test)

Translates pointer events on the canvas into behavior inputs and reports whether the pointer
is over the cat (for click-through).

**Files:**
- Create: `src/renderer/input-handler.js`

- [ ] **Step 1: Create `src/renderer/input-handler.js`**

```js
// Emits input events: {type:'drag-start'|'drag-move'|'drag-end'|'pet'|'play', x, y}
// getCatRect() returns the cat's current screen rect {x,y,w,h}.
export function createInputHandler(canvas, getCatRect, emit, reportHover) {
  let dragging = false;
  let movedDuringDrag = false;
  let downAt = 0;

  const inCat = (e) => {
    const r = getCatRect();
    return e.clientX >= r.x && e.clientX <= r.x + r.w &&
           e.clientY >= r.y && e.clientY <= r.y + r.h;
  };

  canvas.addEventListener('mousemove', (e) => {
    reportHover(inCat(e));
    if (dragging) { movedDuringDrag = true; emit({ type: 'drag-move', x: e.clientX, y: e.clientY }); }
  });

  canvas.addEventListener('mousedown', (e) => {
    if (!inCat(e)) return;
    dragging = true; movedDuringDrag = false; downAt = Date.now();
    emit({ type: 'drag-start', x: e.clientX, y: e.clientY });
  });

  window.addEventListener('mouseup', (e) => {
    if (!dragging) return;
    dragging = false;
    emit({ type: 'drag-end', x: e.clientX, y: e.clientY });
    if (!movedDuringDrag) emit({ type: 'pet', x: e.clientX, y: e.clientY }); // click w/o move = pet
  });

  canvas.addEventListener('dblclick', (e) => {
    if (inCat(e)) emit({ type: 'play', x: e.clientX, y: e.clientY });
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/input-handler.js
git commit -m "feat: pointer input handler for drag/pet/play and hover hit-test"
```

---

## Task 9: Renderer loop — wire the cat world together

The rAF loop: tick mood → pick behavior → move → animate → draw → cue audio. Also draws a
heart particle on pet and renders the current sprite frame to canvas.

**Files:**
- Modify (replace stub): `src/renderer/loop.js`

- [ ] **Step 1: Replace `src/renderer/loop.js` with the full loop**

```js
import { AnimationPlayer } from './animation-player.js';
import { MoodModel } from './mood-model.js';
import { BehaviorController } from './behavior-controller.js';
import { Mover } from './mover.js';
import { AudioManager } from './audio-manager.js';
import { createInputHandler } from './input-handler.js';
import { SPRITES, CLIPS } from './sprite-config.js';
import { makeBrowserAudio } from './browser-audio.js';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const debug = document.getElementById('debug');
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
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
let hovering = false;
createInputHandler(
  canvas,
  getCatRect,
  (ev) => inputQueue.push(ev),
  (over) => {
    hovering = over;
    if (window.catAPI) window.catAPI.setHover(over); // tell main to (dis)allow click-through
  }
);

const hearts = [];
let decisionTimer = 0;
let prev = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - prev) / 1000);
  prev = now;
  const clock = new Date();

  // drain one input per frame (priority over autonomous decisions)
  const input = inputQueue.shift() || null;
  if (input?.type === 'drag-move') { mover.x = input.x - footprint.w / 2; mover.y = input.y - footprint.h / 2; }
  if (input?.type === 'pet') { mood.pet(); spawnHeart(); }
  if (input?.type === 'feed') mood.feed();
  if (input?.type === 'play') mood.play();

  // Decide behavior ~ every 2.5s, or immediately on a forcing input
  decisionTimer -= dt;
  const forcing = input && ['drag-start', 'feed', 'play', 'pet'].includes(input.type);
  if (forcing || decisionTimer <= 0) {
    const m = mood.dominantMood(clock);
    lastState = behavior.update(m, forcing ? input : null, dt);
    player.play(lastState.anim);
    audio.cue(lastState.sound);
    decisionTimer = 2.5;
    if (lastState.name === 'WANDER') {
      const p = mover.randomWanderPoint();
      mover.setTarget(p.x, p.y);
    }
  }

  // Advance mood with the behavior's moodState
  mood.tick(dt, clock, lastState.moodState);

  // Movement only while wandering/dragged-not
  if (lastState.name === 'WANDER') mover.update(dt);
  player.update(dt);

  render();
  debug.textContent = `${lastState.name} | H${mood.hunger|0} E${mood.energy|0} J${mood.happiness|0}`;
  requestAnimationFrame(frame);
}

function spawnHeart() { hearts.push({ x: mover.x + 32, y: mover.y, life: 1 }); }

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // draw cat
  const clip = SPRITES.clips[lastState.anim] || SPRITES.clips.idle;
  const sheet = SPRITES.sheets[clip.sheet];
  const img = images[clip.sheet];
  const f = player.currentFrame();
  if (img && img.complete) {
    const sx = f * sheet.frameW;
    const sy = clip.row * sheet.frameH;
    ctx.save();
    if (mover.facing === -1) {
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
  // hearts
  for (let i = hearts.length - 1; i >= 0; i--) {
    const h = hearts[i]; h.y -= 30 * 0.016; h.life -= 0.016;
    if (h.life <= 0) { hearts.splice(i, 1); continue; }
    ctx.globalAlpha = Math.max(0, h.life);
    ctx.font = '20px serif'; ctx.fillText('❤️', h.x, h.y);
    ctx.globalAlpha = 1;
  }
}

// Receive tray actions from main (Task 12)
if (window.catAPI) {
  window.catAPI.onAction((action) => inputQueue.push({ type: action }));
  window.catAPI.onMute((m) => audio.setMuted(m));
}

requestAnimationFrame(frame);
```

- [ ] **Step 2: Run the app to see the cat move (art optional)**

Run: `npm start`
Expected: With sheets present, an animated cat wanders along the bottom. Without art yet, an
orange block slides around. Debug text shows state + stats updating.

- [ ] **Step 3: Commit**

```bash
git add src/renderer/loop.js
git commit -m "feat: renderer loop wiring mood/behavior/mover/animation/audio"
```

---

## Task 10: Overlay window — transparent, always-on-top, full desktop

**Files:**
- Create: `src/main/overlay-window.js`
- Modify: `src/main/main.js`

- [ ] **Step 1: Create `src/main/overlay-window.js`**

```js
const { BrowserWindow, screen } = require('electron');
const path = require('path');

function createOverlay() {
  const { workArea } = screen.getPrimaryDisplay();
  const win = new BrowserWindow({
    x: workArea.x, y: workArea.y, width: workArea.width, height: workArea.height,
    transparent: true,
    frame: false,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: true,
    hasShadow: false,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true);
  win.loadFile(path.join(__dirname, '../renderer/index.html'));
  return win;
}

module.exports = { createOverlay };
```

- [ ] **Step 2: Replace `src/main/main.js` body to use the overlay + single-instance lock**

```js
const { app } = require('electron');
const { createOverlay } = require('./overlay-window');

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); }
else {
  let win = null;
  app.whenReady().then(() => { win = createOverlay(); });
  app.on('second-instance', () => { if (win) win.show(); });
  app.on('window-all-closed', () => app.quit());
}
```

- [ ] **Step 3: Run and verify**

Run: `npm start`
Expected: No window chrome; cat (or fallback block) appears over the desktop. (Click-through
comes next — for now the whole overlay may capture clicks; that's fine to verify visuals.)

- [ ] **Step 4: Commit**

```bash
git add src/main/overlay-window.js src/main/main.js
git commit -m "feat: transparent always-on-top desktop overlay window"
```

---

## Task 11: Click-through passthrough + preload bridge

Make the overlay ignore the mouse everywhere except over the cat, using the renderer's hover
reports.

**Files:**
- Create: `src/main/preload.js`, `src/main/passthrough.js`
- Modify: `src/main/main.js`

- [ ] **Step 1: Create `src/main/preload.js`**

```js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('catAPI', {
  setHover: (over) => ipcRenderer.send('cat:hover', over),
  onAction: (cb) => ipcRenderer.on('cat:action', (_e, action) => cb(action)),
  onMute: (cb) => ipcRenderer.on('cat:mute', (_e, muted) => cb(muted)),
});
```

- [ ] **Step 2: Create `src/main/passthrough.js`**

```js
const { ipcMain } = require('electron');

// Start ignoring the mouse (clicks pass through). When the renderer says the
// pointer is over the cat, capture the mouse so drag/pet work.
function wirePassthrough(win) {
  win.setIgnoreMouseEvents(true, { forward: true });
  ipcMain.on('cat:hover', (_e, over) => {
    win.setIgnoreMouseEvents(!over, { forward: true });
  });
}

module.exports = { wirePassthrough };
```

- [ ] **Step 3: Wire it in `src/main/main.js`** (add inside the `whenReady` callback)

```js
const { wirePassthrough } = require('./passthrough');
// ...
app.whenReady().then(() => {
  win = createOverlay();
  wirePassthrough(win);
});
```

- [ ] **Step 4: Run and verify passthrough**

Run: `npm start`
Expected: You can click desktop icons through the empty overlay. Moving the mouse over the
cat lets you drag it and click to pet (heart appears). Double-click triggers play.

- [ ] **Step 5: Commit**

```bash
git add src/main/preload.js src/main/passthrough.js src/main/main.js
git commit -m "feat: mouse click-through except over the cat"
```

---

## Task 12: System tray menu (Feed / Sleep / Mute / Quit)

**Files:**
- Create: `src/main/tray.js`
- Modify: `src/main/main.js`

- [ ] **Step 1: Create `src/main/tray.js`**

```js
const { Tray, Menu, app } = require('electron');
const path = require('path');

function createTray(win, getState, setState) {
  const tray = new Tray(path.join(__dirname, '../../assets/tray-icon.png'));
  function rebuild() {
    const muted = getState().muted;
    tray.setContextMenu(Menu.buildFromTemplate([
      { label: '🍗 Feed', click: () => win.webContents.send('cat:action', 'feed') },
      { label: '😴 Sleep', click: () => win.webContents.send('cat:action', 'sleep') },
      { label: '🧶 Play', click: () => win.webContents.send('cat:action', 'play') },
      { type: 'separator' },
      { label: muted ? '🔈 Unmute' : '🔇 Mute', click: () => { const m = !muted; setState({ muted: m }); win.webContents.send('cat:mute', m); rebuild(); } },
      { label: 'Start with Windows', type: 'checkbox', checked: getState().autostart,
        click: (item) => setState({ autostart: item.checked }) },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ]));
  }
  tray.setToolTip('Desktop Cat');
  rebuild();
  return tray;
}

module.exports = { createTray };
```

> Note: the renderer already handles `cat:action` 'feed'/'play' in Task 9. Add a `'sleep'`
> handler: in `loop.js` Task 9 the action is pushed to `inputQueue`; extend the input switch
> so `input.type === 'sleep'` sets `mood.energy = Math.min(mood.energy, 15)` to make it seek
> sleep. Add this one line where the other input types are handled:
> `if (input?.type === 'sleep') mood.energy = Math.min(mood.energy, 15);`

- [ ] **Step 2: Add the sleep input line to `src/renderer/loop.js`**

In the input-handling block add:

```js
if (input?.type === 'sleep') mood.energy = Math.min(mood.energy, 15);
```

- [ ] **Step 3: Wire tray + settings state in `src/main/main.js`**

```js
const Store = require('electron-store');
const { createTray } = require('./tray');
const { applyAutostart } = require('./autostart'); // Task 13

const store = new Store({ defaults: { muted: false, autostart: true } });
// inside whenReady, after wirePassthrough:
const getState = () => ({ muted: store.get('muted'), autostart: store.get('autostart') });
const setState = (patch) => {
  for (const [k, v] of Object.entries(patch)) store.set(k, v);
  if ('autostart' in patch) applyAutostart(patch.autostart);
};
let tray = createTray(win, getState, setState);
```

- [ ] **Step 4: Run and verify**

Run: `npm start`
Expected: Tray icon present. Feed clears hunger (debug H→low), Sleep makes the cat lie down,
Play triggers yarn, Mute silences sounds, Quit exits.

- [ ] **Step 5: Commit**

```bash
git add src/main/tray.js src/main/main.js src/renderer/loop.js
git commit -m "feat: system tray menu for feed/sleep/play/mute/quit"
```

---

## Task 13: Autostart (launch with Windows)

**Files:**
- Create: `src/main/autostart.js`
- Modify: `src/main/main.js`

- [ ] **Step 1: Create `src/main/autostart.js`**

```js
const { app } = require('electron');

function applyAutostart(enabled) {
  app.setLoginItemSettings({
    openAtLogin: !!enabled,
    path: process.execPath,
    args: [],
  });
}

module.exports = { applyAutostart };
```

- [ ] **Step 2: Apply saved autostart at boot** — in `src/main/main.js` inside `whenReady`,
after creating the store:

```js
applyAutostart(store.get('autostart'));
```

- [ ] **Step 3: Verify**

Run: `npm start`, toggle "Start with Windows" off then on in the tray.
Expected: No errors. (Full verification: it appears after a real Windows re-login. In dev
mode `process.execPath` is the electron binary — that's expected; real autostart points at
the packaged exe after Task 14.)

- [ ] **Step 4: Commit**

```bash
git add src/main/autostart.js src/main/main.js
git commit -m "feat: launch-with-Windows autostart setting"
```

---

## Task 14: Manual end-to-end verification + (optional) packaging

**Files:** none (verification); optional `package.json` script for `electron-builder`.

- [ ] **Step 1: Full manual QA pass** — run `npm start` and confirm each:
  - Cat wanders the desktop, flips to face travel direction.
  - Over time it gets hungry (begs + insistent meow), then fed via tray clears it.
  - Left alone / at night it gets sleepy → curls up → snores.
  - Pet (single click) → purr + heart; double-click → yarn play + chirp.
  - Drag relocates the cat; releasing without moving counts as a pet.
  - Desktop icons/apps under the empty overlay remain clickable; only the cat catches clicks.
  - Mute silences all audio; unmute restores it.
  - Only one instance runs (launch twice → second exits).

- [ ] **Step 2: Run the unit suite**

Run: `npm test`
Expected: all suites pass (animation-player, mood-model, behavior-controller, mover, audio-manager).

- [ ] **Step 3 (optional): add packaging** — `npm i -D electron-builder`, add to `package.json`:

```json
"scripts": { "dist": "electron-builder --win" },
"build": { "appId": "com.you.desktopcat", "files": ["src/**", "assets/**"], "win": { "target": "nsis" } }
```

Run: `npm run dist` → produces an installer in `dist/`. Re-toggle autostart after installing
so it points at the installed exe.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: optional electron-builder Windows packaging"
```

---

## Self-Review Notes

- **Spec coverage:** overlay/always-on-top/passthrough (T10–11), wander everywhere (T5, T9),
  moods hunger/energy/happiness (T3), mood→behavior map (T4), real mood-based + petting
  sounds (T6–7, T9), drag/pet/play interactions (T8–9), tray Feed/Sleep/Quit + mute (T12),
  autostart (T13), unit tests for pure modules (T2–6), manual verification (T14). All spec
  sections map to a task.
- **Type consistency:** behavior `anim` names (`idle/walk/run/sit/lick/paw/yarn/sleep`) match
  `sprite-config.js` clip keys; `sound` names (`meow/beg/purr/snore/chirp/grumpy`) match
  `browser-audio.js` FILES and AudioManager cues; `moodState` values
  (`active/resting/sleeping`) match `MoodModel.tick` states; `catAPI` methods
  (`setHover/onAction/onMute`) match preload + loop usage.
- **YAGNI:** no AI brain, no multi-monitor, no settings GUI window — deferred as in spec §12.
