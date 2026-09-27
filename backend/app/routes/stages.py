"""API routes for stage lesson plan generation, answer evaluation, and hints."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.services.ai_provider import get_ai_provider
from app.agents.learning_agent import LearningAgent
from app.schemas.stage_schemas import LessonPlan, AnswerSubmission, AssessmentResult, GameActivity

router = APIRouter(prefix="/api/stages", tags=["stages"])
ai_provider = get_ai_provider()
learning_agent = LearningAgent(ai_provider)

@router.get("/{world_id}/{stage_id}", response_model=LessonPlan)
async def get_stage_lesson(
    world_id: str,
    stage_id: str,
    child_id: str = Query("default-child"),
    db: AsyncSession = Depends(get_db)
):
    """Generates structured lesson plan containing See/Hear teaching, Song, Story, and Game activity."""
    return await learning_agent.create_stage_lesson(
        session=db,
        child_id=child_id,
        world_id=world_id,
        stage_id=stage_id
    )

@router.post("/{world_id}/{stage_id}/submit", response_model=AssessmentResult)
async def submit_stage_answer(
    world_id: str,
    stage_id: str,
    submission: AnswerSubmission,
    db: AsyncSession = Depends(get_db)
):
    """Evaluates child answer, tracks mastery, dynamically adapts difficulty, and awards stars."""
    # Re-fetch lesson activity context to verify correct answer
    lesson = await learning_agent.create_stage_lesson(
        session=db,
        child_id=submission.child_id,
        world_id=world_id,
        stage_id=stage_id,
        override_difficulty=submission.difficulty
    )

    return await learning_agent.evaluate_child_answer(
        session=db,
        submission=submission,
        current_activity=lesson.activity
    )

@router.get("/{world_id}/{stage_id}/hint")
async def get_stage_hint(
    world_id: str,
    stage_id: str,
    attempt: int = 1,
    db: AsyncSession = Depends(get_db)
):
    """Returns cheerful hints without any frustration."""
    lesson = await learning_agent.create_stage_lesson(
        session=db,
        child_id="default-child",
        world_id=world_id,
        stage_id=stage_id
    )
    return await learning_agent.teacher.get_hint(lesson.concept, attempt)

@router.get("/{world_id}/{stage_id}/simplify", response_model=GameActivity)
async def get_simplified_activity(
    world_id: str,
    stage_id: str,
    child_id: str = "default-child",
    db: AsyncSession = Depends(get_db)
):
    """Returns simplified game activity with reduced distractors and golden glow."""
    lesson = await learning_agent.create_stage_lesson(
        session=db,
        child_id=child_id,
        world_id=world_id,
        stage_id=stage_id,
        override_difficulty=1
    )
    return learning_agent.adaptation.simplify_activity(
        lesson.activity, lesson.activity.correct_answer
    )
