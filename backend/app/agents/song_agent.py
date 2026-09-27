"""Song Agent: Crafts simple rhyming sing-along lines for preschool concepts."""
from app.services.ai_provider import BaseAIProvider

class SongAgent:
    def __init__(self, ai_provider: BaseAIProvider):
        self.ai = ai_provider

    async def get_rhyme(self, concept: str) -> str:
        return await self.ai.generate_song(concept)
