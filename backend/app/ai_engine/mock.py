from typing import Dict, Any, Optional
from app.ai_engine.base import BaseAIProvider
from app.ai_engine.capabilities import MOCK_CAPABILITIES
from app.ai_engine.schemas import (
    ShotPlan, GenerationJobRequest, ProviderSubmissionResponse, ProviderStatusResponse
)
from app.db.models import JobStatus

class MockEngineProvider(BaseAIProvider):
    provider_name = "mock_engine"
    display_name = "VYRON High-Speed Dev/Mock Engine"
    capabilities = MOCK_CAPABILITIES

    def is_configured(self) -> bool:
        return True

    async def submit_shot(self, shot: ShotPlan, request: GenerationJobRequest) -> ProviderSubmissionResponse:
        return ProviderSubmissionResponse(
            task_id=f"mock_task_{shot.shot_id}",
            provider_name=self.provider_name,
            status=JobStatus.PROCESSING,
            estimated_cost=10.0,
            raw_response={"mock": True, "mode": request.mode.value}
        )

    async def get_task_status(self, provider_task_id: str) -> ProviderStatusResponse:
        return ProviderStatusResponse(
            task_id=provider_task_id,
            provider_name=self.provider_name,
            status=JobStatus.COMPLETED,
            progress_percentage=100,
            video_url="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            thumbnail_url="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop",
            actual_cost=10.0
        )
