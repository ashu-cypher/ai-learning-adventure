import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, Sparkles, ArrowRight, Map } from 'lucide-react';
import { sound } from '../../audio/soundEngine';
import { MiloCompanion } from '../character/MiloCompanion';

interface CelebrationProps {
  stageTitle: string;
  concept: string;
  starsEarned: number;
  nextStageId?: string;
  onNextStage: () => void;
  onGoToMap: () => void;
}

export const CelebrationModal: React.FC<CelebrationProps> = ({
  stageTitle,
  concept,
  starsEarned,
  onNextStage,
  onGoToMap,
}) => {
  useEffect(() => {
    // 1. Play joyful fanfare
    sound.playFanfare();

    // 2. Confetti cannon burst
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#EF4444', '#3B82F6', '#FBBF24', '#10B981', '#EC4899'],
      });
    } catch {
      // Ignore if canvas blocked
    }

    // 3. Audio celebration
    sound.speak(`Hooray! You did it! You mastered ${concept.toUpperCase()}! You earned ${starsEarned} gold stars!`);
  }, [concept, starsEarned]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white rounded-3xl border-4 border-amber-300 p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center relative overflow-hidden animate-bounce-subtle">
        {/* Glow backdrop */}
        <div className="absolute -top-20 -left-20 w-44 h-44 bg-amber-200/50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-pink-200/50 rounded-full blur-2xl pointer-events-none" />

        {/* Celebrating Milo */}
        <MiloCompanion mood="celebrating" size="md" showBubble={false} autoSpeak={false} />

        <div className="mt-4 flex items-center gap-2 text-amber-500 font-bubble text-2xl font-bold uppercase tracking-wider">
          <Sparkles className="w-6 h-6 animate-spin" />
          <span>YOU DID IT!</span>
          <Sparkles className="w-6 h-6 animate-spin" />
        </div>

        <h2 className="font-bubble font-bold text-3xl text-slate-800 mt-1">
          {stageTitle} Complete! 🏆
        </h2>

        {/* Stars earned */}
        <div className="flex items-center justify-center gap-3 my-5 bg-amber-50 border-3 border-amber-200 px-6 py-3 rounded-full shadow-inner">
          {[1, 2, 3].map((starIdx) => (
            <Star
              key={starIdx}
              className={`w-10 h-10 transition-transform duration-500 ${
                starIdx <= starsEarned
                  ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow-md animate-bounce'
                  : 'text-slate-200 scale-95'
              }`}
            />
          ))}
        </div>

        <p className="font-bubble text-lg text-slate-600 mb-6 font-medium">
          🌟 +{starsEarned} Stars Collected! Next stage is unlocked!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
          <button
            onClick={() => {
              sound.playPop();
              onNextStage();
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bubble font-bold text-xl py-4 px-6 rounded-2xl shadow-lg active:scale-95 transition-transform"
          >
            <span>Next Stage</span>
            <ArrowRight className="w-6 h-6" />
          </button>

          <button
            onClick={() => {
              sound.playPop();
              onGoToMap();
            }}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bubble font-bold text-lg py-4 px-5 rounded-2xl border-2 border-slate-300 active:scale-95 transition-transform"
          >
            <Map className="w-5 h-5 text-slate-600" />
            <span>Map</span>
          </button>
        </div>
      </div>
    </div>
  );
};
