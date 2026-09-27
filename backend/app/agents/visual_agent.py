"""Visual Agent: Designs visual representations, layout specs, icons, and visual glow cues."""
from typing import List, Dict, Any
from app.schemas.stage_schemas import VisualObject

class VisualAgent:
    COLOR_HEX_MAP = {
        "red": "#EF4444",
        "blue": "#3B82F6",
        "yellow": "#FBBF24",
        "green": "#10B981",
        "orange": "#F97316",
        "purple": "#A855F7",
        "pink": "#EC4899",
    }

    def format_visual_objects(self, raw_items: List[Dict[str, Any]], glow_target: bool = False) -> List[VisualObject]:
        objects: List[VisualObject] = []
        for item in raw_items:
            is_target = item.get("is_target", False)
            obj = VisualObject(
                id=item.get("id", "obj"),
                name=item.get("name", "Object"),
                label=item.get("label", item.get("name", "Object")),
                color=item.get("color"),
                shape=item.get("shape"),
                icon=item.get("icon", "🌟"),
                size=item.get("size", "large"),
                sound_cue=f"{item.get('name', 'item').lower()}_pop",
                highlight=(glow_target and is_target),
                is_target=is_target,
            )
            objects.append(obj)
        return objects

    def get_see_objects_for_concept(self, concept: str) -> List[VisualObject]:
        """Provides large showcase objects for the 'SEE' teaching phase."""
        if concept == "red":
            return [
                VisualObject(id="see_apple", name="Red Apple", label="Apple", color="red", icon="🍎", size="giant", is_target=True),
                VisualObject(id="see_strawberry", name="Strawberry", label="Strawberry", color="red", icon="🍓", size="giant", is_target=True),
                VisualObject(id="see_car", name="Fire Engine", label="Fire Engine", color="red", icon="🚒", size="giant", is_target=True),
            ]
        elif concept == "blue":
            return [
                VisualObject(id="see_butterfly", name="Blue Butterfly", label="Butterfly", color="blue", icon="🦋", size="giant", is_target=True),
                VisualObject(id="see_whale", name="Blue Whale", label="Whale", color="blue", icon="🐳", size="giant", is_target=True),
                VisualObject(id="see_balloon", name="Blue Balloon", label="Balloon", color="blue", icon="🎈", size="giant", is_target=True),
            ]
        elif concept == "yellow":
            return [
                VisualObject(id="see_sun", name="Yellow Sun", label="Sun", color="yellow", icon="☀️", size="giant", is_target=True),
                VisualObject(id="see_duck", name="Yellow Duckling", label="Duckling", color="yellow", icon="🐥", size="giant", is_target=True),
                VisualObject(id="see_banana", name="Yellow Banana", label="Banana", color="yellow", icon="🍌", size="giant", is_target=True),
            ]
        elif concept == "green":
            return [
                VisualObject(id="see_frog", name="Green Frog", label="Frog", color="green", icon="🐸", size="giant", is_target=True),
                VisualObject(id="see_tree", name="Green Tree", label="Tree", color="green", icon="🌲", size="giant", is_target=True),
                VisualObject(id="see_leaf", name="Green Leaf", label="Leaf", color="green", icon="🍃", size="giant", is_target=True),
            ]
        else:
            return [
                VisualObject(id="see_palette", name="Rainbow Palette", label="Colors", color="multi", icon="🎨", size="giant", is_target=True),
                VisualObject(id="see_rainbow", name="Rainbow", label="Rainbow", color="multi", icon="🌈", size="giant", is_target=True),
            ]
