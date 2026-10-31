import asyncio
import logging
from typing import List, Optional, Dict, Any
from app.ai_engine.base import BaseAIProvider
from app.ai_engine.registry import ai_registry
from app.ai_engine.schemas import (
    GenerationJobRequest, ShotPlan, StoryboardPlan, StoryboardScene
)
from app.ai_engine.exceptions import (
    ProviderNotConfiguredError, UnsupportedCapabilityError, ShotGenerationError
)
from app.db.models import GenerationMode, JobStatus

logger = logging.getLogger(__name__)

class GenerationOrchestrator:
    def __init__(self, registry=ai_registry):
        self.registry = registry

    def resolve_provider(self, request: GenerationJobRequest) -> BaseAIProvider:
        return self.registry.select_best_provider(
            mode=request.mode,
            preferred_provider=request.preferred_provider
        )

    async def generate_shot(
        self,
        provider: BaseAIProvider,
        shot: ShotPlan,
        request: GenerationJobRequest,
        max_retries: int = 2
    ) -> ShotPlan:
        attempt = 0
        last_error = None

        while attempt <= max_retries:
            try:
                attempt += 1
                logger.info(f"Submitting shot #{shot.scene_number} (attempt {attempt}) to {provider.provider_name}")
                sub = await provider.submit_shot(shot, request)
                shot.provider_task_id = sub.task_id
                shot.status = JobStatus.PROCESSING

                poll_count = 0
                while poll_count < 60:
                    await asyncio.sleep(0.5 if provider.provider_name == "mock_engine" else 3.0)
                    poll_count += 1
                    status_resp = await provider.get_task_status(shot.provider_task_id)

                    if status_resp.status == JobStatus.COMPLETED:
                        shot.status = JobStatus.COMPLETED
                        shot.output_url = status_resp.video_url
                        return shot
                    elif status_resp.status in (JobStatus.FAILED, JobStatus.CANCELLED):
                        raise ShotGenerationError(
                            shot_index=shot.scene_number,
                            reason=status_resp.error_message or "Task failed on remote provider",
                            provider_name=provider.provider_name
                        )

                raise ShotGenerationError(
                    shot_index=shot.scene_number,
                    reason="Provider polling timed out after 3 minutes",
                    provider_name=provider.provider_name
                )

            except Exception as e:
                last_error = str(e)
                logger.warning(f"Shot #{shot.scene_number} failed attempt {attempt}: {e}")
                if attempt > max_retries:
                    break
                await asyncio.sleep(1.0)

        shot.status = JobStatus.FAILED
        shot.error_message = last_error
        return shot

orchestrator = GenerationOrchestrator()
