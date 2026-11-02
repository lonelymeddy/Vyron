from typing import Dict, Optional, List, Any
from app.ai_engine.base import BaseAIProvider
from app.ai_engine.kling import KlingAIProvider
from app.ai_engine.runway import RunwayAIProvider
from app.config import settings
from app.db.models import GenerationMode, JobStatus
from app.ai_engine.capabilities import ProviderCapability, VYRON_RECONSTRUCTION_CAPABILITIES
from app.ai_engine.schemas import ShotPlan, GenerationJobRequest, ProviderSubmissionResponse, ProviderStatusResponse
from app.services.blender_service import blender_service
import os

class VyronReconstructionProvider(BaseAIProvider):
    provider_name = "vyron_reconstruction_engine"
    display_name = "VYRON Reference-Driven Cinematic Engine"
    capabilities = VYRON_RECONSTRUCTION_CAPABILITIES

    def is_configured(self) -> bool:
        return blender_service.is_available()

    async def submit_shot(self, shot: ShotPlan, request: GenerationJobRequest) -> ProviderSubmissionResponse:
        out_dir = os.path.join("static", "uploads", "blender_renders")
        os.makedirs(out_dir, exist_ok=True)
        rendered_image = os.path.join(out_dir, f"{shot.shot_id}.png")

        # Execute genuine 3D headless scene reconstruction via Blender
        shot_config = {
            "width": 720,
            "height": 1066,
            "focal_length": 35.0,
            "character_position": [0.0, 0.0, 0.9],
            "camera_position": [0.0, -4.0, 1.35],
            "camera_rotation": [1.45, 0.0, 0.0]
        }
        success = blender_service.render_reconstructed_scene(shot_config, rendered_image)
        if not success:
            raise RuntimeError(f"Blender reconstruction failed for shot {shot.shot_id}")

        return ProviderSubmissionResponse(
            task_id=f"vyron_rec_{shot.shot_id}",
            provider_name=self.provider_name,
            status=JobStatus.COMPLETED,
            estimated_cost=10.0,
            raw_response={"engine": "vyron_reconstruction_engine", "rendered_image": rendered_image}
        )

    async def get_task_status(self, provider_task_id: str) -> ProviderStatusResponse:
        img_name = provider_task_id.replace("vyron_rec_", "") + ".png"
        img_path = os.path.join("static", "uploads", "blender_renders", img_name)
        if os.path.exists(img_path):
            return ProviderStatusResponse(
                task_id=provider_task_id,
                provider_name=self.provider_name,
                status=JobStatus.COMPLETED,
                progress_percentage=100,
                video_url=f"/static/uploads/blender_renders/{img_name}",
                thumbnail_url=f"/static/uploads/blender_renders/{img_name}",
                actual_cost=10.0,
                raw_response={"task_id": provider_task_id}
            )
        return ProviderStatusResponse(
            task_id=provider_task_id,
            provider_name=self.provider_name,
            status=JobStatus.FAILED,
            progress_percentage=0,
            error_message="Rendered output artifact was not found.",
            actual_cost=0.0
        )

class AIProviderRegistry:
    def __init__(self):
        self._providers: Dict[str, BaseAIProvider] = {}
        self._register_default_providers()

    def _register_default_providers(self):
        self.register_provider(VyronReconstructionProvider())
        self.register_provider(KlingAIProvider(api_key=settings.KLING_API_KEY, base_url=settings.KLING_API_BASE_URL))
        self.register_provider(RunwayAIProvider(api_key=settings.RUNWAY_API_KEY, base_url=settings.RUNWAY_API_BASE_URL))

    def register_provider(self, provider: BaseAIProvider):
        self._providers[provider.provider_name] = provider

    def get_provider(self, provider_name: str) -> Optional[BaseAIProvider]:
        norm = provider_name.lower()
        if "runway" in norm:
            norm = "runway"
        elif "kling" in norm:
            norm = "kling"
        elif "vyron" in norm:
            norm = "vyron_reconstruction_engine"
        return self._providers.get(norm)

    def select_best_provider(self, mode: GenerationMode, preferred_provider: Optional[str] = None) -> Optional[BaseAIProvider]:
        if preferred_provider:
            p = self.get_provider(preferred_provider)
            if p and p.supports_mode(mode) and p.is_configured():
                return p

        for name, p in self._providers.items():
            if p.supports_mode(mode) and p.is_configured():
                return p

        return self.get_provider("vyron_reconstruction_engine")

    def list_available_providers(self) -> List[Dict[str, Any]]:
        result = []
        for name, provider in self._providers.items():
            result.append({
                "name": provider.provider_name,
                "display_name": provider.display_name,
                "is_configured": provider.is_configured(),
                "capabilities": [c.value for c in provider.capabilities.capabilities],
                "supported_resolutions": provider.capabilities.supported_resolutions,
                "supported_durations": provider.capabilities.supported_durations,
                "supports_character_consistency": provider.capabilities.supports_character_consistency,
                "disclaimer": provider.capabilities.disclaimer
            })
        return result

ai_registry = AIProviderRegistry()
