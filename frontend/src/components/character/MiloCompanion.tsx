import React, { useEffect, useState } from 'react';
import { Volume2, Sparkles } from 'lucide-react';
import { sound } from '../../audio/soundEngine';

interface MiloProps {
  speechText?: string;
  mood?: 'idle' | 'speaking' | 'happy' | 'celebrating' | 'thinking' | 'encouraging';
  autoSpeak?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'giant';
  showBubble?: boolean;
  onTap?: () => void;
}

/**
 * Milo's interactive voice lines — tapping Milo makes him chat, teach and
 * play with the child like a little voice teacher, not just repeat.
 */
const MILO_FUN_PHRASES: string[] = [
  "Hee hee! That tickles! You're my best friend!",
  "Wow, you found me! High five, little superstar!",
  "I love playing with you! Let's learn something fun!",
  "Did you know? Bunnies can hop super high! Boing boing!",
  "You have the brightest smile! It makes my ears wiggle!",
  "Psst... I have a secret: you're doing AMAZING!",
  "Let's sing together! La la la! Your turn!",
  "Hippity hoppity! I'm the happiest bunny today!",
];

export const MiloCompanion: React.FC<MiloProps> = ({
  speechText = "Hi! I'm Milo! Let's play!",
  mood = 'idle',
  autoSpeak = true,
  size = 'md',
  showBubble = true,
  onTap,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [blink, setBlink] = useState(false);
  const [excited, setExcited] = useState(false);
  const [tapCount, setTapCount] = useState(0);

  // Periodic eye blink for lifelike animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 180);
    }, 3800);
    return () => clearInterval(blinkInterval);
  }, []);

  // Speak when speechText changes
  useEffect(() => {
    if (speechText && autoSpeak) {
      setIsSpeaking(true);
      sound.speak(speechText, () => {
        setIsSpeaking(false);
      });
    }
  }, [speechText, autoSpeak]);

  const handleMiloClick = () => {
    sound.playGiggle();
    // Excited bounce animation
    setExcited(true);
    setTimeout(() => setExcited(false), 700);

    // Milo the voice teacher: every other tap he chats playfully,
    // otherwise he repeats his current teaching line.
    const nextTap = tapCount + 1;
    setTapCount(nextTap);
    const lineToSpeak =
      nextTap % 2 === 0
        ? MILO_FUN_PHRASES[Math.floor(Math.random() * MILO_FUN_PHRASES.length)]
        : speechText;

    if (lineToSpeak) {
      setIsSpeaking(true);
      sound.speak(lineToSpeak, () => {
        setIsSpeaking(false);
      });
    }
    onTap?.();
  };

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32 md:w-36 md:h-36',
    lg: 'w-44 h-44 md:w-52 md:h-52',
    giant: 'w-56 h-56 md:w-64 md:h-64',
  }[size];

  return (
    <div className="flex flex-col items-center select-none relative z-20">
      {/* Speech Bubble */}
      {showBubble && speechText && (
        <div 
          onClick={handleMiloClick}
          className="mb-3 max-w-sm md:max-w-md bg-white border-4 border-amber-300 rounded-3xl p-4 shadow-xl cursor-pointer hover:scale-102 transition-all duration-200 relative animate-bounce-subtle"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">💬</span>
            <p className="text-lg md:text-xl font-bubble font-semibold text-slate-800 leading-snug flex-1">
              {speechText}
            </p>
            <button 
              className={`p-2 rounded-full transition-transform ${isSpeaking ? 'bg-amber-400 text-white scale-110 animate-pulse' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}`}
              title="Listen again"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
          {/* Bubble tail */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[14px] border-t-amber-300" />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[12px] border-t-white" />
        </div>
      )}

      {/* Animated Milo Character (Cute Bunny with Ears, Whiskers, Bowtie) */}
      <div 
        onClick={handleMiloClick}
        className={`${sizeClasses} cursor-pointer group transition-transform duration-300 transform hover:scale-105 active:scale-95 relative ${excited ? 'animate-milo-boing' : 'animate-milo-bob'}`}
        title="Tap Milo to speak!"
      >
        {/* Tap-me hint */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-pink-500 text-white font-bubble font-extrabold text-xs px-3 py-1 rounded-full shadow-lg animate-bounce whitespace-nowrap z-10">
          🎙️ Tap me!
        </div>
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl overflow-visible">
          <defs>
            <linearGradient id="bunnyFur" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F1F5F9" />
            </linearGradient>
            <linearGradient id="earPink" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FDA4AF" />
              <stop offset="100%" stopColor="#F43F5E" />
            </linearGradient>
            <radialGradient id="cheekGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FB7185" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FB7185" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Left Ear */}
          <g className={`transition-transform duration-500 origin-[65px_80px] ${mood === 'celebrating' ? 'rotate-[-12deg]' : 'rotate-[-4deg]'}`}>
            <ellipse cx="65" cy="45" rx="16" ry="42" fill="url(#bunnyFur)" stroke="#E2E8F0" strokeWidth="3" />
            <ellipse cx="65" cy="48" rx="9" ry="30" fill="url(#earPink)" />
          </g>

          {/* Right Ear */}
          <g className={`transition-transform duration-500 origin-[135px_80px] ${mood === 'celebrating' ? 'rotate-[12deg]' : 'rotate-[4deg]'}`}>
            <ellipse cx="135" cy="45" rx="16" ry="42" fill="url(#bunnyFur)" stroke="#E2E8F0" strokeWidth="3" />
            <ellipse cx="135" cy="48" rx="9" ry="30" fill="url(#earPink)" />
          </g>

          {/* Bunny Head */}
          <ellipse cx="100" cy="115" rx="65" ry="58" fill="url(#bunnyFur)" stroke="#E2E8F0" strokeWidth="3" />

          {/* Cheerful Rosy Cheeks */}
          <circle cx="58" cy="126" r="14" fill="url(#cheekGlow)" />
          <circle cx="142" cy="126" r="14" fill="url(#cheekGlow)" />

          {/* Eyes */}
          {blink ? (
            // Blinking curved lines
            <>
              <path d="M 68 112 Q 78 118 88 112" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" fill="none" />
              <path d="M 112 112 Q 122 118 132 112" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" fill="none" />
            </>
          ) : mood === 'celebrating' || mood === 'happy' ? (
            // Happy squinting smiling eyes (^ ^)
            <>
              <path d="M 68 114 Q 78 102 88 114" stroke="#1E293B" strokeWidth="4.5" strokeLinecap="round" fill="none" />
              <path d="M 112 114 Q 122 102 132 114" stroke="#1E293B" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            </>
          ) : (
            // Large cute glistening eyes
            <>
              <circle cx="78" cy="110" r="10" fill="#1E293B" />
              <circle cx="75" cy="107" r="3.5" fill="#FFFFFF" />
              <circle cx="81" cy="113" r="1.8" fill="#FFFFFF" />

              <circle cx="122" cy="110" r="10" fill="#1E293B" />
              <circle cx="119" cy="107" r="3.5" fill="#FFFFFF" />
              <circle cx="125" cy="113" r="1.8" fill="#FFFFFF" />
            </>
          )}

          {/* Cute Bunny Nose */}
          <polygon points="100,123 93,116 107,116" fill="#F43F5E" />

          {/* Mouth (animated open/close when speaking) */}
          {isSpeaking ? (
            <path 
              d="M 90 127 Q 100 142 110 127 Z" 
              fill="#BE123C" 
              stroke="#1E293B" 
              strokeWidth="2.5" 
              className="animate-pulse"
            />
          ) : (
            <path d="M 92 124 Q 100 132 100 128 Q 100 132 108 124" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" fill="none" />
          )}

          {/* Cute Whiskers */}
          <line x1="42" y1="120" x2="22" y2="116" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="42" y1="126" x2="20" y2="128" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="158" y1="120" x2="178" y2="116" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="158" y1="126" x2="180" y2="128" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />

          {/* Cheerful Golden Bowtie */}
          <g transform="translate(100, 168)">
            <polygon points="-16,-10 0,0 -16,10" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
            <polygon points="16,-10 0,0 16,10" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="5" fill="#EF4444" />
          </g>
        </svg>

        {/* Floating Sparkle if celebrating */}
        {(mood === 'celebrating' || mood === 'happy') && (
          <div className="absolute -top-3 -right-2 text-amber-400 animate-spin">
            <Sparkles className="w-8 h-8 fill-amber-300" />
          </div>
        )}
      </div>
    </div>
  );
};
