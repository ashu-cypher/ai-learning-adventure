import React, { useState, useRef } from 'react';
import { sound } from '../../audio/soundEngine';
import { AudioInstructionBox } from '../audio/AudioInstructionBox';
import { GamesHub } from './GamesHub';
import { PaintingGame } from '../games/PaintingGame';
import { SpidermanWebGame, SupermanFlyGame, BatmanNightGame } from '../games/SuperheroGames';
import { PianoGame, DrumGame, XylophoneGame } from '../games/MusicGames';
import { BubblePopGame, BalloonFloatGame, StarCatchGame } from '../games/AnimationGames';
import { recordGamePlayed, toggleFavoriteGame, getGameStats } from '../../engine/gameStore';
import { Star, ArrowLeft } from 'lucide-react';

interface GamesScreenProps {
  onBack: () => void;
  onGoToLearning: () => void;
}

interface MiniGameProps {
  onBack: () => void;
  onGameComplete?: () => void;
}

const GAME_COMPONENTS: Record<string, React.FC<MiniGameProps>> = {
  painting: PaintingGame,
  spiderman: SpidermanWebGame,
  superman: SupermanFlyGame,
  batman: BatmanNightGame,
  piano: PianoGame,
  drums: DrumGame,
  xylophone: XylophoneGame,
  bubbles: BubblePopGame,
  balloons: BalloonFloatGame,
  stars: StarCatchGame,
};

const GAME_NAMES: Record<string, string> = {
  painting: 'Painting Fun',
  spiderman: 'Spider-Man Webs',
  superman: 'Superman Fly',
  batman: 'Batman Night',
  piano: 'Rainbow Piano',
  drums: 'Happy Drums',
  xylophone: 'Xylophone',
  bubbles: 'Bubble Pop',
  balloons: 'Balloon Pop',
  stars: 'Star Catch',
};

// Bilingual spoken instructions for each game (English + Hindi)
const GAME_INSTRUCTIONS: Record<string, { en: string; hi: string }> = {
  painting: {
    en: 'Pick a color and paint with your finger! Tap the brush to change colors!',
    hi: 'Rang chuno aur ungli se paint karo! Rang badalne ke liye brush dabao!',
  },
  spiderman: {
    en: 'Spider-Man needs you! Tap the bad guys to catch them in webs!',
    hi: 'Spider-Man ko tumhari madad chahiye! Bad guys ko pakadne ke liye unhe dabao!',
  },
  superman: {
    en: 'Help Superman fly! Tap the sky to flap and catch the stars!',
    hi: 'Superman ko udne me madad karo! Aasmaan dabao aur taare pakdo!',
  },
  batman: {
    en: 'It is night in Gotham! Tap the bats to turn on the city lights!',
    hi: 'Gotham me raat hai! Chamgadadon ko dabao aur sheher ki battiyan jalao!',
  },
  piano: {
    en: 'Tap the rainbow keys to play music! Make your own song!',
    hi: 'Rangeen keys dabao aur sangeet bajao! Apna gaana banao!',
  },
  drums: {
    en: 'Bang the drums! Tap each drum to make a fun sound!',
    hi: 'Dhol bajao! Mazedaar awaaz ke liye har dhol ko dabao!',
  },
  xylophone: {
    en: 'Tap the colorful bars! Each bar plays a happy note!',
    hi: 'Rangeen dandiyon ko dabao! Har dandi ek khush sur bajayegi!',
  },
  bubbles: {
    en: 'Pop the bubbles! Tap them before they float away!',
    hi: 'Bulbulon ko phodo! Ud jaane se pehle unhe dabao!',
  },
  balloons: {
    en: 'Pop the balloons! Tap the bright balloons to pop them!',
    hi: 'Gubbaron ko phodo! Rangeen gubbare dabao!',
  },
  stars: {
    en: 'Catch the falling stars! Tap them to collect them!',
    hi: 'Girte taaron ko pakdo! Unhe dabao aur jama karo!',
  },
};

export const GamesScreen: React.FC<GamesScreenProps> = ({ onBack, onGoToLearning }) => {
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const sessionStart = useRef<number>(0);

  const handleSelectGame = (gameId: string) => {
    sessionStart.current = Date.now();
    recordGamePlayed(gameId, GAME_NAMES[gameId] ?? gameId);
    setIsFavorite(getGameStats(gameId)?.favorites ?? false);
    setActiveGameId(gameId);
  };

  const handleGameBack = () => {
    if (activeGameId) {
      const secs = Math.max(0, Math.round((Date.now() - sessionStart.current) / 1000));
      recordGamePlayed(activeGameId, GAME_NAMES[activeGameId] ?? activeGameId, secs);
    }
    sound.playPop();
    sound.stopSpeaking();
    setActiveGameId(null);
  };

  const handleToggleFavorite = () => {
    if (!activeGameId) return;
    const next = toggleFavoriteGame(activeGameId);
    setIsFavorite(next);
    if (next) {
      sound.playStarCollect();
      sound.speak('Added to favorites! Yay!');
    } else {
      sound.playPop();
    }
  };

  const handleGameComplete = () => {
    // Parent-level celebration for finishing any mini-game goal
    setCelebrating(true);
    sound.playFanfare();
    window.setTimeout(() => setCelebrating(false), 2600);
  };

  if (activeGameId && GAME_COMPONENTS[activeGameId]) {
    const Game = GAME_COMPONENTS[activeGameId];
    const instructions = GAME_INSTRUCTIONS[activeGameId] ?? {
      en: 'Have fun playing!',
      hi: 'Khelo aur maze karo!',
    };
    return (
      <div className="w-full max-w-4xl mx-auto relative">
        {/* Top bar: back + favorite */}
        <div className="flex items-center justify-between mb-2 px-1">
          <button
            onClick={handleGameBack}
            className="flex items-center gap-2 bg-white/80 hover:bg-white text-slate-700 font-bubble font-bold text-lg px-4 py-2 rounded-2xl shadow border-2 border-slate-200 active:scale-95 transition-all"
          >
            <ArrowLeft className="w-6 h-6" />
            <span>Games</span>
          </button>
          <button
            onClick={handleToggleFavorite}
            aria-label="Toggle favorite"
            className={`flex items-center gap-2 font-bubble font-bold text-lg px-4 py-2 rounded-2xl shadow border-2 active:scale-95 transition-all ${
              isFavorite
                ? 'bg-amber-100 border-amber-300 text-amber-700'
                : 'bg-white/80 border-slate-200 text-slate-400'
            }`}
          >
            <Star className={`w-6 h-6 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>{isFavorite ? 'Favorite!' : 'Favorite'}</span>
          </button>
        </div>

        {/* Bilingual audio instruction box */}
        <AudioInstructionBox
          englishText={instructions.en}
          hindiText={instructions.hi}
          autoPlay={true}
        />

        <div className="mt-3">
          <Game onBack={handleGameBack} onGameComplete={handleGameComplete} />
        </div>

        {celebrating && (
          <div className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-black/40 pointer-events-none animate-fade-in">
            <div className="text-8xl mb-3 animate-bounce">🏆</div>
            <p className="font-bubble font-extrabold text-4xl md:text-5xl text-white text-center px-6 drop-shadow-lg">
              Amazing! You did it!
            </p>
            <div className="text-6xl mt-3">🎉⭐🎊</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <GamesHub onSelectGame={handleSelectGame} onBack={onBack} onGoToLearning={onGoToLearning} />
  );
};
