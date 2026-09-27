"""API routes for World Maps and stage listing."""
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.schemas.progress_schemas import WorldSummary, StageSummary
from app.agents.progress_agent import ProgressAgent, WORLD_STAGES

router = APIRouter(prefix="/api/worlds", tags=["worlds"])
progress_agent = ProgressAgent()

WORLDS_METADATA = [
    {
        "id": "colors",
        "name": "Rainbow Colors World",
        "icon": "🌈",
        "theme_color": "from-pink-400 via-rose-400 to-amber-300",
        "accent_color": "#EC4899",
        "description": "Discover vibrant red, cool blue, sunny yellow, and wonderful green!",
        "is_unlocked": True,
    },
    {
        "id": "shapes",
        "name": "Magic Shapes Kingdom",
        "icon": "🔷",
        "theme_color": "from-blue-400 via-indigo-400 to-cyan-300",
        "accent_color": "#3B82F6",
        "description": "Roll with round circles, balance with squares, and discover pointy triangles!",
        "is_unlocked": True,
    },
    {
        "id": "numbers",
        "name": "Number Jungle",
        "icon": "🔢",
        "theme_color": "from-emerald-400 via-teal-400 to-yellow-300",
        "accent_color": "#10B981",
        "description": "Count yummy apples, hopping frogs, and friendly jungle stars!",
        "is_unlocked": False,
    },
    {
        "id": "alphabet",
        "name": "Alphabet Castle",
        "icon": "🔤",
        "theme_color": "from-purple-400 via-violet-400 to-pink-300",
        "accent_color": "#A855F7",
        "description": "Sing letters A, B, C and find out what wonderful words they make!",
        "is_unlocked": False,
    },
    {
        "id": "animals",
        "name": "Animal Friends Safari",
        "icon": "🐶",
        "theme_color": "from-amber-400 via-orange-400 to-yellow-200",
        "accent_color": "#F59E0B",
        "description": "Hear the dog go woof, the cat go meow, and the elephant stomp!",
        "is_unlocked": False,
    },
    {
        "id": "everyday",
        "name": "Everyday Explorer",
        "icon": "🌎",
        "theme_color": "from-sky-400 via-cyan-400 to-teal-300",
        "accent_color": "#0284C7",
        "description": "Explore fruits, vegetables, sunny weather, day and night!",
        "is_unlocked": False,
    },
]

@router.get("", response_model=List[WorldSummary])
async def get_all_worlds(child_id: str = "default-child", db: AsyncSession = Depends(get_db)):
    """Returns world map overview with stage lock/completion status for child."""
    await progress_agent.get_or_create_child(db, child_id)
    summaries: List[WorldSummary] = []

    for w_meta in WORLDS_METADATA:
        w_id = w_meta["id"]
        stages_def = WORLD_STAGES.get(w_id, [])
        stage_summaries: List[StageSummary] = []
        completed_count = 0

        for idx, s_def in enumerate(stages_def):
            prog = await progress_agent.get_or_create_stage_progress(db, child_id, w_id, s_def["id"])
            if prog.status == "completed":
                completed_count += 1

            stage_summaries.append(
                StageSummary(
                    id=s_def["id"],
                    world_id=w_id,
                    stage_number=idx + 1,
                    title=s_def["title"],
                    concept=s_def["concept"],
                    icon=s_def["icon"],
                    status=prog.status,
                    stars=prog.stars,
                    mastery_score=prog.mastery_score,
                )
            )

        summaries.append(
            WorldSummary(
                id=w_id,
                name=w_meta["name"],
                icon=w_meta["icon"],
                theme_color=w_meta["theme_color"],
                accent_color=w_meta["accent_color"],
                description=w_meta["description"],
                is_unlocked=w_meta["is_unlocked"],
                total_stages=len(stages_def),
                completed_stages=completed_count,
                stages=stage_summaries,
            )
        )

    return summaries

@router.get("/{world_id}", response_model=WorldSummary)
async def get_world_details(world_id: str, child_id: str = "default-child", db: AsyncSession = Depends(get_db)):
    all_worlds = await get_all_worlds(child_id, db)
    world = next((w for w in all_worlds if w.id == world_id), all_worlds[0])
    return world
