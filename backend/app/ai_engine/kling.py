import httpx
import logging
from typing import Optional, Dict, Any, List
from app.ai_engine.base import BaseAIProvider
from app.ai_engine.capabilities import KLING_CAPABILITIES, ProviderCapability
from app.ai_engine.schemas import (
    ShotPlan, GenerationJobRequest, ProviderSubmissionResponse, ProviderStatusResponse
)
from app.ai_engine.exceptions import (
    ProviderNotConfiguredError, ProviderAuthenticationError, ProviderRateLimitError, AIProviderError
)
from app.db.models import JobStatus, GenerationMode

logger = logging.getLogger(__name__)

class KlingAIProvider(BaseAIProvider):
    provider_name = "kling"
    display_name = "Kling AI Video Generator"
    capabilities = KLING_CAPABILITIES

    def __init__(self, api_key: Optional[str] = None, base_url: str = "https://api.klingai.com/v1"):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 10)

    def _get_headers(self) -> Dict[str, str]:
        if not self.is_configured():
            raise ProviderNotConfiguredError(self.provider_name)
        return {
            "Authorization": f"Bearer {self.api_key.strip()}",
            "Content-Type": "application/json"
        }

    async def submit_shot(self, shot: ShotPlan, request: GenerationJobRequest) -> ProviderSubmissionResponse:
        if not self.is_configured():
            raise ProviderNotConfiguredError(self.provider_name)

        headers = self._get_headers()
        endpoint = f"{self.base_url}/videos/image2video"

        camera_config: Dict[str, Any] = {}
        cam_val = shot.camera_direction.lower()
        if "orbit" in cam_val:
            camera_config = {"type": "horizontal_pan", "horizontal": 5.0}
        elif "zoom" in cam_val or "push" in cam_val:
            camera_config = {"type": "zoom", "zoom": 5.0}
        elif "pan" in cam_val:
            camera_config = {"type": "horizontal_pan", "horizontal": -5.0}

        prompt_image = shot.character_reference_urls[0] if shot.character_reference_urls else request.character_image_url

        payload: Dict[str, Any] = {
            "model": "kling-v1",
            "image": prompt_image,
            "prompt": f"{shot.prompt_text}. Character action: {shot.character_action}. Environment: {shot.environment_desc}.",
            "duration": str(min(max(int(shot.duration_seconds), 5), 10)),
            "aspect_ratio": request.production_settings.aspect_ratio or "16:9",
            "mode": "pro" if request.production_settings.resolution == "1080p" else "std"
        }
        if camera_config:
            payload["camera_control"] = camera_config

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(endpoint, json=payload, headers=headers)
            if resp.status_code == 401:
                raise ProviderAuthenticationError(self.provider_name, resp.text)
            elif resp.status_code == 429:
                raise ProviderRateLimitError(self.provider_name)
            elif resp.status_code not in (200, 201):
                raise AIProviderError(f"Kling AI submit rejected: {resp.text}", provider_name=self.provider_name, status_code=resp.status_code)

            data = resp.json()
            code = data.get("code")
            if code not in (0, 200, None):
                msg = data.get("message", "Unknown Kling error")
                if code == 1000 or "auth" in msg.lower():
                    raise ProviderAuthenticationError(self.provider_name, msg)
                raise AIProviderError(f"Kling AI error ({code}): {msg}", provider_name=self.provider_name)

            task_data = data.get("data") or {}
            task_id = task_data.get("task_id") or data.get("request_id") or ""

            return ProviderSubmissionResponse(
                task_id=task_id,
                provider_name=self.provider_name,
                status=JobStatus.QUEUED,
                estimated_cost=10.0,
                raw_response=data
            )

    async def get_task_status(self, provider_task_id: str) -> ProviderStatusResponse:
        if not self.is_configured():
            raise ProviderNotConfiguredError(self.provider_name)

        headers = self._get_headers()
        endpoint = f"{self.base_url}/videos/image2video/{provider_task_id}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(endpoint, headers=headers)
            if resp.status_code == 401:
                raise ProviderAuthenticationError(self.provider_name, resp.text)
            elif resp.status_code == 429:
                raise ProviderRateLimitError(self.provider_name)
            elif resp.status_code != 200:
                raise AIProviderError(f"Kling task status failed: {resp.text}", provider_name=self.provider_name, status_code=resp.status_code)

            data = resp.json()
            task_data = data.get("data") or {}
            task_status = (task_data.get("task_status") or "").lower()

            status = JobStatus.PROCESSING
            progress = 50
            video_url = None
            error_msg = None

            if task_status in ("submitted", "queueing", "waiting"):
                status = JobStatus.QUEUED
                progress = 10
            elif task_status == "processing":
                status = JobStatus.PROCESSING
                progress = 60
            elif task_status == "succeed":
                status = JobStatus.COMPLETED
                progress = 100
                works = task_data.get("task_result", {}).get("videos", [])
                if works and isinstance(works, list):
                    video_url = works[0].get("url")
            elif task_status == "failed":
                status = JobStatus.FAILED
                error_msg = task_data.get("task_status_msg") or "Kling generation failed"

            return ProviderStatusResponse(
                task_id=provider_task_id,
                provider_name=self.provider_name,
                status=status,
                progress_percentage=progress,
                video_url=video_url,
                thumbnail_url=None,
                error_message=error_msg,
                actual_cost=10.0 if status == JobStatus.COMPLETED else 0.0,
                raw_response=data
            )
