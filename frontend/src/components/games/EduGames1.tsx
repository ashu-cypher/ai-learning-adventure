import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft } from 'lucide-react';
import { sound } from '../../audio/soundEngine';
import { speakKid } from '../../audio/speakKid';

export interface MiniGameProps {
  onBack: () => void;
  onGameComplete?: () => void;
}

/* ================= Shared juice: particles, score/streak, confetti ================= */

const CONFETTI_COLORS = ['#EF4444', '#3B82F6', '#FBBF24', '#10B981', '#EC4899', '#8B5CF6'];

const EDU_CSS = `
.edu-particle{position:absolute;transform:translate(-50%,-50%);animation:edu-particle-fly .75s cubic-bezier(.16,1,.3,1) forwards;pointer-events:none;z-index:30}
@keyframes edu-particle-fly{0%{transform:translate(-50%,-50%) scale(.4) rotate(0deg);opacity:1}100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1.25) rotate(50deg);opacity:0}}
.edu-tap-anim{display:inline-block;animation:edu-bounce-spin .7s cubic-bezier(.34,1.56,.64,1)}
@keyframes edu-bounce-spin{0%{transform:scale(1) rotate(0)}35%{transform:scale(1.3) rotate(-10deg) translateY(-12px)}65%{transform:scale(1.12) rotate(10deg)}100%{transform:scale(1) rotate(360deg)}}
.edu-pop{animation:edu-pop .45s cubic-bezier(.34,1.56,.64,1)}
@keyframes edu-pop{0%{transform:scale(.3);opacity:0}100%{transform:scale(1);opacity:1}}
.edu-float{animation:edu-float 3s ease-in-out infinite}
@keyframes edu-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.edu-wiggle{animation:edu-wiggle 2.4s ease-in-out infinite}
@keyframes edu-wiggle{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}
.edu-munch{animation:edu-munch .5s ease-in-out 2}
@keyframes edu-munch{0%,100%{transform:scale(1,1)}30%{transform:scale(1.12,.78)}60%{transform:scale(.94,1.12)}}
.edu-shake{animation:edu-shake .5s ease-in-out}
@keyframes edu-shake{0%,100%{transform:translateX(0) rotate(0)}25%{transform:translateX(-12px) rotate(-4deg)}50%{transform:translateX(12px) rotate(4deg)}75%{transform:translateX(-8px) rotate(-2deg)}}
.edu-dance{animation:edu-dance 1s ease-in-out 2}
@keyframes edu-dance{0%,100%{transform:translateY(0) rotate(0)}25%{transform:translateY(-16px) rotate(-8deg)}50%{transform:translateY(0) rotate(0)}75%{transform:translateY(-16px) rotate(8deg)}}
.edu-card{perspective:700px;-webkit-tap-highlight-color:transparent;outline:none}
.edu-card-inner{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform .55s cubic-bezier(.34,1.3,.64,1)}
.edu-card.flipped .edu-card-inner{transform:rotateY(180deg)}
.edu-card-face{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;border-radius:1.25rem;backface-visibility:hidden;-webkit-backface-visibility:hidden;overflow:hidden}
.edu-card-back{transform:rotateY(180deg)}
.edu-matched{animation:edu-glow 1.2s ease-in-out infinite}
@keyframes edu-glow{0%,100%{filter:drop-shadow(0 0 6px rgba(250,204,21,.9))}50%{filter:drop-shadow(0 0 20px rgba(250,204,21,1))}}
.edu-quiz-pulse{animation:edu-quiz-pulse 1s ease-in-out infinite}
@keyframes edu-quiz-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
`;

function miniConfetti() {
  try {
    confetti({
      particleCount: 45,
      spread: 75,
      startVelocity: 32,
      origin: { y: 0.55 },
      colors: CONFETTI_COLORS,
      disableForReducedMotion: true,
    });
  } catch {
    /* confetti unavailable — ignore */
  }
}

function bigCelebrate() {
  sound.playFanfare();
  try {
    confetti({ particleCount: 130, spread: 100, origin: { y: 0.6 }, colors: CONFETTI_COLORS });
    setTimeout(() => {
      try {
        confetti({ particleCount: 70, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: CONFETTI_COLORS });
      } catch {
        /* ignore */
      }
    }, 250);
    setTimeout(() => {
      try {
        confetti({ particleCount: 70, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: CONFETTI_COLORS });
      } catch {
        /* ignore */
      }
    }, 450);
  } catch {
    /* ignore */
  }
}

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  dx: number;
  dy: number;
  size: number;
}

