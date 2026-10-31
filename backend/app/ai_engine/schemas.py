from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from app.db.models import GenerationMode, JobStatus

class CameraInstruction(BaseModel):
    shot_type: str = "medium"
    movement: str = "cinematic_orbit"
    speed: str = "normal"
    angle: str = "eye_level"

class EnvironmentInstruction(BaseModel):
    location: str = "erangel_pubg"
    weather: str = "clear"
    lighting: str = "sunset_dramatic"
    time_of_day: str = "sunset"
    atmosphere: Optional[str] = None

class CharacterAppearanceInstruction(BaseModel):
    outfit: str = "tactical_black"
    accessories: List[str] = Field(default_factory=list)
    action: str = "idle"
    mood: str = "focused"

class ProductionSettings(BaseModel):
    environment: EnvironmentInstruction = Field(default_factory=EnvironmentInstruction)
    character: CharacterAppearanceInstruction = Field(default_factory=CharacterAppearanceInstruction)
    camera: CameraInstruction = Field(default_factory=CameraInstruction)
    vehicle: Optional[str] = None
    objects: List[str] = Field(default_factory=list)
    aspect_ratio: str = "16:9"
    resolution: str = "1080p"
    duration_seconds: int = 10
    enable_audio: bool = False

class ShotPlan(BaseModel):
    shot_id: str
    scene_number: int
    duration_seconds: float = 5.0
    prompt_text: str
    character_action: str
    camera_direction: str
    environment_desc: str
    character_reference_urls: List[str] = Field(default_factory=list)
    reference_video_url: Optional[str] = None
    output_url: Optional[str] = None
    provider_task_id: Optional[str] = None
    status: JobStatus = JobStatus.QUEUED
    error_message: Optional[str] = None

class StoryboardScene(BaseModel):
    scene_number: int
    title: str
    duration_seconds: float = 5.0
    character_action: str
    environment: str
    camera_direction: str
    lighting: str
    objects: List[str] = Field(default_factory=list)
    vehicles: Optional[str] = None
    generation_instructions: str

class StoryboardPlan(BaseModel):
    project_id: str
    title: str
    total_scenes: int
    scenes: List[StoryboardScene] = Field(default_factory=list)
    estimated_duration_seconds: float = 15.0

class GenerationJobRequest(BaseModel):
    job_id: str
    project_id: str
    mode: GenerationMode
    character_image_url: str
    character_reference_urls: List[str] = Field(default_factory=list)
    reference_video_url: Optional[str] = None
    prompt_instructions: Optional[str] = None
    production_settings: ProductionSettings = Field(default_factory=ProductionSettings)
    shots: List[ShotPlan] = Field(default_factory=list)
    preferred_provider: Optional[str] = None

class ProviderSubmissionResponse(BaseModel):
    task_id: str
    provider_name: str
    status: JobStatus
    estimated_cost: float = 0.0
    raw_response: Optional[Dict[str, Any]] = None

class ProviderStatusResponse(BaseModel):
    task_id: str
    provider_name: str
    status: JobStatus
    progress_percentage: int = 0
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    error_message: Optional[str] = None
    actual_cost: Optional[float] = None
    raw_response: Optional[Dict[str, Any]] = None
