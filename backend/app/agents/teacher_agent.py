"""Teacher Agent: Crafts friendly explanations, audio speech scripts, and encouraging hints."""
from typing import Dict, Any
from app.services.ai_provider import BaseAIProvider

class TeacherAgent:
    def __init__(self, ai_provider: BaseAIProvider):
        self.ai = ai_provider

    async def create_greeting(self, concept: str, stage_num: int) -> Dict[str, str]:
        content = await self.ai.generate_lesson_content({"concept": concept})
        return {
            "greeting": content.get("greeting", f"Hi! I'm Milo! Let's explore {concept}! 🌟"),
            "spoken_greeting": content.get("spoken", f"Hi! I'm Milo! Let's explore {concept} together!"),
        }

    async def get_see_hear_teaching(self, concept: str) -> Dict[str, Any]:
        content = await self.ai.generate_lesson_content({"concept": concept})
        return {
            "hear_text": content.get("hear", f"Listen: {concept.upper()}!"),
            "spoken_text": content.get("spoken", f"Listen carefully: this is {concept}!"),
            "fun_fact": content.get("fact", f"{concept.capitalize()} is such a wonderful color!"),
        }

    async def get_hint(self, concept: str, attempt: int) -> Dict[str, str]:
        content = await self.ai.generate_lesson_content({"concept": concept})
        hint = content.get("hint", f"Look for the bright {concept} one!")
        if attempt >= 2:
            hint = f"Milo has a clue: {hint} Look where Milo is pointing!"
        return {
            "hint_text": hint,
            "spoken_hint": hint
        }
