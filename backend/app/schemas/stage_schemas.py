"""Pydantic schemas for stage lessons, visual activities, and assessments."""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class VisualObject(BaseModel):
    id: str
    name: str
    label: str
    color: Optional[str] = None
    shape: Optional[str] = None
    icon: str  # emoji or icon name (e.g. '🍎', 'balloon', 'star', 'car')
    size: str = "large"  # normal, large, giant
    sound_cue: Optional[str] = None
    highlight: bool = False
    is_target: bool = False

class TeachingContent(BaseModel):
    concept: str
    see_objects: List[VisualObject]
    hear_text: str
    spoken_text: str
    fun_fact: str
    song_lyrics: Optional[str] = None
    story_snippet: Optional[str] = None

class GameActivity(BaseModel):
    visual_type: str = Field(..., description="object_selection, color_match, color_sort, counting_game, story_scene, song_scene")
    instruction: str
    spoken_instruction: str
    objects: List[VisualObject]
    targets: Optional[List[Dict[str, Any]]] = None  # e.g. color buckets for match/sort
    correct_answer: str
    difficulty: int = 1  # 1 (simple), 2 (standard), 3 (advanced challenge)
    hint_text: str
    spoken_hint: str

class LessonPlan(BaseModel):
    world_id: str
    world_name: str
    stage_id: str
    stage_number: int
    stage_title: str
    concept: str
    greeting: str
    spoken_greeting: str
    teaching: TeachingContent
    activity: GameActivity

class AnswerSubmission(BaseModel):
    child_id: str = "default-child"
    world_id: str
    stage_id: str
    concept: str
    selected_answer: str
    attempt_number: int = 1
    difficulty: int = 1

class AssessmentResult(BaseModel):
    is_correct: bool
    ai_reaction: str
    spoken_feedback: str
    hint: Optional[str] = None
    visual_help_glow_id: Optional[str] = None
    next_action: str  # 'celebrate', 'retry_same', 'retry_simplified', 'next_stage'
    stage_completed: bool = False
    stars_earned: int = 0
    current_mastery: float = 0.0
    attempts: int = 1
    mistakes: int = 0
    concept: str
    next_stage_id: Optional[str] = None
    simplified_activity: Optional[GameActivity] = None
