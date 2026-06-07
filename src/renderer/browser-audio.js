// Real audio player for the renderer; satisfies AudioManager's { play(name) } contract.
const FILES = {
  meow: 'dragon-studio-cute-cat-meow-472372.mp3',
  beg: 'freesound_community-cat-wants-food-107901.mp3',
  purr: 'vinodadora-cat-purr-128584.mp3',
  snore: 'u_1i3msyu21c-kitten-snore-438557.mp3',
  chirp: 'stu9-cute-cat-352656.mp3',
  grumpy: 'alex_jauk-annoyed-cat-meows-angrily-438006.mp3',
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
