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
