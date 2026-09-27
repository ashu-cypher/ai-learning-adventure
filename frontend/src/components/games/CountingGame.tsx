import React, { useState } from 'react';
import { GameActivity } from '../../types';
import { sound } from '../../audio/soundEngine';

interface CountingGameProps {
  activity: GameActivity;
  onSelectAnswer: (selectedId: string) => void;
  disabled?: boolean;
}

export const CountingGame: React.FC<CountingGameProps> = ({
  activity,
  onSelectAnswer,
  disabled = false,
}) => {
  const [countedCount, setCountedCount] = useState(0);

  const handleItemTap = () => {
    sound.playPop();
    const next = countedCount + 1;
    setCountedCount(next);
    sound.speak(`${next}!`);
  };

  const handleSelectNumber = (num: number) => {
    if (disabled) return;
    sound.playPop();
    onSelectAnswer(num.toString());
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="bg-amber-100 border-3 border-amber-300 rounded-3xl px-6 py-3.5 mb-8 shadow-md text-center max-w-lg w-full">
        <p className="font-bubble font-bold text-xl md:text-2xl text-amber-950">
          {activity.instruction}
        </p>
        <p className="font-bubble text-sm text-amber-800 mt-0.5">
          Tap items to count them! Then choose the right number!
        </p>
      </div>

      {/* Items to Count */}
      <div className="flex flex-wrap gap-6 justify-center max-w-xl mb-10">
        {activity.objects.map((obj, i) => (
          <button
            key={obj.id + i}
            onClick={handleItemTap}
            className="w-24 h-24 sm:w-28 sm:h-28 bg-white border-4 border-amber-200 rounded-3xl shadow-lg flex items-center justify-center text-6xl hover:scale-110 active:scale-95 transition-transform"
          >
            {obj.icon}
          </button>
        ))}
      </div>

      {/* Number Choices */}
      <div className="flex items-center gap-3 sm:gap-5 justify-center">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            onClick={() => handleSelectNumber(num)}
            disabled={disabled}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-white border-4 border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 rounded-3xl font-bubble font-bold text-3xl sm:text-4xl text-indigo-900 shadow-lg hover:scale-110 active:scale-95 transition-transform"
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );
};
