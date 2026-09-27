"""Game Agent: Prepares mini-game activities, targets, distractors, and difficulty levels."""
from typing import Dict, Any, List
from app.schemas.stage_schemas import GameActivity, VisualObject

class GameAgent:
    def determine_game_type(self, stage_id: str, concept: str) -> str:
        if "match" in stage_id or concept == "color_matching":
            return "color_match"
        elif "sort" in stage_id or concept == "color_sorting":
            return "color_sort"
        elif "count" in stage_id:
            return "counting_game"
        elif "story" in stage_id:
            return "story_scene"
        elif "song" in stage_id:
            return "song_scene"
        return "object_selection"

    def build_game_activity(
        self,
        game_type: str,
        lesson_data: Dict[str, Any],
        visual_objects: List[VisualObject],
        difficulty: int = 1
    ) -> GameActivity:
        return GameActivity(
            visual_type=game_type,
            instruction=lesson_data.get("instruction", "Find the matching item!"),
            spoken_instruction=lesson_data.get("spoken", "Find the matching item! Tap it!"),
            objects=visual_objects,
            targets=lesson_data.get("targets"),
            correct_answer=lesson_data.get("correct_id", "apple"),
            difficulty=difficulty,
            hint_text=lesson_data.get("hint", "Look closely!"),
            spoken_hint=lesson_data.get("hint", "Look closely with Milo!"),
        )