/** Emoji particle bursts at a point inside the play area. GPU-friendly CSS keyframes. */
function useBursts() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef<number[]>([]);

  useEffect(
    () => () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
    },
    []
  );

  const burst = (x: number, y: number, emojis: string[], count = 8) => {
    const fresh: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      const dist = 55 + Math.random() * 75;
      idRef.current += 1;
      fresh.push({
        id: idRef.current,
        x,
        y,
        emoji: emojis[i % emojis.length],
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist - 34,
        size: 20 + Math.random() * 18,
      });
    }
    const ids = new Set(fresh.map((p) => p.id));
    setParticles((prev) => [...prev, ...fresh]);
    const t = window.setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !ids.has(p.id)));
    }, 850);
    timersRef.current.push(t);
  };

  return { particles, burst };
}

/** Score + streak/combo engine. Cheers every 5 streak, big milestone at 10 points. */
function useKidGame(onGameComplete?: () => void) {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const doneRef = useRef(false);

  const claimComplete = () => {
    if (doneRef.current) return false;
    doneRef.current = true;
    return true;
  };

  const bumpScore = (points: number) => {
    const ns = score + points;
    setScore(ns);
    if (ns >= 10 && claimComplete()) {
      bigCelebrate();
      onGameComplete?.();
    }
  };

  const registerHit = (cheerEn: string, cheerHi: string, points = 1) => {
    const nstreak = streak + 1;
    setStreak(nstreak);
    bumpScore(points);
    if (nstreak % 5 === 0) {
      sound.playLevelUp();
      miniConfetti();
      speakKid(cheerEn, cheerHi);
    }
  };

  const registerMiss = () => setStreak(0);

  return { score, streak, bumpScore, registerHit, registerMiss, claimComplete };
}

const TopBar: React.FC<{
  title: string;
  onBack: () => void;
  score: number;
  streak: number;
}> = ({ title, onBack, score, streak }) => (
  <div className="w-full flex items-center justify-between mb-3 gap-2">
    <button
      onClick={() => {
        sound.playPop();
        sound.stopSpeaking();
        onBack();
      }}
      aria-label="Back to games"
      className="flex items-center gap-2 bg-white/90 hover:bg-white text-slate-700 px-4 py-2.5 rounded-2xl shadow-md border-2 border-sky-200 active:scale-95 transition-transform min-h-[56px]"
    >
      <ArrowLeft className="w-6 h-6 text-sky-500" />
      <span className="font-bubble font-bold text-lg">Games</span>
    </button>
    <h2 className="font-bubble font-extrabold text-xl md:text-3xl text-slate-800 text-center flex-1">
      {title}
    </h2>
    <div className="flex items-center gap-2">
      {streak >= 2 && (
        <div className="edu-pop flex items-center gap-1 bg-orange-100 border-2 border-orange-300 px-3 py-2 rounded-full shadow">
          <span className="text-xl">🔥</span>
          <span className="font-bubble font-extrabold text-lg text-orange-800">x{streak}</span>
        </div>
      )}
      <div className="flex items-center gap-2 bg-amber-100 border-2 border-amber-300 px-4 py-2 rounded-full shadow">
        <span className="text-2xl">⭐</span>
        <span className="font-bubble font-extrabold text-2xl text-amber-900">{score}</span>
      </div>
    </div>
  </div>
);

const Particles: React.FC<{ particles: Particle[] }> = ({ particles }) => (
  <>
    {particles.map((p) => (
      <span
        key={p.id}
        className="edu-particle"
        style={
          {
            left: p.x,
            top: p.y,
            fontSize: p.size,
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
          } as React.CSSProperties
        }
      >
        {p.emoji}
      </span>
    ))}
  </>
);

/* ================= GAME 1: Animal Friends ================= */

interface Animal {
  id: string;
  emoji: string;
  /** Crisp Twemoji art vendored in public/assets/animals — emoji is the fallback */
  img: string;
  en: string;
  hi: string;
  soundEn: string;
  soundHi: string;
  bg: string;
  play: () => void;
}

/** Renders the animal art, falling back to emoji if the PNG is missing */
const AnimalFace: React.FC<{ animal: Animal; className?: string }> = ({ animal, className }) => {
  const [err, setErr] = useState(false);
  if (err || !animal.img) return <span className={className}>{animal.emoji}</span>;
  return (
    <img
      src={animal.img}
      alt={animal.en}
      draggable={false}
      onError={() => setErr(true)}
      className={className}
    />
  );
};

