import React, { useState } from 'react';
import { GameActivity, VisualObject, TargetBucket } from '../../types';
import { sound } from '../../audio/soundEngine';
import { Check, Sparkles } from 'lucide-react';

interface ColorMatchProps {
  activity: GameActivity;
  onSelectAnswer: (selectedId: string) => void;
  disabled?: boolean;
}

export const ColorMatch: React.FC<ColorMatchProps> = ({
  activity,
  onSelectAnswer,
  disabled = false,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Record<string, string>>({}); // item_id -> bucket_color

  const targets: TargetBucket[] = activity.targets || [
    { color: 'red', label: 'Red Bucket', icon: '🪣', target_color: '#EF4444' },
    { color: 'blue', label: 'Blue Bucket', icon: '🪣', target_color: '#3B82F6' },
    { color: 'yellow', label: 'Yellow Bucket', icon: '🪣', target_color: '#EAB308' },
  ];

  const handleItemClick = (item: VisualObject) => {
    if (disabled || matchedPairs[item.id]) return;
    sound.playPop();
    setSelectedItemId(item.id);
    sound.speak(`You picked the ${item.label}! Now tap its matching bucket!`);
  };

  const handleBucketClick = (bucket: TargetBucket) => {
    if (disabled || !selectedItemId) return;

    const item = activity.objects.find(obj => obj.id === selectedItemId);
    if (!item) return;

    if (item.color?.toLowerCase() === bucket.color.toLowerCase()) {
      // Correct match!
      sound.playSuccessChime();
      const updated = { ...matchedPairs, [item.id]: bucket.color };
      setMatchedPairs(updated);
      setSelectedItemId(null);

      // Check if all matched
      if (Object.keys(updated).length === activity.objects.length) {
        sound.speak("Woohoo! You matched every color perfectly!");
        setTimeout(() => {
          onSelectAnswer('all_matched');
        }, 800);
      } else {
        sound.speak(`Yes! ${item.label} matches ${bucket.label}! Great job!`);
      }
    } else {
      // Gentle mismatch feedback
      sound.playGentleEncouragement();
      sound.speak(`Almost! The ${item.label} is ${item.color}. Look for the ${item.color} bucket!`);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Activity Instruction */}
      <div className="bg-amber-100 border-3 border-amber-300 rounded-3xl px-6 py-3 mb-6 shadow-md max-w-lg w-full text-center">
        <p className="font-bubble font-bold text-xl md:text-2xl text-amber-950">
          {activity.instruction}
        </p>
        <p className="font-bubble text-sm text-amber-800 mt-0.5">
          Tap a toy, then tap its matching paint bucket!
        </p>
      </div>

      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left Column: Toys */}
        <div className="flex flex-col items-center gap-4 bg-white/70 p-5 rounded-3xl border-3 border-sky-200 shadow-lg">
          <h3 className="font-bubble font-bold text-lg text-sky-900 flex items-center gap-2">
            <span>🧸 Colorful Toys</span>
          </h3>
          <div className="flex flex-wrap md:flex-col gap-3.5 justify-center w-full">
            {activity.objects.map((item) => {
              const isMatched = !!matchedPairs[item.id];
              const isSelected = selectedItemId === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  disabled={isMatched || disabled}
                  className={`flex items-center gap-4 p-3.5 rounded-2xl border-4 transition-all duration-200 select-none w-full ${
                    isMatched
                      ? 'bg-emerald-50 border-emerald-400 opacity-80'
                      : isSelected
                      ? 'bg-amber-100 border-amber-400 scale-105 ring-4 ring-amber-300/80 shadow-md'
                      : 'bg-white border-slate-200 hover:border-amber-300 hover:scale-102 shadow-sm'
                  }`}
                >
                  <span className="text-4xl">{item.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="font-bubble font-bold text-lg text-slate-800">{item.label}</div>
                    <div className="text-xs font-semibold capitalize text-slate-500">{item.color}</div>
                  </div>
                  {isMatched && <Check className="w-6 h-6 text-emerald-600 font-bold" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Buckets */}
        <div className="flex flex-col items-center gap-4 bg-white/70 p-5 rounded-3xl border-3 border-amber-200 shadow-lg">
          <h3 className="font-bubble font-bold text-lg text-amber-900 flex items-center gap-2">
            <span>🎨 Paint Buckets</span>
          </h3>
          <div className="flex flex-wrap md:flex-col gap-3.5 justify-center w-full">
            {targets.map((bucket) => {
              const matchCount = Object.values(matchedPairs).filter(c => c === bucket.color).length;
              return (
                <button
                  key={bucket.color}
                  onClick={() => handleBucketClick(bucket)}
                  disabled={disabled}
                  className="flex items-center gap-4 p-3.5 rounded-2xl border-4 transition-all duration-200 select-none w-full bg-white hover:scale-105 shadow-sm active:scale-95"
                  style={{ borderColor: bucket.target_color }}
                >
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner text-white font-bold"
                    style={{ backgroundColor: bucket.target_color }}
                  >
                    {bucket.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-bubble font-bold text-lg text-slate-800">{bucket.label}</div>
                    <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: bucket.target_color }}>
                      {bucket.color}
                    </div>
                  </div>
                  {matchCount > 0 && (
                    <div className="flex items-center gap-1 bg-amber-100 text-amber-800 font-bold px-2 py-1 rounded-full text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{matchCount}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
