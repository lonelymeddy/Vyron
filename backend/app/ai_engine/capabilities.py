from enum import Enum
from typing import Dict, Any, List
from pydantic import BaseModel

class ProviderCapability(str, Enum):
    IMAGE_TO_VIDEO = "image_to_video"
    VIDEO_TO_VIDEO = "video_to_video"
    REFERENCE_IMAGE_CONDITIONING = "reference_image_conditioning"
    CHARACTER_REFERENCE_CONSISTENCY = "character_reference_consistency"
    MOTION_TRANSFER = "motion_transfer"
    VIDEO_EDITING = "video_editing"
    SCENE_RECREATION = "scene_recreation"
    CAMERA_CONTROL = "camera_control"
    MULTIPLE_REFERENCE_IMAGES = "multiple_reference_images"
    VIDEO_DURATION_CONTROLS = "video_duration_controls"
    RESOLUTION_CONTROLS = "resolution_controls"
    AUDIO_GENERATION = "audio_generation"

class ProviderCapabilityProfile(BaseModel):
    provider_name: str
    display_name: str
    capabilities: List[ProviderCapability]
    supported_resolutions: List[str]
    supported_durations: List[int]
    supports_character_consistency: bool
    requires_reference_video_for_replacement: bool
    disclaimer: str = ""

    def supports(self, capability: ProviderCapability) -> bool:
        return capability in self.capabilities

MOCK_CAPABILITIES = ProviderCapabilityProfile(
    provider_name="mock_engine",
    display_name="VYRON High-Speed Dev/Mock Engine",
    capabilities=[c for c in ProviderCapability],
    supported_resolutions=["720p", "1080p", "4K"],
    supported_durations=[5, 10, 15],
    supports_character_consistency=True,
    requires_reference_video_for_replacement=True,
    disclaimer="Simulated engine for local testing, rapid iterations, and CI pipelines."
)

RUNWAY_CAPABILITIES = ProviderCapabilityProfile(
    provider_name="runway",
    display_name="Runway Gen-3 Alpha / Gen-4 Turbo",
    capabilities=[
        ProviderCapability.IMAGE_TO_VIDEO,
        ProviderCapability.VIDEO_TO_VIDEO,
        ProviderCapability.REFERENCE_IMAGE_CONDITIONING,
        ProviderCapability.CHARACTER_REFERENCE_CONSISTENCY,
        ProviderCapability.VIDEO_EDITING,
        ProviderCapability.SCENE_RECREATION,
        ProviderCapability.MULTIPLE_REFERENCE_IMAGES,
        ProviderCapability.VIDEO_DURATION_CONTROLS,
        ProviderCapability.RESOLUTION_CONTROLS,
        ProviderCapability.AUDIO_GENERATION,
    ],
    supported_resolutions=["720p", "1080p"],
    supported_durations=[5, 10],
    supports_character_consistency=True,
    requires_reference_video_for_replacement=True,
    disclaimer="Official Runway REST API integration (Gen-3/Gen-4). Video-to-video editing modifies input video guided by character references; frame-by-frame exact consistency depends on model latent space."
)

KLING_CAPABILITIES = ProviderCapabilityProfile(
    provider_name="kling",
    display_name="Kling AI Video Generator",
    capabilities=[
        ProviderCapability.IMAGE_TO_VIDEO,
        ProviderCapability.REFERENCE_IMAGE_CONDITIONING,
        ProviderCapability.CHARACTER_REFERENCE_CONSISTENCY,
        ProviderCapability.CAMERA_CONTROL,
        ProviderCapability.VIDEO_DURATION_CONTROLS,
        ProviderCapability.RESOLUTION_CONTROLS,
    ],
    supported_resolutions=["720p", "1080p"],
    supported_durations=[5, 10],
    supports_character_consistency=True,
    requires_reference_video_for_replacement=False,
    disclaimer="Official Kling AI API integration. Supports image-to-video with explicit camera controls (orbit, pan, tilt, zoom). Video-to-video character replacement uses keyframe conditioning."
)
