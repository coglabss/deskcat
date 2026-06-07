const clamp = (v) => Math.max(0, Math.min(100, v));

const RATES = {
  hungerPerSec: 0.3,
  energyDrainPerSec: 0.25,
  energyRecoverPerSec: 0.5,
  energyRestPerSec: 0.05,
  happinessDecayPerSec: 0.05,
};

class MoodModel {
  constructor(init = {}) {
    this.hunger = init.hunger ?? 20;
    this.energy = init.energy ?? 80;
    this.happiness = init.happiness ?? 50;
  }

  // state: 'active' | 'resting' | 'sleeping'
  tick(dtSeconds, now, state = 'resting') {
    this.hunger = clamp(this.hunger + RATES.hungerPerSec * dtSeconds);
    this.happiness = clamp(this.happiness - RATES.happinessDecayPerSec * dtSeconds);
    if (state === 'sleeping') {
      this.energy = clamp(this.energy + RATES.energyRecoverPerSec * dtSeconds);
    } else if (state === 'active') {
      this.energy = clamp(this.energy - RATES.energyDrainPerSec * dtSeconds);
    } else {
      this.energy = clamp(this.energy + RATES.energyRestPerSec * dtSeconds);
    }
  }

  feed() { this.hunger = clamp(this.hunger - 90); this.happiness = clamp(this.happiness + 10); }
  pet() { this.happiness = clamp(this.happiness + 15); }
  play() { this.happiness = clamp(this.happiness + 20); this.energy = clamp(this.energy - 10); }

  isNight(now) { const h = now.getHours(); return h >= 22 || h < 6; }

  dominantMood(now) {
    if (this.hunger >= 80) return 'hungry';
    if (this.energy <= 20) return 'sleepy';
    if (this.isNight(now) && this.energy < 50) return 'sleepy';
    if (this.energy <= 40) return 'tired';
    if (this.happiness >= 60 && this.energy >= 50) return 'playful';
    return 'content';
  }
}

module.exports = { MoodModel };
