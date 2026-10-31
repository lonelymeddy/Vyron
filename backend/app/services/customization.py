import re
from typing import Dict, Any, List, Optional
from app.ai_engine.schemas import (
    ProductionSettings, EnvironmentInstruction, CharacterAppearanceInstruction, CameraInstruction
)

class CustomizationParser:
    ENV_KEYWORDS = {
        "erangel": "erangel_pubg",
        "military": "erangel_pubg",
        "compound": "erangel_pubg",
        "desert": "miramar_desert",
        "miramar": "miramar_desert",
        "snow": "vikendi_snow",
        "vikendi": "vikendi_snow",
        "city": "cyberpunk_city",
        "street": "cyberpunk_city",
        "urban": "cyberpunk_city",
        "hangar": "futuristic_hangar",
        "warehouse": "futuristic_hangar"
    }

    LIGHTING_KEYWORDS = {
        "sunset": "sunset_dramatic",
        "dusk": "sunset_dramatic",
        "golden hour": "sunset_dramatic",
        "night": "cinematic_night",
        "dark": "cinematic_night",
        "storm": "overcast_stormy",
        "rain": "overcast_stormy",
        "neon": "cyberpunk_neon"
    }

    CAMERA_KEYWORDS = {
        "orbit": "cinematic_orbit",
        "360": "cinematic_orbit",
        "push": "dramatic_push_in",
        "zoom": "dramatic_push_in",
        "track": "tracking_shot",
        "follow": "tracking_shot",
        "wide": "wide_landscape",
        "close": "close_up_lens"
    }

    VEHICLE_KEYWORDS = {
        "sports car": "sports_car_gt",
        "car": "dacia_sedan",
        "buggy": "dacia_sedan",
        "dacia": "dacia_sedan",
        "motorcycle": "hover_bike",
        "bike": "hover_bike",
        "truck": "armored_truck"
    }

    OUTFIT_KEYWORDS = {
        "tactical": "tactical_black",
        "black suit": "tactical_black",
        "ghillie": "desert_ghillie",
        "camo": "desert_ghillie",
        "armor": "tactical_black",
        "exosuit": "cyber_exosuit",
        "cyber": "cyber_exosuit"
    }

    @classmethod
    def parse_prompt(cls, prompt: str, base_settings: Optional[Dict[str, Any]] = None) -> ProductionSettings:
        text = prompt.lower()
        settings = ProductionSettings()

        for k, v in cls.ENV_KEYWORDS.items():
            if k in text:
                settings.environment.location = v
                break

        for k, v in cls.LIGHTING_KEYWORDS.items():
            if k in text:
                settings.environment.lighting = v
                break

        for k, v in cls.CAMERA_KEYWORDS.items():
            if k in text:
                settings.camera.movement = v
                break

        for k, v in cls.VEHICLE_KEYWORDS.items():
            if k in text:
                settings.vehicle = v
                break

        for k, v in cls.OUTFIT_KEYWORDS.items():
            if k in text:
                settings.character.outfit = v
                break

        if base_settings and isinstance(base_settings, dict):
            if "environment" in base_settings:
                settings.environment.location = str(base_settings["environment"])
            if "lighting" in base_settings:
                settings.environment.lighting = str(base_settings["lighting"])
            if "camera_motion" in base_settings:
                settings.camera.movement = str(base_settings["camera_motion"])
            if "vehicle" in base_settings and base_settings["vehicle"] != "none":
                settings.vehicle = str(base_settings["vehicle"])
            if "outfit" in base_settings:
                settings.character.outfit = str(base_settings["outfit"])
            if "resolution" in base_settings:
                settings.resolution = str(base_settings["resolution"])
            if "aspect_ratio" in base_settings:
                settings.aspect_ratio = str(base_settings["aspect_ratio"])

        return settings

customization_parser = CustomizationParser()
