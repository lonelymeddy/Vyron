import httpx
import logging
from typing import Optional, Dict, Any, List
from app.ai_engine.base import BaseAIProvider
from app.ai_engine.capabilities import RUNWAY_CAPABILITIES, ProviderCapability
from app.ai_engine.schemas import (
    ShotPlan, GenerationJobRequest, ProviderSubmissionResponse, ProviderStatusResponse
)
from app.ai_engine.exceptions import (
    ProviderNotConfiguredError, ProviderAuthenticationError, ProviderRateLimitError, AIProviderError
)
from app.db.models import JobStatus, GenerationMode

logger = logging.getLogger(__name__)

class RunwayAIProvider(BaseAIProvider):
    provider_name = "runway"
    display_name = "Runway Gen-3 Alpha / Gen-4 Turbo"
    capabilities = RUNWAY_CAPABILITIES

    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://api.runwayml.com/v1"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 10)

    def _get_headers(self) -> Dict[str, str]:
        if not self.is_configured():
            raise ProviderNotConfiguredError(self.provider_name)
        return {
            "Authorization": f"Bearer {self.api_key.strip()}",
            "X-Runway-Version": "2024-09-13",
            "Content-Type": "application/json"
        }

    async def submit_shot(self, shot: ShotPlan, request: GenerationJobRequest) -> ProviderSubmissionResponse:
        if not self.is_configured():
            raise ProviderNotConfiguredError(self.provider_name)

        headers = self._get_headers()
        async with httpx.AsyncClient(timeout=30.0) as client:
            if request.mode == GenerationMode.CHARACTER_REPLACEMENT and shot.reference_video_url:
                endpoint = f"{self.base_url}/video_to_video"
                references = []
                for img_url in shot.character_reference_urls or [request.character_image_url]:
                    if img_url:
                        references.append({"uri": img_url})

                payload: Dict[str, Any] = {
                    "model": "gemini_omni_flash",
                    "promptText": (
                        f"Replace character with reference persona. {shot.prompt_text}. "
                        f"Preserve exact scene physics and camera timing."
                    ),
                    "videoUri": shot.reference_video_url,
                }
                if references:
                    payload["references"] = references

                resp = await client.post(endpoint, json=payload, headers=headers)
            else:
                endpoint = f"{self.base_url}/image_to_video"
                target_ratio = "1280:720"
                if request.production_settings.aspect_ratio == "9:16":
                    target_ratio = "720:1280"
                elif request.production_settings.aspect_ratio == "1:1":
                    target_ratio = "960:960"

                prompt_img = shot.character_reference_urls[0] if shot.character_reference_urls else request.character_image_url
                payload = {
                    "model": "gen3a_turbo",
                    "promptImage": prompt_img,
                    "promptText": f"Cinematic CGI shot: {shot.prompt_text}. Camera: {shot.camera_direction}.",
                    "duration": min(max(int(shot.duration_seconds), 5), 10),
                    "ratio": target_ratio,
                    "audio": request.production_settings.enable_audio
                }
                resp = await client.post(endpoint, json=payload, headers=headers)

            if resp.status_code == 401:
                raise ProviderAuthenticationError(self.provider_name, resp.text)
            elif resp.status_code == 429:
                raise ProviderRateLimitError(self.provider_name)
            elif resp.status_code not in (200, 201):
                logger.error(f"Runway API submit error: {resp.status_code} {resp.text}")
                raise AIProviderError(f"Runway submission rejected: {resp.text}", provider_name=self.provider_name, status_code=resp.status_code)

            data = resp.json()
            task_id = data.get("id") or data.get("taskId") or ""
            estimated_cost = float(data.get("estimatedCost", {}).get("credits", 10.0))

            return ProviderSubmissionResponse(
                task_id=task_id,
                provider_name=self.provider_name,
                status=JobStatus.QUEUED,
                estimated_cost=estimated_cost,
                raw_response=data
            )

    async def get_task_status(self, provider_task_id: str) -> ProviderStatusResponse:
        if not self.is_configured():
            raise ProviderNotConfiguredError(self.provider_name)

        headers = self._get_headers()
        endpoint = f"{self.base_url}/tasks/{provider_task_id}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(endpoint, headers=headers)
            if resp.status_code == 401:
                raise ProviderAuthenticationError(self.provider_name, resp.text)
            elif resp.status_code == 429:
                raise ProviderRateLimitError(self.provider_name)
            elif resp.status_code != 200:
                raise AIProviderError(f"Runway task status check failed: {resp.text}", provider_name=self.provider_name, status_code=resp.status_code)

            data = resp.json()
            raw_status = (data.get("status") or "").upper()

            status = JobStatus.PROCESSING
            progress = 50
            video_url = None
            error_msg = None
            actual_cost = None

            if raw_status in ("PENDING", "THROTTLED"):
                status = JobStatus.QUEUED
                progress = 10
            elif raw_status == "RUNNING":
                status = JobStatus.PROCESSING
                progress = int(float(data.get("progress", 0.5)) * 100)
            elif raw_status == "SUCCEEDED":
                status = JobStatus.COMPLETED
                progress = 100
                outputs = data.get("output") or []
                if outputs and isinstance(outputs, list):
                    video_url = outputs[0]
                cost_dict = data.get("cost") or {}
                actual_cost = float(cost_dict.get("credits", 10.0))
            elif raw_status in ("FAILED", "CANCELLED"):
                status = JobStatus.FAILED if raw_status == "FAILED" else JobStatus.CANCELLED
                error_msg = data.get("failure") or f"Runway task ended with status {raw_status}"

            return ProviderStatusResponse(
                task_id=provider_task_id,
                provider_name=self.provider_name,
                status=status,
                progress_percentage=progress,
                video_url=video_url,
                thumbnail_url=None,
                error_message=error_msg,
                actual_cost=actual_cost,
                raw_response=data
            )
