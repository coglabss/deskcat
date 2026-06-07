// Frame metadata for the octopusinkus "Cat Pack" sheet:
//   assets/cats/Cat_Sprite_Sheet_Black.png  (384x288 = 12 cols x 9 rows of 32x32)
// Frame counts per row were measured from the sheet. Side-view rows face LEFT in
// the source art; loop.js mirrors them when the cat moves right.
// Clip KEYS (idle/walk/run/sit/lick/paw/yarn/sleep) are referenced by other modules.
const SPRITES = {
  sheets: {
    main: { src: '../../assets/cats/Cat_Sprite_Sheet_Black.png', frameW: 32, frameH: 32 },
  },
  clips: {
    idle:  { sheet: 'main', row: 0, frames: 9,  fps: 6,  loop: true }, // sit upright (front)
    sit:   { sheet: 'main', row: 0, frames: 9,  fps: 4,  loop: true }, // reuse sitting, slower
    lick:  { sheet: 'main', row: 2, frames: 11, fps: 8,  loop: true }, // groom / lick (used for EAT)
    paw:   { sheet: 'main', row: 3, frames: 6,  fps: 8,  loop: true }, // low crouch (used for BEG)
    walk:  { sheet: 'main', row: 5, frames: 10, fps: 10, loop: true }, // side walk cycle
    run:   { sheet: 'main', row: 6, frames: 10, fps: 14, loop: true }, // low fast run
    yarn:  { sheet: 'main', row: 7, frames: 11, fps: 10, loop: true }, // play with pink yarn ball
    sleep: { sheet: 'main', row: 8, frames: 6,  fps: 2,  loop: true }, // lying down
  },
};

// AnimationPlayer only needs {frames, fps, loop} per clip:
const CLIPS = Object.fromEntries(
  Object.entries(SPRITES.clips).map(([k, v]) => [k, { frames: v.frames, fps: v.fps, loop: v.loop }])
);

module.exports = { SPRITES, CLIPS };
