import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../../audio/soundEngine';
import { ArrowLeft } from 'lucide-react';

interface HeroGameProps {
  onBack: () => void;
  onGameComplete?: () => void;
}

/* ---------- Shared bits ---------- */

const TopBar: React.FC<{ title: string; onBack: () => void; score: number; scoreEmoji: string }> = ({
  title,
  onBack,
  score,
  scoreEmoji,
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
      <span className="text-2xl">{scoreEmoji}</span>
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

/* ---------- Spider-Man: Web Catch ---------- */

interface WebTarget {
  id: number;
  x: number;
  y: number;
  villain: boolean;
}

const SPIDER_GOAL = 15;

export const SpidermanWebGame: React.FC<HeroGameProps> = ({ onBack, onGameComplete }) => {
  const [targets, setTargets] = useState<WebTarget[]>([]);
  const [score, setScore] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const idRef = useRef(1);
  const scoreRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    sound.speak('Help Spider-Man! Tap the spiders and villains to catch them in webs!');
    const spawn = setInterval(() => {
      const id = idRef.current++;
      const villain = Math.random() < 0.3;
      const t: WebTarget = {
        id,
        x: 4 + Math.random() * 80,
        y: 6 + Math.random() * 68,
        villain,
      };
      setTargets((prev) => [...prev.slice(-11), t]);
      setTimeout(() => {
        setTargets((prev) => prev.filter((p) => p.id !== id));
      }, 2600);
    }, 850);
    return () => clearInterval(spawn);
  }, []);

  const tapTarget = (t: WebTarget) => {
    setTargets((prev) => prev.filter((p) => p.id !== t.id));
    sound.playPop();
    const n = scoreRef.current + (t.villain ? 2 : 1);
    scoreRef.current = n;
    setScore(n);
    if (n >= SPIDER_GOAL && !doneRef.current) {
      doneRef.current = true;
      setCelebrate(true);
      sound.playFanfare();
      sound.speak('Amazing! You are a true superhero!');
      onGameComplete?.();
      setTimeout(() => setCelebrate(false), 3000);
    } else if (n === 5 || n === 10) {
      sound.playSuccessChime();
      sound.speak(t.villain ? 'Got the villain! Super catching!' : 'Great catching! Keep going!');
    }
  };

  return (
    <div className="w-full flex flex-col items-center animate-fade-in select-none">
      <TopBar title="🕷️ Spider-Man Webs" onBack={onBack} score={score} scoreEmoji="🕸️" />
      <div className="relative w-full h-[420px] md:h-[480px] rounded-3xl border-4 border-red-300 shadow-xl overflow-hidden bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-200">
        {/* City skyline */}
        <div className="absolute bottom-0 left-0 right-0 text-center text-5xl md:text-6xl opacity-90 pointer-events-none">
          🏙️🏢🏙️🏢🏙️
        </div>
        <p className="absolute top-3 left-0 right-0 text-center font-bubble font-bold text-lg text-red-900/80 pointer-events-none">
          Tap spiders 🕷️ and villains 🦹 to web them!
        </p>
        {targets.map((t) => (
          <button
            key={t.id}
            onClick={() => tapTarget(t)}
            className={`absolute text-6xl md:text-7xl active:scale-90 transition-transform ${
              t.villain ? 'animate-wiggle' : 'animate-float'
            }`}
            style={{ left: `${t.x}%`, top: `${t.y}%` }}
            aria-label={t.villain ? 'villain' : 'spider'}
          >
            {t.villain ? '🦹' : '🕷️'}
          </button>
        ))}
        {celebrate && <Celebrate message="You saved the city, hero! 🕷️" />}
      </div>
      <div className="mt-2 w-full bg-white/70 rounded-2xl px-4 py-2 text-center border-2 border-red-200">
        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-400 to-blue-500 rounded-full transition-all"
            style={{ width: `${Math.min(100, (score / SPIDER_GOAL) * 100)}%` }}
          />
        </div>
        <p className="font-bubble text-sm text-slate-600 mt-1">
          Catch {SPIDER_GOAL} to win! 🕸️
        </p>
      </div>
    </div>
  );
};

/* ---------- Superman: Fly High ---------- */

interface Cloud {
  id: number;
  x: number;
  y: number;
}
interface FlyStar {
  id: number;
  x: number;
  y: number;
}

const SUPER_GOAL = 10;