const ANIMALS: Animal[] = [
  {
    id: 'dog', emoji: '🐶', img: 'assets/animals/dog.png', en: 'Dog', hi: 'कुत्ता',
    soundEn: 'Woof woof!', soundHi: 'भौं भौं!',
    bg: 'from-amber-200 to-orange-300',
    play: () => {
      sound.playDrumKick();
      setTimeout(() => sound.playDrumKick(), 170);
    },
  },
  {
    id: 'cat', img: 'assets/animals/cat.png', emoji: '🐱', en: 'Cat', hi: 'बिल्ली',
    soundEn: 'Meow!', soundHi: 'म्याऊँ!',
    bg: 'from-pink-200 to-rose-300',
    play: () => {
      sound.playStarCollect();
      setTimeout(() => sound.playStarCollect(), 230);
    },
  },
  {
    id: 'cow', img: 'assets/animals/cow.png', emoji: '🐄', en: 'Cow', hi: 'गाय',
    soundEn: 'Moo!', soundHi: 'मूँ!',
    bg: 'from-sky-200 to-blue-300',
    play: () => {
      sound.playDrumKick();
      setTimeout(() => sound.playBoing(), 140);
    },
  },
  {
    id: 'lion', img: 'assets/animals/lion.png', emoji: '🦁', en: 'Lion', hi: 'शेर',
    soundEn: 'Roar!', soundHi: 'दहाड़!',
    bg: 'from-yellow-200 to-amber-400',
    play: () => {
      sound.playWhoosh();
      setTimeout(() => sound.playDrumSnare(), 160);
    },
  },
  {
    id: 'duck', img: 'assets/animals/duck.png', emoji: '🦆', en: 'Duck', hi: 'बत्तख',
    soundEn: 'Quack quack!', soundHi: 'क्वैक क्वैक!',
    bg: 'from-lime-200 to-green-300',
    play: () => {
      sound.playTap();
      setTimeout(() => sound.playTap(), 160);
      setTimeout(() => sound.playTap(), 320);
    },
  },
  {
    id: 'elephant', img: 'assets/animals/elephant.png', emoji: '🐘', en: 'Elephant', hi: 'हाथी',
    soundEn: 'Toot toot!', soundHi: 'टूट टूट!',
    bg: 'from-violet-200 to-purple-300',
    play: () => {
      sound.playYay();
    },
  },
];

