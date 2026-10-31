from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.db.models import GenerationMode, JobStatus
from app.ai_engine.capabilities import ProviderCapabilityProfile, ProviderCapability
from app.ai_engine.schemas import (
    GenerationJobRequest, ShotPlan, ProviderSubmissionResponse, ProviderStatusResponse
)

class AIJobRequest(BaseModel):
    job_id: str
    mode: GenerationMode
    character_image_url: str
    reference_video_url: Optional[str] = None
    prompt_instructions: Optional[str] = None
    settings: Dict[str, Any] = {}

class AIJobResponse(BaseModel):
    job_id: str
    provider_name: str
    provider_job_id: Optional[str] = None
    status: JobStatus
    progress_percentage: int = 0
    generated_video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    logs: Optional[str] = None
    error_message: Optional[str] = None

class BaseAIProvider(ABC):
    provider_name: str
    display_name: str
    capabilities: ProviderCapabilityProfile

    @abstractmethod
    def is_configured(self) -> bool:
        pass

    def supports_mode(self, mode: GenerationMode) -> bool:
        if mode == GenerationMode.ORIGINAL_CGI_CREATION:
            return self.capabilities.supports(ProviderCapability.IMAGE_TO_VIDEO)
        elif mode == GenerationMode.FULL_CGI_RECREATION:
            return (
                self.capabilities.supports(ProviderCapability.IMAGE_TO_VIDEO) or
                self.capabilities.supports(ProviderCapability.SCENE_RECREATION)
            )
        elif mode == GenerationMode.CHARACTER_REPLACEMENT:
            return (
                self.capabilities.supports(ProviderCapability.VIDEO_TO_VIDEO) or
                self.capabilities.supports(ProviderCapability.VIDEO_EDITING) or
                self.capabilities.supports(ProviderCapability.REFERENCE_IMAGE_CONDITIONING)
            )
        return False

    def supports_capability(self, capability: ProviderCapability) -> bool:
        return self.capabilities.supports(capability)

    @abstractmethod
    async def submit_shot(self, shot: ShotPlan, request: GenerationJobRequest) -> ProviderSubmissionResponse:
        pass

    @abstractmethod
    async def get_task_status(self, provider_task_id: str) -> ProviderStatusResponse:
        pass

    async def submit_job(self, request: AIJobRequest) -> AIJobResponse:
        shot = ShotPlan(
            shot_id=f"shot_{request.job_id}",
            scene_number=1,
            duration_seconds=float(request.settings.get("duration", 5)),
            prompt_text=request.prompt_instructions or "Cinematic CGI sequence",
            character_action="cinematic action",
            camera_direction=request.settings.get("camera_direction", "cinematic_orbit"),
            environment_desc=request.settings.get("environment", "erangel_pubg"),
            character_reference_urls=[request.character_image_url] if request.character_image_url else [],
            reference_video_url=request.reference_video_url
        )
        job_req = GenerationJobRequest(
            job_id=request.job_id,
            project_id=request.job_id,
            mode=request.mode,
            character_image_url=request.character_image_url,
            reference_video_url=request.reference_video_url,
            prompt_instructions=request.prompt_instructions
        )
        sub = await self.submit_shot(shot, job_req)
        return AIJobResponse(
            job_id=request.job_id,
            provider_name=self.provider_name,
            provider_job_id=sub.task_id,
            status=sub.status
        )

    async def get_job_status(self, provider_job_id: str) -> AIJobResponse:
        st = await self.get_task_status(provider_task_id=provider_job_id)
        return AIJobResponse(
            job_id=provider_job_id,
            provider_name=self.provider_name,
            provider_job_id=provider_job_id,
            status=st.status,
            progress_percentage=st.progress_percentage,
            generated_video_url=st.video_url,
            thumbnail_url=st.thumbnail_url,
            error_message=st.error_message
        )