export const SupermanFlyGame: React.FC<HeroGameProps> = ({ onBack, onGameComplete }) => {
  const [snap, setSnap] = useState<{ y: number; clouds: Cloud[]; stars: FlyStar[] }>({
    y: 50,
    clouds: [],
    stars: [],
  });
  const [score, setScore] = useState(0);
  const [bumpy, setBumpy] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const phys = useRef({ y: 50, v: 0, clouds: [] as Cloud[], stars: [] as FlyStar[], tick: 0 });
  const idRef = useRef(1);
  const scoreRef = useRef(0);
  const doneRef = useRef(false);
  const invulnRef = useRef(false);
  const completeRef = useRef(onGameComplete);
  completeRef.current = onGameComplete;

  useEffect(() => {
    sound.speak('Help Superman fly! Tap the sky to fly up. Catch the stars, dodge the clouds!');
    const loop = setInterval(() => {
      const s = phys.current;
      s.tick += 1;
      s.v = Math.min(s.v + 0.9, 12);
      s.y = Math.max(2, Math.min(92, s.y + s.v * 0.55));
      s.clouds.forEach((c) => {
        c.x -= 2.2;
      });
      s.clouds = s.clouds.filter((c) => c.x > -15);
      s.stars.forEach((st) => {
        st.x -= 1.8;
      });
      s.stars = s.stars.filter((st) => st.x > -10);
      if (s.tick % 24 === 0) {
        s.clouds.push({ id: idRef.current++, x: 105, y: 5 + Math.random() * 80 });
      }
      if (s.tick % 36 === 0) {
        s.stars.push({ id: idRef.current++, x: 105, y: 8 + Math.random() * 76 });
      }
      // Catch stars
      const caught = s.stars.filter(
        (st) => Math.abs(st.x - 14) < 9 && Math.abs(st.y - s.y) < 11
      );
      if (caught.length > 0) {
        const caughtIds = new Set(caught.map((c) => c.id));
        s.stars = s.stars.filter((st) => !caughtIds.has(st.id));
        const n = scoreRef.current + caught.length;
        scoreRef.current = n;
        setScore(n);
        sound.playStarCollect();
        if (n === 5) {
          sound.playSuccessChime();
          sound.speak('Super flying! You are doing great!');
        }
        if (n >= SUPER_GOAL && !doneRef.current) {
          doneRef.current = true;
          setCelebrate(true);
          sound.playFanfare();
          sound.speak('Superman says thank you, little hero!');
          completeRef.current?.();
          setTimeout(() => setCelebrate(false), 3000);
        }
      }
      // Bump into clouds (gentle!)
      if (!invulnRef.current) {
        const bump = s.clouds.find(
          (c) => Math.abs(c.x - 14) < 10 && Math.abs(c.y - s.y) < 10
        );
        if (bump) {
          invulnRef.current = true;
          setBumpy(true);
          sound.playGentleEncouragement();
          sound.speak('Oops! Bumpy cloud! Keep flying!');
          s.y = Math.min(92, s.y + 12);
          s.v = 2;
          setTimeout(() => {
            invulnRef.current = false;
            setBumpy(false);
          }, 1200);
        }
      }
      setSnap({ y: s.y, clouds: [...s.clouds], stars: [...s.stars] });
    }, 60);
    return () => clearInterval(loop);
  }, []);

  const flap = () => {
    phys.current.v = -10;
    sound.playPop();
  };

  return (
    <div className="w-full flex flex-col items-center animate-fade-in select-none">
      <TopBar title="🦸 Superman Fly" onBack={onBack} score={score} scoreEmoji="⭐" />
      <div
        className="relative w-full h-[420px] md:h-[480px] rounded-3xl border-4 border-blue-300 shadow-xl overflow-hidden bg-gradient-to-b from-sky-400 via-sky-300 to-sky-100 cursor-pointer"
        onPointerDown={flap}
        style={{ touchAction: 'none' }}
      >
        <p className="absolute top-3 left-0 right-0 text-center font-bubble font-bold text-lg text-blue-900/80 pointer-events-none">
          Tap the sky to fly up! Catch ⭐, dodge ☁️!
        </p>
        {/* Superman */}
        <div
          className="absolute text-6xl md:text-7xl transition-none pointer-events-none"
          style={{ left: '8%', top: `${snap.y}%`, transform: 'translateY(-50%)' }}
        >
          <span className={bumpy ? 'opacity-60' : ''}>🦸‍♂️</span>
          {bumpy && <span className="text-3xl absolute -top-4 -right-2">💫</span>}
        </div>
        {/* Clouds */}
        {snap.clouds.map((c) => (
          <div
            key={c.id}
            className="absolute text-5xl md:text-6xl pointer-events-none"
            style={{ left: `${c.x}%`, top: `${c.y}%`, transform: 'translateY(-50%)' }}
          >
            ☁️
          </div>
        ))}
        {/* Stars */}
        {snap.stars.map((st) => (
          <div
            key={st.id}
            className="absolute text-4xl md:text-5xl pointer-events-none animate-wiggle"
            style={{ left: `${st.x}%`, top: `${st.y}%`, transform: 'translateY(-50%)' }}
          >
            ⭐
          </div>
        ))}
        {celebrate && <Celebrate message="Superman is so proud of you! 🦸" />}
      </div>
      <p className="font-bubble text-slate-500 mt-2 text-center">
        Catch {SUPER_GOAL} stars to win! 🌟
      </p>
    </div>
  );
};

