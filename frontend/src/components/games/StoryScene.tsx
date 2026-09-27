import React, { useState } from 'react';
import { BookOpen, Volume2, ArrowRight } from 'lucide-react';
import { sound } from '../../audio/soundEngine';

interface StorySceneProps {
  concept: string;
  storyText?: string;
  onDone: () => void;
}

export const StoryScene: React.FC<StorySceneProps> = ({ concept, storyText, onDone }) => {
  const [isReading, setIsReading] = useState(false);

  const defaultStory = storyText || `Milo the Bunny hopped into the magical meadow looking for ${concept.toUpperCase()}! Look closely, an adventure is waiting for us!`;

  const handleReadStory = () => {
    sound.playPop();
    setIsReading(true);
    sound.speak(`Story time! ${defaultStory}`, () => {
      setIsReading(false);
    });
  };

  return (
    <div className="w-full max-w-xl bg-gradient-to-br from-amber-50 via-sky-50 to-pink-50 p-6 md:p-8 rounded-3xl border-4 border-amber-300 shadow-xl flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-3xl shadow-md mb-4">
        <BookOpen className="w-8 h-8" />
      </div>

      <h2 className="font-bubble font-bold text-2xl md:text-3xl text-amber-950 mb-2">
        📖 Story Time with Milo!
      </h2>

      <div className="bg-white/90 border-2 border-amber-200 rounded-2xl p-5 my-4 w-full shadow-inner">
        <p className="font-bubble text-lg md:text-xl text-slate-800 leading-relaxed font-medium">
          "{defaultStory}"
        </p>
      </div>

      <div className="flex flex-wrap gap-4 mt-2 justify-center">
        <button
          onClick={handleReadStory}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bubble font-bold text-lg shadow-md transition-all active:scale-95 ${
            isReading
              ? 'bg-amber-400 text-amber-950 animate-pulse'
              : 'bg-sky-600 hover:bg-sky-700 text-white'
          }`}
        >
          <Volume2 className="w-6 h-6" />
          <span>{isReading ? 'Reading Story...' : 'Read Aloud!'}</span>
        </button>

        <button
          onClick={() => {
            sound.playPop();
            onDone();
          }}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-bubble font-bold text-lg shadow-md transition-all active:scale-95"
        >
          <span>Let's Play!</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
