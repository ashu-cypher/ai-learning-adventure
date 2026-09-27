import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sound } from '../../audio/soundEngine';
import { useKidSettings } from '../../engine/settingsStore';

interface SpeakButtonProps {
  /** What Milo should say in English */
  englishText: string;
  /** What Milo should say in Hindi (optional — falls back to English) */
  hindiText?: string;
  /** Extra classes for positioning */
  className?: string;
}

/**
 * Big floating push-to-speak button.
 * Always visible during play so the child can tap it any time to hear
 * what to do — in the language chosen in Settings. Tapping is a real
 * user gesture, which is exactly what Android needs to allow speech.
 */
export const SpeakButton: React.FC<SpeakButtonProps> = ({
  englishText,
  hindiText,
  className = '',
}) => {
  const { lang } = useKidSettings();
  const [speaking, setSpeaking] = useState(false);

  const text = lang === 'hi' && hindiText ? hindiText : englishText;

  const handleSpeak = () => {
    sound.playTap();
    setSpeaking(true);
    sound.speak(text, lang, () => setSpeaking(false));
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.stopSpeaking();
    setSpeaking(false);
  };

  return (
    <div className={`fixed bottom-6 right-5 z-40 flex flex-col items-center gap-2 ${className}`}>
      {/* The big push button */}
      <button
        onClick={handleSpeak}
        aria-label="Hear what to do"
        className={`relative w-20 h-20 rounded-full shadow-2xl border-4 active:scale-90 transition-transform flex items-center justify-center ${
          speaking
            ? 'bg-gradient-to-br from-amber-300 to-orange-400 border-white animate-ping-slow'
            : 'bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 border-white hover:scale-105'
        }`}
      >
        {/* Radiating rings while speaking */}
        {speaking && (
          <span className="absolute inset-0 rounded-full border-4 border-amber-300 animate-ping" />
        )}
        <Volume2 className="w-10 h-10 text-white drop-shadow-lg" />
        {/* Little "TAP ME" bounce hint */}
        {!speaking && (
          <span className="absolute -top-3 -right-2 bg-amber-400 text-amber-950 font-bubble font-extrabold text-xs px-2 py-0.5 rounded-full shadow animate-bounce">
            TAP ME! 👆
          </span>
        )}
      </button>

      {/* Stop button appears while speaking */}
      {speaking && (
        <button
          onClick={handleStop}
          aria-label="Stop speaking"
          className="bg-white/95 border-2 border-rose-300 text-rose-600 rounded-full p-2 shadow-lg active:scale-95 transition-transform"
        >
          <VolumeX className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
