"""Progress Agent: Manages child mastery, star awards, stage unlocks, and learning analytics."""
from datetime import datetime
from typing import Dict, Any, Tuple, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.domain import ChildProfile, StageProgress, ConceptMastery, SessionLog

# Ordered list of stages in World 1 (Colors)
WORLD_STAGES = {
    "colors": [
        {"id": "colors-1", "title": "Find Red", "concept": "red", "icon": "🍎"},
        {"id": "colors-2", "title": "Find Blue", "concept": "blue", "icon": "🦋"},
        {"id": "colors-3", "title": "Find Yellow", "concept": "yellow", "icon": "🐥"},
        {"id": "colors-4", "title": "Find Green", "concept": "green", "icon": "🐸"},
        {"id": "colors-5", "title": "Match Colors", "concept": "color_matching", "icon": "🎨"},
        {"id": "colors-6", "title": "Color Sorting", "concept": "color_sorting", "icon": "🧸"},
        {"id": "colors-7", "title": "Color Challenge", "concept": "color_challenge", "icon": "🏆"},
    ],
    "shapes": [
        {"id": "shapes-1", "title": "Round Circle", "concept": "circle", "icon": "🔴"},
        {"id": "shapes-2", "title": "Square Box", "concept": "square", "icon": "🟧"},
        {"id": "shapes-3", "title": "Triangle Wedge", "concept": "triangle", "icon": "🔺"},
        {"id": "shapes-4", "title": "Match Shapes", "concept": "shape_matching", "icon": "🔷"},
    ]
}

class ProgressAgent:
    async def get_or_create_child(self, session: AsyncSession, child_id: str = "default-child") -> ChildProfile:
        res = await session.execute(select(ChildProfile).where(ChildProfile.id == child_id))
        child = res.scalar_one_or_none()
        if not child:
            child = ChildProfile(
                id=child_id,
                name="Little Explorer",
                avatar="milo-bunny",
                current_world_id="colors",
                current_stage_id="colors-1",
                total_stars=0
            )
            session.add(child)
            await session.commit()
            await session.refresh(child)
        return child

    async def get_or_create_stage_progress(
        self, session: AsyncSession, child_id: str, world_id: str, stage_id: str
    ) -> StageProgress:
        prog_id = f"{child_id}_{stage_id}"
        res = await session.execute(select(StageProgress).where(StageProgress.id == prog_id))
        prog = res.scalar_one_or_none()
        if not prog:
            # First stage of colors is unlocked by default; others locked
            status = "unlocked" if stage_id == "colors-1" else "locked"
            prog = StageProgress(
                id=prog_id,
                child_id=child_id,
                world_id=world_id,
                stage_id=stage_id,
                status=status,
                stars=0,
                attempts=0,
                mistakes=0,
                correct_answers=0,
                mastery_score=0.0
            )
            session.add(prog)
            await session.commit()
            await session.refresh(prog)
        return prog

    async def get_or_create_concept_mastery(
        self, session: AsyncSession, child_id: str, world_id: str, concept: str
    ) -> ConceptMastery:
        mast_id = f"{child_id}_{concept}"
        res = await session.execute(select(ConceptMastery).where(ConceptMastery.id == mast_id))
        mast = res.scalar_one_or_none()
        if not mast:
            mast = ConceptMastery(
                id=mast_id,
                child_id=child_id,
                world_id=world_id,
                concept=concept,
                mastery=0.0,
                attempts=0,
                mistakes=0,
                correct_answers=0,
                needs_practice=False
            )
            session.add(mast)
            await session.commit()
            await session.refresh(mast)
        return mast

    async def record_answer_and_update_progress(
        self,
        session: AsyncSession,
        child_id: str,
        world_id: str,
        stage_id: str,
        concept: str,
        is_correct: bool,
    ) -> Tuple[StageProgress, ConceptMastery, int, Optional[str]]:
        """Updates progress, calculates mastery, awards stars, and unlocks next stage if completed."""
        prog = await self.get_or_create_stage_progress(session, child_id, world_id, stage_id)
        mast = await self.get_or_create_concept_mastery(session, child_id, world_id, concept)
        child = await self.get_or_create_child(session, child_id)

        prog.attempts += 1
        mast.attempts += 1

        stars_awarded = 0
        next_stage_id: Optional[str] = None

        if is_correct:
            prog.correct_answers += 1
            mast.correct_answers += 1

            # Calculate stars based on mistakes in this stage
            if prog.mistakes == 0:
                stars_awarded = 3
            elif prog.mistakes == 1:
                stars_awarded = 2
            else:
                stars_awarded = 1

            # Update highest stars earned
            new_stars = max(prog.stars, stars_awarded)
            stars_diff = new_stars - prog.stars
            prog.stars = new_stars
            child.total_stars += stars_diff

            prog.status = "completed"
            prog.completed_at = datetime.utcnow()
            mast.needs_practice = False

            # Determine next stage to unlock
            stages_list = WORLD_STAGES.get(world_id, [])
            for i, stg in enumerate(stages_list):
                if stg["id"] == stage_id and i + 1 < len(stages_list):
                    next_stg = stages_list[i + 1]
                    next_stage_id = next_stg["id"]
                    # Unlock the next stage in DB
                    next_prog = await self.get_or_create_stage_progress(
                        session, child_id, world_id, next_stage_id
                    )
                    if next_prog.status == "locked":
                        next_prog.status = "unlocked"
                    break
        else:
            prog.mistakes += 1
            mast.mistakes += 1
            if mast.mistakes >= 2:
                mast.needs_practice = True

        # Calculate mastery score:
        # mastery = correct / (correct + mistakes * 0.5)
        total_eval = mast.correct_answers + (mast.mistakes * 0.5)
        mast.mastery = min(1.0, round(mast.correct_answers / total_eval, 2)) if total_eval > 0 else 0.0
        prog.mastery_score = mast.mastery
        mast.last_practiced = datetime.utcnow()

        # Log session action
        log_entry = SessionLog(
            id=f"log_{datetime.utcnow().timestamp()}",
            child_id=child_id,
            stage_id=stage_id,
            concept=concept,
            action_type="answer",
            is_correct=is_correct,
            details=f"Attempts: {prog.attempts}, Mistakes: {prog.mistakes}"
        )
        session.add(log_entry)

        await session.commit()
        await session.refresh(prog)
        await session.refresh(mast)

        return prog, mast, stars_awarded, next_stage_id