/* ---------- Batman: Night Light ---------- */

interface Bat {
  id: number;
  x: number;
  y: number;
  dx: number;
  born: number;
}

const BAT_GOAL = 12;

export const BatmanNightGame: React.FC<HeroGameProps> = ({ onBack, onGameComplete }) => {
  const [bats, setBats] = useState<Bat[]>([]);
  const [lights, setLights] = useState(0);
  const [zaps, setZaps] = useState<{ id: number; x: number; y: number }[]>([]);
  const [celebrate, setCelebrate] = useState(false);
  const idRef = useRef(1);
  const lightsRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    sound.speak('It is night in Gotham City! Tap the bats to turn on the city lights!');
    const spawn = setInterval(() => {
      const fromLeft = Math.random() < 0.5;
      const id = idRef.current++;
      const bat: Bat = {
        id,
        x: fromLeft ? -12 : 112,
        y: 8 + Math.random() * 55,
        dx: (fromLeft ? 1 : -1) * (1.4 + Math.random() * 1.2),
        born: Date.now(),
      };
      setBats((prev) => [...prev.slice(-9), bat]);
    }, 1100);
    const move = setInterval(() => {
      const now = Date.now();
      setBats((prev) =>
        prev
          .map((b) => ({ ...b, x: b.x + b.dx }))
          .filter((b) => b.x > -15 && b.x < 115 && now - b.born < 9000)
      );
    }, 120);
    return () => {
      clearInterval(spawn);
      clearInterval(move);
    };
  }, []);

  const tapBat = (b: Bat) => {
    setBats((prev) => prev.filter((p) => p.id !== b.id));
    const zapId = idRef.current++;
    setZaps((prev) => [...prev, { id: zapId, x: b.x, y: b.y }]);
    setTimeout(() => {
      setZaps((prev) => prev.filter((z) => z.id !== zapId));
    }, 450);
    sound.playPop();
    const n = lightsRef.current + 1;
    lightsRef.current = n;
    setLights(n);
    if (n >= BAT_GOAL && !doneRef.current) {
      doneRef.current = true;
      setCelebrate(true);
      sound.playFanfare();
      sound.speak('Gotham City is bright and safe! Great job, hero!');
      onGameComplete?.();
      setTimeout(() => setCelebrate(false), 3000);
    } else if (n === 6) {
      sound.playSuccessChime();
      sound.speak('Gotham is getting brighter! Keep tapping!');
    }
  };

  const glow = Math.min(1, lights / BAT_GOAL);

  return (
    <div className="w-full flex flex-col items-center animate-fade-in select-none">
      <TopBar title="🦇 Batman Night" onBack={onBack} score={lights} scoreEmoji="💡" />
      <div className="relative w-full h-[420px] md:h-[480px] rounded-3xl border-4 border-indigo-400 shadow-xl overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900">
        {/* Moon */}
        <div className="absolute top-4 right-6 text-6xl pointer-events-none">🌙</div>
        <p className="absolute top-3 left-0 right-0 text-center font-bubble font-bold text-lg text-indigo-100/90 pointer-events-none">
          Tap the bats 🦇 to light up Gotham!
        </p>
        {/* City glow */}
        <div
          className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-amber-300/80 to-transparent pointer-events-none transition-opacity duration-500"
          style={{ opacity: glow }}
        />
        {/* Skyline */}
        <div className="absolute bottom-0 left-0 right-0 text-center text-5xl md:text-6xl pointer-events-none">
          🌃🏙️🌃🏙️🌃
        </div>
        {/* Bats */}
        {bats.map((b) => (
          <button
            key={b.id}
            onClick={() => tapBat(b)}
            className="absolute text-5xl md:text-6xl active:scale-90 transition-transform animate-float"
            style={{ left: `${b.x}%`, top: `${b.y}%` }}
            aria-label="bat"
          >
            🦇
          </button>
        ))}
        {/* Zap flashes */}
        {zaps.map((z) => (
          <div
            key={z.id}
            className="absolute text-5xl pointer-events-none animate-bounce"
            style={{ left: `${z.x}%`, top: `${z.y}%` }}
          >
            💡
          </div>
        ))}
        {celebrate && <Celebrate message="Gotham City is safe! 🦇" />}
      </div>
      <p className="font-bubble text-slate-500 mt-2 text-center">
        Light up {BAT_GOAL} city lights to win! 💡
      </p>
    </div>
  );
};
