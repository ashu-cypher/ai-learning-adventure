"""Adaptation Agent: Dynamically adapts difficulty and simplifies activities upon child struggle."""
from typing import List, Dict, Any, Optional
from app.schemas.stage_schemas import GameActivity, VisualObject

class AdaptationAgent:
    def simplify_activity(self, activity: GameActivity, target_id: str) -> GameActivity:
        """Simplifies the game by reducing distractors and highlighting target object."""
        # Find target object
        target_obj: Optional[VisualObject] = None
        distractors: List[VisualObject] = []

        for obj in activity.objects:
            if obj.id == target_id or obj.is_target:
                target_obj = obj
            else:
                distractors.append(obj)

        if not target_obj and activity.objects:
            target_obj = activity.objects[0]

        # Reduce distractors to just 1 distractor (making it 2 choices total)
        simplified_objects: List[VisualObject] = []
        if target_obj:
            # Highlight target with golden glow
            target_glow = VisualObject(
                id=target_obj.id,
                name=target_obj.name,
                label=target_obj.label,
                color=target_obj.color,
                shape=target_obj.shape,
                icon=target_obj.icon,
                size="giant",
                sound_cue=target_obj.sound_cue,
                highlight=True,
                is_target=True,
            )
            simplified_objects.append(target_glow)

        if distractors:
            simplified_objects.append(distractors[0])

        return GameActivity(
            visual_type=activity.visual_type,
            instruction=f"Look! Milo made it easier! Can you find {target_obj.name if target_obj else 'it'}?",
            spoken_instruction=f"Look! Milo made it easier! Can you find it now? Tap the glowing one!",
            objects=simplified_objects,
            targets=activity.targets,
            correct_answer=activity.correct_answer,
            difficulty=1,
            hint_text=f"Look for the glowing {target_obj.label if target_obj else 'item'}!",
            spoken_hint="Look for the one with the glowing golden border!",
        )

    def calculate_adaptive_difficulty(self, current_mastery: float, mistakes_in_row: int) -> int:
        if mistakes_in_row >= 2:
            return 1  # Simplified
        elif current_mastery >= 0.8:
            return 3  # Advanced challenge
        elif current_mastery >= 0.4:
            return 2  # Standard
        return 1
