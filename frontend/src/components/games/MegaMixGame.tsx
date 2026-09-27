import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { sound } from '../../audio/soundEngine';
import { speakKid } from '../../audio/speakKid';

export interface MiniGameProps {
  onBack: () => void;
  onGameComplete?: () => void;
}

/* ------------------------------------------------------------------ */
/* Toy box — reuses the repo's VisualObject-style data from the lesson */
/* games (CountingGame, ColorSort, ObjectSelection)                    */
/* ------------------------------------------------------------------ */

type ToyColor = 'red' | 'blue' | 'yellow' | 'green';

interface Toy {
  id: string;
  icon: string;
  en: string;
  hi: string;
  color: ToyColor;
  colorHi: string;
}

const COLOR_META: Record<ToyColor, { hex: string; en: string; hi: string; gradient: string }> = {
  red: { hex: '#EF4444', en: 'red', hi: 'लाल', gradient: 'from-red-400 to-rose-500' },
  blue: { hex: '#3B82F6', en: 'blue', hi: 'नीला', gradient: 'from-blue-400 to-indigo-500' },
  yellow: { hex: '#EAB308', en: 'yellow', hi: 'पीला', gradient: 'from-amber-300 to-yellow-500' },
  green: { hex: '#22C55E', en: 'green', hi: 'हरा', gradient: 'from-emerald-400 to-green-500' },
};

const TOY_BOX: Toy[] = [
  { id: 'apple', icon: '🍎', en: 'apple', hi: 'सेब', color: 'red', colorHi: 'लाल' },
  { id: 'balloon', icon: '🎈', en: 'balloon', hi: 'गुब्बारा', color: 'red', colorHi: 'लाल' },
  { id: 'car', icon: '🚗', en: 'car', hi: 'गाड़ी', color: 'red', colorHi: 'लाल' },
  { id: 'strawberry', icon: '🍓', en: 'strawberry', hi: 'स्ट्रॉबेरी', color: 'red', colorHi: 'लाल' },
  { id: 'dolphin', icon: '🐬', en: 'dolphin', hi: 'डॉल्फिन', color: 'blue', colorHi: 'नीला' },
  { id: 'drop', icon: '💧', en: 'water drop', hi: 'पानी की बूंद', color: 'blue', colorHi: 'नीला' },
  { id: 'butterfly', icon: '🦋', en: 'butterfly', hi: 'तितली', color: 'blue', colorHi: 'नीला' },
  { id: 'whale', icon: '🐳', en: 'whale', hi: 'व्हेल', color: 'blue', colorHi: 'नीला' },
  { id: 'banana', icon: '🍌', en: 'banana', hi: 'केला', color: 'yellow', colorHi: 'पीला' },
  { id: 'star', icon: '⭐', en: 'star', hi: 'तारा', color: 'yellow', colorHi: 'पीला' },
  { id: 'chick', icon: '🐤', en: 'baby chick', hi: 'चूज़ा', color: 'yellow', colorHi: 'पीला' },
  { id: 'sunflower', icon: '🌻', en: 'sunflower', hi: 'सूरजमुखी', color: 'yellow', colorHi: 'पीला' },
  { id: 'greenapple', icon: '🍏', en: 'green apple', hi: 'हरा सेब', color: 'green', colorHi: 'हरा' },
  { id: 'turtle', icon: '🐢', en: 'turtle', hi: 'कछुआ', color: 'green', colorHi: 'हरा' },
  { id: 'frog', icon: '🐸', en: 'frog', hi: 'मेंढक', color: 'green', colorHi: 'हरा' },
  { id: 'clover', icon: '🍀', en: 'clover', hi: 'तिपतिया', color: 'green', colorHi: 'हरा' },
];

const NUMBER_WORDS: { en: string; hi: string }[] = [
  { en: 'zero', hi: 'शून्य' },
  { en: 'one', hi: 'एक' },
  { en: 'two', hi: 'दो' },
  { en: 'three', hi: 'तीन' },
  { en: 'four', hi: 'चार' },
  { en: 'five', hi: 'पाँच' },
  { en: 'six', hi: 'छह' },
];

type RoundKind = 'count' | 'sort' | 'find';

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ------------------------------------------------------------------ */
/* Shared bits: top bar, bursts, celebration                           */
/* ------------------------------------------------------------------ */

