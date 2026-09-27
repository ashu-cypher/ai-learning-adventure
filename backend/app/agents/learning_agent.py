"""Master Orchestrator Agent: Coordinates all specialized agents to deliver structured child lessons."""
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.ai_provider import BaseAIProvider
from app.agents.teacher_agent import TeacherAgent
from app.agents.visual_agent import VisualAgent
from app.agents.game_agent import GameAgent
from app.agents.story_agent import StoryAgent
from app.agents.song_agent import SongAgent
from app.agents.safety_agent import SafetyAgent
from app.agents.assessment_agent import AssessmentAgent
from app.agents.adaptation_agent import AdaptationAgent
from app.agents.progress_agent import ProgressAgent, WORLD_STAGES
from app.schemas.stage_schemas import LessonPlan, TeachingContent, GameActivity, AssessmentResult, AnswerSubmission

class LearningAgent:
    def __init__(self, ai_provider: BaseAIProvider):
        self.ai = ai_provider
        self.teacher = TeacherAgent(ai_provider)
        self.visual = VisualAgent()
        self.game = GameAgent()
        self.story = StoryAgent(ai_provider)
        self.song = SongAgent(ai_provider)
        self.safety = SafetyAgent()
        self.assessment = AssessmentAgent(ai_provider)
        self.adaptation = AdaptationAgent()
        self.progress = ProgressAgent()

    async def create_stage_lesson(
        self,
        session: AsyncSession,
        child_id: str,
        world_id: str,
        stage_id: str,
        override_difficulty: Optional[int] = None
    ) -> LessonPlan:
        """Master method to assemble a multi-mode preschool lesson plan."""
        # 1. Lookup stage metadata
        world_stages = WORLD_STAGES.get(world_id, WORLD_STAGES["colors"])
        stage_meta = next((s for s in world_stages if s["id"] == stage_id), world_stages[0])
        stage_number = world_stages.index(stage_meta) + 1
        concept = stage_meta["concept"]

        # 2. Check child progress & adaptation
        prog = await self.progress.get_or_create_stage_progress(session, child_id, world_id, stage_id)
        mast = await self.progress.get_or_create_concept_mastery(session, child_id, world_id, concept)

        difficulty = override_difficulty or self.adaptation.calculate_adaptive_difficulty(
            mast.mastery, prog.mistakes
        )

        # 3. Generate raw lesson content from AI / Knowledge
        raw_content = await self.ai.generate_lesson_content({
            "concept": concept,
            "difficulty": difficulty,
            "stage_id": stage_id,
        })

        # 4. Teacher agent greetings
        greetings = await self.teacher.create_greeting(concept, stage_number)
        see_hear = await self.teacher.get_see_hear_teaching(concept)

        # 5. Visual agent visual objects
        see_objects = self.visual.get_see_objects_for_concept(concept)
        raw_items = raw_content.get("items", [])
        game_visual_objects = self.visual.format_visual_objects(raw_items, glow_target=(prog.mistakes >= 2))

        # 6. Song & Story agents
        song_lyrics = await self.song.get_rhyme(concept)
        story_snippet = await self.story.get_micro_story(concept)

        teaching = TeachingContent(
            concept=concept,
            see_objects=see_objects,
            hear_text=see_hear["hear_text"],
            spoken_text=see_hear["spoken_text"],
            fun_fact=see_hear["fun_fact"],
            song_lyrics=song_lyrics,
            story_snippet=story_snippet,
        )

        # 7. Game agent mini-game activity
        game_type = self.game.determine_game_type(stage_id, concept)
        activity = self.game.build_game_activity(game_type, raw_content, game_visual_objects, difficulty)

        lesson_plan = LessonPlan(
            world_id=world_id,
            world_name=world_id.capitalize(),
            stage_id=stage_id,
            stage_number=stage_number,
            stage_title=stage_meta["title"],
            concept=concept,
            greeting=greetings["greeting"],
            spoken_greeting=greetings["spoken_greeting"],
            teaching=teaching,
            activity=activity,
        )

        # 8. Safety check
        safe_dict = self.safety.ensure_positive_tone(lesson_plan.model_dump())
        return LessonPlan(**safe_dict)

    async def evaluate_child_answer(
        self,
        session: AsyncSession,
        submission: AnswerSubmission,
        current_activity: GameActivity
    ) -> AssessmentResult:
        """Processes child interaction, updates progress, adjusts difficulty, and returns feedback."""
        # 1. Retrieve current stage & progress
        prog = await self.progress.get_or_create_stage_progress(
            session, submission.child_id, submission.world_id, submission.stage_id
        )

        # 2. Assessment Agent evaluation
        eval_result = await self.assessment.evaluate_answer(
            concept=submission.concept,
            selected_answer=submission.selected_answer,
            correct_answer=current_activity.correct_answer,
            attempts=prog.attempts,
            mistakes=prog.mistakes,
        )

        is_correct = eval_result["is_correct"]

        # 3. Progress Agent updates
        prog, mast, stars_earned, next_stage_id = await self.progress.record_answer_and_update_progress(
            session=session,
            child_id=submission.child_id,
            world_id=submission.world_id,
            stage_id=submission.stage_id,
            concept=submission.concept,
            is_correct=is_correct,
        )

        # 4. Adaptation Agent reaction: simplify if struggling
        simplified_activity = None
        visual_help_id = None
        next_action = eval_result["next_action"]

        if not is_correct and prog.mistakes >= 2:
            next_action = "retry_simplified"
            simplified_activity = self.adaptation.simplify_activity(
                current_activity, current_activity.correct_answer
            )
            visual_help_id = current_activity.correct_answer

        # 5. Build result
        res = AssessmentResult(
            is_correct=is_correct,
            ai_reaction=eval_result["ai_reaction"],
            spoken_feedback=eval_result["spoken_feedback"],
            hint=eval_result.get("encouragement"),
            visual_help_glow_id=visual_help_id,
            next_action=next_action,
            stage_completed=is_correct,
            stars_earned=stars_earned,
            current_mastery=mast.mastery,
            attempts=prog.attempts,
            mistakes=prog.mistakes,
            concept=submission.concept,
            next_stage_id=next_stage_id,
            simplified_activity=simplified_activity,
        )

        safe_res = self.safety.ensure_positive_tone(res.model_dump())
        return AssessmentResult(**safe_res)
