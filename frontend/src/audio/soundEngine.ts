/**
 * Synthesizes fun, cheerful sound effects using Web Audio API
 * and provides speech synthesis for Milo the AI Companion.
 *
 * Voice stack (in order of preference):
 *  1. @capacitor-community/text-to-speech native plugin (Android APK builds)
 *  2. window.speechSynthesis (web / fallback)
 *
 * Android notes:
 *  - WebView speechSynthesis can be empty until `voiceschanged` fires,
 *    and is blocked until a user gesture unlocks audio — both are handled here.
 *  - AudioContext is unlocked on the first touch/click so SFX work too.
 */

import { Capacitor } from '@capacitor/core';

export type SpeechLang = 'en' | 'hi';

export interface VoiceEngineStatus {
  /** Which engine would be used for speak() right now */
  platform: 'android-native' | 'web' | 'unavailable';
  /** True when the Capacitor TTS plugin module resolved */
  ttsPluginAvailable: boolean;
  /** True when window.speechSynthesis exists */
  speechSynthesisAvailable: boolean;
  /** True when at least one voice has been loaded */
  voicesLoaded: boolean;
  /** Number of voices currently visible to the engine */
  voiceCount: number;
  /** True when at least one Hindi (hi) voice is available (or native engine) */
  hindiVoiceAvailable: boolean;
  /** Number of Hindi voices found (0 when using the native engine) */
  hindiVoiceCount: number;
  /** True once a user gesture unlocked audio playback */
  audioUnlocked: boolean;
  /** True when speechSynthesis has been primed (voiceschanged fired) */
  speechPrimed: boolean;
  lastError?: string;
}

interface NativeTts {
  speak: (options: {
    text: string;
    lang?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    category?: string;
  }) => Promise<void>;
  stop: () => Promise<void>;
}

const CHEERFUL_RATE = 0.95;
const CHEERFUL_PITCH = 1.3;
const SPEECH_LANG: Record<SpeechLang, string> = { en: 'en-US', hi: 'hi-IN' };

