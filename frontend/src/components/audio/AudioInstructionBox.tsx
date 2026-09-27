import React, { useCallback, useEffect, useState } from 'react';
import { Volume2, RotateCcw } from 'lucide-react';
import { sound } from '../../audio/soundEngine';
import { useKidSettings } from '../../engine/settingsStore';

interface AudioInstructionBoxProps {
  /** Instruction text spoken/shown in English */
  englishText: string;
  /** Instruction text spoken/shown in Hindi */
  hindiText: string;
  /** Speak automatically on mount and when the language changes. Default true. */
  autoPlay?: boolean;
}

/**
 * Big, colorful instruction box for preschoolers.
 * Speaks the instruction out loud in the globally chosen language
 * (Settings > Language) — the child just taps the giant speaker button
 * to hear it again.
 */
export const AudioInstructionBox: React.FC<AudioInstructionBoxProps> = ({
  englishText,
  hindiText,
  autoPlay = true,
}) => {
  const { lang } = useKidSettings();
  const [isSpeaking, setIsSpeaking] = useState(false);

  const currentText = lang === 'hi' ? hindiText : englishText;

  const speakNow = useCallback((text: string) => {
    setIsSpeaking(true);
    sound.speak(text, lang, () => setIsSpeaking(false));
  }, [lang]);

  // Speak on mount and whenever the language or text changes
  useEffect(() => {
    if (autoPlay) {
      speakNow(currentText);
    }
    return () => {
      sound.stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, englishText, hindiText, autoPlay]);

  const handleReplay = () => {
    sound.playPop();
    speakNow(currentText);
  };

  return (
    <div className="w-full max-w-xl mx-auto select-none">
      <div className="bg-gradient-to-br from-amber-300 via-orange-300 to-pink-300 rounded-3xl border-4 border-white shadow-xl p-4 sm:p-5">
        {/* Instruction text + giant speaker button */}
        <div className="flex items-center gap-4 bg-white/80 rounded-2xl p-4">
          <button
            type="button"
            onClick={handleReplay}
            aria-label={isSpeaking ? 'Speaking…' : 'Listen to the instruction'}
            className={`shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center border-4 border-orange-400 shadow-lg transition-transform active:scale-90 ${
              isSpeaking
                ? 'bg-orange-400 animate-pulse'
                : 'bg-gradient-to-br from-yellow-300 to-orange-400 hover:scale-105'
            }`}
          >
            <Volume2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </button>
          <p className="font-bubble font-bold text-xl sm:text-2xl text-orange-950 leading-snug">
            {currentText}
          </p>
        </div>

        {/* Replay row */}
        <button
          type="button"
          onClick={handleReplay}
          className="mt-3 w-full min-h-[56px] rounded-2xl bg-white/70 hover:bg-white font-bubble font-extrabold text-lg text-orange-800 border-2 border-white flex items-center justify-center gap-2 transition-transform active:scale-95"
        >
          <RotateCcw className="w-6 h-6" />
          {lang === 'hi' ? 'फिर से सुनो' : 'Listen Again'}
        </button>
      </div>
    </div>
  );
};
