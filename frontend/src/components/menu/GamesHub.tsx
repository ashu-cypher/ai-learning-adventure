import React, { useMemo } from 'react';
import { sound } from '../../audio/soundEngine';
import { ArrowLeft } from 'lucide-react';
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
  title: string;
  emoji: string;
  gradient: string;
  ring: string;
  games: GameCard[];
}

const CATEGORIES: Category[] = [
  {
    title: 'Painting',
    emoji: '🎨',
    gradient: 'from-pink-400 to-rose-500',
    ring: 'border-pink-200',
    games: [{ id: 'painting', name: 'Painting Fun', emoji: '🖌️' }],
  },
  {
    title: 'Superheroes',
    emoji: '🦸',
    gradient: 'from-blue-500 to-indigo-600',
    ring: 'border-blue-200',
    games: [
      { id: 'spiderman', name: 'Spider-Man Webs', emoji: '🕷️' },
      { id: 'superman', name: 'Superman Fly', emoji: '🦸‍♂️' },
      { id: 'batman', name: 'Batman Night', emoji: '🦇' },
    ],
  },
  {
    title: 'Music',
    emoji: '🎵',
    gradient: 'from-amber-400 to-orange-500',
    ring: 'border-amber-200',
    games: [
      { id: 'piano', name: 'Rainbow Piano', emoji: '🎹' },
      { id: 'drums', name: 'Happy Drums', emoji: '🥁' },
      { id: 'xylophone', name: 'Xylophone', emoji: '🎶' },
    ],
  },
  {
    title: 'Animation',
    emoji: '✨',
    gradient: 'from-purple-400 to-fuchsia-500',
    ring: 'border-purple-200',
    games: [
      { id: 'bubbles', name: 'Bubble Pop', emoji: '🫧' },
      { id: 'balloons', name: 'Balloon Pop', emoji: '🎈' },
      { id: 'stars', name: 'Star Catch', emoji: '⭐' },
    ],
  },
  {
    title: 'Learning',
    emoji: '📚',
    gradient: 'from-emerald-400 to-teal-500',
    ring: 'border-emerald-200',
    games: [{ id: 'learning', name: 'Color Adventure', emoji: '🌈' }],
  },
];

export const GamesHub: React.FC<GamesHubProps> = ({ onSelectGame, onBack, onGoToLearning }) => {
  // Local DB: recently played + favorites (updates every time the hub renders)
  const recentGames = useMemo(() => getRecentlyPlayedGames(6), []);

  const handleSelect = (gameId: string) => {
    sound.playPop();
    if (gameId === 'learning') {
      sound.speak("Let's go on a color adventure!");
      onGoToLearning();
    } else {
      const allGames = CATEGORIES.flatMap((c) => c.games);
      const game = allGames.find((g) => g.id === gameId);
      if (game) {
        sound.speak(`Yay! Let's play ${game.name}!`);
      }
      onSelectGame(gameId);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
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

      <p className="font-bubble text-xl text-slate-600 text-center mb-6">
        Pick a game to play, little superstar! 🌟
      </p>

      {/* Recently played strip (from local DB) */}
      {recentGames.length > 0 && (
        <section className="bg-white/70 rounded-3xl border-2 border-amber-200 shadow-md p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-3xl shadow-md">
              🕹️
            </div>
            <h2 className="font-bubble font-extrabold text-2xl text-slate-800">Play Again!</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentGames.map((rec) => (
              <button
                key={rec.gameId}
                onClick={() => handleSelect(rec.gameId)}
                className="flex-shrink-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl px-5 py-4 border-4 border-white shadow-xl flex flex-col items-center gap-1 hover:scale-105 active:scale-95 transition-transform min-w-[120px]"
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
        </section>
      )}

      {/* Categories */}
      <div className="flex flex-col gap-6">
        {CATEGORIES.map((cat) => (
          <section key={cat.title} className={`bg-white/70 rounded-3xl border-2 ${cat.ring} shadow-md p-4`}>
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-3xl shadow-md animate-bounce-subtle`}
              >
                {cat.emoji}
              </div>
              <h2 className="font-bubble font-extrabold text-2xl text-slate-800">{cat.title}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {cat.games.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleSelect(game.id)}
                  className={`bg-gradient-to-br ${cat.gradient} rounded-3xl p-4 md:p-5 border-4 border-white shadow-xl flex flex-col items-center gap-2 hover:scale-105 active:scale-95 transition-transform min-h-[132px] justify-center`}
                >
                  <span className="text-6xl md:text-7xl animate-float drop-shadow">
                    {game.emoji}
                  </span>
                  <span className="font-bubble font-extrabold text-lg md:text-xl text-white drop-shadow text-center leading-tight">
                    {game.name}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
