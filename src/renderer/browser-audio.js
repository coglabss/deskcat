// Real audio player for the renderer; satisfies AudioManager's { play(name) } contract.
const FILES = {
  meow: 'meow.mp3',
  beg: 'beg.mp3',
  purr: 'purr.mp3',
  snore: 'snore.mp3',
  chirp: 'chirp.mp3',
  grumpy: 'grumpy.mp3',
};

function makeBrowserAudio(volume = 0.7) {
  const cache = {};
  for (const [k, f] of Object.entries(FILES)) {
    const a = new Audio(`../../assets/sounds/${f}`);
    a.volume = volume;
    cache[k] = a;
  }
  return {
    setVolume(v) { for (const a of Object.values(cache)) a.volume = v; },
    play(name) {
      const a = cache[name];
      if (!a) return;
      try { a.currentTime = 0; a.play().catch(() => {}); } catch (_) {}
    },
  };
}

module.exports = { makeBrowserAudio };
