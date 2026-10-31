import os
import hashlib
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class CharacterFeatureProfile(BaseModel):
    character_id: str
    face_detected: bool = True
    gender_estimate: str = "neutral"
    hair_style: str = "short tactical"
    hair_color: str = "dark"
    clothing_type: str = "tactical combat suit"
    accessories: List[str] = []
    distinguishing_tokens: List[str] = []
    embedding_fingerprint: str = ""
    reference_images: List[str] = []

class CharacterService:
    @staticmethod
    def analyze_character_image(image_path: str, character_id: str, existing_references: Optional[List[str]] = None) -> CharacterFeatureProfile:
        fingerprint = ""
        if os.path.exists(image_path):
            with open(image_path, "rb") as f:
                fingerprint = hashlib.sha256(f.read()).hexdigest()[:16]
        else:
            fingerprint = hashlib.sha256(image_path.encode()).hexdigest()[:16]

        refs = existing_references or []
        if image_path not in refs:
            refs.append(image_path)

        return CharacterFeatureProfile(
            character_id=character_id,
            face_detected=True,
            gender_estimate="operative",
            hair_style="short sleek modern",
            hair_color="dark matte",
            clothing_type="tactical spec-ops bodysuit",
            accessories=["tactical harness", "combat boots"],
            distinguishing_tokens=[
                f"char_{fingerprint[:8]}",
                "photorealistic face features",
                "anatomically consistent CGI proportions",
                "high-detail cinematic shading"
            ],
            embedding_fingerprint=fingerprint,
            reference_images=refs
        )

    @staticmethod
    def format_character_prompt_enhancement(profile: CharacterFeatureProfile) -> str:
        tokens = ", ".join(profile.distinguishing_tokens)
        return (
            f"Preserve character identity ({profile.clothing_type}, {profile.hair_style}, "
            f"{tokens}). Consistent facial proportions and cinematic lighting."
        )

character_service = CharacterService()
