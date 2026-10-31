import os
import logging
from typing import Dict, Any, List, Optional
from app.ai_engine.schemas import StoryboardPlan, StoryboardScene
from app.services.video_processor import video_processor

logger = logging.getLogger(__name__)

class VideoAnalysisService:
    @staticmethod
    def analyze_source_video(video_path: str, project_id: str, title: str = "Recreation Project") -> StoryboardPlan:
        meta = video_processor.extract_metadata(video_path)
        duration = meta.get("duration_seconds", 15.0)

        shot_duration = 5.0
        num_scenes = max(1, min(int(duration // shot_duration), 5))

        scenes: List[StoryboardScene] = []
        templates = [
            {
                "title": "Opening Establishing Shot",
                "character_action": "Approaching compound entrance, scanning surroundings with tactical weapon",
                "environment": "PUBG Erangel military outpost, dusty tarmac and guard towers",
                "camera_direction": "Slow dramatic wide push-in tracking shot",
                "lighting": "Golden hour sunset with long atmospheric shadows",
                "objects": ["ammunition crates", "tactical backpack", "barbed wire fence"],
                "vehicles": "Armored Dacia sedan parked near perimeter"
            },
            {
                "title": "Mid-Action Tactical Maneuver",
                "character_action": "Sprinting across open courtyard, seeking low cover behind concrete barrier",
                "environment": "Ruined urban sector with smoke plumes and debris",
                "camera_direction": "Dynamic low-angle follow camera with motion blur",
                "lighting": "High-contrast dusk with flickering building neon",
                "objects": ["barrier rubble", "smoke grenade plume"],
                "vehicles": None
            },
            {
                "title": "Climactic Vehicle Extraction",
                "character_action": "Entering high-speed combat vehicle, revving engine and accelerating away",
                "environment": "Desert highway perimeter leading to mountain pass",
                "camera_direction": "Cinematic 360 orbit transitioning to high-speed trailing lens",
                "lighting": "Dramatic sunset backlighting and vehicle headlight flare",
                "objects": ["tire smoke", "desert dust storm"],
                "vehicles": "Upgraded black tactical sports buggy"
            }
        ]

        for i in range(num_scenes):
            tmpl = templates[i % len(templates)]
            scene = StoryboardScene(
                scene_number=i + 1,
                title=f"Scene {i+1}: {tmpl['title']}",
                duration_seconds=shot_duration,
                character_action=tmpl["character_action"],
                environment=tmpl["environment"],
                camera_direction=tmpl["camera_direction"],
                lighting=tmpl["lighting"],
                objects=tmpl["objects"],
                vehicles=tmpl["vehicles"],
                generation_instructions=(
                    f"Shot {i+1}: {tmpl['character_action']}. Location: {tmpl['environment']}. "
                    f"Cinematography: {tmpl['camera_direction']}. Visual lighting: {tmpl['lighting']}."
                )
            )
            scenes.append(scene)

        return StoryboardPlan(
            project_id=project_id,
            title=title,
            total_scenes=len(scenes),
            scenes=scenes,
            estimated_duration_seconds=float(len(scenes) * shot_duration)
        )

video_analysis_service = VideoAnalysisService()