// Friendly voice name hints, most preferred first
const VOICE_HINTS: Record<SpeechLang, string[]> = {
  en: [
    'Samantha',
    'Natural',
    'Google US English',
    'Google',
    'Zira',
    'Aria',
    'Jenny',
  ],
  hi: [
    'Google हिन्दी',
    'हिन्दी',
    'Hindi',
    'Lekha',
    'Kalpana',
    'Google',
  ],
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  private audioUnlocked = false;
  private unlockListenersAttached = false;
  private voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;
  private speechPrimed = false;
  private nativeTts: NativeTts | null = null;
  private nativeTtsChecked = false;
  private lastError: string | undefined;
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.attachUnlockListeners();
    // Prime voices early so the first speak() isn't waiting on an empty list
    this.loadVoices().catch(() => undefined);
  }

  // ------------------------------------------------------------------ audio
  private initCtx() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  /**
   * Unlock audio on the first user gesture. Android WebView / mobile browsers
   * start AudioContext suspended until a touch/click happens.
   */
  public unlockAudio() {
    if (this.audioUnlocked) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      // Play a tiny silent buffer so the context truly resumes on iOS/Android
      const buffer = this.ctx.createBuffer(1, 1, 22050);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.start(0);
      if (this.ctx.state === 'running') {
        this.audioUnlocked = true;
      } else {
        void this.ctx.resume().then(() => {
          if (this.ctx && this.ctx.state === 'running') {
            this.audioUnlocked = true;
          }
        });
      }
    } catch {
      // Audio unavailable — SFX will stay silent
    }
  }

  private attachUnlockListeners() {
    if (this.unlockListenersAttached || typeof window === 'undefined') return;
    this.unlockListenersAttached = true;
    const unlock = () => this.unlockAudio();
    const events = ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'];
    events.forEach((evt) =>
      window.addEventListener(evt, unlock, { passive: true })
    );
  }

  public playPop() {
    if (this.isMuted) return;
    try {
      this.unlockAudio();
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
      this.unlockAudio();
      this.initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + index * 0.09);

        gain.gain.setValueAtTime(0, this.ctx.currentTime + index * 0.09);
        gain.gain.linearRampToValueAtTime(
          0.25,
          this.ctx.currentTime + index * 0.09 + 0.02
        );
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          this.ctx.currentTime + index * 0.09 + 0.35
        );

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
      this.unlockAudio();
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
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          this.ctx.currentTime + index * 0.12 + 0.3
        );

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
      this.unlockAudio();
      this.initCtx();
      if (!this.ctx) return;
      const melody = [
        { f: 523.25, d: 0.12 },
        { f: 659.25, d: 0.12 },
        { f: 783.99, d: 0.12 },
        { f: 1046.5, d: 0.4 },
      ];
      let t = this.ctx.currentTime;
      melody.forEach((note) => {
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
      this.unlockAudio();
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        1400,
        this.ctx.currentTime + 0.15
      );

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

  // ------------------------------------------------------------------- speech

  /**
   * Wait until speechSynthesis voices are available. On Android WebView,
   * getVoices() often returns [] until `voiceschanged` fires, so we listen
   * for the event and also poll as a fallback.
   */
  private loadVoices(): Promise<SpeechSynthesisVoice[]> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return Promise.resolve([]);
    }
    if (this.voicesPromise) return this.voicesPromise;

    this.voicesPromise = new Promise<SpeechSynthesisVoice[]>((resolve) => {
      const synth = window.speechSynthesis;
      let settled = false;
      const finish = (voices: SpeechSynthesisVoice[]) => {
        if (settled) return;
        settled = true;
        this.speechPrimed = voices.length > 0;
        resolve(voices);
      };

      const handleVoicesChanged = () => {
        const voices = synth.getVoices();
        if (voices.length > 0) finish(voices);
      };
      synth.onvoiceschanged = handleVoicesChanged;

      const poll = (attempts: number) => {
        const voices = synth.getVoices();
        if (voices.length > 0) {
          finish(voices);
          return;
        }
        if (attempts <= 0) {
          // Give up waiting but still resolve so speak() can try anyway
          finish([]);
          return;
        }
        setTimeout(() => poll(attempts - 1), 150);
      };
      poll(40); // up to ~6 seconds
    });

    return this.voicesPromise;
  }

  private pickVoice(
    voices: SpeechSynthesisVoice[],
    lang: SpeechLang
  ): SpeechSynthesisVoice | undefined {
    if (voices.length === 0) return undefined;
    const prefix = lang === 'hi' ? 'hi' : 'en';
    const matching = voices.filter((v) =>
      v.lang.toLowerCase().startsWith(prefix)
    );
    // Fall back to any voice rather than speaking with no voice at all
    const pool = matching.length > 0 ? matching : voices;
    const hints = VOICE_HINTS[lang];
    for (const hint of hints) {
      const match = pool.find((v) =>
        v.name.toLowerCase().includes(hint.toLowerCase())
      );
      if (match) return match;
    }
    return pool[0];
  }

  /**
   * Resolve the Capacitor native TTS plugin, but only on native platforms
   * and only if the package is actually installed. Uses dynamic import so
   * web builds without the plugin keep working.
   */
  private async getNativeTts(): Promise<NativeTts | null> {
    if (this.nativeTtsChecked) return this.nativeTts;
    this.nativeTtsChecked = true;
    try {
      if (!Capacitor.isNativePlatform()) return null;
      const mod = await import('@capacitor-community/text-to-speech');
      const plugin = (mod as { TextToSpeech?: NativeTts }).TextToSpeech;
      if (plugin && typeof plugin.speak === 'function') {
        this.nativeTts = plugin;
      }
    } catch {
      this.nativeTts = null;
    }
    return this.nativeTts;
  }

  private startKeepAlive() {
    // Android Chrome pauses long utterances; nudging resume() keeps speech alive
    this.stopKeepAlive();
    if (!('speechSynthesis' in window)) return;
    this.keepAliveTimer = setInterval(() => {
      try {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.resume();
        }
      } catch {
        // ignore
      }
    }, 5000);
  }

  private stopKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  /**
   * Speaks text out loud with a child-friendly pitch and rate.
   * Prefers the native Capacitor TTS plugin on Android, falls back to
   * window.speechSynthesis. Always invokes onEnd exactly once.
   *
   * Accepts either speak(text, onEnd) or speak(text, lang, onEnd)
   * so existing callers keep working.
   */
  public speak(
    text: string,
    langOrOnEnd?: SpeechLang | (() => void),
    onEnd?: () => void
  ) {
    let lang: SpeechLang = 'en';
    let callback: (() => void) | undefined;
    if (typeof langOrOnEnd === 'function') {
      callback = langOrOnEnd;
    } else {
      if (langOrOnEnd) lang = langOrOnEnd;
      callback = onEnd;
    }

    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      this.stopKeepAlive();
      try {
        callback?.();
      } catch {
        // Never let a callback error break the engine
      }
    };

    if (!text || this.isMuted) {
      done();
      return;
    }

    this.unlockAudio();
    const targetLang = SPEECH_LANG[lang];

    void (async () => {
      try {
        // 1) Native plugin first (Android APK)
        const native = await this.getNativeTts();
        if (native) {
          try {
            await native.speak({
              text,
              lang: targetLang,
              rate: CHEERFUL_RATE,
              pitch: Math.min(CHEERFUL_PITCH, 2.0),
              volume: 1.0,
              category: 'ambient',
            });
          } catch (err) {
            this.lastError =
              err instanceof Error ? err.message : 'Native TTS failed';
          }
          done();
          return;
        }

        // 2) Web Speech API fallback
        if (!('speechSynthesis' in window)) {
          this.lastError = 'speechSynthesis not available';
          done();
          return;
        }

        const voices = await this.loadVoices();
        const synth = window.speechSynthesis;
        try {
          synth.cancel();
        } catch {
          // ignore cancel errors
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = CHEERFUL_RATE;
        utterance.pitch = CHEERFUL_PITCH;
        utterance.lang = targetLang;
        utterance.volume = 1.0; // Android WebView sometimes defaults quiet

        const voice = this.pickVoice(voices, lang);
        if (voice) {
          utterance.voice = voice;
          // Some Android builds need lang to match the voice exactly
          utterance.lang = voice.lang || targetLang;
        }

        utterance.onend = done;
        utterance.onerror = (event) => {
          // 'interrupted' / 'canceled' happen on rapid cancel(); still finish
          if (event && (event as SpeechSynthesisErrorEvent).error) {
            this.lastError = `Speech error: ${
              (event as SpeechSynthesisErrorEvent).error
            }`;
          }
          done();
        };

        this.startKeepAlive();
        synth.speak(utterance);

        // Safety net: if the utterance never starts (silent failure on some
        // WebViews), don't hang the caller forever.
        setTimeout(() => {
          if (!finished && !synth.speaking && !synth.pending) {
            this.lastError = 'Speech never started (silent WebView failure)';
            done();
          }
        }, 4000);
      } catch (err) {
        this.lastError = err instanceof Error ? err.message : 'speak() failed';
        done();
      }
    })();
  }

  public stopSpeaking() {
    this.stopKeepAlive();
    // Best effort on both engines; never throws
    if (this.nativeTts) {
      void this.nativeTts.stop().catch(() => undefined);
    }
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {
      // ignore
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopSpeaking();
    }
    return this.isMuted;
  }

  /**
   * Diagnostic snapshot of the voice engine. Safe to call anytime;
   * never throws and never speaks.
   */
  public async checkVoiceEngine(): Promise<VoiceEngineStatus> {
    const speechSynthesisAvailable =
      typeof window !== 'undefined' && 'speechSynthesis' in window;

    let voices: SpeechSynthesisVoice[] = [];
    if (speechSynthesisAvailable) {
      try {
        voices = await this.loadVoices();
      } catch {
        voices = [];
      }
    }

    const native = await this.getNativeTts();

    let platform: VoiceEngineStatus['platform'] = 'unavailable';
    if (native) {
      platform = 'android-native';
    } else if (speechSynthesisAvailable) {
      platform = 'web';
    }

    // Native engine manages its own voices; assume Hindi is handled by the OS.
    const hindiVoices = voices.filter((v) =>
      v.lang.toLowerCase().startsWith('hi')
    );
    const hindiVoiceAvailable =
      native !== null ? true : hindiVoices.length > 0;

    return {
      platform,
      ttsPluginAvailable: native !== null,
      speechSynthesisAvailable,
      voicesLoaded: voices.length > 0,
      voiceCount: voices.length,
      hindiVoiceAvailable,
      hindiVoiceCount: native ? 0 : hindiVoices.length,
      audioUnlocked: this.audioUnlocked,
      speechPrimed: this.speechPrimed,
      lastError: this.lastError,
    };
  }
}

export const sound = new SoundEngine();
