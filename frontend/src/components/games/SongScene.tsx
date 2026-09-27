import React, { useState } from 'react';
import { Music, Play, Volume2, Sparkles } from 'lucide-react';
import { sound } from '../../audio/soundEngine';

interface SongSceneProps {
  concept: string;
  lyrics?: string;
  onDone: () => void;
}

export const SongScene: React.FC<SongSceneProps> = ({ concept, lyrics, onDone }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const defaultLyrics = lyrics || `${concept.toUpperCase()}, ${concept.toUpperCase()}, look around!\n${concept.toUpperCase()} is the color that we found!\nShiny and bright, a happy sight! 🎵`;

  const handleSingAlong = () => {
    sound.playPop();
    setIsPlaying(true);
    sound.speak(`Let's sing together! ${defaultLyrics}`, () => {
      setIsPlaying(false);
    });
  };

  return (
    <div className="w-full max-w-xl bg-gradient-to-br from-violet-100 via-pink-100 to-amber-100 p-6 md:p-8 rounded-3xl border-4 border-violet-300 shadow-xl flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-violet-400 text-white flex items-center justify-center text-3xl shadow-md mb-4 animate-bounce">
        <Music className="w-8 h-8" />
      </div>

      <h2 className="font-bubble font-bold text-2xl md:text-3xl text-violet-950 mb-2">
        🎵 Sing-Along Song!
      </h2>

      <div className="bg-white/80 border-2 border-violet-200 rounded-2xl p-5 my-4 w-full shadow-inner">
        <p className="font-bubble text-lg md:text-xl text-slate-800 leading-relaxed whitespace-pre-line font-medium">
          {defaultLyrics}
        </p>
      </div>

      <div className="flex flex-wrap gap-4 mt-2 justify-center">
        <button
          onClick={handleSingAlong}
          className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bubble font-bold text-lg shadow-md transition-all active:scale-95 ${
            isPlaying
              ? 'bg-amber-400 text-amber-950 animate-pulse'
              : 'bg-violet-600 hover:bg-violet-700 text-white'
          }`}
        >
          {isPlaying ? <Volume2 className="w-6 h-6" /> : <Play className="w-6 h-6 fill-white" />}
          <span>{isPlaying ? 'Singing with Milo...' : 'Sing with Milo!'}</span>
        </button>

        <button
          onClick={() => {
            sound.playPop();
            onDone();
          }}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3.5 rounded-2xl font-bubble font-bold text-lg shadow-md transition-all active:scale-95"
        >
          <Sparkles className="w-5 h-5" />
          <span>Ready to Play!</span>
        </button>
      </div>
    </div>
  );
};
