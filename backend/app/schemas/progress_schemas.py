"""Pydantic schemas for progress, worlds, stages, and parent dashboard."""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class StageSummary(BaseModel):
    id: str
    world_id: str
    stage_number: int
    title: str
    concept: str
    icon: str
    status: str  # locked, unlocked, completed
    stars: int
    mastery_score: float

class WorldSummary(BaseModel):
    id: str
    name: str
    icon: str
    theme_color: str
    accent_color: str
    description: str
    is_unlocked: bool
    total_stages: int
    completed_stages: int
    stages: List[StageSummary]

class ConceptMasteryItem(BaseModel):
    concept: str
    world_id: str
    mastery: float
    attempts: int
    mistakes: int
    correct_answers: int
    needs_practice: bool
    last_practiced: Optional[datetime] = None

class ParentDashboardData(BaseModel):
    child_id: str
    child_name: str
    total_stars: int
    current_world: str
    total_stages_completed: int
    total_stages_available: int
    overall_progress_percentage: float
    concept_masteries: List[ConceptMasteryItem]
    concepts_needing_practice: List[str]
    recommended_activities: List[str]
    ai_companion_notes: str
