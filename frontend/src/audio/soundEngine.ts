/**
 * Synthesizes fun, cheerful sound effects using Web Audio API
 * and provides speech synthesis for Milo the AI Companion.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  constructor() {
    // Lazily initialize AudioContext on first user interaction
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playPop() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // AudioContext unavailable
    }
  }

  public playSuccessChime() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + index * 0.09);

        gain.gain.setValueAtTime(0, this.ctx.currentTime + index * 0.09);
        gain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + index * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + index * 0.09 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + index * 0.09);
        osc.stop(this.ctx.currentTime + index * 0.09 + 0.35);
      });
    } catch {
      // Ignore
    }
  }

  public playGentleEncouragement() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      // Soft gentle two-tone warm chime
      const notes = [440, 554.37]; // A4, C#5
      notes.forEach((freq, index) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + index * 0.12);

        gain.gain.setValueAtTime(0.18, this.ctx.currentTime + index * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + index * 0.12 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + index * 0.12);
        osc.stop(this.ctx.currentTime + index * 0.12 + 0.3);
      });
    } catch {
      // Ignore
    }
  }

  public playFanfare() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const melody = [
        { f: 523.25, d: 0.12 },
        { f: 659.25, d: 0.12 },
        { f: 783.99, d: 0.12 },
        { f: 1046.50, d: 0.4 },
      ];
      let t = this.ctx.currentTime;
      melody.forEach(note => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, t);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + note.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + note.d);
        t += note.d + 0.03;
      });
    } catch {
      // Ignore
    }
  }

  public playStarCollect() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch {
      // Ignore
    }
  }

  /**
   * Speaks out loud using browser SpeechSynthesis with child-friendly pitch and rate.
   */
  public speak(text: str, onEnd?: () => void) {
    if (this.isMuted || !('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // Slightly slower for clarity
      utterance.pitch = 1.35; // Cheerful friendly slightly higher pitch for preschool
      utterance.lang = 'en-US';

      // Pick a friendly English voice if available
      const voices = window.speechSynthesis.getVoices();
      const friendlyVoice = voices.find(v => 
        v.lang.startsWith('en') && (v.name.includes('Samantha') || v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Zira'))
      );
      if (friendlyVoice) {
        utterance.voice = friendlyVoice;
      }

      utterance.onend = () => {
        onEnd?.();
      };
      utterance.onerror = () => {
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      onEnd?.();
    }
  }

  public stopSpeaking() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopSpeaking();
    }
    return this.isMuted;
  }
}

type str = string;

export const sound = new SoundEngine();
