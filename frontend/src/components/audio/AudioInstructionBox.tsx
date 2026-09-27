import React, { useCallback, useEffect, useState } from 'react';
import { Volume2, RotateCcw, Languages } from 'lucide-react';
import { sound, type SpeechLang } from '../../audio/soundEngine';

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
 * Speaks the instruction out loud in English or Hindi and lets the
 * child replay it by tapping the giant speaker button.
 */
export const AudioInstructionBox: React.FC<AudioInstructionBoxProps> = ({
  englishText,
  hindiText,
  autoPlay = true,
}) => {
  const [lang, setLang] = useState<SpeechLang>('en');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const currentText = lang === 'hi' ? hindiText : englishText;

  const speakNow = useCallback(
    (text: string, language: SpeechLang) => {
      setIsSpeaking(true);
      sound.speak(text, language, () => setIsSpeaking(false));
    },
    []
  );

  // Speak on mount and whenever the language or text changes
  useEffect(() => {
    if (autoPlay) {
      speakNow(currentText, lang);
    }
    return () => {
      sound.stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, englishText, hindiText, autoPlay]);

  const handleReplay = () => {
    sound.playPop();
    speakNow(currentText, lang);
  };

  const handleLanguageChange = (next: SpeechLang) => {
    if (next === lang) {
      // Tapping the active language just replays the instruction
      handleReplay();
      return;
    }
    sound.playPop();
    setLang(next);
  };

  return (
    <div className="w-full max-w-xl mx-auto select-none">
      <div className="bg-gradient-to-br from-amber-300 via-orange-300 to-pink-300 rounded-3xl border-4 border-white shadow-xl p-4 sm:p-5">
        {/* Language toggle — big flags/text for little fingers */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <Languages className="w-6 h-6 text-orange-900" />
          <button
            type="button"
            onClick={() => handleLanguageChange('en')}
            aria-pressed={lang === 'en'}
            className={`min-h-[56px] px-6 rounded-2xl font-bubble font-extrabold text-xl border-4 transition-transform active:scale-95 ${
              lang === 'en'
                ? 'bg-white text-orange-700 border-orange-500 shadow-md scale-105'
                : 'bg-white/60 text-orange-900/70 border-white/70'
            }`}
          >
            🇬🇧 English
          </button>
          <button
            type="button"
            onClick={() => handleLanguageChange('hi')}
            aria-pressed={lang === 'hi'}
            className={`min-h-[56px] px-6 rounded-2xl font-bubble font-extrabold text-xl border-4 transition-transform active:scale-95 ${
              lang === 'hi'
                ? 'bg-white text-orange-700 border-orange-500 shadow-md scale-105'
                : 'bg-white/60 text-orange-900/70 border-white/70'
            }`}
          >
            🇮🇳 हिंदी
          </button>
        </div>

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
