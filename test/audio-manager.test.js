const { AudioManager } = require('../src/renderer/audio-manager.js');

function fake() {
  const played = [];
  return { play: (name) => played.push(name), played };
}

test('plays a cue', () => {
  const f = fake();
  const a = new AudioManager({ player: f, cooldownMs: 1000, now: () => 0 });
  a.cue('meow');
  expect(f.played).toEqual(['meow']);
});

test('respects per-sound cooldown', () => {
  const f = fake();
  let t = 0;
  const a = new AudioManager({ player: f, cooldownMs: 1000, now: () => t });
  a.cue('meow');        // t=0 plays
  t = 500; a.cue('meow'); // within cooldown -> ignored
  t = 1500; a.cue('meow'); // cooldown elapsed -> plays
  expect(f.played).toEqual(['meow', 'meow']);
});

test('different sounds have independent cooldowns', () => {
  const f = fake();
  const a = new AudioManager({ player: f, cooldownMs: 1000, now: () => 0 });
  a.cue('meow'); a.cue('purr');
  expect(f.played).toEqual(['meow', 'purr']);
});

test('null cue plays nothing', () => {
  const f = fake();
  const a = new AudioManager({ player: f, cooldownMs: 1000, now: () => 0 });
  a.cue(null);
  expect(f.played).toEqual([]);
});

test('muted plays nothing', () => {
  const f = fake();
  const a = new AudioManager({ player: f, cooldownMs: 1000, now: () => 0, muted: true });
  a.cue('meow');
  expect(f.played).toEqual([]);
});
