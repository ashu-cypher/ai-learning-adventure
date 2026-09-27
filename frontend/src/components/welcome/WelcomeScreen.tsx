import React, { useEffect } from 'react';
import { MiloCompanion } from '../character/MiloCompanion';
import { Rocket, Sparkles } from 'lucide-react';
import { sound } from '../../audio/soundEngine';

interface WelcomeProps {
  onStartAdventure: () => void;
}

export const WelcomeScreen: React.FC<WelcomeProps> = ({ onStartAdventure }) => {
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
    </div>
  );
};
