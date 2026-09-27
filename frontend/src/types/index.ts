export interface VisualObject {
  id: string;
  name: string;
  label: string;
  color?: string;
  shape?: string;
  icon: string;
  size?: 'normal' | 'large' | 'giant';
  sound_cue?: string;
  highlight?: boolean;
  is_target?: boolean;
}

export interface TargetBucket {
  color: string;
  label: string;
  icon: string;
  target_color: string;
}

export interface TeachingContent {
  concept: string;
  see_objects: VisualObject[];
  hear_text: string;
  spoken_text: string;
  fun_fact: string;
  song_lyrics?: string;
  story_snippet?: string;
}

export interface GameActivity {
  visual_type: 'object_selection' | 'color_match' | 'color_sort' | 'counting_game' | 'story_scene' | 'song_scene';
  instruction: string;
  spoken_instruction: string;
  objects: VisualObject[];
  targets?: TargetBucket[];
  correct_answer: string;
  difficulty: number;
  hint_text: string;
  spoken_hint: string;
}

export interface LessonPlan {
  world_id: string;
  world_name: string;
  stage_id: string;
  stage_number: number;
  stage_title: string;
  concept: string;
  greeting: string;
  spoken_greeting: string;
  teaching: TeachingContent;
  activity: GameActivity;
}

export interface AnswerSubmission {
  child_id?: string;
  world_id: string;
  stage_id: string;
  concept: string;
  selected_answer: string;
  attempt_number: number;
  difficulty?: number;
}

export interface AssessmentResult {
  is_correct: boolean;
  ai_reaction: string;
  spoken_feedback: string;
  hint?: string;
  visual_help_glow_id?: string;
  next_action: 'celebrate' | 'retry_same' | 'retry_simplified' | 'next_stage';
  stage_completed: boolean;
  stars_earned: number;
  current_mastery: number;
  attempts: number;
  mistakes: number;
  concept: string;
  next_stage_id?: string;
  simplified_activity?: GameActivity;
}

export interface StageSummary {
  id: string;
  world_id: string;
  stage_number: number;
  title: string;
  concept: string;
  icon: string;
  status: 'locked' | 'unlocked' | 'completed';
  stars: number;
  mastery_score: number;
}

export interface WorldSummary {
  id: string;
  name: string;
  icon: string;
  theme_color: string;
  accent_color: string;
  description: string;
  is_unlocked: boolean;
  total_stages: number;
  completed_stages: number;
  stages: StageSummary[];
}

export interface ConceptMasteryItem {
  concept: string;
  world_id: string;
  mastery: float;
  attempts: number;
  mistakes: number;
  correct_answers: number;
  needs_practice: boolean;
  last_practiced?: string;
}

export interface ParentDashboardData {
  child_id: string;
  child_name: string;
  total_stars: number;
  current_world: string;
  total_stages_completed: number;
  total_stages_available: number;
  overall_progress_percentage: number;
  concept_masteries: ConceptMasteryItem[];
  concepts_needing_practice: string[];
  recommended_activities: string[];
  ai_companion_notes: string;
}

type float = number;