interface Burst {
  id: number;
  x: number; // px relative to play area
  y: number;
  emoji: string;
}

const useBursts = () => {
  const [bursts, setBursts] = useState<Burst[]>([]);
  const idRef = useRef(1);
  const burst = (x: number, y: number, emoji = '✨') => {
    const id = idRef.current++;
    setBursts((p) => [...p.slice(-14), { id, x, y, emoji }]);
    window.setTimeout(() => setBursts((p) => p.filter((b) => b.id !== id)), 550);
  };
  const burstEls = (
    <>
      {bursts.map((b) => (
        <div
          key={b.id}
          className="absolute text-4xl pointer-events-none animate-burst-pop z-30"
          style={{ left: b.x, top: b.y }}
        >
          {b.emoji}
        </div>
      ))}
    </>
  );
  return { burst, burstEls };
};

const TopBar: React.FC<{ onBack: () => void; score: number; streak: number; level: number }> = ({
  onBack,
  score,
  streak,
  level,
}) => (
  <div className="w-full flex items-center justify-between mb-3 select-none">
    <button
      onClick={() => {
        sound.playPop();
        sound.stopSpeaking();
        onBack();
      }}
      className="flex items-center gap-2 bg-white/90 hover:bg-white text-slate-700 px-4 py-2.5 rounded-2xl shadow-md border-2 border-sky-200 active:scale-95 transition-transform"
    >
      <ArrowLeft className="w-6 h-6 text-sky-500" />
      <span className="font-bubble font-bold text-lg">Games</span>
    </button>
    <div className="flex items-center gap-2">
      {streak >= 3 && (
        <div className="bg-orange-100 border-2 border-orange-300 px-3 py-2 rounded-full shadow animate-wiggle">
          <span className="font-bubble font-extrabold text-lg text-orange-700">🔥 {streak}</span>
        </div>
      )}
      <div className="bg-violet-100 border-2 border-violet-300 px-3 py-2 rounded-full shadow">
        <span className="font-bubble font-extrabold text-lg text-violet-700">Lv {level}</span>
      </div>
      <div className="flex items-center gap-2 bg-amber-100 border-2 border-amber-300 px-4 py-2 rounded-full shadow">
        <span className="text-2xl">⭐</span>
        <span className="font-bubble font-extrabold text-2xl text-amber-900">{score}</span>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Milo's Mega Mix — the game                                          */
/* ------------------------------------------------------------------ */

const ROUND_ORDER: RoundKind[] = ['count', 'sort', 'find'];

export const MegaMixGame: React.FC<MiniGameProps> = ({ onBack, onGameComplete }) => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [roundsDone, setRoundsDone] = useState(0);
  const [roundKind, setRoundKind] = useState<RoundKind>('count');
  const [roundKey, setRoundKey] = useState(0); // bump to regenerate a round
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [roundIntro, setRoundIntro] = useState(true);
  const { burst, burstEls } = useBursts();
  const areaRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef(0);
  const completeFiredRef = useRef(false);
  const streakRef = useRef(0);

  const level = Math.floor(roundsDone / 6) + 1;

  const posOf = (e: React.MouseEvent) => {
    const r = areaRef.current?.getBoundingClientRect();
    if (!r) return { x: 80, y: 80 };
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const addScore = (pts: number) => {
    const n = scoreRef.current + pts;
    scoreRef.current = n;
    setScore(n);
    const s = streakRef.current + 1;
    streakRef.current = s;
    setStreak(s);
    if (s > 0 && s % 5 === 0) {
      sound.playLevelUp();
      speakKid(
        `Wow! ${s} in a row! You're on fire!`,
        `वाह! लगातार ${s}! तुम कमाल कर रहे हो!`
      );
    }
    if (n >= 30 && !completeFiredRef.current) {
      completeFiredRef.current = true;
      sound.playFanfare();
      sound.playJingle('win');
      onGameComplete?.();
    }
  };

  const miss = () => {
    streakRef.current = 0;
    setStreak(0);
    sound.playOops();
  };

  const finishRound = () => {
    const done = roundsDone + 1;
    setRoundsDone(done);
    sound.playSuccessChime();
    // Level up every 6 rounds — faster, more items, bigger cheers
    if (done % 6 === 0) {
      setShowLevelUp(true);
      sound.playFanfare();
      sound.playJingle('levelup');
      speakKid(
        `Level ${Math.floor(done / 6) + 1}! You're a superstar!`,
        `लेवल ${Math.floor(done / 6) + 1}! तुम सुपरस्टार हो!`
      );
      window.setTimeout(() => setShowLevelUp(false), 2400);
    }
    window.setTimeout(() => {
      setRoundKind(ROUND_ORDER[done % ROUND_ORDER.length]);
      setRoundKey((k) => k + 1);
      setRoundIntro(true);
      window.setTimeout(() => setRoundIntro(false), 1400);
    }, 900);
  };

  // Intro voice for each round
  useEffect(() => {
    const intros: Record<RoundKind, { en: string; hi: string }> = {
      count: {
        en: 'Counting time! Tap each toy and count with me!',
        hi: 'गिनती का समय! हर खिलौने को छुओ और मेरे साथ गिनो!',
      },
      sort: {
        en: 'Sorting time! Put each toy in its color home!',
        hi: 'छँटाई का समय! हर खिलौने को उसके रंग के घर में रखो!',
      },
      find: {
        en: 'Finding time! Listen carefully and tap what I ask for!',
        hi: 'खोज का समय! ध्यान से सुनो और वही छुओ जो मैं कहूँ!',
      },
    };
    speakKid(intros[roundKind].en, intros[roundKind].hi);
    const t = window.setTimeout(() => setRoundIntro(false), 1400);
    return () => {
      window.clearTimeout(t);
      sound.stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundKind, roundKey]);

  return (
    <div className="w-full max-w-4xl mx-auto select-none">
      <TopBar onBack={onBack} score={score} streak={streak} level={level} />
      <div
        ref={areaRef}
        className="relative overflow-hidden rounded-3xl border-4 border-white shadow-2xl bg-gradient-to-br from-fuchsia-200 via-violet-100 to-sky-200 min-h-[64vh] p-4 md:p-6"
      >
        {burstEls}
        {roundIntro && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/60 backdrop-blur-[2px] pointer-events-none">
            <div className="animate-pop-in bg-white rounded-3xl border-4 border-violet-300 shadow-2xl px-8 py-6 text-center">
              <div className="text-7xl mb-2 animate-bounce-subtle">
                {roundKind === 'count' ? '🔢' : roundKind === 'sort' ? '🎨' : '🔍'}
              </div>
              <p className="font-bubble font-extrabold text-3xl text-violet-800">
                {roundKind === 'count'
                  ? 'Counting Time!'
                  : roundKind === 'sort'
                    ? 'Sorting Time!'
                    : 'Finding Time!'}
              </p>
            </div>
          </div>
        )}
        {showLevelUp && (
          <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
            <div className="animate-pop-in text-center">
              <div className="text-8xl animate-bounce">🏆</div>
              <p className="font-bubble font-extrabold text-5xl text-amber-500 drop-shadow-lg">
                LEVEL {level}!
              </p>
            </div>
          </div>
        )}
        {roundKind === 'count' && (
          <CountRound
            key={roundKey}
            level={level}
            onHit={(x, y) => {
              burst(x, y, '✨');
              addScore(1);
            }}
            onMiss={(x, y) => {
              burst(x, y, '💛');
              miss();
            }}
            onDone={finishRound}
            posOf={posOf}
          />
        )}
        {roundKind === 'sort' && (
          <SortRound
            key={roundKey}
            level={level}
            onHit={(x, y) => {
              burst(x, y, '🎉');
              addScore(2);
            }}
            onMiss={() => miss()}
            onDone={finishRound}
            posOf={posOf}
          />
        )}
        {roundKind === 'find' && (
          <FindRound
            key={roundKey}
            level={level}
            onHit={(x, y) => {
              burst(x, y, '⭐');
              addScore(2);
            }}
            onMiss={() => miss()}
            onDone={finishRound}
            posOf={posOf}
          />
        )}
      </div>
      <p className="font-bubble text-slate-500 mt-2 text-center">
        Count, sort and find — every round makes you smarter! 🧠✨
      </p>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Round 1 — Count & Pop (from the repo's CountingGame mechanic)       */
/* ------------------------------------------------------------------ */

interface RoundProps {
  level: number;
  onHit: (x: number, y: number) => void;
  onMiss: (x: number, y: number) => void;
  onDone: () => void;
  posOf: (e: React.MouseEvent) => { x: number; y: number };
}

const CountRound: React.FC<RoundProps> = ({ level, onHit, onMiss, onDone, posOf }) => {
  const count = Math.min(2 + Math.floor(level / 2) + (Math.random() < 0.5 ? 1 : 0), 6);
  const [toy] = useState<Toy>(() => pick(TOY_BOX));
  const [tapped, setTapped] = useState<boolean[]>(() => Array(count).fill(false));
  const [phase, setPhase] = useState<'tap' | 'choose'>('tap');
  const [options] = useState<number[]>(() =>
    shuffle([...new Set([count, ...Array.from({ length: 4 }, () => 1 + Math.floor(Math.random() * 6))])]).slice(0, 4).sort((a, b) => a - b)
  );
  const tappedCount = tapped.filter(Boolean).length;

  const handleTapItem = (i: number, e: React.MouseEvent) => {
    if (tapped[i]) return;
    const p = posOf(e);
    const next = [...tapped];
    next[i] = true;
    setTapped(next);
    sound.playPop();
    const n = next.filter(Boolean).length;
    const w = NUMBER_WORDS[Math.min(n, 6)];
    speakKid(w.en, w.hi);
    onHit(p.x, p.y);
    if (n === count) {
      window.setTimeout(() => {
        setPhase('choose');
        speakKid(
          `How many ${toy.en}s? Tap the right number!`,
          `कितने ${toy.hi}? सही नंबर दबाओ!`
        );
      }, 900);
    }
  };

  const handleChoose = (num: number, e: React.MouseEvent) => {
    const p = posOf(e);
    if (num === count) {
      sound.playYay();
      speakKid(
        `Yes! ${NUMBER_WORDS[count].en}! Great counting!`,
        `हाँ! ${NUMBER_WORDS[count].hi}! बहुत बढ़िया गिनती!`
      );
      onHit(p.x, p.y);
      window.setTimeout(onDone, 1100);
    } else {
      const q = posOf(e);
      onMiss(q.x, q.y);
      speakKid('Good try! Count again!', 'अच्छा प्रयास! फिर से गिनो!');
    }
  };

  return (
    <div className="flex flex-col items-center animate-pop-in">
      <p className="font-bubble font-extrabold text-2xl md:text-3xl text-violet-900 text-center mb-4">
        {phase === 'tap'
          ? `Tap each ${toy.icon} and count! (${tappedCount}/${count})`
          : `How many ${toy.icon} did you tap?`}
      </p>
      {phase === 'tap' ? (
        <div className="flex flex-wrap gap-4 md:gap-6 justify-center max-w-2xl">
          {tapped.map((t, i) => (
            <button
              key={i}
              onClick={(e) => handleTapItem(i, e)}
              disabled={t}
              className={`w-24 h-24 md:w-28 md:h-28 rounded-3xl border-4 shadow-xl flex items-center justify-center text-6xl md:text-7xl transition-all active:scale-90 ${
                t
                  ? 'bg-emerald-100 border-emerald-400 scale-95 opacity-70'
                  : 'bg-white border-violet-300 hover:scale-110 hover:border-violet-500 animate-float'
              }`}
              style={{ animationDelay: `${i * 0.15}s` }}
              aria-label={`${toy.en} ${i + 1}`}
            >
              <span className={t ? 'grayscale' : ''}>{toy.icon}</span>
              {t && <span className="absolute text-3xl">✅</span>}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex gap-3 md:gap-5 justify-center flex-wrap">
          {options.map((num) => (
            <button
              key={num}
              onClick={(e) => handleChoose(num, e)}
              className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-amber-300 to-orange-400 border-4 border-white shadow-xl font-bubble font-extrabold text-4xl md:text-5xl text-white hover:scale-110 active:scale-95 transition-transform animate-pop-in"
            >
              {num}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Round 2 — Color Carnival Sort (from the repo's ColorSort mechanic)   */
/* ------------------------------------------------------------------ */

const SortRound: React.FC<RoundProps> = ({ level, onHit, onMiss, onDone, posOf }) => {
  const queueSize = Math.min(4 + Math.floor(level / 2), 6);
  const [queue, setQueue] = useState<Toy[]>(() => shuffle(TOY_BOX).slice(0, queueSize));
  const [selected, setSelected] = useState<Toy | null>(null);
  const [sorted, setSorted] = useState<Record<string, Toy[]>>({ red: [], blue: [], yellow: [], green: [] });
  const [flying, setFlying] = useState<{ toy: Toy; x: number; y: number } | null>(null);

  const colors = Object.keys(COLOR_META) as ToyColor[];

  const handleToyTap = (toy: Toy, e: React.MouseEvent) => {
    sound.playPop();
    setSelected(toy);
    const p = posOf(e);
    speakKid(
      `Where does the ${COLOR_META[toy.color].en} ${toy.en} go?`,
      `${toy.colorHi} ${toy.hi} कहाँ जाएगा?`
    );
    void p;
  };

  const handleChestTap = (color: ToyColor, e: React.MouseEvent) => {
    if (!selected) {
      speakKid('First tap a toy!', 'पहले एक खिलौना दबाओ!');
      return;
    }
    const p = posOf(e);
    if (selected.color === color) {
      const toy = selected;
      setFlying({ toy, x: p.x, y: p.y });
      sound.playWhoosh();
      window.setTimeout(() => {
        setSorted((s) => ({ ...s, [color]: [...s[color], toy] }));
        setQueue((q) => q.filter((t) => t.id !== toy.id));
        setSelected(null);
        setFlying(null);
        sound.playSparkle();
        speakKid(
          `Yay! The ${toy.en} is home!`,
          `ये! ${toy.hi} घर पहुँच गया!`
        );
        onHit(p.x, p.y);
        if (queue.length - 1 === 0) {
          window.setTimeout(onDone, 1100);
        }
      }, 450);
    } else {
      onMiss(p.x, p.y);
      sound.playGentleEncouragement();
      speakKid(
        `Oops! The ${selected.en} is ${COLOR_META[selected.color].en}, not ${COLOR_META[color].en}!`,
        `अरे! ${selected.hi} ${COLOR_META[selected.color].hi} है, ${COLOR_META[color].hi} नहीं!`
      );
    }
  };

  return (
    <div className="flex flex-col items-center animate-pop-in">
      <p className="font-bubble font-extrabold text-2xl md:text-3xl text-violet-900 text-center mb-4">
        {selected
          ? `Tap the ${COLOR_META[selected.color].en} home! 🏠`
          : 'Tap a toy, then its color home! 🎨'}
      </p>

      {/* Toy shelf */}
      <div className="flex flex-wrap gap-3 md:gap-4 justify-center mb-6 min-h-[110px]">
        {queue.map((toy) => (
          <button
            key={toy.id}
            onClick={(e) => handleToyTap(toy, e)}
            className={`w-20 h-20 md:w-24 md:h-24 rounded-3xl border-4 bg-white shadow-lg flex items-center justify-center text-5xl md:text-6xl transition-all active:scale-90 ${
              selected?.id === toy.id
                ? 'border-amber-400 scale-110 ring-4 ring-amber-300 animate-wiggle'
                : 'border-slate-200 hover:scale-105 hover:border-violet-300'
            }`}
            aria-label={toy.en}
          >
            {toy.icon}
          </button>
        ))}
        {queue.length === 0 && (
          <p className="font-bubble font-extrabold text-2xl text-emerald-600 animate-bounce-subtle">
            All sorted! 🎉
          </p>
        )}
      </div>

      {/* Color homes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 w-full max-w-2xl">
        {colors.map((color) => {
          const meta = COLOR_META[color];
          return (
            <button
              key={color}
              onClick={(e) => handleChestTap(color, e)}
              className={`rounded-3xl border-4 border-white shadow-xl p-3 flex flex-col items-center gap-1 bg-gradient-to-br ${meta.gradient} hover:scale-105 active:scale-95 transition-transform min-h-[120px] justify-center`}
            >
              <span className="text-5xl">🏠</span>
              <span className="font-bubble font-extrabold text-white text-lg drop-shadow">
                {meta.en} {meta.hi}
              </span>
              <span className="font-bubble font-bold text-white/90 text-sm">
                {sorted[color].length > 0 ? sorted[color].map((t) => t.icon).join(' ') : 'empty'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Flying toy */}
      {flying && (
        <div
          className="fixed text-6xl z-50 pointer-events-none transition-all duration-500"
          style={{ left: flying.x - 30, top: flying.y - 30, transform: 'scale(0.4)', opacity: 0.9 }}
        >
          {flying.toy.icon}
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Round 3 — Find It! (from the repo's ObjectSelection mechanic)       */
/* ------------------------------------------------------------------ */

const FindRound: React.FC<RoundProps> = ({ level, onHit, onMiss, onDone, posOf }) => {
  const gridSize = Math.min(4 + Math.floor(level / 2), 6);
  const [choices] = useState<Toy[]>(() => shuffle(TOY_BOX).slice(0, gridSize));
  const [found, setFound] = useState(false);
  const [wrongId, setWrongId] = useState<string | null>(null);

  // Pick target after choices exist
  const [targetToy] = useState<Toy>(() => choices[Math.floor(Math.random() * choices.length)]);

  useEffect(() => {
    speakKid(
      `Where is the ${COLOR_META[targetToy.color].en} ${targetToy.en}? Tap it!`,
      `${targetToy.colorHi} ${targetToy.hi} कहाँ है? उसे दबाओ!`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTap = (toy: Toy, e: React.MouseEvent) => {
    if (found) return;
    const p = posOf(e);
    if (toy.id === targetToy.id) {
      setFound(true);
      sound.playYay();
      speakKid(
        `You found the ${toy.en}! Amazing eyes!`,
        `तुमने ${toy.hi} खोज लिया! क्या नज़र है!`
      );
      onHit(p.x, p.y);
      window.setTimeout(onDone, 1200);
    } else {
      setWrongId(toy.id);
      window.setTimeout(() => setWrongId(null), 600);
      onMiss(p.x, p.y);
      speakKid(
        `Good try! That's a ${toy.en}. Find the ${targetToy.en}!`,
        `अच्छा प्रयास! यह ${toy.hi} है। ${targetToy.hi} खोजो!`
      );
    }
  };

  const handleHearAgain = () => {
    sound.playPop();
    speakKid(
      `Where is the ${COLOR_META[targetToy.color].en} ${targetToy.en}?`,
      `${targetToy.colorHi} ${targetToy.hi} कहाँ है?`
    );
  };

  return (
    <div className="flex flex-col items-center animate-pop-in">
      <button
        onClick={handleHearAgain}
        className="mb-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bubble font-extrabold text-xl md:text-2xl px-6 py-3 rounded-3xl border-4 border-white shadow-xl hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
      >
        <span className="text-3xl">🔊</span>
        <span>
          Find the {COLOR_META[targetToy.color].en} {targetToy.en}!
        </span>
      </button>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-5 justify-items-center">
        {choices.map((toy, i) => (
          <button
            key={toy.id}
            onClick={(e) => handleTap(toy, e)}
            className={`w-28 h-28 md:w-36 md:h-36 rounded-3xl border-4 bg-white shadow-xl flex items-center justify-center text-6xl md:text-7xl transition-all active:scale-90 animate-pop-in ${
              found && toy.id === targetToy.id
                ? 'border-emerald-400 ring-8 ring-emerald-300 scale-110'
                : wrongId === toy.id
                  ? 'border-rose-400 animate-wiggle'
                  : 'border-slate-200 hover:scale-105 hover:border-violet-300'
            }`}
            style={{ animationDelay: `${i * 0.08}s` }}
            aria-label={toy.en}
          >
            {toy.icon}
          </button>
        ))}
      </div>
      {found && (
        <p className="mt-4 font-bubble font-extrabold text-2xl text-emerald-600 animate-bounce-subtle">
          Found it! 🎉
        </p>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Registry for the games hub                                          */
/* ------------------------------------------------------------------ */

export const MEGAMIX_GAME_INFO = {
  name: 'Mega Mix',
  emoji: '🎪',
  instructions: {
    en: 'Count the toys, sort them by color, and find what Milo asks for! New surprise every round!',
    hi: 'खिलौने गिनो, रंग से छाँटो, और मीलो जो कहे उसे खोजो! हर राउंड में नया मज़ा!',
  },
};
