const { MoodModel } = require('../src/renderer/mood-model.js');

const noon = new Date('2026-06-07T12:00:00');
const night = new Date('2026-06-07T23:30:00');

test('defaults to content', () => {
  expect(new MoodModel().dominantMood(noon)).toBe('content');
});

test('hunger rises over time and triggers hungry', () => {
  const m = new MoodModel({ hunger: 0 });
  m.tick(1000, noon, 'active');
  expect(m.hunger).toBeGreaterThanOrEqual(80);
  expect(m.dominantMood(noon)).toBe('hungry');
});

test('feed() lowers hunger out of hungry range', () => {
  const m = new MoodModel({ hunger: 90 });
  m.feed();
  expect(m.hunger).toBeLessThan(80);
  expect(m.dominantMood(noon)).not.toBe('hungry');
});

test('draining energy (while not hungry) makes it sleepy', () => {
  const m = new MoodModel({ energy: 30, hunger: 0 });
  m.tick(60, noon, 'active');
  expect(m.energy).toBeLessThanOrEqual(20);
  expect(m.hunger).toBeLessThan(80);
  expect(m.dominantMood(noon)).toBe('sleepy');
});

test('sleeping recovers energy', () => {
  const m = new MoodModel({ energy: 5, hunger: 0 });
  m.tick(1000, noon, 'sleeping');
  expect(m.energy).toBeGreaterThanOrEqual(80);
});

test('night lowers the sleepy threshold', () => {
  const m = new MoodModel({ energy: 45, hunger: 0, happiness: 50 });
  expect(m.dominantMood(noon)).not.toBe('sleepy');
  expect(m.dominantMood(night)).toBe('sleepy');
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
