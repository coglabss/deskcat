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
