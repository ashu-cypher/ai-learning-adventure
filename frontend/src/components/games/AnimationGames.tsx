import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../../audio/soundEngine';
import { ArrowLeft } from 'lucide-react';

interface AnimGameProps {
  onBack: () => void;
  onGameComplete?: () => void;
}

/* ---------- Shared bits ---------- */

const TopBar: React.FC<{ title: string; onBack: () => void; score: number }> = ({
  title,
  onBack,
  score,
}) => (
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
    <div className="flex items-center gap-2 bg-amber-100 border-2 border-amber-300 px-4 py-2 rounded-full shadow">
      <span className="text-2xl">⭐</span>
      <span className="font-bubble font-extrabold text-2xl text-amber-900">{score}</span>
    </div>
  </div>
);

const Celebrate: React.FC<{ message: string }> = ({ message }) => (
  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 rounded-3xl pointer-events-none animate-fade-in">
    <div className="text-7xl mb-2 animate-bounce">🎉</div>
    <p className="font-bubble font-extrabold text-3xl md:text-4xl text-white text-center px-6 drop-shadow-lg">
      {message}
    </p>
    <div className="text-5xl mt-2">⭐🎊⭐</div>
  </div>
);

interface FloatItem {
  id: number;
  x: number;
  size: number;
  /** seconds for the full CSS rise/fall journey */
  duration: number;
  color?: string;
}

interface Burst {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

/* ---------- Bubble Pop ---------- */

const BUBBLE_GOAL = 20;

export const BubblePopGame: React.FC<AnimGameProps> = ({ onBack, onGameComplete }) => {
  const [bubbles, setBubbles] = useState<FloatItem[]>([]);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [score, setScore] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const idRef = useRef(1);
  const scoreRef = useRef(0);
  const doneRef = useRef(false);
  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sound.speak('Pop pop pop! Tap the bubbles before they float away!');
    const spawn = setInterval(() => {
      const id = idRef.current++;
      // Slower duration = slower bubble. GPU CSS animation does the moving.
      const duration = 5 + Math.random() * 4;
      setBubbles((prev) => [
        ...prev.slice(-13),
        { id, x: 4 + Math.random() * 84, size: 44 + Math.random() * 48, duration },
      ]);
    }, 650);
    return () => clearInterval(spawn);
  }, []);

  const removeBubble = (id: number) => {
    setBubbles((prev) => prev.filter((p) => p.id !== id));
  };

  const popBubble = (b: FloatItem, e: React.MouseEvent) => {
    removeBubble(b.id);
    const burstId = idRef.current++;
    // Burst exactly where the little finger tapped
    const area = areaRef.current?.getBoundingClientRect();
    const t = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const bx = area ? ((t.left + t.width / 2 - area.left) / area.width) * 100 : b.x;
    const by = area ? ((t.top + t.height / 2 - area.top) / area.height) * 100 : 50;
    setBursts((prev) => [...prev, { id: burstId, x: bx, y: by, emoji: '💥' }]);
    setTimeout(() => {
      setBursts((prev) => prev.filter((z) => z.id !== burstId));
    }, 500);
    sound.playPop();
    const n = scoreRef.current + 1;
    scoreRef.current = n;
    setScore(n);
    if (n >= BUBBLE_GOAL && !doneRef.current) {
      doneRef.current = true;
      setCelebrate(true);
      sound.playFanfare();
      sound.speak('Pop pop hooray! You popped so many bubbles!');
      onGameComplete?.();
      setTimeout(() => setCelebrate(false), 3000);
    } else if (n === 10) {
      sound.playSuccessChime();
      sound.speak('Wow! So many pops! Keep going!');
    }
  };

  return (
    <div className="w-full flex flex-col items-center animate-fade-in select-none">
      <TopBar title="🫧 Bubble Pop" onBack={onBack} score={score} />
      <div
        ref={areaRef}
        className="relative w-full h-[420px] md:h-[480px] rounded-3xl border-4 border-sky-300 shadow-xl overflow-hidden bg-gradient-to-b from-sky-200 via-cyan-100 to-sky-100"
      >
        <p className="absolute top-3 left-0 right-0 text-center font-bubble font-bold text-lg text-sky-900/80 pointer-events-none">
          Tap the bubbles to pop them! 🫧
        </p>
        {bubbles.map((b) => (
          <button
            key={b.id}
            onClick={(e) => popBubble(b, e)}
            onAnimationEnd={() => removeBubble(b.id)}
            className="absolute rounded-full border-4 border-sky-300/80 bg-sky-200/30 shadow-inner active:scale-90"
            style={{
              left: `${b.x}%`,
              bottom: -70,
              width: b.size,
              height: b.size,
              animation: `riseUp ${b.duration}s linear forwards`,
              willChange: 'transform',
            }}
            aria-label="bubble"
          >
            <span className="animate-sway absolute inset-0 rounded-full">
              <span
                className="absolute rounded-full bg-white/80"
                style={{ width: b.size * 0.25, height: b.size * 0.25, left: '20%', top: '18%' }}
              />
            </span>
          </button>
        ))}
        {bursts.map((z) => (
          <div
            key={z.id}
            className="absolute text-5xl pointer-events-none animate-burst-pop"
            style={{ left: `${z.x}%`, top: `${z.y}%` }}
          >
            {z.emoji}
          </div>
        ))}
        {celebrate && <Celebrate message="Bubble-tastic popping! 🫧" />}
      </div>
      <p className="font-bubble text-slate-500 mt-2 text-center">
        Pop {BUBBLE_GOAL} bubbles to win! 🎈
      </p>
    </div>
  );
};

