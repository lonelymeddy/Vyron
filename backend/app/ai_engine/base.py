from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.db.models import GenerationMode, JobStatus

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

    @abstractmethod
    def supports_mode(self, mode: GenerationMode) -> bool:
        pass

    @abstractmethod
    def is_configured(self) -> bool:
        pass

    @abstractmethod
    async def submit_job(self, request: AIJobRequest) -> AIJobResponse:
        pass

    @abstractmethod
    async def get_job_status(self, provider_job_id: str) -> AIJobResponse:
        pass
