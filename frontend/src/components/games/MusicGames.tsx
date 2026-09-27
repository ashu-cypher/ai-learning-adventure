import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../../audio/soundEngine';
import { ArrowLeft, Play } from 'lucide-react';

interface MusicGameProps {
  onBack: () => void;
  onGameComplete?: () => void;
}

/* ---------- Tiny Web-Audio synth (no external assets) ---------- */

let actx: AudioContext | null = null;

const ac = (): AudioContext | null => {
  try {
    if (!actx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      actx = new AC();
    }
    if (actx.state === 'suspended') {
      void actx.resume();
    }
    return actx;
  } catch {
    return null;
  }
};

const tone = (freq: number, dur = 0.5, type: OscillatorType = 'triangle', vol = 0.3, when = 0) => {
  const ctx = ac();
  if (!ctx) return;
  try {
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  } catch {
    /* ignore */
  }
};

const drumSound = (kind: 'kick' | 'snare' | 'tom' | 'cymbal') => {
  const ctx = ac();
  if (!ctx) return;
  try {
    const t = ctx.currentTime;
    if (kind === 'kick') {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.25);
      g.gain.setValueAtTime(0.5, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.3);
    } else if (kind === 'tom') {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(220, t);
      o.frequency.exponentialRampToValueAtTime(90, t + 0.2);
      g.gain.setValueAtTime(0.4, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.25);
    } else {
      // snare & cymbal: noise burst
      const len = kind === 'snare' ? 0.2 : 0.5;
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const f = ctx.createBiquadFilter();
      f.type = kind === 'snare' ? 'bandpass' : 'highpass';
      f.frequency.value = kind === 'snare' ? 1800 : 6000;
      const g = ctx.createGain();
      g.gain.value = kind === 'snare' ? 0.4 : 0.25;
      src.connect(f);
      f.connect(g);
      g.connect(ctx.destination);
      src.start(t);
      if (kind === 'snare') {
        tone(190, 0.12, 'triangle', 0.25);
      }
    }
  } catch {
    /* ignore */
  }
};

/* ---------- Shared bits ---------- */

const TopBar: React.FC<{ title: string; onBack: () => void }> = ({ title, onBack }) => (
  <div className="w-full flex items-center justify-between mb-3">
    <button
      onClick={() => {
        sound.playPop();
        onBack();
      }}
      className="flex items-center gap-2 bg-white/90 hover:bg-white text-slate-700 px-4 py-2.5 rounded-2xl shadow-md border-2 border-sky-200 active:scale-95 transition-transform"
    >
      <ArrowLeft className="w-6 h-6 text-sky-500" />
      <span className="font-bubble font-bold text-lg">Games</span>
    </button>
    <h2 className="font-bubble font-extrabold text-2xl md:text-3xl text-slate-800 text-center">
      {title}
    </h2>
    <div className="w-24" />
  </div>
);

/* ---------- Piano ---------- */

const PIANO_KEYS = [
  { name: 'C', freq: 261.63, color: '#EF4444' },
  { name: 'D', freq: 293.66, color: '#F97316' },
  { name: 'E', freq: 329.63, color: '#FBBF24' },
  { name: 'F', freq: 349.23, color: '#22C55E' },
  { name: 'G', freq: 392.0, color: '#38BDF8' },
  { name: 'A', freq: 440.0, color: '#8B5CF6' },
  { name: 'B', freq: 493.88, color: '#EC4899' },
  { name: 'C', freq: 523.25, color: '#14B8A6' },
];

const TWINKLE = [0, 0, 4, 4, 5, 5, 4]; // C C G G A A G

