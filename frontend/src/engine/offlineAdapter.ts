import {
  WorldSummary,
  StageSummary,
  LessonPlan,
  AnswerSubmission,
  AssessmentResult,
  ParentDashboardData,
  GameActivity,
} from '../types';
import { generateLessonPlan, evaluateAnswer, simplifyActivity, CONCEPT_KNOWLEDGE } from './gameEngine';
import {
  getOrCreateStageProgress,
  recordAnswerAndUpdateProgress,
  getAllStageProgresses,
  getAllConceptMasteries,
  resetAllProgress,
  getOrCreateChild,
  getTotalStars,
} from './progressStore';

const WORLDS_CONFIG = [
  {
    id: 'colors',
    name: 'Rainbow Colors World',
    icon: '🌈',
    theme_color: 'from-pink-400 via-rose-400 to-amber-300',
    accent_color: '#EC4899',
    description: 'Discover vibrant red, cool blue, sunny yellow, and wonderful green!',
    is_unlocked: true,
  },
  {
    id: 'shapes',
    name: 'Magic Shapes Kingdom',
    icon: '🔷',
    theme_color: 'from-blue-400 via-indigo-400 to-cyan-300',
    accent_color: '#3B82F6',
    description: 'Roll with round circles, balance with squares, and discover pointy triangles!',
    is_unlocked: true,
  },
  {
    id: 'numbers',
    name: 'Number Jungle',
    icon: '🔢',
    theme_color: 'from-emerald-400 via-teal-400 to-yellow-300',
    accent_color: '#10B981',
    description: 'Count yummy apples, hopping frogs, and friendly jungle stars!',
    is_unlocked: false,
  },
  {
    id: 'alphabet',
    name: 'Alphabet Castle',
    icon: '🔤',
    theme_color: 'from-purple-400 via-violet-400 to-pink-300',
    accent_color: '#A855F7',
    description: 'Sing letters A, B, C and find out what wonderful words they make!',
    is_unlocked: false,
  },
  {
    id: 'animals',
    name: 'Animal Friends Safari',
    icon: '🐶',
    theme_color: 'from-amber-400 via-orange-400 to-yellow-200',
    accent_color: '#F59E0B',
    description: 'Hear the dog go woof, the cat go meow, and the elephant stomp!',
    is_unlocked: false,
  },
  {
    id: 'everyday',
    name: 'Everyday Explorer',
    icon: '🚀',
    theme_color: 'from-cyan-400 via-teal-400 to-emerald-300',
    accent_color: '#06B6D4',
    description: 'Explore daily routines, kindness, tooth brushing, and bedtime stars!',
    is_unlocked: false,
  },
];

const STAGES_CONFIG: Record<string, Array<{ id: string; title: string; concept: string; icon: string }>> = {
  colors: [
    { id: 'colors-1', title: 'Find Red', concept: 'red', icon: '🍎' },
    { id: 'colors-2', title: 'Find Blue', concept: 'blue', icon: '🦋' },
    { id: 'colors-3', title: 'Find Yellow', concept: 'yellow', icon: '🐥' },
    { id: 'colors-4', title: 'Find Green', concept: 'green', icon: '🐸' },
    { id: 'colors-5', title: 'Match Colors', concept: 'color_matching', icon: '🎨' },
    { id: 'colors-6', title: 'Color Sorting', concept: 'color_sorting', icon: '🧸' },
    { id: 'colors-7', title: 'Color Challenge', concept: 'color_challenge', icon: '🏆' },
  ],
  shapes: [
    { id: 'shapes-1', title: 'Round Circle', concept: 'circle', icon: '🔴' },
    { id: 'shapes-2', title: 'Square Box', concept: 'square', icon: '🟧' },
    { id: 'shapes-3', title: 'Triangle Wedge', concept: 'triangle', icon: '🔺' },
    { id: 'shapes-4', title: 'Match Shapes', concept: 'shape_matching', icon: '🔷' },
  ],
};

