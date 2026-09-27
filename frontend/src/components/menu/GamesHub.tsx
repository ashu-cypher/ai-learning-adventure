import React, { useMemo, useState } from 'react';
import { sound } from '../../audio/soundEngine';
import { ArrowLeft, LayoutGrid } from 'lucide-react';
import { getRecentlyPlayedGames } from '../../engine/gameStore';

interface GamesHubProps {
  onSelectGame: (gameId: string) => void;
  onBack: () => void;
  onGoToLearning: () => void;
}

interface GameCard {
  id: string;
  name: string;
  emoji: string;
}

interface Category {
  id: string;
  title: string;
  emoji: string;
  gradient: string;
  ring: string;
  tint: string;
  games: GameCard[];
}

const CATEGORIES: Category[] = [
  {
    id: 'paint',
    title: 'Paint',
    emoji: '🎨',
    gradient: 'from-pink-400 to-rose-500',
    ring: 'border-pink-200',
    tint: 'bg-gradient-to-br from-pink-100 to-rose-100',
    games: [{ id: 'painting', name: 'Painting Fun', emoji: '🖌️' }],
  },
  {
    id: 'heroes',
    title: 'Heroes',
    emoji: '🦸',
    gradient: 'from-blue-500 to-indigo-600',
    ring: 'border-blue-200',
    tint: 'bg-gradient-to-br from-blue-100 to-indigo-100',
    games: [
      { id: 'spiderman', name: 'Spider-Man', emoji: '🕷️' },
      { id: 'superman', name: 'Superman', emoji: '🦸‍♂️' },
      { id: 'batman', name: 'Batman', emoji: '🦇' },
    ],
  },
  {
    id: 'music',
    title: 'Music',
    emoji: '🎵',
    gradient: 'from-amber-400 to-orange-500',
    ring: 'border-amber-200',
    tint: 'bg-gradient-to-br from-amber-100 to-orange-100',
    games: [
      { id: 'piano', name: 'Piano', emoji: '🎹' },
      { id: 'drums', name: 'Drums', emoji: '🥁' },
      { id: 'xylophone', name: 'Xylophone', emoji: '🎶' },
    ],
  },
  {
    id: 'fun',
    title: 'Fun',
    emoji: '✨',
    gradient: 'from-purple-400 to-fuchsia-500',
    ring: 'border-purple-200',
    tint: 'bg-gradient-to-br from-purple-100 to-fuchsia-100',
    games: [
      { id: 'bubbles', name: 'Bubbles', emoji: '🫧' },
      { id: 'balloons', name: 'Balloons', emoji: '🎈' },
      { id: 'stars', name: 'Stars', emoji: '⭐' },
    ],
  },
  {
    id: 'learn',
    title: 'Learn',
    emoji: '🧠',
    gradient: 'from-emerald-400 to-teal-500',
    ring: 'border-emerald-200',
    tint: 'bg-gradient-to-br from-emerald-100 to-teal-100',
    games: [
      { id: 'megamix', name: 'Mega Mix', emoji: '🎪' },
      { id: 'animals', name: 'Animals', emoji: '🦁' },
      { id: 'feedmonster', name: 'Feed Monster', emoji: '👹' },
      { id: 'memory', name: 'Memory', emoji: '🃏' },
      { id: 'shapes', name: 'Shapes', emoji: '🔷' },
      { id: 'fruitcatch', name: 'Fruit Catch', emoji: '🍓' },
      { id: 'vehicles', name: 'Vehicles', emoji: '🚗' },
      { id: 'learning', name: 'Colors', emoji: '🌈' },
    ],
  },
];

/** A distinct playful sound for each game so every tap feels different */
const GAME_SOUNDS: Record<string, () => void> = {
  painting: () => sound.playSparkle(),
  spiderman: () => sound.playWhoosh(),
  superman: () => sound.playWhoosh(),
  batman: () => sound.playWhoosh(),
  piano: () => sound.playDrumCymbal(),
  drums: () => sound.playDrumKick(),
  xylophone: () => sound.playDrumSnare(),
  bubbles: () => sound.playPop(),
  balloons: () => sound.playBoing(),
  stars: () => sound.playStarCollect(),
  animals: () => sound.playChirp(),
  feedmonster: () => sound.playGiggle(),
  memory: () => sound.playSparkle(),
  shapes: () => sound.playBoing(),
  fruitcatch: () => sound.playPop(),
  vehicles: () => sound.playWhoosh(),
  megamix: () => sound.playFanfare(),
  learning: () => sound.playYay(),
};