export const PianoGame: React.FC<MusicGameProps> = ({ onBack, onGameComplete }) => {
  const [activeKey, setActiveKey] = useState<number | null>(null);
  const [playingSong, setPlayingSong] = useState(false);
  const [taps, setTaps] = useState(0);
  const timersRef = useRef<number[]>([]);
  const tapsRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    sound.speak('Let us play the rainbow piano! Tap the colorful keys!');
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const pressKey = (i: number) => {
    if (playingSong) return;
    const key = PIANO_KEYS[i];
    tone(key.freq, 0.6, 'triangle', 0.32);
    setActiveKey(i);
    sound.speak(key.name + '!');
    const t = window.setTimeout(() => setActiveKey(null), 350);
    timersRef.current.push(t);
    const n = tapsRef.current + 1;
    tapsRef.current = n;
    setTaps(n);
    if (n === 25 && !doneRef.current) {
      doneRef.current = true;
      sound.playSuccessChime();
      sound.speak('Beautiful music, little maestro!');
      onGameComplete?.();
    }
  };

  const playTwinkle = () => {
    if (playingSong) return;
    setPlayingSong(true);
    sound.speak('Listen! Twinkle twinkle little star!');
    TWINKLE.forEach((keyIdx, step) => {
      const t = window.setTimeout(() => {
        const key = PIANO_KEYS[keyIdx];
        tone(key.freq, 0.55, 'triangle', 0.32);
        setActiveKey(keyIdx);
        const off = window.setTimeout(() => setActiveKey(null), 380);
        timersRef.current.push(off);
        if (step === TWINKLE.length - 1) {
          const done = window.setTimeout(() => {
            setPlayingSong(false);
            sound.playSuccessChime();
            sound.speak('You played Twinkle Twinkle! Wonderful!');
            onGameComplete?.();
          }, 600);
          timersRef.current.push(done);
        }
      }, step * 520);
      timersRef.current.push(t);
    });
  };

  return (
    <div className="w-full flex flex-col items-center animate-fade-in select-none">
      <TopBar title="🎹 Rainbow Piano" onBack={onBack} />
      <div className="w-full bg-white/70 rounded-3xl border-2 border-amber-200 shadow-md p-4 mb-3 text-center">
        <p className="font-bubble font-bold text-xl text-slate-700">
          {activeKey !== null ? (
            <>
              You played <span style={{ color: PIANO_KEYS[activeKey].color }}>{PIANO_KEYS[activeKey].name}</span>! 🎵
            </>
          ) : (
            'Tap a key to make music! 🎶'
          )}
        </p>
        <p className="font-bubble text-sm text-slate-500 mt-1">Keys tapped: {taps} 🖐️</p>
      </div>
      <div className="w-full flex gap-1.5 md:gap-2 h-56 md:h-72">
        {PIANO_KEYS.map((key, i) => (
          <button
            key={`${key.name}-${i}`}
            onPointerDown={() => pressKey(i)}
            className={`flex-1 rounded-b-3xl rounded-t-xl border-b-8 border-black/20 flex flex-col items-center justify-end pb-4 transition-transform active:scale-y-95 active:brightness-110 ${
              activeKey === i ? 'scale-y-95 brightness-125' : ''
            }`}
            style={{ backgroundColor: key.color }}
            aria-label={`Piano key ${key.name}`}
          >
            <span className="font-bubble font-extrabold text-2xl md:text-3xl text-white drop-shadow">
              {key.name}
            </span>
            <span className="text-xl">🎵</span>
          </button>
        ))}
      </div>
      <button
        onClick={playTwinkle}
        disabled={playingSong}
        className="mt-4 flex items-center gap-2 bg-gradient-to-r from-purple-400 to-pink-500 text-white font-bubble font-extrabold text-xl px-8 py-4 rounded-3xl shadow-xl border-4 border-white active:scale-95 transition-transform disabled:opacity-60"
      >
        <Play className="w-6 h-6 fill-white" />
        {playingSong ? 'Playing... 🌟' : 'Play Twinkle Twinkle 🌟'}
      </button>
    </div>
  );
};

/* ---------- Drums ---------- */

const DRUMS: { kind: 'kick' | 'snare' | 'tom' | 'cymbal'; label: string; emoji: string; bg: string }[] = [
  { kind: 'kick', label: 'Boom!', emoji: '🥁', bg: 'from-red-400 to-rose-600' },
  { kind: 'snare', label: 'Tap!', emoji: '🪘', bg: 'from-amber-400 to-orange-600' },
  { kind: 'tom', label: 'Bop!', emoji: '🥁', bg: 'from-sky-400 to-blue-600' },
  { kind: 'cymbal', label: 'Crash!', emoji: '🔔', bg: 'from-yellow-300 to-amber-500' },
];

