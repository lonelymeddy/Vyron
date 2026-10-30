import asyncio
from typing import Dict, Any, Optional
from app.ai_engine.base import BaseAIProvider, AIJobRequest, AIJobResponse
from app.db.models import GenerationMode, JobStatus

class MockEngineProvider(BaseAIProvider):
    provider_name = "mock_engine"
    display_name = "VYRON AI Cinematic Engine (Dev/Fallback)"

    def supports_mode(self, mode: GenerationMode) -> bool:
        return True

    def is_configured(self) -> bool:
        return True

    async def submit_job(self, request: AIJobRequest) -> AIJobResponse:
        return AIJobResponse(
            job_id=request.job_id,
            provider_name=self.provider_name,
            provider_job_id=f"mock_job_{request.job_id}",
            status=JobStatus.PROCESSING,
            progress_percentage=25,
            logs=f"Mock Engine: Initiated CGI render for mode {request.mode.value}."
        )

    async def get_job_status(self, provider_job_id: str) -> AIJobResponse:
        return AIJobResponse(
            job_id=provider_job_id.replace("mock_job_", ""),
            provider_name=self.provider_name,
            provider_job_id=provider_job_id,
            status=JobStatus.COMPLETED,
            progress_percentage=100,
            generated_video_url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            thumbnail_url="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop",
            logs="Mock Engine: Render finished successfully."
        )

class KlingAIProvider(BaseAIProvider):
    provider_name = "kling"
    display_name = "Kling AI Video Generator"

    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://api.klingai.com/v1"):
        self.api_key = api_key
        self.base_url = base_url

    def supports_mode(self, mode: GenerationMode) -> bool:
        return mode in [GenerationMode.CHARACTER_REPLACEMENT, GenerationMode.FULL_CGI_RECREATION]

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key) > 5)

    async def submit_job(self, request: AIJobRequest) -> AIJobResponse:
        if not self.is_configured():
            return AIJobResponse(
                job_id=request.job_id,
                provider_name=self.provider_name,
                status=JobStatus.FAILED,
                error_message="Kling AI provider API key is not configured in server environment."
            )
        return AIJobResponse(
            job_id=request.job_id,
            provider_name=self.provider_name,
            provider_job_id=f"kling_tx_{request.job_id}",
            status=JobStatus.QUEUED,
            logs="Submitted job to Kling AI remote API."
        )

    async def get_job_status(self, provider_job_id: str) -> AIJobResponse:
        if not self.is_configured():
            return AIJobResponse(
                job_id=provider_job_id,
                provider_name=self.provider_name,
                status=JobStatus.FAILED,
                error_message="Kling AI provider is not configured."
            )
        return AIJobResponse(
            job_id=provider_job_id,
            provider_name=self.provider_name,
            status=JobStatus.PROCESSING,
            progress_percentage=50
        )

class RunwayAIProvider(BaseAIProvider):
    provider_name = "runway"
    display_name = "Runway Gen-3 Alpha"

    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://api.runwayml.com/v1"):
        self.api_key = api_key
        self.base_url = base_url

    def supports_mode(self, mode: GenerationMode) -> bool:
        return True

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key) > 5)

    async def submit_job(self, request: AIJobRequest) -> AIJobResponse:
        if not self.is_configured():
            return AIJobResponse(
                job_id=request.job_id,
                provider_name=self.provider_name,
                status=JobStatus.FAILED,
                error_message="Runway API key is not configured in environment."
            )
        return AIJobResponse(
            job_id=request.job_id,
            provider_name=self.provider_name,
            provider_job_id=f"runway_task_{request.job_id}",
            status=JobStatus.QUEUED
        )

    async def get_job_status(self, provider_job_id: str) -> AIJobResponse:
        if not self.is_configured():
            return AIJobResponse(
                job_id=provider_job_id,
                provider_name=self.provider_name,
                status=JobStatus.FAILED,
                error_message="Runway provider is not configured."
            )
        return AIJobResponse(
            job_id=provider_job_id,
            provider_name=self.provider_name,
            status=JobStatus.PROCESSING,
            progress_percentage=40
        )