export const offlineAdapter = {
  fetchWorlds(childId = 'default-child'): WorldSummary[] {
    return WORLDS_CONFIG.map((w) => {
      const stageDefs = STAGES_CONFIG[w.id] || [];
      const stages: StageSummary[] = stageDefs.map((def, idx) => {
        const prog = getOrCreateStageProgress(childId, w.id, def.id);
        return {
          id: def.id,
          world_id: w.id,
          stage_number: idx + 1,
          title: def.title,
          concept: def.concept,
          icon: def.icon,
          status: prog.status,
          stars: prog.stars,
          mastery_score: prog.mastery_score,
        };
      });

      const completed = stages.filter((s) => s.status === 'completed').length;
      return {
        id: w.id,
        name: w.name,
        icon: w.icon,
        theme_color: w.theme_color,
        accent_color: w.accent_color,
        description: w.description,
        is_unlocked: w.is_unlocked,
        total_stages: stages.length,
        completed_stages: completed,
        stages,
      };
    });
  },

  fetchStageLesson(worldId: string, stageId: string, childId = 'default-child'): LessonPlan {
    const stageDefs = STAGES_CONFIG[worldId] || [];
    const stageIdx = stageDefs.findIndex((s) => s.id === stageId);
    const def = stageDefs[stageIdx >= 0 ? stageIdx : 0] || {
      id: stageId,
      title: 'Adventure Stage',
      concept: 'red',
      icon: '⭐',
    };
    const prog = getOrCreateStageProgress(childId, worldId, stageId);
    const difficulty = prog.mistakes >= 2 ? 1 : 2;

    return generateLessonPlan(
      worldId,
      stageId,
      (stageIdx >= 0 ? stageIdx : 0) + 1,
      def.title,
      def.concept,
      difficulty,
      prog.mistakes
    );
  },

  submitAnswer(worldId: string, stageId: string, submission: AnswerSubmission): AssessmentResult {
    const childId = submission.child_id || 'default-child';
    const stageDefs = STAGES_CONFIG[worldId] || [];
    const stageIdx = stageDefs.findIndex((s) => s.id === stageId);
    const def = stageDefs[stageIdx >= 0 ? stageIdx : 0] || { concept: submission.concept };
    const prog = getOrCreateStageProgress(childId, worldId, stageId);

    // Determine correct answer
    const conceptData = CONCEPT_KNOWLEDGE[submission.concept] || CONCEPT_KNOWLEDGE[def.concept];
    const correctAnswer = conceptData ? conceptData.correct_id : submission.selected_answer;

    const evalResult = evaluateAnswer(
      submission.concept,
      submission.selected_answer,
      correctAnswer,
      prog.mistakes
    );

    const { prog: updatedProg, mast, stars_earned, next_stage_id } = recordAnswerAndUpdateProgress(
      childId,
      worldId,
      stageId,
      submission.concept,
      evalResult.is_correct
    );

    let simplifiedActivity: GameActivity | undefined;
    if (evalResult.next_action === 'retry_simplified') {
      const lesson = generateLessonPlan(worldId, stageId, stageIdx + 1, '', submission.concept, 1, 2);
      simplifiedActivity = simplifyActivity(lesson.activity);
    }

    return {
      is_correct: evalResult.is_correct,
      ai_reaction: evalResult.ai_reaction,
      spoken_feedback: evalResult.spoken_feedback,
      hint: conceptData?.hint,
      visual_help_glow_id: evalResult.is_correct ? undefined : correctAnswer,
      next_action: evalResult.next_action === 'celebrate' && updatedProg.status === 'completed'
        ? 'celebrate'
        : evalResult.next_action,
      stage_completed: evalResult.is_correct,
      stars_earned,
      current_mastery: mast.mastery,
      attempts: updatedProg.attempts,
      mistakes: updatedProg.mistakes,
      concept: submission.concept,
      next_stage_id: next_stage_id || undefined,
      simplified_activity: simplifiedActivity,
    };
  },

  fetchStageHint(worldId: string, stageId: string, _attempt = 1): { hint_text: string; spoken_hint: string } {
    const stageDefs = STAGES_CONFIG[worldId] || [];
    const def = stageDefs.find((s) => s.id === stageId);
    const concept = def ? def.concept : 'red';
    const data = CONCEPT_KNOWLEDGE[concept] || CONCEPT_KNOWLEDGE['red'];
    return {
      hint_text: data.hint,
      spoken_hint: data.hint,
    };
  },

  fetchSimplifiedActivity(worldId: string, stageId: string, childId = 'default-child'): GameActivity {
    const lesson = this.fetchStageLesson(worldId, stageId, childId);
    return simplifyActivity(lesson.activity);
  },

  fetchParentDashboard(childId = 'default-child'): ParentDashboardData {
    const child = getOrCreateChild(childId);
    const stages = getAllStageProgresses(childId);
    const masteries = getAllConceptMasteries(childId);
    const completedStages = stages.filter((s) => s.status === 'completed').length;
    const totalAvailable = 11; // 7 colors + 4 shapes

    const needingPractice = masteries.filter((m) => m.needs_practice).map((m) => m.concept);

    return {
      child_id: child.id,
      child_name: child.name,
      total_stars: getTotalStars(childId),
      current_world: child.current_world_id,
      total_stages_completed: completedStages,
      total_stages_available: totalAvailable,
      overall_progress_percentage: Math.round((completedStages / totalAvailable) * 100),
      concept_masteries: masteries.map((m) => ({
        concept: m.concept,
        world_id: m.world_id,
        mastery: m.mastery,
        attempts: m.attempts,
        mistakes: m.mistakes,
        correct_answers: m.correct_answers,
        needs_practice: m.needs_practice,
        last_practiced: m.last_practiced,
      })),
      concepts_needing_practice: needingPractice,
      recommended_activities: needingPractice.length > 0
        ? needingPractice.map((c) => `Practice ${c} with Milo!`)
        : ['Explore Magic Shapes Kingdom', 'Review Rainbow Colors'],
      ai_companion_notes:
        completedStages > 0
          ? `Milo says: Great job! You have explored ${completedStages} learning stages so far!`
          : 'Milo is excited to start the learning journey with you!',
    };
  },

  resetProgress(childId = 'default-child'): void {
    resetAllProgress(childId);
  },
};