export const DrumGame: React.FC<MusicGameProps> = ({ onBack, onGameComplete }) => {
  const [active, setActive] = useState<number | null>(null);
  const [hits, setHits] = useState(0);
  const hitsRef = useRef(0);
  const doneRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    sound.speak('Bang the drums! Make some happy noise!');
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const hitDrum = (i: number) => {
    const drum = DRUMS[i];
    drumSound(drum.kind);
    setActive(i);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setActive(null), 220);
    const n = hitsRef.current + 1;
    hitsRef.current = n;
    setHits(n);
    if (n === 20 && !doneRef.current) {
      doneRef.current = true;
      sound.playSuccessChime();
      sound.speak('What a super drummer you are!');
      onGameComplete?.();
    } else if (n % 7 === 0) {
      sound.speak(drum.label + ' Great rhythm!');
    }
  };

  return (
    <div className="w-full flex flex-col items-center animate-fade-in select-none">
      <TopBar title="🥁 Happy Drums" onBack={onBack} />
      <p className="font-bubble font-bold text-xl text-slate-700 mb-4 text-center">
        Bang the big drums! 🥁 <span className="text-amber-600">Hits: {hits}</span>
      </p>
      <div className="grid grid-cols-2 gap-4 md:gap-6 w-full max-w-lg">
        {DRUMS.map((drum, i) => (
          <button
            key={drum.kind}
            onPointerDown={() => hitDrum(i)}
            className={`aspect-square rounded-full bg-gradient-to-br ${drum.bg} shadow-xl border-8 border-white/60 flex flex-col items-center justify-center transition-transform active:scale-90 ${
              active === i ? 'scale-90 brightness-125' : 'hover:scale-105'
            }`}
            aria-label={`${drum.label} drum`}
          >
            <span className="text-6xl md:text-7xl">{drum.emoji}</span>
            <span className="font-bubble font-extrabold text-2xl text-white drop-shadow mt-1">
              {drum.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ---------- Xylophone ---------- */

const XYLO_BARS = [
  { name: 'C', freq: 523.25, color: '#EF4444', h: 200 },
  { name: 'D', freq: 587.33, color: '#F97316', h: 185 },
  { name: 'E', freq: 659.25, color: '#FBBF24', h: 170 },
  { name: 'F', freq: 698.46, color: '#22C55E', h: 155 },
  { name: 'G', freq: 783.99, color: '#38BDF8', h: 140 },
  { name: 'A', freq: 880.0, color: '#8B5CF6', h: 125 },
  { name: 'B', freq: 987.77, color: '#EC4899', h: 110 },
  { name: 'C', freq: 1046.5, color: '#14B8A6', h: 95 },
];

export const XylophoneGame: React.FC<MusicGameProps> = ({ onBack, onGameComplete }) => {
  const [active, setActive] = useState<number | null>(null);
  const [taps, setTaps] = useState(0);
  const tapsRef = useRef(0);
  const doneRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    sound.speak('Ting ting! Play the rainbow xylophone!');
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const tapBar = (i: number) => {
    const bar = XYLO_BARS[i];
    tone(bar.freq, 0.7, 'sine', 0.35);
    tone(bar.freq * 2, 0.4, 'sine', 0.12);
    setActive(i);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setActive(null), 300);
    const n = tapsRef.current + 1;
    tapsRef.current = n;
    setTaps(n);
    if (n === 20 && !doneRef.current) {
      doneRef.current = true;
      sound.playSuccessChime();
      sound.speak('Ting ting ting! Beautiful!');
      onGameComplete?.();
    }
  };

  return (
    <div className="w-full flex flex-col items-center animate-fade-in select-none">
      <TopBar title="🎶 Rainbow Xylophone" onBack={onBack} />
      <p className="font-bubble font-bold text-xl text-slate-700 mb-2 text-center">
        Tap the colorful bars! <span className="text-amber-600">Taps: {taps}</span>
      </p>
      <div className="w-full max-w-2xl flex items-end justify-center gap-1.5 md:gap-2 bg-amber-900/90 rounded-3xl p-4 pt-6 shadow-xl border-4 border-amber-700">
        {XYLO_BARS.map((bar, i) => (
          <button
            key={`${bar.name}-${i}`}
            onPointerDown={() => tapBar(i)}
            className={`flex-1 rounded-t-2xl rounded-b-lg border-b-4 border-black/30 flex flex-col items-center justify-start pt-2 transition-transform active:scale-y-95 ${
              active === i ? 'scale-y-95 brightness-125' : 'hover:scale-y-105'
            }`}
            style={{ backgroundColor: bar.color, height: bar.h, maxHeight: 220 }}
            aria-label={`Xylophone bar ${bar.name}`}
          >
            <span className="text-lg">🔨</span>
            <span className="font-bubble font-extrabold text-white drop-shadow">{bar.name}</span>
          </button>
        ))}
      </div>
      <p className="font-bubble text-slate-500 mt-3 text-center">
        Big bars make low sounds, little bars make high sounds! 🎵
      </p>
    </div>
  );
};
