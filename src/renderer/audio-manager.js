class AudioManager {
  constructor({ player, cooldownMs = 4000, now = () => Date.now(), muted = false } = {}) {
    this.player = player;
    this.cooldownMs = cooldownMs;
    this.now = now;
    this.muted = muted;
    this.lastPlayed = {}; // name -> timestamp
  }
  setMuted(m) { this.muted = m; }
  cue(name) {
    if (!name || this.muted) return;
    const t = this.now();
    const last = this.lastPlayed[name];
    if (last !== undefined && t - last < this.cooldownMs) return;
    this.lastPlayed[name] = t;
    this.player.play(name);
  }
}

module.exports = { AudioManager };
