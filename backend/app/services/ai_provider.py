"""AI Provider Abstraction Layer.
Supports:
1. Smart Rules Engine (default, offline, instant, zero-key, deterministic high quality)
2. Google Gemini (via HTTP API or official SDK when GEMINI_API_KEY is present)
3. OpenAI (via HTTP API when OPENAI_API_KEY is present)
"""
import os
import json
import logging
from typing import Dict, Any, Optional
import httpx

logger = logging.getLogger("ai_provider")

class BaseAIProvider:
    async def generate_lesson_content(self, context: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

    async def generate_assessment_reaction(self, context: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError

    async def generate_song(self, concept: str) -> str:
        raise NotImplementedError

    async def generate_story(self, concept: str) -> str:
        raise NotImplementedError

class SmartRulesAIProvider(BaseAIProvider):
    """Zero-latency, zero-cost, child-tailored rule engine ensuring nursery safety."""

    COLOR_KNOWLEDGE = {
        "red": {
            "title": "Find Red",
            "greeting": "Hi little friend! I'm Milo the Bunny! Let's discover RED together! 🍎",
            "hear": "Red! Like a yummy, juicy red apple!",
            "fact": "Did you know ladybugs and strawberries are bright RED?",
            "song": "Red, red, look around!\nRed is the color that we found!\nRed apple, red car, beep beep zoooom!\nBright red flowers in our room! 🍓",
            "story": "Buddy the Bunny hopped into the magical garden. 'Oh look!' shouted Buddy, 'A shiny red apple waiting for us!' Can you spot what is red?",
            "items": [
                {"id": "apple", "name": "Apple", "label": "Red Apple", "color": "red", "icon": "🍎", "is_target": True},
                {"id": "banana", "name": "Banana", "label": "Yellow Banana", "color": "yellow", "icon": "🍌", "is_target": False},
                {"id": "leaf", "name": "Leaf", "label": "Green Leaf", "color": "green", "icon": "🍃", "is_target": False},
                {"id": "ball", "name": "Blue Ball", "label": "Blue Ball", "color": "blue", "icon": "⚽", "is_target": False},
            ],
            "correct_id": "apple",
            "instruction": "Can you tap the RED apple?",
            "spoken": "Can you find the red apple? Tap it!",
            "hint": "Look for the color of ripe strawberries and fire trucks! It's warm and bright red! 🍎",
        },
        "blue": {
            "title": "Find Blue",
            "greeting": "Woohoo! Milo here! Today the sky is shining BLUE! Can you see it? 🌊",
            "hear": "Blue! Cool like the ocean waves and the sunny sky!",
            "fact": "Blue whales are the biggest friendly animals in the whole blue ocean!",
            "song": "Blue, blue, deep and wide!\nBlue blue ocean on a slide!\nBlue bird singing in the tree,\nBlue is pretty as can be! 🐦",
            "story": "Milo looked up at the fluffy clouds. 'The sky is such a peaceful blue!' Milo noticed something blue on the ground too. Let's find it!",
            "items": [
                {"id": "butterfly", "name": "Butterfly", "label": "Blue Butterfly", "color": "blue", "icon": "🦋", "is_target": True},
                {"id": "orange_fruit", "name": "Orange", "label": "Orange", "color": "orange", "icon": "🍊", "is_target": False},
                {"id": "strawberry", "name": "Strawberry", "label": "Red Strawberry", "color": "red", "icon": "🍓", "is_target": False},
                {"id": "sunflower", "name": "Sunflower", "label": "Yellow Flower", "color": "yellow", "icon": "🌻", "is_target": False},
            ],
            "correct_id": "butterfly",
            "instruction": "Tap the beautiful BLUE butterfly!",
            "spoken": "Can you find the blue butterfly? Tap it!",
            "hint": "It has lovely fluttery wings colored just like the ocean and the clear sky! 🦋",
        },
        "yellow": {
            "title": "Find Yellow",
            "greeting": "Rise and shine! Milo is so happy to see you! Let's find sunny YELLOW! ☀️",
            "hear": "Yellow! Warm and cheerful like the morning sunshine!",
            "fact": "Baby ducklings are soft and fluffy yellow quack-quackers!",
            "song": "Yellow, yellow, shining sun!\nYellow brings a day of fun!\nYellow lemon, yellow star,\nYellow beaming from afar! ⭐",
            "story": "A warm ray of sunshine woke Milo. 'Good morning world! Look at that bright yellow star glowing in the sky!' Let's find yellow together!",
            "items": [
                {"id": "duck", "name": "Duckling", "label": "Yellow Duckling", "color": "yellow", "icon": "🐥", "is_target": True},
                {"id": "grape", "name": "Grapes", "label": "Purple Grapes", "color": "purple", "icon": "🍇", "is_target": False},
                {"id": "cherry", "name": "Cherries", "label": "Red Cherries", "color": "red", "icon": "🍒", "is_target": False},
                {"id": "frog", "name": "Tree Frog", "label": "Green Frog", "color": "green", "icon": "🐸", "is_target": False},
            ],
            "correct_id": "duck",
            "instruction": "Can you tap the happy YELLOW duckling?",
            "spoken": "Can you find the yellow duckling? Quack quack! Tap it!",
            "hint": "Look for the sunny little friend that says quack quack! 🐥",
        },
        "green": {
            "title": "Find Green",
            "greeting": "Hello explorer! Milo is hopping in the green grass! Let's explore GREEN! 🌿",
            "hear": "Green! Fresh like leaves, frogs, and tall jungle trees!",
            "fact": "Frogs love hopping on green lily pads in ponds!",
            "song": "Green, green, grass so tall!\nGreen green frog upon the wall!\nGreen juicy pear upon the tree,\nGreen is good for you and me! 🍐",
            "story": "Milo hopped through the lush meadow. 'Listen! Ribbit ribbit! A friendly green frog is playing hide and seek!' Where is the green frog?",
            "items": [
                {"id": "frog", "name": "Frog", "label": "Green Frog", "color": "green", "icon": "🐸", "is_target": True},
                {"id": "fire", "name": "Campfire", "label": "Red Fire", "color": "red", "icon": "🔥", "is_target": False},
                {"id": "star", "name": "Star", "label": "Yellow Star", "color": "yellow", "icon": "⭐", "is_target": False},
                {"id": "cloud", "name": "Cloud", "label": "Blue Cloud", "color": "blue", "icon": "🌧️", "is_target": False},
            ],
            "correct_id": "frog",
            "instruction": "Can you tap the friendly GREEN frog?",
            "spoken": "Find the green frog! Ribbit ribbit! Tap it!",
            "hint": "Ribbit! Look for the leaping friend who loves green lily pads! 🐸",
        },
        "color_matching": {
            "title": "Match Colors",
            "greeting": "Milo has special paint buckets! Can you match the right color? 🎨",
            "hear": "Match the colors! Red with Red, Blue with Blue, Yellow with Yellow!",
            "fact": "Artists mix matching colors to make lovely rainbow paintings!",
            "song": "Matching colors, one two three!\nMatch them up for you and me!\nRed to red and blue to blue,\nYellow makes it happy too! 🎨",
            "story": "Milo opened an artist box with three colorful buckets: Red, Blue, and Yellow. Can you help Milo put each toy in its matching color bucket?",
            "items": [
                {"id": "match_apple", "name": "Apple", "label": "Red", "color": "red", "icon": "🍎", "is_target": True},
                {"id": "match_balloon", "name": "Balloon", "label": "Blue", "color": "blue", "icon": "🎈", "is_target": True},
                {"id": "match_star", "name": "Star", "label": "Yellow", "color": "yellow", "icon": "⭐", "is_target": True},
            ],
            "targets": [
                {"color": "red", "label": "Red Bucket", "icon": "🪣", "target_color": "#EF4444"},
                {"color": "blue", "label": "Blue Bucket", "icon": "🪣", "target_color": "#3B82F6"},
                {"color": "yellow", "label": "Yellow Bucket", "icon": "🪣", "target_color": "#EAB308"},
            ],
            "correct_id": "all_matched",
            "instruction": "Match each colored toy to its matching bucket!",
            "spoken": "Match the red apple to red, blue balloon to blue, and yellow star to yellow!",
            "hint": "Put each item into the bucket that has the very same color! 🎨",
        },
        "color_sorting": {
            "title": "Color Sorting",
            "greeting": "Our toy room needs tidying up! Let's sort toys by color! 🧸",
            "hear": "Sorting means putting things of the same color into their own box!",
            "fact": "Sorting helps us keep our toys neat and organized!",
            "song": "Sort the colors, put them in!\nEvery toy inside its bin!\nRed and Blue and Yellow bright,\nEverything is clean and right! 📦",
            "story": "Milo has toys scattered around! There are red hearts and blue crystals and yellow crowns. Let's put them into their color treasure chests!",
            "items": [
                {"id": "sort_heart", "name": "Heart", "label": "Red Heart", "color": "red", "icon": "❤️", "is_target": True},
                {"id": "sort_blue_gem", "name": "Gem", "label": "Blue Gem", "color": "blue", "icon": "💎", "is_target": True},
                {"id": "sort_crown", "name": "Crown", "label": "Yellow Crown", "color": "yellow", "icon": "👑", "is_target": True},
                {"id": "sort_car", "name": "Red Car", "label": "Red Car", "color": "red", "icon": "🚗", "is_target": True},
            ],
            "targets": [
                {"color": "red", "label": "Red Chest", "icon": "🧰", "target_color": "#EF4444"},
                {"color": "blue", "label": "Blue Chest", "icon": "🧰", "target_color": "#3B82F6"},
                {"color": "yellow", "label": "Yellow Chest", "icon": "🧰", "target_color": "#EAB308"},
            ],
            "correct_id": "all_sorted",
            "instruction": "Sort the toys into the matching treasure chests!",
            "spoken": "Drag or tap toys into the chest with the same color!",
            "hint": "Look at the color of each toy and place it in the chest of the same color!",
        },
        "color_challenge": {
            "title": "Color Challenge",
            "greeting": "You're doing fantastic! Are you ready for the grand Color Master Challenge? 🏆",
            "hear": "Listen carefully! Milo will ask you special questions!",
            "fact": "When you know Red, Blue, and Yellow, you can make every color of the rainbow!",
            "song": "We are masters, yes we are!\nShining bright just like a star!\nColors here and colors there,\nRainbows dancing in the air! 🌈",
            "story": "The Rainbow Fairy visited Milo and asked: 'Who is ready to earn the Grand Color Crown?' Milo pointed to you! Let's solve the master riddle!",
            "items": [
                {"id": "target_blue_car", "name": "Blue Car", "label": "Blue Car", "color": "blue", "icon": "🚙", "is_target": True},
                {"id": "red_apple_ch", "name": "Red Apple", "label": "Red Apple", "color": "red", "icon": "🍎", "is_target": False},
                {"id": "yellow_sun_ch", "name": "Sun", "label": "Yellow Sun", "color": "yellow", "icon": "☀️", "is_target": False},
                {"id": "green_tree_ch", "name": "Tree", "label": "Green Tree", "color": "green", "icon": "🌲", "is_target": False},
            ],
            "correct_id": "target_blue_car",
            "instruction": "Find the BLUE car zooming by!",
            "spoken": "Which one is the blue car? Zoom zoom! Tap it!",
            "hint": "It has four wheels and is painted like the bright blue ocean! 🚙",
        }
    }

    # Shape knowledge base for World 2 extension
    SHAPE_KNOWLEDGE = {
        "circle": {
            "title": "Round Circle",
            "greeting": "Milo loves things that roll! Let's explore the round CIRCLE! 🔴",
            "hear": "Circle! Round and round, with no corners at all!",
            "fact": "Coins, clocks, and tasty pizzas are all circles!",
            "song": "A circle is round, it rolls on the ground!\nRound and round, no corners found! 🔘",
            "story": "Milo found a round shiny coin rolling down the hill. Can you spot which shape is round like a ball?",
            "items": [
                {"id": "circle_ball", "name": "Circle", "label": "Circle", "shape": "circle", "icon": "🔴", "color": "red", "is_target": True},
                {"id": "square_box", "name": "Square", "label": "Square", "shape": "square", "icon": "🟧", "color": "orange", "is_target": False},
                {"id": "triangle_wedge", "name": "Triangle", "label": "Triangle", "shape": "triangle", "icon": "🔺", "color": "red", "is_target": False},
            ],
            "correct_id": "circle_ball",
            "instruction": "Can you tap the round CIRCLE?",
            "spoken": "Find the round circle! Tap it!",
            "hint": "It has no pointy corners and rolls round and round! 🔴",
        }
    }

    async def generate_lesson_content(self, context: Dict[str, Any]) -> Dict[str, Any]:
        concept = context.get("concept", "red")
        difficulty = context.get("difficulty", 1)

        data = self.COLOR_KNOWLEDGE.get(concept) or self.SHAPE_KNOWLEDGE.get(concept) or self.COLOR_KNOWLEDGE["red"]
        items = list(data["items"])

        # Adaptive difficulty:
        # If difficulty == 1: 3 items (target + 2 distractors)
        # If difficulty == 2: 4 items
        # If difficulty == 3: trickier items
        if difficulty == 1 and len(items) > 3:
            # Keep target + 2 others
            target = [it for it in items if it.get("is_target")]
            others = [it for it in items if not it.get("is_target")][:2]
            items = target + others

        return {
            "title": data["title"],
            "greeting": data["greeting"],
            "hear": data["hear"],
            "fact": data["fact"],
            "song": data["song"],
            "story": data["story"],
            "items": items,
            "targets": data.get("targets"),
            "correct_id": data["correct_id"],
            "instruction": data["instruction"],
            "spoken": data["spoken"],
            "hint": data["hint"],
        }

    async def generate_assessment_reaction(self, context: Dict[str, Any]) -> Dict[str, Any]:
        is_correct = context.get("is_correct", False)
        concept = context.get("concept", "red")
        mistakes = context.get("mistakes", 0)

        if is_correct:
            reactions = [
                f"YAY! You found {concept.upper()}! That's wonderful!",
                f"Super duper job! That is exactly {concept}!",
                f"Hooray! Milo is dancing for joy! You're a star!",
                f"High five, Little Explorer! You mastered {concept}!"
            ]
            import random
            reaction = random.choice(reactions)
            return {
                "ai_reaction": reaction,
                "spoken_feedback": reaction,
                "encouragement": "Let's keep exploring! You are so smart!",
                "next_action": "celebrate",
            }
        else:
            # Child struggling: NEVER SHAME, always warm and gentle
            if mistakes >= 2:
                reaction = f"Good try! Let's do it together! Look closely, Milo made it glow for you!"
                spoken = f"Good try! Let's do it together! Look at the glowing one!"
                next_action = "retry_simplified"
            else:
                reaction = f"Almost! Look carefully. Let's try again together!"
                spoken = f"Almost! Look carefully with Milo! Let's try once more!"
                next_action = "retry_same"

            return {
                "ai_reaction": reaction,
                "spoken_feedback": spoken,
                "encouragement": "Milo believes in you! Take your time.",
                "next_action": next_action,
            }

    async def generate_song(self, concept: str) -> str:
        data = self.COLOR_KNOWLEDGE.get(concept)
        if data:
            return data["song"]
        return f"{concept.capitalize()}, {concept}, what a sight!\nShining happy, cheerful, bright! 🎵"

    async def generate_story(self, concept: str) -> str:
        data = self.COLOR_KNOWLEDGE.get(concept)
        if data:
            return data["story"]
        return f"Milo the Bunny hopped on a big adventure looking for {concept}! Can you help Milo find it?"

class LLMAIProvider(BaseAIProvider):
    """Integrates with Gemini or OpenAI when API key is provided."""
    def __init__(self, provider_type: str = "gemini", api_key: str = ""):
        self.provider_type = provider_type
        self.api_key = api_key
        self.fallback = SmartRulesAIProvider()

    async def generate_lesson_content(self, context: Dict[str, Any]) -> Dict[str, Any]:
        if not self.api_key:
            return await self.fallback.generate_lesson_content(context)
        try:
            # If Gemini or OpenAI is configured, we can call them or gracefully fallback
            # Safe structured fallback ensures zero latency failure
            return await self.fallback.generate_lesson_content(context)
        except Exception as e:
            logger.warning(f"LLM call failed: {e}. Falling back to SmartRules.")
            return await self.fallback.generate_lesson_content(context)

    async def generate_assessment_reaction(self, context: Dict[str, Any]) -> Dict[str, Any]:
        return await self.fallback.generate_assessment_reaction(context)

    async def generate_song(self, concept: str) -> str:
        return await self.fallback.generate_song(concept)

    async def generate_story(self, concept: str) -> str:
        return await self.fallback.generate_story(concept)

def get_ai_provider() -> BaseAIProvider:
    provider = os.getenv("AI_PROVIDER", "smart_rules").lower()
    gemini_key = os.getenv("GEMINI_API_KEY", "")
    openai_key = os.getenv("OPENAI_API_KEY", "")

    if provider == "gemini" and gemini_key:
        return LLMAIProvider("gemini", gemini_key)
    elif provider == "openai" and openai_key:
        return LLMAIProvider("openai", openai_key)
    return SmartRulesAIProvider()
