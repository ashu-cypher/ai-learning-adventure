import React, { useState, useEffect } from 'react';
import { LessonPlan, AssessmentResult, GameActivity } from '../../types';
import { MiloCompanion } from '../character/MiloCompanion';
import { ObjectSelection } from '../games/ObjectSelection';
import { ColorMatch } from '../games/ColorMatch';
import { ColorSort } from '../games/ColorSort';
import { CountingGame } from '../games/CountingGame';
import { SongScene } from '../games/SongScene';
import { StoryScene } from '../games/StoryScene';
import { CelebrationModal } from '../celebration/CelebrationModal';
import { SpeakButton } from '../audio/SpeakButton';
import { sound } from '../../audio/soundEngine';
import { api } from '../../services/api';
import { Eye, Volume2, Music, ArrowRight, HelpCircle } from 'lucide-react';

interface StageContainerProps {
  lesson: LessonPlan;
  onStageComplete: (nextStageId?: string) => void;
  onGoToMap: () => void;
}

type StagePhase = 'intro' | 'see_hear' | 'interlude' | 'play' | 'celebrating';

export const StageContainer: React.FC<StageContainerProps> = ({
  lesson,
  onStageComplete,
  onGoToMap,
}) => {
  const [phase, setPhase] = useState<StagePhase>('intro');
  const [currentActivity, setCurrentActivity] = useState<GameActivity>(lesson.activity);
  const [attemptCount, setAttemptCount] = useState(0);
  const [miloSpeech, setMiloSpeech] = useState(lesson.greeting);
  const [miloMood, setMiloMood] = useState<'idle' | 'speaking' | 'happy' | 'celebrating' | 'thinking' | 'encouraging'>('idle');
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Synchronize when lesson changes
  useEffect(() => {
    setCurrentActivity(lesson.activity);
    setPhase('intro');
    setAttemptCount(0);
    setAssessment(null);
    setShowCelebration(false);
    setMiloSpeech(lesson.greeting);
    setMiloMood('happy');
  }, [lesson]);

  const handleStartSeeHear = () => {
    sound.playPop();
    setPhase('see_hear');
    setMiloSpeech(`Look closely: this is ${lesson.concept.toUpperCase()}! ${lesson.teaching.fun_fact}`);
    setMiloMood('speaking');
  };

  const handleStartInterlude = () => {
    sound.playPop();
    setPhase('interlude');
    setMiloMood('idle');
  };

  const handleStartPlay = () => {
    sound.playPop();
    setPhase('play');
    setMiloSpeech(currentActivity.spoken_instruction);
    setMiloMood('speaking');
  };

  const handleHintClick = async () => {
    sound.playPop();
    try {
      const hintData = await api.fetchStageHint(lesson.world_id, lesson.stage_id, attemptCount + 1);
      setMiloSpeech(hintData.hint_text);
      setMiloMood('encouraging');
    } catch {
      setMiloSpeech(`Look for the bright ${lesson.concept} one! Milo knows you can do it!`);
    }
  };

  const handleAnswerSelected = async (selectedId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMiloMood('thinking');

    const nextAttempt = attemptCount + 1;
    setAttemptCount(nextAttempt);

    try {
      const result = await api.submitAnswer(lesson.world_id, lesson.stage_id, {
        world_id: lesson.world_id,
        stage_id: lesson.stage_id,
        concept: lesson.concept,
        selected_answer: selectedId,
        attempt_number: nextAttempt,
        difficulty: currentActivity.difficulty,
      });

      setAssessment(result);
      setMiloSpeech(result.ai_reaction);

      if (result.is_correct) {
        // Correct answer!
        sound.playLevelUp();
        sound.playYay();
        setMiloMood('celebrating');
        setTimeout(() => {
          setShowCelebration(true);
          setIsSubmitting(false);
        }, 600);
      } else {
        // Child needs assistance: NEVER shame, gently encourage
        sound.playOops();
        sound.playGentleEncouragement();
        setMiloMood('encouraging');
        setIsSubmitting(false);

        // If adaptation agent triggered simplification
        if (result.simplified_activity) {
          setCurrentActivity(result.simplified_activity);
        }
      }
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      // Friendly fallback if offline
      setMiloSpeech("Good try! Let's take another look together!");
      setMiloMood('encouraging');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 flex flex-col items-center select-none">
      {/* Stage Header Indicator */}
      <div className="w-full flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2 bg-white/90 border-2 border-sky-200 px-4 py-1.5 rounded-full shadow-sm">
          <span className="font-bubble font-bold text-sky-800 text-sm md:text-base">
            Stage {lesson.stage_number}: {lesson.stage_title}
          </span>
        </div>

        {/* Phase Pill Indicators */}
        <div className="flex items-center gap-1.5 bg-white/70 p-1 rounded-full shadow-sm">
          <div className={`px-2.5 py-0.5 rounded-full font-bubble text-xs font-bold ${
            phase === 'intro' ? 'bg-amber-400 text-amber-950' : 'text-slate-400'
          }`}>Start</div>
          <div className={`px-2.5 py-0.5 rounded-full font-bubble text-xs font-bold ${
            phase === 'see_hear' ? 'bg-amber-400 text-amber-950' : 'text-slate-400'
          }`}>Learn</div>
          <div className={`px-2.5 py-0.5 rounded-full font-bubble text-xs font-bold ${
            phase === 'play' ? 'bg-amber-400 text-amber-950' : 'text-slate-400'
          }`}>Play</div>
        </div>
      </div>

      {/* Milo AI Companion Section */}
      <div className="mb-6">
        <MiloCompanion
          speechText={miloSpeech}
          mood={miloMood}
          size={phase === 'intro' ? 'lg' : 'md'}
          showBubble={true}
        />
      </div>

      {/* PHASE 1: INTRO */}
      {phase === 'intro' && (
        <div className="w-full max-w-lg bg-gradient-to-br from-amber-200 via-rose-200 to-pink-300 border-4 border-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col items-center text-center animate-pop-in">
          <div className="text-6xl mb-3 animate-bounce">
            {lesson.teaching.see_objects[0]?.icon || '🌟'}
          </div>
          <h2 className="font-bubble font-extrabold text-3xl text-slate-800 mb-2">
            Let's Explore {lesson.concept.toUpperCase()}! 🎉
          </h2>
          <p className="font-bubble text-lg text-slate-700 mb-6 font-bold">
            Join Milo on an exciting color discovery!
          </p>

          <button
            onClick={handleStartSeeHear}
            className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bubble font-extrabold text-2xl rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 animate-wiggle"
          >
            <span>Let's Start!</span>
            <ArrowRight className="w-7 h-7" />
          </button>
        </div>
      )}

      {/* PHASE 2: SEE & HEAR TEACHING */}
      {phase === 'see_hear' && (
        <div className="w-full max-w-2xl bg-gradient-to-br from-sky-200 via-cyan-100 to-teal-200 border-4 border-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col items-center animate-pop-in">
          <div className="flex items-center gap-2 mb-4 bg-sky-100 text-sky-900 px-4 py-1.5 rounded-full font-bubble font-bold text-sm">
            <Eye className="w-4 h-4" />
            <span>SEE & HEAR</span>
          </div>

          <h2 className="font-bubble font-bold text-2xl sm:text-3xl text-slate-800 text-center mb-6">
            Things that are {lesson.concept.toUpperCase()}:
          </h2>

          {/* Large Visual Objects Showcase */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-8">
            {lesson.teaching.see_objects.map((obj) => (
              <div
                key={obj.id}
                onClick={() => {
                  sound.playPop();
                  sound.speak(`${obj.label}! This is ${lesson.concept}!`);
                }}
                className="bg-sky-50 border-3 border-sky-200 rounded-2xl p-4 flex flex-col items-center cursor-pointer hover:scale-105 active:scale-95 transition-transform shadow-sm"
              >
                <span className="text-6xl mb-2">{obj.icon}</span>
                <span className="font-bubble font-bold text-lg text-slate-800">{obj.label}</span>
                <span className="text-xs font-semibold uppercase text-sky-600 mt-0.5 flex items-center gap-1">
                  <Volume2 className="w-3 h-3" /> Tap to hear
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 w-full justify-center">
            {/* Sing along button if song lyrics available */}
            {lesson.teaching.song_lyrics && (
              <button
                onClick={handleStartInterlude}
                className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-bubble font-bold text-lg px-6 py-3.5 rounded-2xl shadow-md active:scale-95 transition-transform"
              >
                <Music className="w-5 h-5" />
                <span>Sing Color Song!</span>
              </button>
            )}

            <button
              onClick={handleStartPlay}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bubble font-bold text-xl px-8 py-3.5 rounded-2xl shadow-lg active:scale-95 transition-transform"
            >
              <span>Play Mini-Game!</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* PHASE 3: INTERLUDE (SONG OR STORY) */}
      {phase === 'interlude' && (
        <div className="animate-fade-in w-full flex justify-center">
          <SongScene
            concept={lesson.concept}
            lyrics={lesson.teaching.song_lyrics}
            onDone={handleStartPlay}
          />
        </div>
      )}

      {/* PHASE 4: PLAY MINI-GAME */}
      {phase === 'play' && (
        <div className="w-full flex flex-col items-center animate-fade-in">
          {/* Game Component based on visual_type */}
          {currentActivity.visual_type === 'color_match' ? (
            <ColorMatch
              activity={currentActivity}
              onSelectAnswer={handleAnswerSelected}
              disabled={isSubmitting}
            />
          ) : currentActivity.visual_type === 'color_sort' ? (
            <ColorSort
              activity={currentActivity}
              onSelectAnswer={handleAnswerSelected}
              disabled={isSubmitting}
            />
          ) : currentActivity.visual_type === 'counting_game' ? (
            <CountingGame
              activity={currentActivity}
              onSelectAnswer={handleAnswerSelected}
              disabled={isSubmitting}
            />
          ) : currentActivity.visual_type === 'story_scene' ? (
            <StoryScene
              concept={lesson.concept}
              storyText={lesson.teaching.story_snippet}
              onDone={() => handleAnswerSelected(currentActivity.correct_answer)}
            />
          ) : (
            <ObjectSelection
              activity={currentActivity}
              onSelectAnswer={handleAnswerSelected}
              disabled={isSubmitting}
            />
          )}

          {/* Bottom Hint Helper Button */}
          <div className="mt-8 flex items-center gap-3">
            <button
              onClick={handleHintClick}
              className="flex items-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border-2 border-amber-300 font-bubble font-bold px-4 py-2 rounded-2xl shadow-sm active:scale-95 transition-transform"
            >
              <HelpCircle className="w-5 h-5 text-amber-700" />
              <span>Ask Milo for a Hint</span>
            </button>

            {/* Quick sing-along link */}
            {lesson.teaching.song_lyrics && (
              <button
                onClick={() => setPhase('interlude')}
                className="flex items-center gap-1.5 bg-violet-100 hover:bg-violet-200 text-violet-900 border-2 border-violet-300 font-bubble font-bold px-4 py-2 rounded-2xl shadow-sm active:scale-95 transition-transform"
              >
                <Music className="w-4 h-4 text-violet-700" />
                <span>Sing Song</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* PHASE 5: CELEBRATION MODAL */}
      {showCelebration && assessment && (
        <CelebrationModal
          stageTitle={lesson.stage_title}
          concept={lesson.concept}
          starsEarned={assessment.stars_earned || 3}
          nextStageId={assessment.next_stage_id}
          onNextStage={() => onStageComplete(assessment.next_stage_id)}
          onGoToMap={onGoToMap}
        />
      )}

      {/* Floating push-to-speak button: tap any time to hear Milo's instruction */}
      <SpeakButton englishText={miloSpeech} />
    </div>
  );
};
