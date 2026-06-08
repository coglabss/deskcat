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

Until you add art, the app shows an orange placeholder block and stays silent —
that's normal. There are two ways to get the real cat. **Option A is the fastest.**

### ✅ Option A — Use the bundled asset packs (recommended)

This repo ships ready-to-use zips in [`bundled-assets/`](bundled-assets). Just
unzip each one into the matching folder:

1. **`bundled-assets/cat-art.zip` → `assets/cats/`**
   It contains `cat.png`. Extract it so the file lands at `assets/cats/cat.png`.
2. **`bundled-assets/cat-sounds.zip` → `assets/sounds/`**
   It contains the 6 sound files. Extract them so they land directly in
   `assets/sounds/` (e.g. `assets/sounds/meow.mp3`).

**How to unzip:**

- **Windows (PowerShell)** — from the project folder:
  ```powershell
  Expand-Archive -Force bundled-assets\cat-art.zip    assets\cats
  Expand-Archive -Force bundled-assets\cat-sounds.zip assets\sounds
  ```
  (Or right-click each zip → **Extract All…** → choose the matching `assets\…` folder.)

- **macOS / Linux** — from the project folder:
  ```bash
  unzip -o bundled-assets/cat-art.zip    -d assets/cats
  unzip -o bundled-assets/cat-sounds.zip -d assets/sounds
  ```

Then run `npm start` again — your cat comes to life. ✅

> Asset credits & licenses: see [`bundled-assets/CREDITS.txt`](bundled-assets/CREDITS.txt).
> The bundled sprite is from the "Cat Pack" by **octopusinkus**; the sounds are
> CC0 / royalty-free. These assets belong to their creators — the MIT license
> covers the **code** only.

### 🔄 Option B — Bring your own assets

Prefer a different cat or sounds? Drop your own files in using these names:

- **Sprite:** `assets/cats/cat.png` — the default mapping in
  `src/renderer/sprite-config.js` expects a **12×9 grid of 32×32 frames** (the
  octopusinkus Cat Pack layout). For a different sheet, adjust the `row`/`col`/
  `frames` values there.
- **Sounds:** in `assets/sounds/`, named `meow.mp3`, `beg.mp3`, `purr.mp3`,
  `snore.mp3`, `chirp.mp3`, `grumpy.mp3`.

| Sound file | When it plays |
|------------|---------------|
| `meow.mp3`  | occasional ambient meow |
| `beg.mp3`   | hungry (begging for food) |
| `purr.mp3`  | when you pet it |
| `snore.mp3` | while sleeping |
| `chirp.mp3` | eating / playing |
| `grumpy.mp3`| petted while sleepy/tired |

Missing files simply fall back to the placeholder / silence — the app never
crashes over a missing asset.

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
- **Cat sprite:** "Cat Pack" by **[octopusinkus](https://octopusinkus.itch.io/cat-pack)**
  — bundled in `bundled-assets/` for convenience; all rights belong to the artist.
- **Sounds:** CC0 / royalty-free clips from Pixabay / Freesound.
- Full asset attribution: [`bundled-assets/CREDITS.txt`](bundled-assets/CREDITS.txt).

The MIT license applies to the **source code only**; bundled assets remain under
their creators' terms.

## 📄 License

MIT — see [LICENSE](LICENSE).

---

Contributions welcome! Open an issue or PR. 🐈‍⬛
