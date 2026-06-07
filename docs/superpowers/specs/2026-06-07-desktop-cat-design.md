# Desktop Cat — Design Spec

**Date:** 2026-06-07
**Status:** Approved (design), pending spec review
**Author:** brainstormed with Claude

## 1. Summary

A standalone Windows desktop pet: a cute, free-roaming animated cat that lives on top of
the desktop. It wanders, sits, naps, plays, and begs for food driven by an internal mood
model that drifts over time and reacts to the user. The user can pet it, drag it, feed it,
send it to sleep, and toss it a yarn ball. It makes real recorded cat sounds tied to its
mood. The desktop stays fully usable — the overlay is click-through everywhere except on
the cat itself.

This is **v1 = "cute scripted pet"**: fully offline, free, no AI/LLM brain. The architecture
leaves room to add a context-aware layer (senses active app / time) and later an AI
companion layer, but neither is in scope here.

## 2. Goals & Non-Goals

### Goals
- A cat on screen within the first build session (`npm start`).
- Free-roaming movement across the primary monitor: walk, pause, sit, sleep in random spots.
- Mood system: hunger, energy, happiness → dominant mood → behavior.
- Interactions: drag to reposition, click to pet, double-click to play (yarn), system-tray
  menu (Feed / Sleep / Settings / Quit).
- Real cat audio tied to moods/events, with anti-spam cooldowns, bundled for offline use.
- Launch automatically when Windows starts (on by default, toggleable in tray).
- Desktop remains usable: overlay click-through except over the cat.

### Non-Goals (v1, YAGNI)
- No AI/LLM chat brain, no "knows facts about you."
- No context awareness (active window, system stats).
- No multi-monitor spanning — primary monitor only.
- No separate settings GUI window — tray menu + small saved settings file only.
- No packaged installer required for v1 (dev `npm start` is enough); `electron-builder`
  is a later, optional step.

## 3. Tech Stack

- **Electron** (web rendering for smooth, easy animation).
- Renderer: plain HTML/CSS/JS + Canvas (or DOM) sprite engine. No heavy framework.
- Persistence: `electron-store` (small JSON settings file).
- Tests: Jest for the pure-logic modules.
- **Art:** "Cat Pack" by octopusinkus (itch.io, name-your-price / free). Pixel sprite
  sheets with idle, walk, run, sit, sit-to-stand, paw-tap, yarn-play, sleep animations,
  6 color variants.
- **Audio:** CC0 cat sounds (freesound.org / pixabay): meow, insistent meow, purr, snore,
  chirp/trill, grumpy meow. Bundled in `assets/sounds/`.

## 4. Architecture

Two Electron processes:

### Main process (`src/main/`)
- **OverlayWindow** — creates one transparent, frameless, always-on-top, focusable-but-
  non-activating `BrowserWindow` sized to the primary monitor's work area. Manages mouse
  passthrough via `setIgnoreMouseEvents(true, { forward: true })` and toggles it based on
  whether the pointer is over the cat (renderer reports hit-test results over IPC).
- **TrayController** — system-tray icon + menu: Feed, Sleep/Wake, Settings (mute, volume,
  autostart toggle, cat color), Quit. Sends actions to the renderer over IPC.
- **AutostartController** — wraps `app.setLoginItemSettings`; reads/writes the autostart
  setting (default ON).
- Single-instance lock so only one cat ever runs.

### Renderer process (`src/renderer/`) — the "cat world"
- **AnimationPlayer** — given a sprite sheet + frame metadata, plays a named animation at a
  frame rate; emits `onComplete` for one-shot animations. Pure, testable frame math.
- **MoodModel** — holds `hunger`, `energy`, `happiness` (0–100). `tick(dtSeconds, clock)`
  advances them: hunger rises over time; energy falls while active and recovers while
  sleeping; happiness decays slowly; time-of-day nudges sleepiness at night. Methods:
  `feed()`, `pet()`, `play()`. `dominantMood()` returns `content | hungry | sleepy |
  tired | playful`. Pure, no I/O — the heart of the pet.
- **BehaviorController** — finite state machine. Given current mood + RNG + input events,
  selects a state: `WANDER`, `WALK_TO(point)`, `SIT`, `SLEEP`, `BEG`, `PLAY`, `PET_REACT`,
  `DRAGGED`, `EAT`. Maps each state to an animation name + movement intent + sound cue.
  Pure logic (RNG and clock injected).
- **Mover** — owns position + velocity; given a target point walks toward it at a set speed,
  flips the sprite to face travel direction, clamps to screen work-area bounds, picks random
  wander destinations.
- **AudioManager** — maps behavior/mood events → audio clips; enforces per-sound cooldowns
  and a global "recently played" guard so it never spams; respects mute/volume settings.
