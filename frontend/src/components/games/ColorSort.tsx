import React, { useState } from 'react';
import { GameActivity, VisualObject, TargetBucket } from '../../types';
import { sound } from '../../audio/soundEngine';

interface ColorSortProps {
  activity: GameActivity;
  onSelectAnswer: (selectedId: string) => void;
  disabled?: boolean;
}

export const ColorSort: React.FC<ColorSortProps> = ({
  activity,
  onSelectAnswer,
  disabled = false,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [sortedItems, setSortedItems] = useState<Record<string, string>>({}); // item_id -> chest_color

  const chests: TargetBucket[] = activity.targets || [
    { color: 'red', label: 'Red Chest', icon: '🧰', target_color: '#EF4444' },
    { color: 'blue', label: 'Blue Chest', icon: '🧰', target_color: '#3B82F6' },
    { color: 'yellow', label: 'Yellow Chest', icon: '🧰', target_color: '#EAB308' },
  ];

  const remainingItems = activity.objects.filter(obj => !sortedItems[obj.id]);

  const handleItemSelect = (item: VisualObject) => {
    if (disabled) return;
    sound.playPop();
    setSelectedItemId(item.id);
    sound.speak(`Selected ${item.label}! Which treasure chest does it go into?`);
  };

  const handleChestSelect = (chest: TargetBucket) => {
    if (disabled || !selectedItemId) return;
    const item = activity.objects.find(obj => obj.id === selectedItemId);
    if (!item) return;

    if (item.color?.toLowerCase() === chest.color.toLowerCase()) {
      sound.playSuccessChime();
      const updated = { ...sortedItems, [item.id]: chest.color };
      setSortedItems(updated);
      setSelectedItemId(null);

      if (Object.keys(updated).length === activity.objects.length) {
        sound.speak("Hooray! Every toy is sorted into its chest!");
        setTimeout(() => {
          onSelectAnswer('all_sorted');
        }, 700);
      } else {
        sound.speak(`Awesome! ${item.label} goes into the ${chest.label}!`);
      }
    } else {
      sound.playGentleEncouragement();
      sound.speak(`Almost! That's a ${item.color} toy! Let's find the ${item.color} chest together!`);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="bg-amber-100 border-3 border-amber-300 rounded-3xl px-6 py-3 mb-6 shadow-md max-w-lg w-full text-center">
        <p className="font-bubble font-bold text-xl md:text-2xl text-amber-950">
          {activity.instruction}
        </p>
        <p className="font-bubble text-sm text-amber-800 mt-0.5">
          Tap a toy, then tap its matching color treasure chest!
        </p>
      </div>

      {/* Toys to Sort */}
      <div className="w-full max-w-xl bg-white/80 p-5 rounded-3xl border-3 border-sky-200 shadow-md mb-8 flex flex-col items-center">
        <span className="font-bubble font-bold text-slate-700 mb-3">
          {remainingItems.length > 0 ? 'Toys to Sort:' : 'All toys sorted! 🎉'}
        </span>
        <div className="flex flex-wrap gap-4 justify-center">
          {remainingItems.map((item) => {
            const isSelected = selectedItemId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemSelect(item)}
                disabled={disabled}
                className={`p-4 rounded-2xl border-4 transition-all duration-200 flex flex-col items-center shadow-md select-none ${
                  isSelected
                    ? 'bg-amber-200 border-amber-500 scale-110 ring-4 ring-amber-300'
                    : 'bg-white border-slate-200 hover:border-amber-300 hover:scale-105'
                }`}
              >
                <span className="text-5xl">{item.icon}</span>
                <span className="font-bubble font-bold text-sm text-slate-800 mt-2">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Treasure Chests */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        {chests.map((chest) => {
          const itemsInChest = Object.entries(sortedItems).filter(([, c]) => c === chest.color);

          return (
            <button
              key={chest.color}
              onClick={() => handleChestSelect(chest)}
              disabled={disabled}
              className="p-5 rounded-3xl border-4 bg-white/90 hover:bg-white shadow-lg flex flex-col items-center gap-3 transition-transform hover:scale-105 active:scale-95"
              style={{ borderColor: chest.target_color }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner text-white"
                style={{ backgroundColor: chest.target_color }}
              >
                {chest.icon}
              </div>
              <span className="font-bubble font-bold text-lg text-slate-800">{chest.label}</span>

              {/* Items currently in this chest */}
              <div className="flex flex-wrap gap-1.5 justify-center min-h-[30px] w-full bg-slate-50 rounded-xl p-2">
                {itemsInChest.length === 0 ? (
                  <span className="text-xs text-slate-400 font-bubble">Empty</span>
                ) : (
                  itemsInChest.map(([itemId]) => {
                    const obj = activity.objects.find(o => o.id === itemId);
                    return (
                      <span key={itemId} className="text-2xl" title={obj?.label}>
                        {obj?.icon}
                      </span>
                    );
                  })
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
