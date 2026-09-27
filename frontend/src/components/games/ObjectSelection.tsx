import React, { useState } from 'react';
import { GameActivity, VisualObject } from '../../types';
import { sound } from '../../audio/soundEngine';
import { Sparkles, Mic, MicOff } from 'lucide-react';

interface ObjectSelectionProps {
  activity: GameActivity;
  onSelectAnswer: (selectedId: string) => void;
  disabled?: boolean;
}

export const ObjectSelection: React.FC<ObjectSelectionProps> = ({
  activity,
  onSelectAnswer,
  disabled = false,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const handleItemClick = (obj: VisualObject) => {
    if (disabled) return;
    sound.playPop();
    setSelectedId(obj.id);
    onSelectAnswer(obj.id);
  };

  // Optional voice recognition for nursery children
  const handleToggleVoiceInput = () => {
    // Check Web Speech Recognition support
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition || 
                              (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      sound.speak("Voice recognition is not available in this browser. You can tap the big picture!");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      sound.playPop();

      recognition.onresult = (event: any) => {
        setIsListening(false);
        const transcript = event.results[0][0].transcript.toLowerCase();
        // Match spoken word to object labels or colors
        const match = activity.objects.find(obj => 
          transcript.includes(obj.name.toLowerCase()) || 
          transcript.includes(obj.color?.toLowerCase() || '') ||
          transcript.includes(obj.label.toLowerCase())
        );

        if (match) {
          handleItemClick(match);
        } else {
          sound.playGentleEncouragement();
          sound.speak(`You said "${transcript}". Tap the picture to choose!`);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Activity Prompt Banner */}
      <div className="bg-amber-100 border-3 border-amber-300 rounded-3xl px-6 py-3.5 mb-8 shadow-md flex items-center justify-between gap-4 max-w-lg w-full">
        <p className="font-bubble font-bold text-xl md:text-2xl text-amber-950 text-center flex-1 leading-snug">
          {activity.instruction}
        </p>

        {/* Voice Input Button */}
        <button
          onClick={handleToggleVoiceInput}
          className={`p-3 rounded-2xl transition-all shadow-md ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse ring-4 ring-rose-300'
              : 'bg-white text-indigo-600 hover:bg-indigo-50 border-2 border-indigo-200'
          }`}
          title={isListening ? 'Listening... Speak now!' : 'Or say your answer!'}
        >
          {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
        </button>
      </div>

      {/* Grid of Large Touchable Objects */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-3xl justify-items-center">
        {activity.objects.map((obj) => {
          const isSelected = selectedId === obj.id;
          const isHighlighted = obj.highlight;

          return (
            <button
              key={obj.id}
              onClick={() => handleItemClick(obj)}
              disabled={disabled}
              className={`group relative w-full aspect-square max-w-[170px] md:max-w-[190px] rounded-3xl p-4 flex flex-col items-center justify-center border-4 transition-all duration-300 select-none shadow-lg active:scale-95 ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50 scale-105 shadow-indigo-200'
                  : isHighlighted
                  ? 'border-amber-400 bg-amber-50 ring-8 ring-amber-300/80 animate-pulse-glow scale-105'
                  : 'border-white bg-white hover:border-amber-300 hover:scale-105 hover:shadow-xl'
              }`}
            >
              {/* Glow Helper Label if assisted */}
              {isHighlighted && (
                <div className="absolute -top-3.5 bg-amber-400 text-amber-950 font-bubble text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1 animate-bounce">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Look Here!</span>
                </div>
              )}

              {/* Big Illustration/Emoji */}
              <div className="text-6xl md:text-7xl group-hover:scale-110 transition-transform duration-200 filter drop-shadow-md">
                {obj.icon}
              </div>

              {/* Friendly Label */}
              <span className="mt-3 font-bubble font-bold text-lg md:text-xl text-slate-800 text-center leading-tight">
                {obj.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
