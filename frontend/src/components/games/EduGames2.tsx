import React, { useState, useEffect, useRef, useCallback } from 'react';
import { sound } from '../../audio/soundEngine';
import { speakKid } from '../../audio/speakKid';
import { ArrowLeft, Volume2 } from 'lucide-react';

interface MiniGameProps {
  onBack: () => void;
  onGameComplete?: () => void;
}

/* ------------------------------------------------------------------ */
/* Shared styles (self-contained keyframes: GPU transforms/opacity only) */
/* ------------------------------------------------------------------ */

const Edu2Styles: React.FC = () => (
  <style>{`
    @keyframes edu2-burst {
      0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
      100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.35); opacity: 0; }
    }
    .edu2-burst-p { position: absolute; animation: edu2-burst 0.85s cubic-bezier(0.16, 0.84, 0.44, 1) forwards; pointer-events: none; }
    @keyframes edu2-wobble {
      0%, 100% { transform: translateX(0) rotate(0deg); }
      20% { transform: translateX(-12px) rotate(-6deg); }
      45% { transform: translateX(10px) rotate(5deg); }
      70% { transform: translateX(-6px) rotate(-3deg); }
      90% { transform: translateX(4px) rotate(2deg); }
    }
    .edu2-wobble { animation: edu2-wobble 0.5s ease-in-out; }
    @keyframes edu2-pop-spring {
      0% { transform: scale(0.25); opacity: 0; }
      60% { transform: scale(1.18); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }
    .edu2-pop-spring { animation: edu2-pop-spring 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
    @keyframes edu2-float-y {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    .edu2-float { animation: edu2-float-y 2.6s ease-in-out infinite; }
    @keyframes edu2-bob {
      0%, 100% { transform: translateY(0) rotate(-2deg); }
      50% { transform: translateY(-8px) rotate(2deg); }
    }
    .edu2-bob { animation: edu2-bob 1.1s ease-in-out infinite; }
    @keyframes edu2-rock {
      0%, 100% { transform: rotate(-4deg) translateY(0); }
      50% { transform: rotate(4deg) translateY(-4px); }
    }
    .edu2-rock { animation: edu2-rock 1.6s ease-in-out infinite; }
    @keyframes edu2-puff {
      0% { transform: scale(0.6); opacity: 0.9; }
      100% { transform: scale(1.6) translateX(-14px); opacity: 0; }
    }
    .edu2-puff { animation: edu2-puff 0.9s ease-out infinite; }
    @keyframes edu2-glow-pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7), 0 0 24px 4px rgba(251, 191, 36, 0.45); }
      50% { box-shadow: 0 0 0 10px rgba(251, 191, 36, 0), 0 0 34px 10px rgba(251, 191, 36, 0.6); }
    }
    .edu2-hole-glow { animation: edu2-glow-pulse 1.6s ease-in-out infinite; }
    @keyframes edu2-fly-in {
      0% { transform: translateY(0) scale(1); opacity: 1; }
      100% { transform: translateY(var(--fly)) scale(0.7); opacity: 1; }
    }
    .edu2-spring-x { transition: transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1); }
    .edu2-glide { transition: transform 0.22s cubic-bezier(0.34, 1.3, 0.64, 1); }
    @keyframes edu2-splat {
      0% { transform: scale(0.5); opacity: 1; }
      100% { transform: scale(1.5); opacity: 0; }
    }
    .edu2-splat { animation: edu2-splat 0.6s ease-out forwards; }
  `}</style>
);

/* ------------------------- Shared UI bits ------------------------- */

interface Burst {
  id: number;
  x: number;
  y: number;
  emojis: string[];
}

let burstId = 1;
function makeBurst(x: number, y: number, emojis: string[]): Burst {
  return { id: burstId++, x, y, emojis };
}

const BurstLayer: React.FC<{ bursts: Burst[] }> = ({ bursts }) => (
  <>
    {bursts.map((b) => (
      <div key={b.id} className="absolute z-30 pointer-events-none" style={{ left: b.x, top: b.y }}>
        {b.emojis.map((e, i) => {
          const angle = (i / b.emojis.length) * Math.PI * 2 + Math.random() * 0.6;
          const dist = 46 + Math.random() * 46;
          return (
            <span
              key={i}
              className="edu2-burst-p text-3xl"
              style={
                {
                  '--dx': `${Math.cos(angle) * dist}px`,
                  '--dy': `${Math.sin(angle) * dist - 30}px`,
                } as React.CSSProperties
              }
            >
              {e}
            </span>
          );
        })}
      </div>
    ))}
  </>
);