export const AnimalSoundsGame: React.FC<MiniGameProps> = ({ onBack, onGameComplete }) => {
  const { score, streak, bumpScore, registerHit, registerMiss } = useKidGame(onGameComplete);
  const { particles, burst } = useBursts();
  const areaRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<'free' | 'quiz'>('free');
  const [freeTaps, setFreeTaps] = useState(0);
  const [quizTarget, setQuizTarget] = useState<Animal | null>(null);
  const [quizTries, setQuizTries] = useState(0);
  const [tapped, setTapped] = useState<{ id: string; n: number }>({ id: '', n: 0 });
  const quizTimer = useRef<number | null>(null);

  useEffect(() => {
    speakKid(
      'Tap an animal to hear its sound! Then we play "Who says?"!',
      'जानवर को छुओ और उसकी आवाज़ सुनो! फिर हम "कौन बोलता है?" खेलेंगे!'
    );
    return () => {
      sound.stopSpeaking();
      if (quizTimer.current !== null) window.clearTimeout(quizTimer.current);
    };
  }, []);

  const posOf = (e: React.MouseEvent) => {
    const r = areaRef.current?.getBoundingClientRect();
    if (!r) return { x: 80, y: 80 };
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const startQuiz = () => {
    const target = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
    setQuizTarget(target);
    setQuizTries(0);
    setMode('quiz');
    sound.playSparkle();
    speakKid(
      `Who says ${target.soundEn} Who makes that sound?`,
      `कौन बोलता है ${target.soundHi}? यह आवाज़ कौन निकालता है?`
    );
  };

  const endQuizToFree = (delayMs: number) => {
    setTimeout(() => {
      setMode('free');
      setQuizTarget(null);
      setFreeTaps(0);
    }, delayMs);
  };

  const handleTap = (animal: Animal, e: React.MouseEvent) => {
    const p = posOf(e);
    burst(p.x, p.y, [animal.emoji, '✨', '💛'], 7);
    setTapped((t) => ({ id: animal.id, n: t.n + 1 }));
    animal.play();

    if (mode === 'free') {
      speakKid(`${animal.en}! ${animal.soundEn}`, `${animal.hi}! ${animal.soundHi}`);
      bumpScore(1);
      const ntaps = freeTaps + 1;
      setFreeTaps(ntaps);
      if (ntaps >= 3 && quizTimer.current === null) {
        quizTimer.current = window.setTimeout(() => {
          quizTimer.current = null;
          startQuiz();
        }, 1400);
      }
      return;
    }

    // Quiz mode
    if (quizTarget && animal.id === quizTarget.id) {
      sound.playSuccessChime();
      sound.playJingle('correct');
      burst(p.x, p.y, ['🎉', '⭐', animal.emoji, '💛'], 12);
      registerHit('Amazing! You found it!', 'बहुत बढ़िया! तुमने खोज लिया!', 2);
      speakKid(
        `Yes! ${animal.en}! ${animal.soundEn} You found it!`,
        `हाँ! ${animal.hi}! ${animal.soundHi} तुमने खोज लिया!`
      );
      endQuizToFree(2200);
    } else {
      sound.playOops();
      registerMiss();
      const ntries = quizTries + 1;
      setQuizTries(ntries);
      if (ntries >= 2 && quizTarget) {
        // Gently reveal the answer, then back to free play
        speakKid(
          `Good try! It was the ${quizTarget.en}! ${quizTarget.soundEn}`,
          `अच्छा प्रयास! यह ${quizTarget.hi} था! ${quizTarget.soundHi}`
        );
        quizTarget.play();
        endQuizToFree(2600);
      } else {
        speakKid('Good try! Listen again and tap!', 'अच्छा प्रयास! फिर से सुनो और छुओ!');
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto select-none">
      <style>{EDU_CSS}</style>
      <TopBar title="🦁 Animal Friends" onBack={onBack} score={score} streak={streak} />

      <div
        ref={areaRef}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-200 via-teal-100 to-sky-200 border-4 border-white shadow-xl p-4 md:p-6 min-h-[62vh]"
      >
        <Particles particles={particles} />

        {/* Quiz prompt banner */}
        {mode === 'quiz' && quizTarget && (
          <div className="edu-pop mb-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-3xl p-4 shadow-lg border-4 border-white">
            <p className="font-bubble font-extrabold text-2xl md:text-3xl text-white text-center">
              🎯 Who says “{quizTarget.soundEn}”?
            </p>
            <p className="font-bubble font-bold text-lg text-violet-100 text-center">
              Tap the right animal! 👆
            </p>
          </div>
        )}

        {mode === 'free' && (
          <p className="font-bubble font-bold text-xl md:text-2xl text-teal-900 text-center mb-4">
            Tap an animal — hear it talk! 🎵
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {ANIMALS.map((animal) => (
            <button
              key={animal.id}
              onClick={(e) => handleTap(animal, e)}
              aria-label={animal.en}
              className={`bg-gradient-to-br ${animal.bg} rounded-3xl border-4 border-white shadow-xl min-h-[132px] md:min-h-[150px] flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform hover:scale-[1.03] ${
                mode === 'quiz' && quizTries >= 2 && quizTarget?.id === animal.id
                  ? 'edu-quiz-pulse ring-4 ring-amber-300'
                  : ''
              }`}
            >
              <span
                key={`${animal.id}-${tapped.id === animal.id ? tapped.n : 0}`}
                className={`drop-shadow-lg ${tapped.id === animal.id ? 'edu-tap-anim' : 'edu-float'}`}
                style={tapped.id === animal.id ? undefined : { animationDelay: `${ANIMALS.indexOf(animal) * 0.25}s` }}
              >
                <AnimalFace animal={animal} className="w-20 h-20 md:w-24 md:h-24 object-contain" />
              </span>
              <span className="font-bubble font-extrabold text-xl text-slate-800">
                {animal.en}
              </span>
            </button>
          ))}
        </div>

        {/* Manual quiz toggle */}
        <div className="flex justify-center mt-4">
          <button
            onClick={() => {
              sound.playPop();
              if (mode === 'free') startQuiz();
            }}
            className="bg-white/90 border-2 border-violet-300 text-violet-800 font-bubble font-extrabold text-lg px-6 py-3 rounded-full shadow-lg active:scale-95 transition-transform min-h-[56px]"
          >
            🎯 Play “Who says?”
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= GAME 2: Feed the Hungry Monster ================= */

/** Real monster art (Kenney CC0 parts, composed) — face changes with mood, emoji fallback */
const MONSTER_IMGS: Record<string, string> = {
  idle: 'assets/monsters/monster_happy.png',
  dance: 'assets/monsters/monster_happy.png',
  munch: 'assets/monsters/monster_silly.png',
  shake: 'assets/monsters/monster_cute.png',
};

const MonsterFace: React.FC<{ mood: 'idle' | 'munch' | 'shake' | 'dance' }> = ({ mood }) => {
  const [err, setErr] = useState(false);
  if (err) return <span className="text-[104px] md:text-[136px]">👹</span>;
  return (
    <img
      src={MONSTER_IMGS[mood] ?? MONSTER_IMGS.idle}
      alt="Hungry monster"
      draggable={false}
      onError={() => setErr(true)}
      className="w-36 h-36 md:w-44 md:h-44 object-contain"
    />
  );
};

type FoodColor = 'red' | 'yellow' | 'purple' | 'orange' | 'green' | 'pink';
type FoodShape = 'round' | 'long' | 'triangle';

interface Food {
  id: string;
  emoji: string;
  en: string;
  hi: string;
  color: FoodColor;
  colorHi: string;
  shape: FoodShape;
  shapeHi: string;
}

const FOODS: Food[] = [
  { id: 'apple', emoji: '🍎', en: 'apple', hi: 'सेब', color: 'red', colorHi: 'लाल', shape: 'round', shapeHi: 'गोल' },
  { id: 'strawberry', emoji: '🍓', en: 'strawberry', hi: 'स्ट्रॉबेरी', color: 'red', colorHi: 'लाल', shape: 'round', shapeHi: 'गोल' },
  { id: 'banana', emoji: '🍌', en: 'banana', hi: 'केला', color: 'yellow', colorHi: 'पीला', shape: 'long', shapeHi: 'लंबा' },
  { id: 'corn', emoji: '🌽', en: 'corn', hi: 'मक्का', color: 'yellow', colorHi: 'पीला', shape: 'long', shapeHi: 'लंबा' },
  { id: 'grapes', emoji: '🍇', en: 'grapes', hi: 'अंगूर', color: 'purple', colorHi: 'बैंगनी', shape: 'round', shapeHi: 'गोल' },
  { id: 'orange', emoji: '🍊', en: 'orange', hi: 'संतरा', color: 'orange', colorHi: 'नारंगी', shape: 'round', shapeHi: 'गोल' },
  { id: 'carrot', emoji: '🥕', en: 'carrot', hi: 'गाजर', color: 'orange', colorHi: 'नारंगी', shape: 'long', shapeHi: 'लंबा' },
  { id: 'donut', emoji: '🍩', en: 'donut', hi: 'डोनट', color: 'pink', colorHi: 'गुलाबी', shape: 'round', shapeHi: 'गोल' },
  { id: 'watermelon', emoji: '🍉', en: 'watermelon', hi: 'तरबूज', color: 'green', colorHi: 'हरा', shape: 'round', shapeHi: 'गोल' },
  { id: 'cheese', emoji: '🧀', en: 'cheese', hi: 'पनीर', color: 'yellow', colorHi: 'पीला', shape: 'triangle', shapeHi: 'तिकोना' },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

interface FlyState {
  emoji: string;
  fromX: number;
  fromY: number;
  dx: number;
  dy: number;
  go: boolean;
}

export const FeedMonsterGame: React.FC<MiniGameProps> = ({ onBack, onGameComplete }) => {
  const { score, streak, registerHit, registerMiss } = useKidGame(onGameComplete);
  const { particles, burst } = useBursts();
  const areaRef = useRef<HTMLDivElement>(null);
  const monsterRef = useRef<HTMLDivElement>(null);

  const [round, setRound] = useState(0);
  const [options, setOptions] = useState<Food[]>([]);
  const [target, setTarget] = useState<Food | null>(null);
  const [monsterMood, setMonsterMood] = useState<'idle' | 'munch' | 'shake' | 'dance'>('idle');
  const [fly, setFly] = useState<FlyState | null>(null);
  const [busy, setBusy] = useState(false);

  const speakCraving = (food: Food) => {
    speakKid(
      `I'm hungry for something ${food.color} and ${food.shape}! Feed me!`,
      `मुझे ${food.colorHi} और ${food.shapeHi} कुछ खाना है! मुझे खिलाओ!`
    );
  };

  const newRound = () => {
    const t = FOODS[Math.floor(Math.random() * FOODS.length)];
    // Distractors must NOT match both color and shape (no ambiguity)
    const distractPool = FOODS.filter(
      (f) => f.id !== t.id && !(f.color === t.color && f.shape === t.shape)
    );
    const optionCount = round < 2 ? 4 : round < 5 ? 5 : 6;
    const picks = shuffle(distractPool).slice(0, optionCount - 1);
    setOptions(shuffle([t, ...picks]));
    setTarget(t);
    setRound((r) => r + 1);
    setBusy(false);
    setTimeout(() => speakCraving(t), 500);
  };

  useEffect(() => {
    speakKid(
      'The monster is hungry! Feed it exactly what it asks for!',
      'राक्षस को भूख लगी है! जो माँगे वही खिलाओ!'
    );
    newRound();
    return () => {
      sound.stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const monsterCenter = () => {
    const area = areaRef.current?.getBoundingClientRect();
    const m = monsterRef.current?.getBoundingClientRect();
    if (!area || !m) return { x: 160, y: 120 };
    return { x: m.left + m.width / 2 - area.left, y: m.top + m.height / 2 - area.top };
  };

  const handleFoodTap = (food: Food, e: React.MouseEvent<HTMLButtonElement>) => {
    if (busy || !target) return;
    const area = areaRef.current?.getBoundingClientRect();
    const btn = e.currentTarget.getBoundingClientRect();
    if (!area) return;
    const fromX = btn.left + btn.width / 2 - area.left;
    const fromY = btn.top + btn.height / 2 - area.top;

    if (food.id === target.id) {
      setBusy(true);
      sound.playWhoosh();
      const mc = monsterCenter();
      const state: FlyState = { emoji: food.emoji, fromX, fromY, dx: mc.x - fromX, dy: mc.y - fromY, go: false };
      setFly(state);
      // Kick off the flight on the next frame so the transition animates
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setFly({ ...state, go: true }));
      });

      setTimeout(() => {
        setFly(null);
        // Chomp chomp!
        setMonsterMood('munch');
        sound.playDrumSnare();
        setTimeout(() => sound.playDrumSnare(), 140);
        setTimeout(() => sound.playDrumSnare(), 280);
        burst(mc.x, mc.y, ['😋', '✨', '💛', food.emoji], 10);
        const willStreak = streak + 1;
        registerHit('Yummy! So tasty!', 'यम्मी! बहुत स्वादिष्ट!', 1);
        speakKid(
          `YUMMY! That ${food.en} was delicious!`,
          `यम्मी! वह ${food.hi} बहुत स्वादिष्ट था!`
        );
        if (willStreak % 5 === 0) {
          // Extra happy dance on streak milestones
          sound.playJingle('win');
          setTimeout(() => setMonsterMood('dance'), 700);
          setTimeout(() => setMonsterMood('idle'), 2900);
        } else {
          setTimeout(() => setMonsterMood('idle'), 1200);
        }
        setTimeout(newRound, 2100);
      }, 620);
    } else {
      // Gentle: no penalty, monster shakes its head
      sound.playOops();
      registerMiss();
      setMonsterMood('shake');
      setTimeout(() => setMonsterMood('idle'), 550);
      burst(fromX, fromY, ['💭'], 4);
      speakKid(
        'Hmm, not that one! Listen: what did I ask for?',
        'हम्म, यह नहीं! सुनो: मैंने क्या माँगा था?'
      );
      setTimeout(() => speakCraving(target), 2200);
    }
  };

  const moodClass =
    monsterMood === 'munch' ? 'edu-munch' : monsterMood === 'shake' ? 'edu-shake' : monsterMood === 'dance' ? 'edu-dance' : 'edu-float';

  return (
    <div className="w-full max-w-4xl mx-auto select-none">
      <style>{EDU_CSS}</style>
      <TopBar title="👹 Feed the Hungry Monster" onBack={onBack} score={score} streak={streak} />

      <div
        ref={areaRef}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-200 via-amber-100 to-yellow-200 border-4 border-white shadow-xl p-4 md:p-6 min-h-[62vh]"
      >
        <Particles particles={particles} />

        {/* Flying food */}
        {fly && (
          <span
            className="pointer-events-none absolute z-40 text-6xl"
            style={{
              left: fly.fromX,
              top: fly.fromY,
              transform: fly.go
                ? `translate(calc(-50% + ${fly.dx}px), calc(-50% + ${fly.dy}px)) scale(0.25) rotate(360deg)`
                : 'translate(-50%, -50%) scale(1) rotate(0deg)',
              transition: fly.go ? 'transform 0.58s cubic-bezier(0.34,1.3,0.64,1)' : 'none',
            }}
          >
            {fly.emoji}
          </span>
        )}

        {/* Monster — real Kenney art (composed monster PNGs), mood changes the face */}
        <div className="flex flex-col items-center mb-2">
          <div ref={monsterRef} className={`leading-none drop-shadow-xl ${moodClass}`}>
            <MonsterFace mood={monsterMood} />
          </div>
          {target && (
            <div className="edu-pop -mt-2 bg-white rounded-3xl border-4 border-orange-300 px-6 py-3 shadow-lg max-w-full">
              <p className="font-bubble font-extrabold text-xl md:text-2xl text-orange-900 text-center">
                🍽️ I want something{' '}
                <span className="text-red-500">{target.color.toUpperCase()}</span> and{' '}
                <span className="text-violet-600">{target.shape.toUpperCase()}</span>!
              </p>
              <button
                onClick={() => {
                  sound.playTap();
                  if (target) speakCraving(target);
                }}
                className="mt-1 mx-auto flex items-center gap-1 text-orange-600 font-bubble font-bold text-base bg-orange-100 px-4 py-1.5 rounded-full active:scale-95 transition-transform min-h-[44px]"
              >
                🔊 Hear again
              </button>
            </div>
          )}
        </div>

        {/* Food choices */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mt-3">
          {options.map((food, i) => (
            <button
              key={`${round}-${food.id}`}
              onClick={(e) => handleFoodTap(food, e)}
              aria-label={food.en}
              disabled={busy}
              className="edu-pop bg-white/95 rounded-3xl border-4 border-amber-200 shadow-lg min-h-[104px] md:min-h-[124px] flex items-center justify-center active:scale-90 transition-transform hover:scale-105 disabled:opacity-90"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <span className="text-6xl md:text-7xl edu-wiggle" style={{ animationDelay: `${i * 0.3}s` }}>
                {food.emoji}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ================= GAME 3: Memory Match ================= */

const PAIR_EMOJIS = ['🐶', '🐱', '🦁', '🐘', '🦋', '🌈'];

interface MemCard {
  uid: number;
  emoji: string;
}

function dealCards(): MemCard[] {
  const deck: MemCard[] = [];
  PAIR_EMOJIS.forEach((emoji) => {
    deck.push({ uid: deck.length, emoji });
    deck.push({ uid: deck.length, emoji });
  });
  return shuffle(deck);
}

export const MemoryPairsGame: React.FC<MiniGameProps> = ({ onBack, onGameComplete }) => {
  const { score, streak, registerHit, registerMiss, claimComplete } = useKidGame(onGameComplete);
  const { particles, burst } = useBursts();
  const areaRef = useRef<HTMLDivElement>(null);

  const [cards, setCards] = useState<MemCard[]>(() => dealCards());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [lock, setLock] = useState(false);
  const [moves, setMoves] = useState(0);
  const [pairsFound, setPairsFound] = useState(0);
  const [round, setRound] = useState(1);
  const [won, setWon] = useState(false);

  useEffect(() => {
    speakKid(
      'Flip the cards and find the matching pairs! You can do it!',
      'पत्ते पलटो और मिलती-जुलती जोड़ी खोजो! तुम कर सकते हो!'
    );
    return () => {
      sound.stopSpeaking();
    };
  }, []);

  const posOf = (e: React.MouseEvent) => {
    const r = areaRef.current?.getBoundingClientRect();
    if (!r) return { x: 80, y: 80 };
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const cardByUid = (uid: number) => cards.find((c) => c.uid === uid);

  const handleCardTap = (card: MemCard, e: React.MouseEvent) => {
    if (lock || won || flipped.includes(card.uid) || matched.includes(card.uid)) return;
    sound.playWhoosh();
    const p = posOf(e);
    const next = [...flipped, card.uid];
    setFlipped(next);

    if (next.length === 2) {
      setLock(true);
      setMoves((m) => m + 1);
      const a = cardByUid(next[0]);
      const b = cardByUid(next[1]);
      const isMatch = a !== undefined && b !== undefined && a.emoji === b.emoji;

      if (isMatch) {
        setTimeout(() => {
          sound.playSparkle();
          burst(p.x, p.y, ['⭐', '✨', '💛', a?.emoji ?? '🎉'], 10);
          setMatched((m) => [...m, next[0], next[1]]);
          setFlipped([]);
          setLock(false);
          const found = pairsFound + 1;
          setPairsFound(found);
          registerHit('You found a pair!', 'तुम्हें जोड़ी मिल गई!', 2);
          if (found >= PAIR_EMOJIS.length) {
            // Round complete!
            setWon(true);
            setTimeout(() => {
              sound.playFanfare();
              miniConfetti();
              speakKid(
                'Wow! You found ALL the pairs! You are a superstar!',
                'वाह! तुम्हें सारी जोड़ियाँ मिल गईं! तुम सुपरस्टार हो!'
              );
              if (claimComplete()) onGameComplete?.();
            }, 600);
          } else {
            speakKid('You found a pair! Amazing!', 'जोड़ी मिल गई! बहुत बढ़िया!');
          }
        }, 380);
      } else {
        // Gentle mismatch: flip back, encourage, never punish
        setTimeout(() => {
          sound.playOops();
          registerMiss();
          setFlipped([]);
          setLock(false);
          speakKid('Good try! Remember and try again!', 'अच्छा प्रयास! याद करो और फिर कोशिश करो!');
        }, 900);
      }
    }
  };

  const playAgain = () => {
    sound.playPop();
    setCards(dealCards());
    setFlipped([]);
    setMatched([]);
    setLock(false);
    setMoves(0);
    setPairsFound(0);
    setWon(false);
    setRound((r) => r + 1);
    speakKid(
      'New cards! Find all the pairs again!',
      'नए पत्ते! फिर से सारी जोड़ियाँ खोजो!'
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto select-none">
      <style>{EDU_CSS}</style>
      <TopBar title="🃏 Memory Match" onBack={onBack} score={score} streak={streak} />

      <div
        ref={areaRef}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-200 via-violet-100 to-fuchsia-200 border-4 border-white shadow-xl p-4 md:p-6 min-h-[62vh]"
      >
        <Particles particles={particles} />

        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="bg-white/90 border-2 border-violet-300 px-4 py-1.5 rounded-full shadow font-bubble font-extrabold text-violet-900">
            🃏 Pairs: {pairsFound}/{PAIR_EMOJIS.length}
          </div>
          <div className="bg-white/90 border-2 border-violet-300 px-4 py-1.5 rounded-full shadow font-bubble font-extrabold text-violet-900">
            👆 Moves: {moves}
          </div>
          {round > 1 && (
            <div className="bg-white/90 border-2 border-amber-300 px-4 py-1.5 rounded-full shadow font-bubble font-extrabold text-amber-800">
              🔁 Round {round}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 md:gap-4">
          {cards.map((card) => {
            const isUp = flipped.includes(card.uid) || matched.includes(card.uid);
            const isMatched = matched.includes(card.uid);
            return (
              <button
                key={`${round}-${card.uid}`}
                onClick={(e) => handleCardTap(card, e)}
                aria-label={isUp ? card.emoji : 'Hidden card'}
                className={`edu-card w-full aspect-square min-h-[84px] ${isUp ? 'flipped' : ''} ${isMatched ? 'edu-matched' : ''} active:scale-95 transition-transform`}
              >
                <div className="edu-card-inner">
                  {/* Front: mystery side */}
                  <div className="edu-card-face bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 border-4 border-white shadow-lg">
                    <span className="text-5xl md:text-6xl edu-float">❓</span>
                  </div>
                  {/* Back: emoji side */}
                  <div
                    className={`edu-card-face edu-card-back border-4 shadow-lg ${
                      isMatched
                        ? 'bg-gradient-to-br from-amber-200 to-yellow-300 border-amber-300'
                        : 'bg-white border-violet-200'
                    }`}
                  >
                    <span className="text-5xl md:text-6xl">{card.emoji}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {won && (
          <div className="edu-pop mt-5 flex flex-col items-center gap-2">
            <p className="font-bubble font-extrabold text-2xl md:text-3xl text-violet-900 text-center">
              🏆 You found every pair! 🏆
            </p>
            <button
              onClick={playAgain}
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bubble font-extrabold text-xl px-8 py-3.5 rounded-full shadow-xl border-4 border-white active:scale-95 transition-transform min-h-[64px] edu-wiggle"
            >
              🔁 Play Again!
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ================= Registry ================= */

export const EDU1_GAMES: Record<
  string,
  { name: string; emoji: string; instructions: { en: string; hi: string } }
> = {
  animals: {
    name: 'Animal Friends',
    emoji: '🦁',
    instructions: {
      en: 'Tap an animal to hear its sound! Then play "Who says?" and find the right animal!',
      hi: 'जानवर को छुओ और उसकी आवाज़ सुनो! फिर "कौन बोलता है?" खेलो और सही जानवर खोजो!',
    },
  },
  feedmonster: {
    name: 'Feed the Hungry Monster',
    emoji: '👹',
    instructions: {
      en: 'The monster is hungry! Listen carefully and feed it exactly the food it asks for!',
      hi: 'राक्षस को भूख लगी है! ध्यान से सुनो और वही खाना खिलाओ जो वह माँगे!',
    },
  },
  memory: {
    name: 'Memory Match',
    emoji: '🃏',
    instructions: {
      en: 'Flip the cards and find all 6 matching pairs! Remember where they hide!',
      hi: 'पत्ते पलटो और 6 मिलती-जुलती जोड़ियाँ खोजो! याद रखो वे कहाँ छिपी हैं!',
    },
  },
};
