# 🐾 DesktopCat

A cute, free-roaming desktop pet cat for **Windows & macOS**. It wanders your
desktop, naps, plays, gets hungry, and reacts to you — pet it, drag it, feed it.
Built with Electron; the desktop stays fully usable (the cat is click-through
everywhere except on its own body).

> _Add a screenshot or GIF here once you've got your cat running!_

## ✨ Features

- Free-roaming cat that walks, sits, naps, and plays on top of your desktop
- Moods that drift over time: **hungry, sleepy, tired, playful, content**
- Real cat sounds tied to mood + interaction (with anti-spam cooldowns)
- Interactions: **click to pet** (❤️), **double-click to play** (🧶), **drag** to move
- System-tray menu: **Feed** 🍖, **Sleep** 💤, **Play**, **Mute**, **Start with system**, **Quit**
- Cute floating effects: hearts when petted, food when fed, Zzz while asleep
- Transparent, always-on-top, click-through overlay — doesn't block your work
- Launches at login (optional)

## 🚀 Quick start

**Prerequisites:** [Node.js 18+](https://nodejs.org) and [Git](https://git-scm.com).

```bash
git clone <YOUR-REPO-URL>
cd desktop-cat
npm install
npm start
```

The cat appears immediately. Until you add art (next section) it shows a small
**orange placeholder block** and stays silent — that's expected, not a bug.

## 🎨 Add the art & sounds (one-time)

The cat sprite and sound clips are **not bundled** in this repo because their
licenses don't permit re-hosting. Grab these free assets and drop them in — it
takes ~2 minutes:

### Sprite art → `assets/cats/cat.png`
1. Download **"Cat Pack" by octopusinkus** (free / name-your-price):
   <https://octopusinkus.itch.io/cat-pack>
2. Rename the **black** sprite sheet to **`cat.png`** and place it at
   `assets/cats/cat.png`.
3. The default animation map in `src/renderer/sprite-config.js` targets this
   pack's **12×9 grid of 32×32 frames**. Other color variants share the same
   layout — just save your chosen one as `cat.png`. Using a *different* pack?
   Adjust the `row`/`frames` values in `sprite-config.js` to match it.

### Sounds → `assets/sounds/*.mp3`
Grab 6 short **CC0 / royalty-free** cat clips from
[Pixabay](https://pixabay.com/sound-effects/search/cat/) or
[Freesound](https://freesound.org) (filter License = *Creative Commons 0*) and
save them with these exact names:

| File | When it plays |
|------|---------------|
| `assets/sounds/meow.mp3`  | occasional ambient meow |
| `assets/sounds/beg.mp3`   | hungry (begging for food) |
| `assets/sounds/purr.mp3`  | when you pet it |
| `assets/sounds/snore.mp3` | while sleeping |
| `assets/sounds/chirp.mp3` | eating / playing |
| `assets/sounds/grumpy.mp3`| petted while sleepy/tired |

Re-run `npm start` and your real cat comes to life. Missing files simply fall
back to the placeholder / silence — the app never crashes over a missing asset.

## 🎮 Controls

| Action | Result |
|--------|--------|
| Single-click the cat | pet it (purr + ❤️) |
| Double-click the cat | play (yarn 🧶) |
| Click & drag | move the cat |
| **Right-click the tray icon** | Feed 🍖 · Sleep 💤 · Play · Mute · Start with system · Quit |

The tray icon lives in the notification area (Windows: bottom-right by the
clock — click the `^` to show hidden icons; macOS: the menu bar, top-right).

## 📦 Build a standalone app

```bash
npm run dist
```

Builds for **your current OS** into `dist/`:
- Windows → `dist/DesktopCat-win32-x64/DesktopCat.exe`
- macOS → `dist/DesktopCat-darwin-<arch>/DesktopCat.app`

Double-click to run; the folder is self-contained and portable. (We use
[`@electron/packager`](https://github.com/electron/packager), which needs no
admin rights. A one-click Windows installer via `electron-builder` is possible
but requires Developer Mode/admin to unpack its signing tools.)

## ⚙️ Customize

- **Animations** — `src/renderer/sprite-config.js` (`row`, `col`, `frames`, `fps` per clip)
- **Sounds** — replace files in `assets/sounds/`; volume in `src/renderer/loop.js` (`makeBrowserAudio(0.7)`)
- **Personality** — tuning constants in `src/renderer/mood-model.js`
- **Ambient meow frequency** — the `Math.random() < 0.04` check in `src/renderer/loop.js`

## 🧪 Tests

```bash
npm test
```

The pure-logic core (mood model, behavior state machine, animation timing,
movement, audio cooldowns) is covered by Jest — 36 tests.

## 🧠 How it works

- **Main process** (`src/main/`): transparent always-on-top overlay window,
  mouse click-through toggling, system tray, autostart, single-instance lock.
- **Renderer** (`src/renderer/`): a tiny engine — `MoodModel` → `BehaviorController`
  → `Mover` / `AnimationPlayer` / `AudioManager` → canvas, driven by a rAF loop.

The full design spec and implementation plan live in `docs/superpowers/`.

## 💻 Platform support

- **Windows 10/11** — ✅ fully supported
- **macOS** — ✅ supported (you may need to allow Screen/Accessibility access)
- **Linux** — may work, but transparency & always-on-top depend on your
  compositor (untested).

## 🙏 Credits

- **Code:** MIT (see [LICENSE](LICENSE)).
- **Cat sprite:** "Cat Pack" by **octopusinkus** — downloaded separately by each
  user; not redistributed here.
- **Sounds:** your chosen CC0 / royalty-free clips — please honor their licenses
  and attributions.

## 📄 License

MIT — see [LICENSE](LICENSE).

---

Contributions welcome! Open an issue or PR. 🐈‍⬛
