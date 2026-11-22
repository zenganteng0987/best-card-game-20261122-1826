// Sound: tiny WebAudio synth blips, no audio files. The context is built
// on the first user gesture (browsers block sound before one) and every
// call is a no-op until then, so a silent headless run never throws.
export function createAudio() {
  let context = null;

  function ensure() {
    if (context) return context;
    try {
      const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContextClass) return null;
      context = new AudioContextClass();
    } catch {
      context = null;
    }
    return context;
  }

  /** One oscillator note: frequency, seconds long, starting after `delay`. */
  function tone(frequency, seconds, delay, type, volume) {
    const audio = ensure();
    if (!audio) return;
    try {
      if (audio.state === 'suspended') void audio.resume();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      const start = audio.currentTime + delay;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(start);
      oscillator.stop(start + seconds + 0.05);
    } catch {
      // Sound is garnish: a failure here must never stop the game.
    }
  }

  return {
    /** Called on the first click or key press, so later notes may sound. */
    unlock() {
      ensure();
    },
    /** A card leaves the hand. */
    play() {
      tone(520, 0.12, 0, 'triangle', 0.12);
    },
    /** The player takes the trick: a rising pair. */
    winTrick() {
      tone(523, 0.12, 0, 'triangle', 0.14);
      tone(784, 0.18, 0.09, 'triangle', 0.14);
    },
    /** The Warden takes the trick: a falling pair. */
    loseTrick() {
      tone(392, 0.12, 0, 'triangle', 0.12);
      tone(262, 0.2, 0.09, 'triangle', 0.12);
    },
    /** The duel is won: a short rising arpeggio. */
    winGame() {
      [523, 659, 784, 1047].forEach((frequency, index) => {
        tone(frequency, 0.22, index * 0.12, 'triangle', 0.15);
      });
    },
    /** The duel is lost: a slow descending line. */
    loseGame() {
      [392, 330, 262, 196].forEach((frequency, index) => {
        tone(frequency, 0.26, index * 0.16, 'sine', 0.14);
      });
    },
  };
}