const TopBar: React.FC<{
  title: string;
  emoji: string;
  onBack: () => void;
  score: number;
  streak?: number;
}> = ({ title, emoji, onBack, score, streak }) => (
  <div className="w-full flex items-center justify-between mb-3">
    <button
      onClick={() => {
        sound.stopSpeaking();
        sound.playPop();
        onBack();
      }}
      aria-label="Back to games"
      className="flex items-center gap-2 bg-white/95 text-slate-700 px-4 py-2.5 rounded-2xl shadow-lg border-2 border-sky-200 active:scale-95 transition-transform min-h-[56px]"
    >
      <ArrowLeft className="w-6 h-6 text-sky-500" />
      <span className="font-bubble font-bold text-lg">Games</span>
    </button>
    <h2 className="font-bubble font-extrabold text-2xl md:text-3xl text-slate-800 text-center">
      {emoji} {title}
    </h2>
    <div className="flex items-center gap-2">
      {streak !== undefined && streak >= 2 && (
        <div className="edu2-pop-spring flex items-center gap-1 bg-orange-100 border-2 border-orange-300 px-3 py-2 rounded-full shadow">
          <span className="text-xl">🔥</span>
          <span className="font-bubble font-extrabold text-xl text-orange-800">x{streak}</span>
        </div>
      )}
      <div className="flex items-center gap-2 bg-amber-100 border-2 border-amber-300 px-4 py-2 rounded-full shadow">
        <span className="text-2xl">⭐</span>
        <span className="font-bubble font-extrabold text-2xl text-amber-900">{score}</span>
      </div>
    </div>
  </div>
);

const Celebrate: React.FC<{ message: string; sub?: string }> = ({ message, sub }) => (
  <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/40 rounded-3xl pointer-events-none">
    <div className="text-7xl mb-2 edu2-bob">🎉</div>
    <p className="edu2-pop-spring font-bubble font-extrabold text-3xl md:text-4xl text-white text-center px-6 drop-shadow-lg">
      {message}
    </p>
    {sub && (
      <p className="font-bubble font-bold text-xl text-amber-200 text-center px-6 mt-1">{sub}</p>
    )}
    <div className="text-5xl mt-2">⭐🎊⭐</div>
  </div>
);

/** Throttled voice helper so Milo doesn't talk over himself. */
function useVoice() {
  const lastRef = useRef(0);
  return useCallback((en: string, hi: string | undefined, minGapMs: number, onEnd?: () => void) => {
    const now = Date.now();
    if (now - lastRef.current < minGapMs) return;
    lastRef.current = now;
    speakKid(en, hi, onEnd);
  }, []);
}

/* ============================ GAME 1 ============================ */
/* ------------------------- Shape Sorter 🔷 ------------------------ */

interface ShapeDef {
  id: string;
  emoji: string;
  nameEn: string;
  nameHi: string;
  btnGradient: string;
}

const SHAPES: ShapeDef[] = [
  { id: 'triangle', emoji: '🔺', nameEn: 'Triangle', nameHi: 'त्रिकोण', btnGradient: 'from-amber-300 to-orange-400' },
  { id: 'square', emoji: '🟥', nameEn: 'Square', nameHi: 'चौकोर', btnGradient: 'from-rose-300 to-pink-400' },
  { id: 'circle', emoji: '🔵', nameEn: 'Circle', nameHi: 'गोल', btnGradient: 'from-sky-300 to-blue-400' },
  { id: 'star', emoji: '⭐', nameEn: 'Star', nameHi: 'तारा', btnGradient: 'from-yellow-300 to-amber-400' },
  { id: 'heart', emoji: '❤️', nameEn: 'Heart', nameHi: 'दिल', btnGradient: 'from-pink-300 to-rose-400' },
];

function pickOptions(target: ShapeDef): ShapeDef[] {
  const others = SHAPES.filter((s) => s.id !== target.id);
  const shuffled = [...others].sort(() => Math.random() - 0.5);
  return [...shuffled.slice(0, 2), target].sort(() => Math.random() - 0.5);
}

interface FlyingShape {
  emoji: string;
  fromX: number;
  fromY: number;
  dx: number;
  dy: number;
  go: boolean;
}

