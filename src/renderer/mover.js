class Mover {
  constructor({ x = 0, y = 0, speed = 80, bounds, footprint = { w: 64, h: 64 } }) {
    this.x = x; this.y = y; this.speed = speed;
    this.bounds = bounds; this.footprint = footprint;
    this.tx = x; this.ty = y; this.facing = 1;
  }
  setTarget(x, y) {
    this.tx = x; this.ty = y;
    if (x !== this.x) this.facing = x > this.x ? 1 : -1;
  }
  update(dt) {
    const dx = this.tx - this.x, dy = this.ty - this.y;
    const dist = Math.hypot(dx, dy);
    const step = this.speed * dt;
    if (dist <= step || dist === 0) { this.x = this.tx; this.y = this.ty; }
    else { this.x += (dx / dist) * step; this.y += (dy / dist) * step; }
    this._clamp();
  }
  _clamp() {
    const maxX = this.bounds.w - this.footprint.w;
    const maxY = this.bounds.h - this.footprint.h;
    this.x = Math.max(0, Math.min(maxX, this.x));
    this.y = Math.max(0, Math.min(maxY, this.y));
  }
  arrived() { return Math.hypot(this.tx - this.x, this.ty - this.y) < 0.5; }
  randomWanderPoint(rng = Math.random) {
    const maxX = this.bounds.w - this.footprint.w;
    const maxY = this.bounds.h - this.footprint.h;
    return { x: rng() * maxX, y: rng() * maxY };
  }
}

module.exports = { Mover };
