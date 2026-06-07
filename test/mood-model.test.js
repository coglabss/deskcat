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