export const GamesHub: React.FC<GamesHubProps> = ({ onSelectGame, onBack, onGoToLearning }) => {
  const [activeTab, setActiveTab] = useState<string>('learn');
  // Local DB: recently played + favorites (updates every time the hub renders)
  const recentGames = useMemo(() => getRecentlyPlayedGames(4), []);

  const handleSelect = (gameId: string) => {
    // Distinct sound per game — every tap feels different!
    (GAME_SOUNDS[gameId] || (() => sound.playPop()))();
    if (gameId === 'learning') {
      onGoToLearning();
    } else {
      onSelectGame(gameId);
    }
  };

  const switchTab = (id: string) => {
    if (id === activeTab) return;
    sound.playTap();
    setActiveTab(id);
  };

  const activeCategory = CATEGORIES.find((c) => c.id === activeTab) ?? CATEGORIES[0];

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => {
            sound.playPop();
            onBack();
          }}
          className="flex items-center gap-2 bg-white/90 hover:bg-white text-slate-700 px-4 py-2.5 rounded-2xl shadow-md border-2 border-sky-200 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-6 h-6 text-sky-500" />
          <span className="font-bubble font-bold text-lg">Home</span>
        </button>
        <h1 className="font-bubble font-extrabold text-3xl md:text-4xl text-slate-800 text-center">
          🎮 Fun Games!
        </h1>
        <div className="w-24" />
      </div>

      {/* Category tabs — no scrolling needed */}
      <div className="flex gap-2 justify-center mb-4 flex-wrap">
        <button
          onClick={() => switchTab('__recent')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-bubble font-extrabold text-lg border-4 transition-all active:scale-95 ${
            activeTab === '__recent'
              ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white border-white shadow-xl scale-105'
              : 'bg-white/80 text-slate-600 border-white shadow'
          }`}
        >
          <span className="text-2xl">🕹️</span>
          <span>Mine</span>
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => switchTab(cat.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-bubble font-extrabold text-lg border-4 transition-all active:scale-95 ${
              activeTab === cat.id
                ? `bg-gradient-to-br ${cat.gradient} text-white border-white shadow-xl scale-105`
                : 'bg-white/80 text-slate-600 border-white shadow'
            }`}
          >
            <span className="text-2xl">{cat.emoji}</span>
            <span>{cat.title}</span>
          </button>
        ))}
      </div>

      {/* Recently played tab */}
      {activeTab === '__recent' && (
        <div key="recent" className="animate-pop-in">
          {recentGames.length === 0 ? (
            <div className="bg-white/70 rounded-3xl border-2 border-amber-200 p-8 text-center">
              <div className="text-6xl mb-3 animate-float">🎮</div>
              <p className="font-bubble font-bold text-xl text-slate-600">
                Play a game and it will show up here!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {recentGames.map((rec) => (
                <button
                  key={rec.gameId}
                  onClick={() => handleSelect(rec.gameId)}
                  className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl px-4 py-5 border-4 border-white shadow-xl flex flex-col items-center gap-1 hover:scale-105 active:scale-95 transition-transform min-h-[128px] justify-center animate-pop-in"
                >
                  <span className="font-bubble font-extrabold text-lg text-white drop-shadow text-center leading-tight">
                    {rec.favorites ? '⭐ ' : ''}{rec.gameName}
                  </span>
                  <span className="font-bubble text-sm text-amber-50">
                    ▶ {rec.playCount} {rec.playCount === 1 ? 'time' : 'times'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active category games — compact grid, fits without scrolling */}
      {activeTab !== '__recent' && (
        <div key={activeTab} className={`${activeCategory.tint} rounded-3xl border-2 ${activeCategory.ring} shadow-md p-4 animate-pop-in`}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${activeCategory.gradient} flex items-center justify-center text-3xl shadow-md animate-bounce-subtle`}
            >
              {activeCategory.emoji}
            </div>
            <h2 className="font-bubble font-extrabold text-2xl text-slate-800">
              {activeCategory.title} Games
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {activeCategory.games.map((game) => (
              <button
                key={game.id}
                onClick={() => handleSelect(game.id)}
                className={`bg-gradient-to-br ${activeCategory.gradient} rounded-3xl p-4 border-4 border-white shadow-xl flex flex-col items-center gap-1 hover:scale-105 active:scale-95 transition-transform min-h-[124px] justify-center`}
              >
                <span className="text-5xl md:text-6xl animate-float drop-shadow">
                  {game.emoji}
                </span>
                <span className="font-bubble font-extrabold text-base md:text-lg text-white drop-shadow text-center leading-tight">
                  {game.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* All-games quick strip */}
      <div className="mt-4 flex items-center justify-center gap-2 text-slate-400">
        <LayoutGrid className="w-4 h-4" />
        <span className="font-bubble text-sm font-bold">Tap a tab to explore every game!</span>
      </div>
    </div>
  );
};
