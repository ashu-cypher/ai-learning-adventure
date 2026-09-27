import React from 'react';
import { WorldSummary, StageSummary } from '../../types';
import { Lock, Star, Sparkles, CheckCircle2, Play } from 'lucide-react';
import { sound } from '../../audio/soundEngine';

interface ProgressMapProps {
  worlds: WorldSummary[];
  activeWorldId: string;
  onSelectWorld: (worldId: string) => void;
  onSelectStage: (worldId: string, stageId: string) => void;
}

export const ProgressMap: React.FC<ProgressMapProps> = ({
  worlds,
  activeWorldId,
  onSelectWorld,
  onSelectStage,
}) => {
  const currentWorld = worlds.find(w => w.id === activeWorldId) || worlds[0];

  const handleStageClick = (stage: StageSummary) => {
    if (stage.status === 'locked') {
      sound.playGentleEncouragement();
      sound.speak("This stage is locked! Let's finish the earlier stages first!");
      return;
    }
    sound.playPop();
    onSelectStage(currentWorld.id, stage.id);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 flex flex-col items-center">
      {/* World Tabs Selector */}
      <div className="w-full flex items-center justify-start sm:justify-center gap-3 overflow-x-auto pb-4 scrollbar-none">
        {worlds.map((world) => {
          const isActive = world.id === activeWorldId;
          return (
            <button
              key={world.id}
              onClick={() => {
                sound.playPop();
                onSelectWorld(world.id);
              }}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-3xl font-bubble text-lg whitespace-nowrap transition-all duration-200 border-3 shadow-md ${
                isActive
                  ? 'bg-amber-400 border-amber-500 text-amber-950 scale-105 shadow-amber-200'
                  : world.is_unlocked
                  ? 'bg-white border-sky-200 text-slate-700 hover:border-amber-300'
                  : 'bg-slate-100 border-slate-200 text-slate-400 opacity-70'
              }`}
            >
              <span className="text-2xl">{world.icon}</span>
              <span className="font-bold">{world.name.replace('World', '').replace('Kingdom', '')}</span>
              {!world.is_unlocked && <Lock className="w-4 h-4 text-slate-400" />}
            </button>
          );
        })}
      </div>

      {/* World Header Card */}
      <div className="w-full bg-gradient-to-r from-pink-400 via-rose-400 to-amber-300 rounded-3xl p-6 text-white shadow-xl mt-2 mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-4xl p-2 bg-white/20 rounded-2xl backdrop-blur-sm">{currentWorld.icon}</span>
            <div>
              <h1 className="font-bubble text-2xl md:text-3xl font-bold tracking-wide drop-shadow-sm">
                {currentWorld.name}
              </h1>
              <p className="text-pink-50 font-bubble text-base md:text-lg mt-0.5">
                {currentWorld.description}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 bg-white/20 backdrop-blur-md w-fit px-4 py-1.5 rounded-full text-sm font-bold">
            <Sparkles className="w-4 h-4 text-yellow-200" />
            <span>Completed: {currentWorld.completed_stages} of {currentWorld.total_stages} Stages</span>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-8 -bottom-10 w-44 h-44 bg-white/10 rounded-full pointer-events-none" />
      </div>

      {/* Adventure Path Stepping Stones */}
      <div className="w-full relative flex flex-col items-center gap-6 py-4">
        {currentWorld.stages.map((stage, idx) => {
          const isCurrent = stage.status === 'unlocked' && (idx === 0 || currentWorld.stages[idx - 1]?.status === 'completed');
          const isCompleted = stage.status === 'completed';
          const isLocked = stage.status === 'locked';

          // Zig-zag offset for winding adventure path effect
          const offsetClass = idx % 2 === 0 ? 'sm:-translate-x-12' : 'sm:translate-x-12';

          return (
            <div key={stage.id} className={`relative flex flex-col items-center ${offsetClass} transition-transform duration-300`}>
              {/* Connector line between stages */}
              {idx < currentWorld.stages.length - 1 && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 w-3 h-10 bg-amber-200 rounded-full -z-10 dashed" />
              )}

              {/* Milo Avatar indicator perched on current stage */}
              {isCurrent && (
                <div className="mb-2 bg-amber-400 text-amber-950 font-bubble font-bold text-xs md:text-sm px-3 py-1 rounded-full shadow-md animate-bounce flex items-center gap-1.5">
                  <span>🐰 Milo is here!</span>
                </div>
              )}

              {/* Stage Button */}
              <button
                onClick={() => handleStageClick(stage)}
                className={`group relative w-48 sm:w-56 p-4 rounded-3xl border-4 shadow-lg text-left transition-all duration-300 flex items-center gap-4 ${
                  isCompleted
                    ? 'bg-gradient-to-b from-emerald-50 to-emerald-100 border-emerald-400 hover:scale-105 active:scale-95'
                    : isCurrent
                    ? 'bg-gradient-to-b from-amber-50 to-amber-100 border-amber-400 ring-4 ring-amber-300/60 scale-105 shadow-amber-200 hover:scale-108 active:scale-98 animate-pulse-glow'
                    : 'bg-slate-100 border-slate-300 opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Stage Icon Circle */}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${
                  isCompleted ? 'bg-emerald-200' : isCurrent ? 'bg-amber-300' : 'bg-slate-200'
                }`}>
                  {isLocked ? <Lock className="w-6 h-6 text-slate-400" /> : stage.icon}
                </div>

                {/* Stage Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold font-bubble uppercase text-slate-500">
                      Stage {stage.stage_number}
                    </span>
                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <h3 className="font-bubble font-bold text-lg text-slate-800 leading-tight">
                    {stage.title}
                  </h3>

                  {/* Stars display */}
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3].map((starIdx) => (
                      <Star
                        key={starIdx}
                        className={`w-4 h-4 ${
                          starIdx <= stage.stars
                            ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Play action indicator */}
                {isCurrent && (
                  <div className="w-8 h-8 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-md">
                    <Play className="w-4 h-4 fill-amber-950 ml-0.5" />
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
