import React, { useEffect } from 'react';
import { MiloCompanion } from '../character/MiloCompanion';
import { Rocket, Sparkles } from 'lucide-react';
import { sound } from '../../audio/soundEngine';
import type { User } from '../../services/auth';

interface WelcomeProps {
  onStartAdventure: () => void;
  onPlayGames: () => void;
  onQuickPlayGame?: (gameId: string) => void;
  parentUser?: User | null;
  onParentSignIn?: () => void;
  onParentSignOut?: () => void;
}

/** Most-loved games, playable straight from the home screen — no scrolling. */
const POPULAR_GAMES = [
  { id: 'megamix', name: 'Mega Mix', emoji: '🎪', gradient: 'from-fuchsia-400 to-violet-500' },
  { id: 'animals', name: 'Animals', emoji: '🦁', gradient: 'from-emerald-400 to-teal-500' },
  { id: 'fruitcatch', name: 'Fruit Catch', emoji: '🍓', gradient: 'from-rose-400 to-pink-500' },
  { id: 'painting', name: 'Painting', emoji: '🖌️', gradient: 'from-pink-400 to-rose-500' },
  { id: 'piano', name: 'Piano', emoji: '🎹', gradient: 'from-amber-400 to-orange-500' },
  { id: 'bubbles', name: 'Bubbles', emoji: '🫧', gradient: 'from-sky-400 to-cyan-500' },
];

export const WelcomeScreen: React.FC<WelcomeProps> = ({
  onStartAdventure,
  onPlayGames,
  onQuickPlayGame,
  parentUser,
  onParentSignIn,
  onParentSignOut,
}) => {
  useEffect(() => {
    sound.playSuccessChime();
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col items-center text-center select-none animate-fade-in">
      {/* Title Badge */}
      <div className="flex items-center gap-2 bg-amber-100 border-2 border-amber-300 text-amber-900 px-5 py-2 rounded-full font-bubble font-bold text-base md:text-lg mb-6 shadow-sm animate-bounce-subtle">
        <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
        <span>My Learning Adventure</span>
        <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
      </div>

      <h1 className="font-bubble font-extrabold text-4xl sm:text-5xl md:text-6xl text-slate-800 tracking-tight leading-tight mb-2">
        Welcome, Little Explorer! 🌟
      </h1>

      <p className="font-bubble text-xl sm:text-2xl text-slate-600 mb-8 max-w-lg leading-relaxed">
        Let's go on a magical learning journey with Milo!
      </p>

      {/* Big Animated Milo */}
      <div className="my-2">
        <MiloCompanion
          speechText="Today we're going on a color adventure! Let's discover magical colors together!"
          mood="celebrating"
          size="giant"
          showBubble={true}
        />
      </div>

      {/* World Preview Card */}
      <div className="w-full max-w-md bg-gradient-to-r from-pink-400 via-rose-400 to-amber-300 text-white rounded-3xl p-5 my-8 shadow-xl border-4 border-white flex items-center gap-4 text-left">
        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl">
          🌈
        </div>
        <div>
          <span className="text-xs font-bubble font-bold uppercase tracking-wider text-pink-100">
            First Destination
          </span>
          <h3 className="font-bubble font-bold text-2xl">Rainbow Colors World</h3>
          <p className="font-bubble text-sm text-pink-50">Red, Blue, Yellow, Green & Match Fun!</p>
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={() => {
          sound.playPop();
          onStartAdventure();
        }}
        className="w-full max-w-md py-5 px-8 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white font-bubble font-extrabold text-2xl sm:text-3xl rounded-3xl shadow-xl hover:shadow-2xl border-4 border-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-3 animate-pulse-glow"
      >
        <Rocket className="w-8 h-8 fill-white" />
        <span>START ADVENTURE</span>
      </button>

      {/* Fun Games Button */}
      <button
        onClick={() => {
          sound.playPop();
          onPlayGames();
        }}
        className="w-full max-w-md mt-4 py-4 px-8 bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-500 hover:to-pink-600 text-white font-bubble font-extrabold text-xl sm:text-2xl rounded-3xl shadow-xl hover:shadow-2xl border-4 border-purple-200 active:scale-95 transition-all flex items-center justify-center gap-3"
      >
        <span className="text-3xl">🎮</span>
        <span>FUN GAMES</span>
      </button>

      {/* Popular games — right on the home screen, no scrolling */}
      <div className="w-full max-w-md mt-6">
        <p className="font-bubble font-extrabold text-xl text-slate-700 mb-3">
          ⭐ Tap & Play!
        </p>
        <div className="grid grid-cols-3 gap-3">
          {POPULAR_GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => {
                sound.playPop();
                onQuickPlayGame?.(game.id);
              }}
              className={`bg-gradient-to-br ${game.gradient} rounded-3xl p-3 border-4 border-white shadow-xl flex flex-col items-center gap-1 hover:scale-105 active:scale-95 transition-transform min-h-[104px] justify-center`}
            >
              <span className="text-4xl animate-float drop-shadow">{game.emoji}</span>
              <span className="font-bubble font-extrabold text-sm text-white drop-shadow text-center leading-tight">
                {game.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grown-ups: Google sign-in */}
      <div className="w-full max-w-md mt-8 flex flex-col items-center gap-2">
        <p className="font-bubble text-sm text-slate-400">👨‍👩‍👧 For grown-ups</p>
        {parentUser ? (
          <div className="flex items-center gap-3 bg-white/80 border-2 border-slate-200 rounded-2xl px-4 py-2 shadow-sm">
            {parentUser.photoUrl && (
              <img
                src={parentUser.photoUrl}
                alt=""
                className="w-9 h-9 rounded-full border-2 border-slate-200"
              />
            )}
            <div className="text-left">
              <p className="font-bubble font-bold text-slate-700 leading-tight">{parentUser.name}</p>
              <p className="font-bubble text-xs text-slate-400 leading-tight">{parentUser.email}</p>
            </div>
            <button
              onClick={() => {
                sound.playPop();
                onParentSignOut?.();
              }}
              className="ml-2 font-bubble font-bold text-sm text-slate-500 underline underline-offset-2"
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              sound.playPop();
              onParentSignIn?.();
            }}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-600 font-bubble font-bold px-5 py-2.5 rounded-2xl shadow border-2 border-slate-200 active:scale-95 transition-all"
          >
            <span className="text-xl">🔐</span>
            <span>Parent Sign in with Google</span>
          </button>
        )}
      </div>
    </div>
  );
};
