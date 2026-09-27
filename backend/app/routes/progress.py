"""API routes for progress tracking and parent dashboard."""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.database.session import get_db
from app.models.domain import ChildProfile, StageProgress, ConceptMastery, SessionLog
from app.schemas.progress_schemas import ParentDashboardData, ConceptMasteryItem
from app.agents.progress_agent import ProgressAgent, WORLD_STAGES

router = APIRouter(prefix="/api/progress", tags=["progress"])
progress_agent = ProgressAgent()

@router.get("/{child_id}/parent-dashboard", response_model=ParentDashboardData)
async def get_parent_dashboard(child_id: str = "default-child", db: AsyncSession = Depends(get_db)):
    """Comprehensive parent dashboard with mastery breakdown and AI companion notes."""
    child = await progress_agent.get_or_create_child(db, child_id)

    # Fetch concept masteries
    mast_res = await db.execute(select(ConceptMastery).where(ConceptMastery.child_id == child_id))
    masteries = mast_res.scalars().all()

    # Fetch completed stages
    prog_res = await db.execute(
        select(StageProgress).where(StageProgress.child_id == child_id, StageProgress.status == "completed")
    )
    completed_stages = prog_res.scalars().all()
    completed_count = len(completed_stages)

    total_stages_count = sum(len(stg_list) for stg_list in WORLD_STAGES.values())
    pct = round((completed_count / total_stages_count * 100), 1) if total_stages_count > 0 else 0.0

    mastery_items: List[ConceptMasteryItem] = []
    needing_practice: List[str] = []
    recommendations: List[str] = []

    for m in masteries:
        item = ConceptMasteryItem(
            concept=m.concept,
            world_id=m.world_id,
            mastery=m.mastery,
            attempts=m.attempts,
            mistakes=m.mistakes,
            correct_answers=m.correct_answers,
            needs_practice=m.needs_practice,
            last_practiced=m.last_practiced,
        )
        mastery_items.append(item)
        if m.needs_practice or m.mastery < 0.6:
            needing_practice.append(m.concept.replace("_", " ").title())
            recommendations.append(f"Play gentle {m.concept.replace('_', ' ').title()} matching games together")

    if not recommendations:
        recommendations = [
            "Great job! Keep exploring Rainbow Colors World!",
            "Try singing the color songs together while walking in the park!",
            "Point out real-world red apples and blue skies at home!"
        ]

    ai_notes = (
        f"{child.name} has earned {child.total_stars} stars! "
        f"They have shown wonderful curiosity. "
        + (f"A little extra play with {', '.join(needing_practice[:2])} will build even more confidence!" if needing_practice else "They are grasping color concepts with great confidence!")
    )

    return ParentDashboardData(
        child_id=child.id,
        child_name=child.name,
        total_stars=child.total_stars,
        current_world=child.current_world_id,
        total_stages_completed=completed_count,
        total_stages_available=total_stages_count,
        overall_progress_percentage=pct,
        concept_masteries=mastery_items,
        concepts_needing_practice=needing_practice,
        recommended_activities=recommendations,
        ai_companion_notes=ai_notes,
    )

@router.post("/{child_id}/reset")
async def reset_child_progress(child_id: str = "default-child", db: AsyncSession = Depends(get_db)):
    """Resets progress back to fresh start (ideal for testing or replaying)."""
    await db.execute(delete(StageProgress).where(StageProgress.child_id == child_id))
    await db.execute(delete(ConceptMastery).where(ConceptMastery.child_id == child_id))
    await db.execute(delete(SessionLog).where(SessionLog.child_id == child_id))

    child = await progress_agent.get_or_create_child(db, child_id)
    child.total_stars = 0
    child.current_world_id = "colors"
    child.current_stage_id = "colors-1"
    await db.commit()

    return {"message": "Progress reset successfully", "child_id": child_id}
