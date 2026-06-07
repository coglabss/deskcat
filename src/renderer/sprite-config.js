// Each clip: which sheet image, frame size, frame count, fps, loop.
// NOTE: frame counts/fps/rows below are PLACEHOLDERS to be tuned after the real
// octopusinkus "Cat Pack" sprite sheets are downloaded into assets/cats/.
// The clip KEYS (idle/walk/run/sit/lick/paw/yarn/sleep) must stay as-is — other
// modules reference them.
const SPRITES = {
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
const CLIPS = Object.fromEntries(
  Object.entries(SPRITES.clips).map(([k, v]) => [k, { frames: v.frames, fps: v.fps, loop: v.loop }])
);

module.exports = { SPRITES, CLIPS };