/* ---------- Balloon Float ---------- */

const BALLOON_COLORS = ['#EF4444', '#F97316', '#FBBF24', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899'];
const BALLOON_GOAL = 15;

export const BalloonFloatGame: React.FC<AnimGameProps> = ({ onBack, onGameComplete }) => {
  const [balloons, setBalloons] = useState<FloatItem[]>([]);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [score, setScore] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const idRef = useRef(1);
  const scoreRef = useRef(0);
  const doneRef = useRef(false);

  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sound.speak('Look at the pretty balloons! Tap them to pop with a happy bang!');
    const spawn = setInterval(() => {
      const id = idRef.current++;
      setBalloons((prev) => [
        ...prev.slice(-9),
        {
          id,
          x: 4 + Math.random() * 82,
          size: 56 + Math.random() * 28,
          duration: 6 + Math.random() * 4,
          color: BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)],
        },
      ]);
    }, 900);
    return () => clearInterval(spawn);
  }, []);

  const removeBalloon = (id: number) => {
    setBalloons((prev) => prev.filter((p) => p.id !== id));
  };

  const popBalloon = (b: FloatItem, e: React.MouseEvent) => {
    removeBalloon(b.id);
    const burstId = idRef.current++;
    const area = areaRef.current?.getBoundingClientRect();
    const t = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const bx = area ? ((t.left + t.width / 2 - area.left) / area.width) * 100 : b.x;
    const by = area ? ((t.top + t.height / 2 - area.top) / area.height) * 100 : 50;
    setBursts((prev) => [...prev, { id: burstId, x: bx, y: by, emoji: '🎉' }]);
    setTimeout(() => {
      setBursts((prev) => prev.filter((z) => z.id !== burstId));
    }, 500);
    sound.playPop();
    const n = scoreRef.current + 1;
    scoreRef.current = n;
    setScore(n);
    if (n >= BALLOON_GOAL && !doneRef.current) {
      doneRef.current = true;
      setCelebrate(true);
      sound.playFanfare();
      sound.speak('Bang bang! You popped all the balloons! Hooray!');
      onGameComplete?.();
      setTimeout(() => setCelebrate(false), 3000);
    } else if (n === 8) {
      sound.playSuccessChime();
      sound.speak('Colorful popping! Amazing!');
    }
  };

  return (
    <div className="w-full flex flex-col items-center animate-fade-in select-none">
      <TopBar title="🎈 Balloon Pop" onBack={onBack} score={score} />
      <div
        ref={areaRef}
        className="relative w-full h-[420px] md:h-[480px] rounded-3xl border-4 border-rose-300 shadow-xl overflow-hidden bg-gradient-to-b from-indigo-300 via-sky-200 to-amber-100"
      >
        <p className="absolute top-3 left-0 right-0 text-center font-bubble font-bold text-lg text-indigo-900/80 pointer-events-none">
          Tap the balloons to pop them! 🎈
        </p>
        {balloons.map((b) => (
          <button
            key={b.id}
            onClick={(e) => popBalloon(b, e)}
            onAnimationEnd={() => removeBalloon(b.id)}
            className="absolute active:scale-90"
            style={{
              left: `${b.x}%`,
              bottom: -120,
              width: b.size,
              animation: `riseUp ${b.duration}s linear forwards`,
              willChange: 'transform',
            }}
            aria-label="balloon"
          >
            <span className="animate-sway block">
              <div
                className="rounded-full mx-auto shadow-lg"
                style={{
                  backgroundColor: b.color,
                  width: b.size,
                  height: b.size * 1.25,
                  borderRadius: '50% 50% 50% 50% / 55% 55% 45% 45%',
                }}
              />
              <div
                className="mx-auto"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '7px solid transparent',
                  borderRight: '7px solid transparent',
                  borderBottom: `10px solid ${b.color}`,
                }}
              />
              <div className="w-0.5 h-10 bg-slate-400 mx-auto" />
            </span>
          </button>
        ))}
        {bursts.map((z) => (
          <div
            key={z.id}
            className="absolute text-5xl pointer-events-none animate-burst-pop"
            style={{ left: `${z.x}%`, top: `${z.y}%` }}
          >
            {z.emoji}
          </div>
        ))}
        {celebrate && <Celebrate message="Balloon bonanza! 🎈" />}
      </div>
      <p className="font-bubble text-slate-500 mt-2 text-center">
        Pop {BALLOON_GOAL} balloons to win! 🎊
      </p>
    </div>
  );
};

