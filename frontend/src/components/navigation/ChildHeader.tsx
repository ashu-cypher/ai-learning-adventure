import React, { useState } from 'react';
import { Home, Map, Star, Volume2, VolumeX, ShieldCheck, Gamepad2 } from 'lucide-react';
import { sound } from '../../audio/soundEngine';

interface HeaderProps {
  currentStars: number;
  onNavigateHome: () => void;
  onNavigateMap: () => void;
  onNavigateGames: () => void;
  onOpenParentGate: () => void;
  currentScreen: 'welcome' | 'map' | 'stage' | 'games';
}

export const ChildHeader: React.FC<HeaderProps> = ({
  currentStars,
  onNavigateHome,
  onNavigateMap,
  onNavigateGames,
  onOpenParentGate,
  currentScreen,
}) => {
  const [isMuted, setIsMuted] = useState(sound.isMuted);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      sound.playPop();
    }
  };

  return (
    <header className="w-full max-w-5xl mx-auto px-4 py-3 flex items-center justify-between select-none">
      {/* Left Navigation Buttons */}
      <div className="flex items-center gap-2 md:gap-3">
        {currentScreen !== 'welcome' && (
          <button
            onClick={() => {
              sound.playPop();
              onNavigateHome();
            }}
            className="flex items-center gap-2 bg-white/90 hover:bg-white text-slate-700 px-3.5 py-2.5 rounded-2xl shadow-md border-2 border-sky-200 active:scale-95 transition-transform"
            title="Go Home"
          >
            <Home className="w-6 h-6 text-sky-500" />
            <span className="hidden sm:inline font-bubble font-semibold text-lg">Home</span>
          </button>
        )}

        {currentScreen === 'stage' && (
          <button
            onClick={() => {
              sound.playPop();
              onNavigateMap();
            }}
            className="flex items-center gap-2 bg-white/90 hover:bg-white text-slate-700 px-3.5 py-2.5 rounded-2xl shadow-md border-2 border-emerald-200 active:scale-95 transition-transform"
            title="Adventure Map"
          >
            <Map className="w-6 h-6 text-emerald-500" />
            <span className="hidden sm:inline font-bubble font-semibold text-lg">Map</span>
          </button>
        )}

        {currentScreen !== 'games' && currentScreen !== 'welcome' && (
          <button
            onClick={() => {
              sound.playPop();
              onNavigateGames();
            }}
            className="flex items-center gap-2 bg-white/90 hover:bg-white text-slate-700 px-3.5 py-2.5 rounded-2xl shadow-md border-2 border-purple-200 active:scale-95 transition-transform"
            title="Fun Games"
          >
            <Gamepad2 className="w-6 h-6 text-purple-500" />
            <span className="hidden sm:inline font-bubble font-semibold text-lg">Games</span>
          </button>
        )}
      </div>

      {/* Middle: Star Counter */}
      <div className="flex items-center gap-2 bg-amber-50 border-3 border-amber-300 px-4 py-2 rounded-full shadow-inner animate-pulse-glow">
        <Star className="w-7 h-7 text-amber-500 fill-amber-400 drop-shadow-sm animate-wiggle" />
        <span className="font-bubble font-bold text-2xl text-amber-900 tracking-wider">
          {currentStars}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Sound Toggle */}
        <button
          onClick={toggleSound}
          className={`p-3 rounded-2xl shadow-md border-2 active:scale-95 transition-transform ${
            isMuted 
              ? 'bg-rose-50 border-rose-200 text-rose-500' 
              : 'bg-white/90 border-amber-200 text-amber-600 hover:bg-white'
          }`}
          title={isMuted ? 'Turn Sound ON' : 'Mute Sound'}
        >
          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>

        {/* Parent Gate Button */}
        <button
          onClick={() => {
            sound.playPop();
            onOpenParentGate();
          }}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-white text-slate-600 px-3 py-2 rounded-2xl shadow-md border-2 border-slate-200 active:scale-95 transition-transform"
          title="Parent Area (Locked for kids)"
        >
          <ShieldCheck className="w-5 h-5 text-indigo-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 hidden md:inline">Parents</span>
        </button>
      </div>
    </header>
  );
};
