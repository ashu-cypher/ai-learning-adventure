"""Safety Agent: Enforces zero-shaming, ultra-positive reinforcement, and nursery-age appropriateness."""
import re
from typing import Dict, Any

class SafetyAgent:
    """Monitors and sanitizer for child-directed AI messages."""

    PROHIBITED_WORDS = [
        "wrong", "fail", "failed", "failure", "bad", "incorrect", "error", "stupid", "dumb", "lose", "lost"
    ]

    GENTLE_REPLACEMENTS = [
        "Almost! Look closely with Milo!",
        "Good try! Let's find it together!",
        "Nice try, Little Explorer! Let's check again!",
        "You are so close! Take another peek!",
    ]

    def sanitize_message(self, text: str) -> str:
        """Sanitizes text to guarantee zero shaming and high encouragement."""
        if not text:
            return "Good try! Let's do it together! 🌟"

        sanitized = text
        for word in self.PROHIBITED_WORDS:
            pattern = re.compile(rf"\b{word}\b", re.IGNORECASE)
            if pattern.search(sanitized):
                # Replace with warm encouragement
                import random
                sanitized = pattern.sub("good try", sanitized)

        return sanitized

    def ensure_positive_tone(self, response_data: Dict[str, Any]) -> Dict[str, Any]:
        """Ensures all AI textual outputs are positive, safe, and friendly."""
        if "ai_reaction" in response_data:
            response_data["ai_reaction"] = self.sanitize_message(response_data["ai_reaction"])
        if "spoken_feedback" in response_data:
            response_data["spoken_feedback"] = self.sanitize_message(response_data["spoken_feedback"])
        if "greeting" in response_data:
            response_data["greeting"] = self.sanitize_message(response_data["greeting"])
        if "instruction" in response_data:
            response_data["instruction"] = self.sanitize_message(response_data["instruction"])
        return response_data
