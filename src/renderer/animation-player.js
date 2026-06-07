class AnimationPlayer {
  constructor(clips) {
    this.clips = clips;
    this.name = null;
    this.elapsed = 0;
  }
  play(name) {
    if (!this.clips[name]) throw new Error(`unknown clip: ${name}`);
    this.name = name;
    this.elapsed = 0;
  }
  update(dt) {
    if (this.name) this.elapsed += dt;
  }
  currentFrame() {
    const c = this.clips[this.name];
    if (!c) return 0;
    const raw = Math.floor(this.elapsed * c.fps);
    if (c.loop) return raw % c.frames;
    return Math.min(raw, c.frames - 1);
  }
  isDone() {
    const c = this.clips[this.name];
    if (!c || c.loop) return false;
    return Math.floor(this.elapsed * c.fps) >= c.frames - 1;
  }
}

module.exports = { AnimationPlayer };
