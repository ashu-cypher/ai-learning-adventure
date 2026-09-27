"""Story Agent: Creates short micro-stories with Milo the companion."""
from app.services.ai_provider import BaseAIProvider

class StoryAgent:
    def __init__(self, ai_provider: BaseAIProvider):
        self.ai = ai_provider

    async def get_micro_story(self, concept: str) -> str:
        return await self.ai.generate_story(concept)
