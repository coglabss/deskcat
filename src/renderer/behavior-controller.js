// State shape: { name, anim, sound|null, moodState, transient? }
const STATES = {
  DRAGGED:   { name: 'DRAGGED',   anim: 'idle',  sound: null,    moodState: 'active' },
  EAT:       { name: 'EAT',       anim: 'lick',  sound: 'chirp', moodState: 'active' },
  BEG:       { name: 'BEG',       anim: 'paw',   sound: 'beg',   moodState: 'resting' },
  SLEEP:     { name: 'SLEEP',     anim: 'sleep', sound: 'snore', moodState: 'sleeping' },
  REST:      { name: 'REST',      anim: 'sit',   sound: 'purr',  moodState: 'resting' },
  PLAY:      { name: 'PLAY',      anim: 'yarn',  sound: 'chirp', moodState: 'active' },
  WANDER:    { name: 'WANDER',    anim: 'walk',  sound: null,    moodState: 'active' },
  SIT:       { name: 'SIT',       anim: 'sit',   sound: null,    moodState: 'resting' },
  PET_REACT: { name: 'PET_REACT', anim: 'sit',   sound: 'purr',   moodState: 'resting', transient: true },
  PET_GRUMPY:{ name: 'PET_REACT', anim: 'sit',   sound: 'grumpy', moodState: 'resting', transient: true },
};

class BehaviorController {
  constructor({ rng = Math.random } = {}) {
    this.rng = rng;
    this.current = STATES.SIT;
  }

  update(mood, input, _dt) {
    if (input) {
      switch (input.type) {
        case 'drag-start': return (this.current = STATES.DRAGGED);
        case 'feed':       return (this.current = STATES.EAT);
        case 'play':       return (this.current = STATES.PLAY);
        case 'pet': // transient; grumble if disturbed while sleepy/tired, else purr
          return (mood === 'sleepy' || mood === 'tired') ? STATES.PET_GRUMPY : STATES.PET_REACT;
      }
    }
    switch (mood) {
      case 'hungry':  return (this.current = STATES.BEG);
      case 'sleepy':  return (this.current = STATES.SLEEP);
      case 'tired':   return (this.current = STATES.REST);
      case 'playful': return (this.current = STATES.PLAY);
      default:        return (this.current = this.rng() < 0.5 ? STATES.WANDER : STATES.SIT);
    }
  }
}

module.exports = { BehaviorController, STATES };
