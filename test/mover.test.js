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