- **InputHandler** — translates pointer events into `drag`, `pet` (single click), `play`
  (double-click); reports cat hit-test to main for passthrough.
- **Loop** — `requestAnimationFrame` driver (~10 logic ticks/sec, render every frame) that
  wires MoodModel → BehaviorController → Mover/AnimationPlayer/AudioManager → draw.

### Data flow (per tick)
```
time + queued input
  → MoodModel.tick() / feed()/pet()/play()
  → MoodModel.dominantMood()
  → BehaviorController.update(mood, input, rng)  →  state
  → Mover.update(state)  +  AnimationPlayer.play(state.anim)  +  AudioManager.cue(state.sound)
  → render frame at cat position
Tray actions (Feed/Sleep) → enqueued as input events.
Cat bounding box each frame → IPC → main toggles mouse passthrough.
```

## 5. Mouse Passthrough Detail

Window starts with mouse events ignored (`forward: true` so move events still arrive). On
each forwarded `mousemove`, the renderer hit-tests the pointer against the cat's current
bounding box. Over the cat → main enables mouse events (so click/drag work); off the cat →
back to ignore. This keeps icons and apps under the cat fully clickable.

## 6. Mood → Behavior Mapping

| Dominant mood | Trigger (stat) | Typical behavior | Animation | Sound |
|---|---|---|---|---|
| Content | nothing urgent | wander / sit / groom | walk, idle, sit | occasional soft meow / purr |
| Hungry | hunger high | beg near user, pace | paw-tap, walk | insistent meow |
| Sleepy | energy low or night | find spot, curl up | sit→sleep | snore 💤 |
| Tired | energy low (daytime) | rest, sit, groom | sit, idle | purr |
| Playful | happiness mid + energy ok | chase yarn, pounce | run, yarn-play | chirp/trill |

Always-available interactions override transiently: drag → `DRAGGED`; pet → `PET_REACT`
(purr + ❤️ particle); double-click → `PLAY`; Feed → `EAT` then hunger resets.

## 7. Error Handling

- Missing sprite/sheet → fall back to a static idle frame; log, don't crash.
- Missing/failed audio → skip silently.
- Single-instance lock prevents duplicate cats.
- Window/passthrough APIs that behave differently across Windows builds → degrade
  gracefully (worst case: cat shown, passthrough off) rather than crash.
- Settings file corrupt/missing → recreate with defaults.

## 8. Testing Strategy

- **Unit (Jest):** MoodModel and BehaviorController are pure functions of injected
  time/RNG/input. Tests assert transitions, e.g.:
  - hunger crosses threshold → `dominantMood() === 'hungry'`; after `feed()` → not hungry.
  - sustained activity → energy low → behavior eventually `SLEEP`; energy recovers while sleeping.
  - `pet()` raises happiness; cooldown in AudioManager prevents repeated sound within window.
  - AnimationPlayer returns correct frame index for elapsed time / loops / one-shots.
- **Manual:** run the Electron app — verify roaming, drag, pet, double-click play, tray
  Feed/Sleep/Quit, autostart toggle, click-through over/around the cat, sounds + mute.

## 9. Project Structure

```
desktop-cat/
  package.json
  .gitignore                 # node_modules/, .superpowers/, dist/
  docs/superpowers/specs/    # this spec
  src/
    main/
      main.js                # app bootstrap, single-instance lock
      overlay-window.js
      tray.js
      autostart.js
      ipc.js
    renderer/
      index.html
      loop.js
      mood-model.js
      behavior-controller.js
      mover.js
      animation-player.js
      audio-manager.js
      input-handler.js
      sprite-config.js       # frame metadata for the octopusinkus sheets
  assets/
    cats/                    # octopusinkus sprite sheets
    sounds/                  # CC0 cat audio
  test/
    mood-model.test.js
    behavior-controller.test.js
    animation-player.test.js
    audio-manager.test.js
```

## 10. Build & Run

- `npm install`
- `npm start` — launches Electron and the cat.
- `npm test` — runs Jest unit tests.
- (Later, optional) `npm run dist` — `electron-builder` produces a Windows installer.
- Autostart handled in-app via `app.setLoginItemSettings` (default ON, tray toggle).

## 11. Asset Acquisition (manual prep step)

1. Download "Cat Pack" by octopusinkus from itch.io → extract sheets into `assets/cats/`.
2. Download CC0 cat sounds → `assets/sounds/` (meow, beg-meow, purr, snore, chirp, grumpy).
3. Fill in `sprite-config.js` with each sheet's frame size, count, and row/animation map.

## 12. Future Layers (out of scope, noted for architecture)

- **Context-aware (B):** a `Sensors` module feeding MoodModel (active app, idle time, clock).
- **AI companion (C):** a speech-bubble UI + Claude API call + a small memory store.
Both attach to the existing MoodModel/Behavior seam without rewrites.
