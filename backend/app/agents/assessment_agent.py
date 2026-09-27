"""Assessment Agent: Evaluates answers, determines correctness, and generates friendly feedback."""
from typing import Dict, Any
from app.services.ai_provider import BaseAIProvider

class AssessmentAgent:
    def __init__(self, ai_provider: BaseAIProvider):
        self.ai = ai_provider

    async def evaluate_answer(
        self,
        concept: str,
        selected_answer: str,
        correct_answer: str,
        attempts: int,
        mistakes: int,
    ) -> Dict[str, Any]:
        is_correct = (selected_answer == correct_answer or selected_answer == "all_matched" or selected_answer == "all_sorted")

        context = {
            "concept": concept,
            "is_correct": is_correct,
            "attempts": attempts,
            "mistakes": mistakes,
            "selected": selected_answer,
            "correct": correct_answer,
        }

        reaction_data = await self.ai.generate_assessment_reaction(context)

        return {
            "is_correct": is_correct,
            "ai_reaction": reaction_data.get("ai_reaction", "Great effort!"),
            "spoken_feedback": reaction_data.get("spoken_feedback", "Great effort!"),
            "next_action": reaction_data.get("next_action", "celebrate" if is_correct else "retry_same"),
            "encouragement": reaction_data.get("encouragement", "You can do it!"),
        }