/* ---------- Star Catch ---------- */

const STAR_GOAL = 20;

export const StarCatchGame: React.FC<AnimGameProps> = ({ onBack, onGameComplete }) => {
  const [stars, setStars] = useState<FloatItem[]>([]);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [score, setScore] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const idRef = useRef(1);
  const scoreRef = useRef(0);
  const doneRef = useRef(false);

  const areaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sound.speak('Catch the falling stars! Tap them before they land!');
    const spawn = setInterval(() => {
      const id = idRef.current++;
      setStars((prev) => [
        ...prev.slice(-11),
        {
          id,
          x: 4 + Math.random() * 84,
          size: 40 + Math.random() * 32,
          duration: 4 + Math.random() * 3,
        },
      ]);
    }, 750);
    return () => clearInterval(spawn);
  }, []);

  const removeStar = (id: number) => {
    setStars((prev) => prev.filter((p) => p.id !== id));
  };

  const catchStar = (s: FloatItem, e: React.MouseEvent) => {
    removeStar(s.id);
    const burstId = idRef.current++;
    const area = areaRef.current?.getBoundingClientRect();
    const t = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const bx = area ? ((t.left + t.width / 2 - area.left) / area.width) * 100 : s.x;
    const by = area ? ((t.top + t.height / 2 - area.top) / area.height) * 100 : 50;
    setBursts((prev) => [...prev, { id: burstId, x: bx, y: by, emoji: '✨' }]);
    setTimeout(() => {
      setBursts((prev) => prev.filter((z) => z.id !== burstId));
    }, 500);
    sound.playStarCollect();
    const n = scoreRef.current + 1;
    scoreRef.current = n;
    setScore(n);
    if (n >= STAR_GOAL && !doneRef.current) {
      doneRef.current = true;
      setCelebrate(true);
      sound.playFanfare();
      sound.speak('Twinkle twinkle! You caught all the stars, little star!');
      onGameComplete?.();
      setTimeout(() => setCelebrate(false), 3000);
    } else if (n === 10) {
      sound.playSuccessChime();
      sound.speak('Shiny stars! You are a star catcher!');
    }
  };

  return (
    <div className="w-full flex flex-col items-center animate-fade-in select-none">
      <TopBar title="⭐ Star Catch" onBack={onBack} score={score} />
      <div
        ref={areaRef}
        className="relative w-full h-[420px] md:h-[480px] rounded-3xl border-4 border-amber-300 shadow-xl overflow-hidden bg-gradient-to-b from-indigo-950 via-indigo-800 to-purple-700"
      >
        <p className="absolute top-3 left-0 right-0 text-center font-bubble font-bold text-lg text-amber-100/90 pointer-events-none">
          Tap the falling stars to catch them! ⭐
        </p>
        <div className="absolute top-6 right-8 text-5xl pointer-events-none">🌙</div>
        {stars.map((s) => (
          <button
            key={s.id}
            onClick={(e) => catchStar(s, e)}
            onAnimationEnd={() => removeStar(s.id)}
            className="absolute active:scale-90"
            style={{
              left: `${s.x}%`,
              top: 0,
              fontSize: s.size,
              lineHeight: 1,
              animation: `fallDown ${s.duration}s linear forwards`,
              willChange: 'transform',
            }}
            aria-label="star"
          >
            <span className="animate-sway inline-block">⭐</span>
          </button>
        ))}
        {bursts.map((z) => (
          <div
            key={z.id}
            className="absolute text-5xl pointer-events-none animate-burst-pop"
            style={{ left: `${z.x}%`, top: `${z.y}%` }}
          >
            {z.emoji}
          </div>
        ))}
        {celebrate && <Celebrate message="You caught the whole night sky! ⭐" />}
      </div>
      <p className="font-bubble text-slate-500 mt-2 text-center">
        Catch {STAR_GOAL} stars to win! 🌟
      </p>
    </div>
  );
};