export const ShapeSorterGame: React.FC<MiniGameProps> = ({ onBack, onGameComplete }) => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState<ShapeDef>(SHAPES[0]);
  const [options, setOptions] = useState<ShapeDef[]>(() => pickOptions(SHAPES[0]));
  const [phase, setPhase] = useState<'pick' | 'flying' | 'done'>('pick');
  const [flying, setFlying] = useState<FlyingShape | null>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [wobbleKey, setWobbleKey] = useState(0);
  const [wobbleId, setWobbleId] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const holeRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);
  const voice = useVoice();

  const newRound = useCallback((speakIt: boolean) => {
    const t = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    setTarget(t);
    setOptions(pickOptions(t));
    setPhase('pick');
    setFlying(null);
    setRound((r) => r + 1);
    if (speakIt) {
      speakKid(
        `Where does the ${t.nameEn} go? Tap the ${t.nameEn}!`,
        `${t.nameHi} कहाँ जाएगा? ${t.nameHi} को दबाओ!`
      );
    }
  }, []);

  useEffect(() => {
    newRound(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addBurst = (x: number, y: number, emojis: string[]) => {
    const b = makeBurst(x, y, emojis);
    setBursts((prev) => [...prev, b]);
    setTimeout(() => setBursts((prev) => prev.filter((p) => p.id !== b.id)), 950);
  };

  const handleCorrect = (shape: ShapeDef, btnEl: HTMLButtonElement) => {
    if (phase !== 'pick') return;
    setPhase('flying');
    sound.playWhoosh();
    // Measure flight path: button center -> hole center (relative to play area)
    const area = areaRef.current;
    const hole = holeRef.current;
    if (area && hole) {
      const a = area.getBoundingClientRect();
      const b = btnEl.getBoundingClientRect();
      const h = hole.getBoundingClientRect();
      const fromX = b.left - a.left + b.width / 2;
      const fromY = b.top - a.top + b.height / 2;
      const toX = h.left - a.left + h.width / 2;
      const toY = h.top - a.top + h.height / 2;
      const f: FlyingShape = { emoji: shape.emoji, fromX, fromY, dx: toX - fromX, dy: toY - fromY, go: false };
      setFlying(f);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setFlying((prev) => (prev ? { ...prev, go: true } : prev)))
      );
    }
    setTimeout(() => {
      setPhase('done');
      setFlying(null);
      sound.playSparkle();
      sound.playStarCollect();
      const hole = holeRef.current;
      const area = areaRef.current;
      if (hole && area) {
        const a = area.getBoundingClientRect();
        const h = hole.getBoundingClientRect();
        addBurst(h.left - a.left + h.width / 2, h.top - a.top + h.height / 2, ['✨', '🌟', '💫', '⭐', '✨', '🎉']);
      }
      speakKid(`${shape.nameEn}! Great job!`, `${shape.nameHi}! बहुत बढ़िया!`);
      setScore((s) => {
        const ns = s + 1;
        setStreak((st) => {
          const nst = st + 1;
          if (nst === 5) {
            sound.playFanfare();
            setCelebrate('Shape Superstar! 🌟');
            speakKid('Wow! Shape superstar! Five in a row!', 'वाह! आकारों के सितारे! लगातार पाँच!');
            setTimeout(() => setCelebrate(null), 2600);
          }
          return nst;
        });
        if (ns % 5 === 0 && ns % 10 !== 0) {
          setTimeout(() => voice(`Woohoo! ${ns} points!`, `वाह! ${ns} अंक!`, 0), 900);
        }
        if (ns === 10 && !doneRef.current) {
          doneRef.current = true;
          setCelebrate('Amazing! 10 Shapes! 🏆');
          sound.playLevelUp();
          setTimeout(() => {
            setCelebrate(null);
            onGameComplete?.();
          }, 2800);
        }
        return ns;
      });
      setTimeout(() => newRound(false), 1400);
    }, 620);
  };

  const handleWrong = (shapeId: string) => {
    if (phase !== 'pick') return;
    sound.playOops();
    setWobbleId(shapeId);
    setWobbleKey((k) => k + 1);
    voice('Good try! Try again!', 'अच्छी कोशिश! फिर से कोशिश करो!', 2200);
    setTimeout(() => setWobbleId(null), 550);
  };

  return (
    <div className="w-full max-w-3xl mx-auto select-none">
      <Edu2Styles />
      <TopBar title="Shape Sorter" emoji="🔷" onBack={onBack} score={score} streak={streak} />

      {/* Milo prompt + replay */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="edu2-float bg-white/95 border-3 border-violet-300 rounded-3xl px-5 py-2.5 shadow-lg">
          <p className="font-bubble font-extrabold text-xl md:text-2xl text-violet-900 text-center">
            🐰 Where does the <span className="text-fuchsia-600">{target.nameEn}</span> go? 👆
          </p>
        </div>
        <button
          onClick={() => {
            sound.playTap();
            speakKid(
              `Where does the ${target.nameEn} go? Tap the ${target.nameEn}!`,
              `${target.nameHi} कहाँ जाएगा? ${target.nameHi} को दबाओ!`
            );
          }}
          aria-label="Hear again"
          className="w-14 h-14 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg flex items-center justify-center active:scale-90 transition-transform"
        >
          <Volume2 className="w-7 h-7" />
        </button>
      </div>

      {/* Play area */}
      <div
        ref={areaRef}
        className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-gradient-to-b from-indigo-200 via-purple-100 to-pink-100 px-4 pt-6 pb-6 min-h-[430px]"
      >
        {/* The glowing shape hole */}
        <div className="flex justify-center mb-2">
          <div
            ref={holeRef}
            className="edu2-hole-glow relative w-44 h-44 md:w-52 md:h-52 rounded-full bg-white/70 border-8 border-dashed border-amber-400 flex items-center justify-center"
          >
            {phase === 'done' ? (
              <span key={`done-${round}`} className="edu2-pop-spring text-8xl md:text-9xl">
                {target.emoji}
              </span>
            ) : (
              <span className="text-8xl md:text-9xl opacity-25 grayscale">{target.emoji}</span>
            )}
            <span className="absolute -bottom-4 bg-amber-400 text-amber-950 font-bubble font-extrabold text-sm px-3 py-1 rounded-full shadow">
              {target.nameEn} hole 🕳️
            </span>
          </div>
        </div>

        <p className="font-bubble font-bold text-lg text-slate-600 text-center mt-6 mb-3">
          Tap the matching shape! 👇
        </p>

        {/* Shape buttons */}
        <div className="flex items-end justify-center gap-4 md:gap-6">
          {options.map((s) => (
            <button
              key={`${round}-${s.id}`}
              onClick={(e) =>
                s.id === target.id
                  ? handleCorrect(s, e.currentTarget)
                  : handleWrong(s.id)
              }
              disabled={phase !== 'pick'}
              aria-label={s.nameEn}
              className={`${wobbleId === s.id ? 'edu2-wobble' : ''} ${
                phase !== 'pick' && s.id === target.id ? 'opacity-40' : ''
              } w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-gradient-to-br ${s.btnGradient} border-4 border-white shadow-xl flex items-center justify-center text-6xl md:text-7xl active:scale-90 transition-transform hover:scale-105 disabled:cursor-default`}
            >
              <span key={wobbleId === s.id ? wobbleKey : 'idle'} className="edu2-float" style={{ animationDelay: `${Math.random()}s` }}>
                {s.emoji}
              </span>
            </button>
          ))}
        </div>

        {/* Flying shape */}
        {flying && (
          <span
            className="edu2-spring-x absolute z-20 text-7xl pointer-events-none"
            style={{
              left: flying.fromX,
              top: flying.fromY,
              transform: flying.go
                ? `translate(calc(-50% + ${flying.dx}px), calc(-50% + ${flying.dy}px)) scale(0.75)`
                : 'translate(-50%, -50%) scale(1)',
            }}
          >
            {flying.emoji}
          </span>
        )}

        <BurstLayer bursts={bursts} />
        {celebrate && <Celebrate message={celebrate} />}
      </div>
    </div>
  );
};

/* ============================ GAME 2 ============================ */
/* ------------------------- Fruit Catch 🍓 ------------------------- */

interface FruitDef {
  emoji: string;
  nameEn: string;
  nameHi: string;
}

const FRUITS: FruitDef[] = [
  { emoji: '🍎', nameEn: 'Apple', nameHi: 'सेब' },
  { emoji: '🍌', nameEn: 'Banana', nameHi: 'केला' },
  { emoji: '🍇', nameEn: 'Grapes', nameHi: 'अंगूर' },
  { emoji: '🍊', nameEn: 'Orange', nameHi: 'संतरा' },
  { emoji: '🍓', nameEn: 'Strawberry', nameHi: 'स्ट्रॉबेरी' },
  { emoji: '🥭', nameEn: 'Mango', nameHi: 'आम' },
];

interface FallItem {
  id: number;
  emoji: string;
  fruit: FruitDef | null;
  isStar: boolean;
  baseX: number;
  size: number;
}

interface FallRuntime {
  el: HTMLDivElement | null;
  y: number;
  vy: number;
  phase: number;
  amp: number;
  dead: boolean;
}

const AREA_H = 440;
const CATCH_Y = AREA_H - 96;
const BASKET_HALF = 58;

export const FruitCatchGame: React.FC<MiniGameProps> = ({ onBack, onGameComplete }) => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [items, setItems] = useState<FallItem[]>([]);
  const [splats, setSplats] = useState<Burst[]>([]);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [basketX, setBasketX] = useState(160);
  const [celebrate, setCelebrate] = useState<string | null>(null);

  const areaRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Map<number, FallRuntime>>(new Map());
  const itemEls = useRef<Map<number, HTMLDivElement>>(new Map());
  const basketXRef = useRef(160);
  const idRef = useRef(1);
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const doneRef = useRef(false);
  const rafRef = useRef(0);
  const lastTRef = useRef(0);
  const spawnAccRef = useRef(0);
  const widthRef = useRef(360);
  const missCountRef = useRef(0);
  const voice = useVoice();

  const addBurst = useCallback((x: number, y: number, emojis: string[]) => {
    const b = makeBurst(x, y, emojis);
    setBursts((prev) => [...prev, b]);
    setTimeout(() => setBursts((prev) => prev.filter((p) => p.id !== b.id)), 950);
  }, []);

  const addSplat = useCallback((x: number, y: number, emoji: string) => {
    const b = makeBurst(x, y, ['💦', emoji, '💦']);
    setSplats((prev) => [...prev, b]);
    setTimeout(() => setSplats((prev) => prev.filter((p) => p.id !== b.id)), 700);
  }, []);

  const gain = useCallback(
    (points: number, x: number, y: number, labelEn: string, labelHi: string, cheer: boolean) => {
      const ns = scoreRef.current + points;
      scoreRef.current = ns;
      setScore(ns);
      const nst = streakRef.current + 1;
      streakRef.current = nst;
      setStreak(nst);
      setBest((b) => Math.max(b, nst));
      if (cheer) {
        sound.playYay();
        addBurst(x, y, ['🎉', '⭐', '🎊', '🌟', '💖', '🎉']);
        speakKid(labelEn, labelHi);
      }
      if (ns % 5 === 0) {
        setTimeout(() => {
          sound.playFanfare();
          voice(`Woohoo! ${ns} points! You're amazing!`, `वाह! ${ns} अंक! तुम कमाल हो!`, 0);
        }, 700);
      }
      if (ns >= 10 && !doneRef.current) {
        doneRef.current = true;
        setCelebrate('Fruit-tastic! 10 Points! 🍓');
        sound.playLevelUp();
        setTimeout(() => {
          setCelebrate(null);
          onGameComplete?.();
        }, 2800);
      }
    },
    [addBurst, onGameComplete, voice]
  );

  const spawnItem = useCallback(() => {
    const W = widthRef.current;
    const isStar = Math.random() < 0.08;
    const fruit = FRUITS[Math.floor(Math.random() * FRUITS.length)];
    const id = idRef.current++;
    const item: FallItem = {
      id,
      emoji: isStar ? '⭐' : fruit.emoji,
      fruit: isStar ? null : fruit,
      isStar,
      baseX: 34 + Math.random() * Math.max(60, W - 68),
      size: isStar ? 56 : 44 + Math.random() * 14,
    };
    const vy = Math.min(400, 150 + scoreRef.current * 7);
    itemsRef.current.set(id, {
      el: null,
      y: -70,
      vy: vy * (0.9 + Math.random() * 0.25),
      phase: Math.random() * Math.PI * 2,
      amp: 14 + Math.random() * 22,
      dead: false,
    });
    setItems((prev) => [...prev.slice(-14), item]);
  }, []);

  const removeItem = useCallback((id: number) => {
    itemsRef.current.delete(id);
    itemEls.current.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  /* Silky RAF loop — all motion via translate3d on refs, no re-renders */
  useEffect(() => {
    const measure = () => {
      if (areaRef.current) {
        widthRef.current = areaRef.current.clientWidth;
        setBasketX((bx) => Math.min(Math.max(bx, BASKET_HALF), widthRef.current - BASKET_HALF));
        basketXRef.current = Math.min(Math.max(basketXRef.current, BASKET_HALF), widthRef.current - BASKET_HALF);
      }
    };
    measure();
    window.addEventListener('resize', measure);

    speakKid(
      'Catch the yummy fruits in your basket! Tap to move!',
      'टोकरी में मीठे फल पकड़ो! हिलाने के लिए दबाओ!'
    );
    sound.playPop();

    lastTRef.current = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - lastTRef.current) / 1000);
      lastTRef.current = t;

      // Spawn pacing ramps gently with score
      spawnAccRef.current += dt;
      const interval = Math.max(0.7, 1.35 - scoreRef.current * 0.03);
      if (spawnAccRef.current >= interval) {
        spawnAccRef.current = 0;
        spawnItem();
      }

      const bx = basketXRef.current;
      for (const [id, rt] of itemsRef.current) {
        if (rt.dead) continue;
        const el = itemEls.current.get(id);
        if (!el) continue;
        rt.y += rt.vy * dt;
        rt.phase += dt * 2.2;
        // Read baseX + meta stashed on the runtime when the item rendered
        const rx = (rt as FallRuntime & { bx0?: number }).bx0 ?? 0;
        const px = rx + Math.sin(rt.phase) * rt.amp;
        el.style.transform = `translate3d(${px}px, ${rt.y}px, 0)`;
        el.style.opacity = '1';

        // Catch?
        const meta0 = (rt as FallRuntime & { meta?: FallItem }).meta;
        const half = (meta0?.size ?? 52) / 2;
        const cx = px + half;
        if (rt.y > CATCH_Y - 46 && rt.y < CATCH_Y + 34 && Math.abs(cx - bx) < 74) {
          rt.dead = true;
          const meta = meta0;
          if (meta?.isStar) {
            sound.playFanfare();
            sound.playStarCollect();
            addBurst(cx, rt.y, ['⭐', '🌟', '✨', '💫', '⭐', '🎉']);
            gain(5, cx, rt.y, 'Golden star! Plus five!', 'सुनहरा तारा! पाँच अंक!', false);
            voice('Golden star! Amazing!', 'सुनहरा तारा! कमाल!', 1500);
          } else {
            sound.playPop();
            sound.playChirp();
            addBurst(cx, rt.y, ['💦', '✨', '💧', '🌟']);
            if (meta?.fruit) {
              gain(1, cx, rt.y, `${meta.fruit.nameEn}! Yummy!`, `${meta.fruit.nameHi}! मीठा!`, false);
              voice(`${meta.fruit.nameEn}!`, `${meta.fruit.nameHi}!`, 2400);
            } else {
              gain(1, cx, rt.y, 'Yummy!', 'मीठा!', false);
            }
          }
          removeItem(id);
        } else if (rt.y > AREA_H + 30) {
          // Gentle splat — no penalty, streak resets softly
          rt.dead = true;
          const meta = meta0;
          sound.playTap();
          addSplat(cx, AREA_H - 24, meta && !meta.isStar ? meta.emoji : '⭐');
          streakRef.current = 0;
          setStreak(0);
          missCountRef.current += 1;
          if (missCountRef.current % 6 === 0) {
            voice('Oops! Try to catch it!', 'उफ़! पकड़ने की कोशिश करो!', 0);
          }
          removeItem(id);
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', measure);
      sound.stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Attach baseX + meta onto runtime entries when items render */
  useEffect(() => {
    for (const it of items) {
      const rt = itemsRef.current.get(it.id);
      if (rt) {
        (rt as FallRuntime & { bx0?: number; meta?: FallItem }).bx0 = it.baseX;
        (rt as FallRuntime & { bx0?: number; meta?: FallItem }).meta = it;
      }
    }
  }, [items]);

  const moveBasket = (clientX: number) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(Math.max(clientX - rect.left, BASKET_HALF), widthRef.current - BASKET_HALF);
    basketXRef.current = x;
    setBasketX(x);
  };

  return (
    <div className="w-full max-w-3xl mx-auto select-none">
      <Edu2Styles />
      <TopBar title="Fruit Catch" emoji="🍓" onBack={onBack} score={score} streak={streak} />

      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="bg-white/95 border-3 border-amber-300 rounded-3xl px-5 py-2.5 shadow-lg">
          <p className="font-bubble font-extrabold text-xl text-amber-900 text-center">
            🧺 Tap to move the basket — catch the fruits! Best: 🔥x{best}
          </p>
        </div>
      </div>

      <div
        ref={areaRef}
        className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-100 cursor-pointer"
        style={{ height: AREA_H, touchAction: 'none' }}
        onPointerDown={(e) => {
          sound.playTap();
          moveBasket(e.clientX);
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (e.buttons > 0) moveBasket(e.clientX);
        }}
      >
        {/* Sun + clouds */}
        <div className="absolute top-3 left-4 text-5xl edu2-float">☀️</div>
        <div className="absolute top-6 right-10 text-4xl edu2-float" style={{ animationDelay: '0.7s' }}>☁️</div>
        <div className="absolute top-14 left-1/3 text-3xl edu2-float" style={{ animationDelay: '1.4s' }}>☁️</div>

        {/* Falling items — positioned by RAF via translate3d */}
        {items.map((it) => (
          <div
            key={it.id}
            ref={(el) => {
              if (el) {
                itemEls.current.set(it.id, el);
                const rt = itemsRef.current.get(it.id);
                if (rt) rt.el = el;
              } else {
                itemEls.current.delete(it.id);
              }
            }}
            className="absolute top-0 left-0 pointer-events-none"
            style={{ fontSize: it.size, willChange: 'transform', opacity: 0, lineHeight: 1 }}
          >
            <span className={it.isStar ? 'edu2-bob inline-block' : 'inline-block'}>{it.emoji}</span>
          </div>
        ))}

        {/* Basket — glides with spring transition */}
        <div
          className="edu2-glide absolute bottom-4 left-0 z-10 pointer-events-none"
          style={{ transform: `translate3d(${basketX - BASKET_HALF}px, 0, 0)`, willChange: 'transform' }}
        >
          <div className="text-7xl leading-none" style={{ width: BASKET_HALF * 2, textAlign: 'center' }}>
            🧺
          </div>
        </div>

        {/* Tap hint halves */}
        <div className="absolute bottom-4 left-3 text-3xl opacity-40 pointer-events-none">👈</div>
        <div className="absolute bottom-4 right-3 text-3xl opacity-40 pointer-events-none">👉</div>

        <BurstLayer bursts={bursts} />
        {/* Splat layer (gentler, smaller) */}
        <>
          {splats.map((b) => (
            <div key={b.id} className="absolute z-20 pointer-events-none" style={{ left: b.x, top: b.y }}>
              {b.emojis.map((e, i) => (
                <span key={i} className="edu2-splat absolute text-2xl" style={{ transform: 'translate(-50%,-50%)' }}>
                  {e}
                </span>
              ))}
            </div>
          ))}
        </>
        {celebrate && <Celebrate message={celebrate} sub="You're a fruit-catching champion!" />}
      </div>
    </div>
  );
};

/* ============================ GAME 3 ============================ */
/* ------------------------ Vehicle Parade 🚗 ----------------------- */

interface VehicleDef {
  id: string;
  emoji: string;
  nameEn: string;
  nameHi: string;
  cheerEn: string;
  cheerHi: string;
  mode: 'road' | 'sky' | 'sea';
  btnGradient: string;
}

const VEHICLES: VehicleDef[] = [
  { id: 'car', emoji: '🚗', nameEn: 'Car', nameHi: 'गाड़ी', cheerEn: 'Car! Beep beep!', cheerHi: 'गाड़ी! पीं पीं!', mode: 'road', btnGradient: 'from-red-300 to-rose-400' },
  { id: 'bus', emoji: '🚌', nameEn: 'Bus', nameHi: 'बस', cheerEn: 'Bus! Everyone hop in!', cheerHi: 'बस! सब चढ़ जाओ!', mode: 'road', btnGradient: 'from-amber-300 to-yellow-400' },
  { id: 'train', emoji: '🚂', nameEn: 'Train', nameHi: 'रेलगाड़ी', cheerEn: 'Train! Choo choo!', cheerHi: 'रेलगाड़ी! छुक छुक!', mode: 'road', btnGradient: 'from-slate-300 to-gray-400' },
  { id: 'plane', emoji: '✈️', nameEn: 'Plane', nameHi: 'हवाई जहाज', cheerEn: 'Plane! Whoosh, up in the sky!', cheerHi: 'हवाई जहाज! आसमान में!', mode: 'sky', btnGradient: 'from-sky-300 to-cyan-400' },
  { id: 'heli', emoji: '🚁', nameEn: 'Helicopter', nameHi: 'हेलीकॉप्टर', cheerEn: 'Helicopter! Whirr whirr!', cheerHi: 'हेलीकॉप्टर! घर्र घर्र!', mode: 'sky', btnGradient: 'from-teal-300 to-emerald-400' },
  { id: 'ship', emoji: '🚢', nameEn: 'Ship', nameHi: 'जहाज', cheerEn: 'Ship! Splish splash!', cheerHi: 'जहाज! छप छप!', mode: 'sea', btnGradient: 'from-blue-300 to-indigo-400' },
];

interface Runner {
  id: number;
  vehicle: VehicleDef;
  dur: number;
  go: boolean;
  laneTop: string;
  size: number;
}

const LANE: Record<VehicleDef['mode'], string> = {
  sky: 'top-8',
  sea: 'top-[46%]',
  road: 'bottom-20',
};

function vehicleSound(id: string) {
  switch (id) {
    case 'car':
      sound.playDrumKick();
      setTimeout(() => sound.playDrumKick(), 200);
      setTimeout(() => sound.playWhoosh(), 120);
      break;
    case 'bus':
      sound.playDrumKick();
      setTimeout(() => sound.playDrumSnare(), 220);
      setTimeout(() => sound.playWhoosh(), 300);
      break;
    case 'train':
      sound.playDrumHat();
      setTimeout(() => sound.playDrumHat(), 160);
      setTimeout(() => sound.playDrumHat(), 320);
      setTimeout(() => sound.playWhoosh(), 420);
      break;
    case 'plane':
      sound.playWhoosh();
      setTimeout(() => sound.playSparkle(), 350);
      break;
    case 'heli':
      sound.playDrumHat();
      setTimeout(() => sound.playDrumHat(), 130);
      setTimeout(() => sound.playDrumHat(), 260);
      setTimeout(() => sound.playDrumHat(), 390);
      setTimeout(() => sound.playWhoosh(), 300);
      break;
    case 'ship':
      sound.playDrumCymbal();
      setTimeout(() => sound.playDrumKick(), 250);
      setTimeout(() => sound.playBoing(), 500);
      break;
    default:
      sound.playWhoosh();
  }
}

export const VehicleParadeGame: React.FC<MiniGameProps> = ({ onBack, onGameComplete }) => {
  const [score, setScore] = useState(0);
  const [runners, setRunners] = useState<Runner[]>([]);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const areaRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef(600);
  const idRef = useRef(1);
  const doneRef = useRef(false);
  const paradeRef = useRef(false);
  const voice = useVoice();

  useEffect(() => {
    const measure = () => {
      if (areaRef.current) widthRef.current = areaRef.current.clientWidth;
    };
    measure();
    window.addEventListener('resize', measure);
    speakKid(
      'Tap a vehicle and watch it zoom across! Vroom vroom!',
      'गाड़ी दबाओ और उसे दौड़ते देखो! भ्रूम भ्रूम!'
    );
    return () => {
      window.removeEventListener('resize', measure);
      sound.stopSpeaking();
    };
  }, []);

  const addBurst = (x: number, y: number, emojis: string[]) => {
    const b = makeBurst(x, y, emojis);
    setBursts((prev) => [...prev, b]);
    setTimeout(() => setBursts((prev) => prev.filter((p) => p.id !== b.id)), 950);
  };

  const launch = useCallback(
    (v: VehicleDef) => {
      const id = idRef.current++;
      const dur = v.mode === 'sky' ? 2.6 : 3.2;
      const runner: Runner = {
        id,
        vehicle: v,
        dur,
        go: false,
        laneTop: LANE[v.mode],
        size: v.mode === 'sky' ? 64 : 76,
      };
      setRunners((prev) => [...prev.slice(-7), runner]);
      // Kick off the CSS transition on the next frames
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          setRunners((prev) => prev.map((r) => (r.id === id ? { ...r, go: true } : r)))
        )
      );
      setTimeout(() => setRunners((prev) => prev.filter((r) => r.id !== id)), dur * 1000 + 400);

      vehicleSound(v.id);
      voice(v.cheerEn, v.cheerHi, 1600);

      setScore((s) => {
        const ns = s + 1;
        if (ns % 6 === 0) {
          setTimeout(() => {
            sound.playFanfare();
            setCelebrate(`🎺 Parade time! ${ns} vehicles!`);
            const area = areaRef.current;
            if (area) {
              const a = area.getBoundingClientRect();
              addBurst(a.width / 2, a.height / 2, ['🎺', '🎉', '⭐', '🎊', '🥁', '✨']);
            }
            voice('Parade time! Look at them go!', 'परेड का समय! देखो कैसे जा रहे हैं!', 0);
            setTimeout(() => setCelebrate(null), 2600);
          }, 600);
        }
        if (ns >= 10 && !doneRef.current) {
          doneRef.current = true;
          setTimeout(() => {
            setCelebrate('Amazing! 10 Vehicles! 🏆');
            sound.playLevelUp();
            setTimeout(() => {
              setCelebrate(null);
              onGameComplete?.();
            }, 2800);
          }, 800);
        }
        return ns;
      });
    },
    [onGameComplete, voice]
  );

  const startParade = () => {
    if (paradeRef.current) return;
    paradeRef.current = true;
    sound.playDrumKick();
    voice('Parade time! Here they come!', 'परेड का समय! आ रहे हैं!', 0);
    VEHICLES.forEach((v, i) => {
      setTimeout(() => launch(v), i * 450);
    });
    setTimeout(() => {
      paradeRef.current = false;
    }, VEHICLES.length * 450 + 500);
    // Musical drum-line under the parade
    VEHICLES.forEach((_, i) => {
      setTimeout(() => (i % 2 === 0 ? sound.playDrumKick() : sound.playDrumSnare()), i * 450);
    });
    setTimeout(() => sound.playDrumCymbal(), VEHICLES.length * 450);
  };

  return (
    <div className="w-full max-w-3xl mx-auto select-none">
      <Edu2Styles />
      <TopBar title="Vehicle Parade" emoji="🚗" onBack={onBack} score={score} />

      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="bg-white/95 border-3 border-sky-300 rounded-3xl px-5 py-2.5 shadow-lg">
          <p className="font-bubble font-extrabold text-xl text-sky-900 text-center">
            Tap a vehicle — vroom vroom! 💨
          </p>
        </div>
        <button
          onClick={startParade}
          aria-label="Start parade"
          className="edu2-pop-spring shrink-0 h-16 px-5 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 border-4 border-white shadow-xl flex items-center gap-2 active:scale-90 transition-transform"
        >
          <span className="text-4xl">🎺</span>
          <span className="font-bubble font-extrabold text-xl text-white">Parade!</span>
        </button>
      </div>

      {/* Road scene */}
      <div
        ref={areaRef}
        className="relative rounded-3xl overflow-hidden shadow-xl border-4 border-white h-[380px] bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-200"
      >
        {/* Sky decor */}
        <div className="absolute top-2 left-6 text-4xl edu2-float">☀️</div>
        <div className="absolute top-4 right-16 text-3xl edu2-float" style={{ animationDelay: '1s' }}>☁️</div>
        {/* Sea band */}
        <div className="absolute left-0 right-0 top-[42%] h-[26%] bg-gradient-to-b from-cyan-300 to-blue-400 opacity-90">
          <div className="absolute top-2 left-10 text-3xl edu2-float">🌊</div>
          <div className="absolute top-3 right-24 text-3xl edu2-float" style={{ animationDelay: '0.9s' }}>🌊</div>
        </div>
        {/* Road band */}
        <div className="absolute left-0 right-0 bottom-0 h-[104px] bg-slate-700">
          <div className="absolute top-1/2 left-0 right-0 border-t-8 border-dashed border-amber-300 -translate-y-1/2" />
        </div>

        {/* Runners — GPU transform transition across the scene */}
        {runners.map((r) => (
          <div
            key={r.id}
            className={`absolute ${r.laneTop} left-0 z-10 pointer-events-none`}
            style={{ willChange: 'transform' }}
          >
            <div
              className="edu2-spring-x"
              style={{
                transform: r.go
                  ? `translate3d(${widthRef.current + 320}px, 0, 0)`
                  : 'translate3d(-160px, 0, 0)',
                transitionProperty: 'transform',
                transitionDuration: `${r.dur}s`,
                transitionTimingFunction: 'linear',
                willChange: 'transform',
              }}
            >
              <span
                className={r.vehicle.mode === 'sky' ? 'edu2-bob inline-block' : r.vehicle.mode === 'sea' ? 'edu2-rock inline-block' : 'inline-block'}
                style={{ fontSize: r.size, lineHeight: 1 }}
              >
                {r.vehicle.emoji}
              </span>
              {/* little emoji trail */}
              <span className="edu2-puff absolute -left-8 top-1/2 text-3xl" style={{ animationDelay: '0.15s' }}>💨</span>
              <span className="edu2-puff absolute -left-14 top-1/3 text-2xl">💨</span>
            </div>
          </div>
        ))}

        <BurstLayer bursts={bursts} />
        {celebrate && <Celebrate message={celebrate} />}
      </div>

      {/* Vehicle buttons */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {VEHICLES.map((v, i) => (
          <button
            key={v.id}
            onClick={() => launch(v)}
            aria-label={v.nameEn}
            className={`min-h-[96px] rounded-3xl bg-gradient-to-br ${v.btnGradient} border-4 border-white shadow-xl flex flex-col items-center justify-center gap-1 active:scale-90 transition-transform hover:scale-105`}
          >
            <span className="text-6xl edu2-float" style={{ animationDelay: `${i * 0.25}s` }}>
              {v.emoji}
            </span>
            <span className="font-bubble font-extrabold text-lg text-white drop-shadow">{v.nameEn}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ------------------------- Registry ------------------------- */

export const EDU2_GAMES: Record<
  string,
  { name: string; emoji: string; instructions: { en: string; hi: string } }
> = {
  shapes: {
    name: 'Shape Sorter',
    emoji: '🔷',
    instructions: {
      en: 'Where does the shape go? Tap the matching shape and watch it fly into the hole!',
      hi: 'आकार कहाँ जाएगा? मिलता-जुलता आकार दबाओ और उसे छेद में उड़ते देखो!',
    },
  },
  fruitcatch: {
    name: 'Fruit Catch',
    emoji: '🍓',
    instructions: {
      en: 'Move the basket and catch the yummy falling fruits! Grab the golden star for bonus points!',
      hi: 'टोकरी हिलाओ और गिरते मीठे फल पकड़ो! सुनहरा तारा पकड़ो और बोनस पाओ!',
    },
  },
  vehicles: {
    name: 'Vehicle Parade',
    emoji: '🚗',
    instructions: {
      en: 'Tap a vehicle and watch it zoom across! Press the trumpet for a full parade!',
      hi: 'गाड़ी दबाओ और उसे दौड़ते देखो! पूरी परेड के लिए तुरही दबाओ!',
    },
  },
};
