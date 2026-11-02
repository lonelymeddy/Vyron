from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from app.db.models import GenerationMode, JobStatus

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: str
    is_active: bool
    is_superuser: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ReconstructionShotBlueprint(BaseModel):
    shot_id: int
    start_time: float
    end_time: float
    duration: float
    start_frame: int
    end_frame: int
    camera_type: str
    has_character: bool
    pose_summary: Optional[Dict[str, Any]] = None
    reconstruction_approach: str
    action_description: str

class ReconstructionBlueprintResponse(BaseModel):
    version: str = "1.0.0"
    reference_metadata: Dict[str, Any]
    character_reference: Optional[str] = None
    total_shots: int
    shots: List[ReconstructionShotBlueprint]
    audio_preservation: bool = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class CharacterBase(BaseModel):
    name: str
    description: Optional[str] = None

class CharacterCreate(CharacterBase):
    image_url: str
    storage_path: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None

class CharacterUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class CharacterResponse(CharacterBase):
    id: str
    user_id: str
    image_url: str
    storage_path: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    active_generation_id: Optional[str] = None
    model_asset_url: Optional[str] = None
    rig_status: Optional[str] = "UNRIGGED"
    animation_ready: Optional[bool] = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CharacterReferenceImageResponse(BaseModel):
    id: str
    character_id: str
    original_file_path: str
    processed_file_path: Optional[str] = None
    mask_file_path: Optional[str] = None
    view_type: str
    confidence: float
    dimensions: Optional[str] = None
    quality_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PipelineExecutionResponse(BaseModel):
    id: str
    generation_id: str
    pipeline_number: int
    stage_number: int
    stage_name: str
    status: str
    input_metadata: Optional[Dict[str, Any]] = None
    output_metadata: Optional[Dict[str, Any]] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_details: Optional[str] = None

    class Config:
        from_attributes = True


class CharacterAssetResponse(BaseModel):
    id: str
    character_id: str
    generation_id: Optional[str] = None
    asset_type: str
    file_path: str
    file_format: str
    file_size: Optional[int] = None
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CharacterRigResponse(BaseModel):
    id: str
    character_id: str
    asset_id: str
    skeleton_type: str
    bone_count: int
    rig_status: str
    has_deformation_tested: bool
    validation_results: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CharacterQualityReportResponse(BaseModel):
    id: str
    generation_id: str
    geometry_results: Optional[Dict[str, Any]] = None
    texture_results: Optional[Dict[str, Any]] = None
    rigging_results: Optional[Dict[str, Any]] = None
    export_results: Optional[Dict[str, Any]] = None
    overall_status: str
    created_at: datetime

    class Config:
        from_attributes = True


class CharacterGenerationResponse(BaseModel):
    id: str
    character_id: str
    generation_version: int
    generation_mode: str
    status: str
    current_pipeline: int
    current_stage: int
    stage_name: str
    progress_percentage: int
    configuration: Optional[Dict[str, Any]] = None
    error_details: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    pipeline_executions: List[PipelineExecutionResponse] = []
    assets: List[CharacterAssetResponse] = []
    quality_report: Optional[CharacterQualityReportResponse] = None

    class Config:
        from_attributes = True


class CharacterGenerationCreate(BaseModel):
    generation_mode: Optional[str] = "SINGLE_IMAGE"
    target_polycount: Optional[int] = 30000
    generate_rig: Optional[bool] = True
    texture_resolution: Optional[int] = 2048
    symmetry_mode: Optional[bool] = True

class SourceVideoResponse(BaseModel):
    id: str
    project_id: str
    file_name: str
    video_url: str
    duration_seconds: Optional[float] = None
    resolution: Optional[str] = None
    fps: Optional[float] = None
    file_size: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class GeneratedVideoResponse(BaseModel):
    id: str
    generation_id: str
    video_url: str
    thumbnail_url: Optional[str] = None
    duration_seconds: Optional[float] = None
    resolution: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class GenerationShotResponse(BaseModel):
    id: str
    scene_number: int
    status: JobStatus
    provider_task_id: Optional[str] = None
    output_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class StoryboardSceneSchema(BaseModel):
    scene_number: int
    title: str
    duration_seconds: float = 5.0
    character_action: str
    environment: str
    camera_direction: str
    lighting: str
    objects: Optional[List[str]] = None
    vehicles: Optional[str] = None
    generation_instructions: str

    class Config:
        from_attributes = True

class StoryboardResponse(BaseModel):
    id: str
    project_id: str
    title: str
    total_scenes: int
    estimated_duration_seconds: float
    scenes: List[StoryboardSceneSchema] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StoryboardUpdate(BaseModel):
    title: Optional[str] = None
    scenes: List[StoryboardSceneSchema]

class GenerationCreate(BaseModel):
    project_id: str
    provider_name: Optional[str] = "vyron_reconstruction_engine"

class GenerationJobResponse(BaseModel):
    id: str
    step_name: str
    status: JobStatus
    logs: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class GenerationResponse(BaseModel):
    id: str
    project_id: str
    provider_name: str
    provider_task_id: Optional[str] = None
    status: JobStatus
    progress_percentage: int
    error_message: Optional[str] = None
    cost_credits: Optional[float] = 10.0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    jobs: List[GenerationJobResponse] = []
    shots: List[GenerationShotResponse] = []
    generated_videos: List[GeneratedVideoResponse] = []

    class Config:
        from_attributes = True

class ProjectSettings(BaseModel):
    aspect_ratio: str = "16:9"
    resolution: str = "1080p"
    duration: int = 10
    visual_style: str = "pubg_cinematic"
    camera_direction: Optional[str] = "cinematic_orbit"
    audio_enabled: bool = True
    character_consistency_weight: float = 0.95
    environment: Optional[str] = "erangel_pubg"
    lighting: Optional[str] = "sunset_dramatic"
    outfit: Optional[str] = "tactical_black"
    vehicle: Optional[str] = "dacia_sedan"

class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    character_id: Optional[str] = None
    generation_mode: GenerationMode = GenerationMode.CHARACTER_REPLACEMENT
    prompt_instructions: Optional[str] = None
    settings: Optional[ProjectSettings] = Field(default_factory=ProjectSettings)

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    character_id: Optional[str] = None
    generation_mode: Optional[GenerationMode] = None
    prompt_instructions: Optional[str] = None
    settings: Optional[ProjectSettings] = None

class ProjectResponse(BaseModel):
    id: str
    user_id: str
    character_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    generation_mode: GenerationMode
    status: JobStatus
    prompt_instructions: Optional[str] = None
    settings: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    character: Optional[CharacterResponse] = None
    source_videos: List[SourceVideoResponse] = []
    generations: List[GenerationResponse] = []
    storyboard: Optional[StoryboardResponse] = None

    class Config:
        from_attributes = True

class CreditResponse(BaseModel):
    balance: int
    updated_at: datetime

    class Config:
        from_attributes = True

class CreditTransactionResponse(BaseModel):
    id: str
    amount: int
    description: str
    created_at: datetime

    class Config:
        from_attributes = True

class Asset3D(BaseModel):
    id: str
    category: str
    name: str
    thumbnail_url: str
    tags: List[str]
    is_pubg_style: bool = True

class WorldPreset(BaseModel):
    id: str
    name: str
    description: str
    map_location: str
    weather: str
    preview_url: str

class ProviderCapabilityInfo(BaseModel):
    name: str
    display_name: str
    provider_type: str = "internal"  # "internal" | "external"
    requires_api_key: bool = False
    is_configured: bool
    capabilities: List[str]
    supported_resolutions: List[str]
    supported_durations: List[int]
    supports_character_consistency: bool
    disclaimer: str
    dependencies: Optional[Dict[str, bool]] = None

# Editor & Shot Refinement Schemas
class ShotAdjustmentSchema(BaseModel):
    id: Optional[str] = None
    project_id: str
    shot_id: int
    pos_x: float = 0.0
    pos_y: float = 0.0
    pos_z: float = 0.0
    scale: float = 1.0
    rotation_y: float = 0.0
    ground_offset: float = 0.0
    speed: float = 1.0
    offset_sec: float = 0.0
    root_movement: bool = True
    camera_pos_x: float = 0.0
    camera_pos_y: float = 0.0
    camera_pos_z: float = 0.0
    camera_fov: float = 50.0
    camera_movement: str = "standard"
    light_intensity: float = 1.0
    light_color_temp: float = 5500.0
    light_direction: str = "ambient"
    environment_alignment: float = 0.0
    custom_params: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class ShotAdjustmentUpdate(BaseModel):
    pos_x: Optional[float] = None
    pos_y: Optional[float] = None
    pos_z: Optional[float] = None
    scale: Optional[float] = None
    rotation_y: Optional[float] = None
    ground_offset: Optional[float] = None
    speed: Optional[float] = None
    offset_sec: Optional[float] = None
    root_movement: Optional[bool] = None
    camera_pos_x: Optional[float] = None
    camera_pos_y: Optional[float] = None
    camera_pos_z: Optional[float] = None
    camera_fov: Optional[float] = None
    camera_movement: Optional[str] = None
    light_intensity: Optional[float] = None
    light_color_temp: Optional[float] = None
    light_direction: Optional[str] = None
    environment_alignment: Optional[float] = None
    custom_params: Optional[Dict[str, Any]] = None

class ShotRenderVersionResponse(BaseModel):
    id: str
    project_id: str
    shot_id: int
    version_number: int
    video_url: str
    duration: Optional[float] = None
    resolution: Optional[str] = None
    fps: Optional[float] = None
    is_selected: bool
    status: JobStatus
    adjustments_snapshot: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class QualityControlIssue(BaseModel):
    category: str
    severity: str
    description: str
    timestamp: Optional[float] = None
    frame_number: Optional[int] = None

class QualityControlResponse(BaseModel):
    id: str
    project_id: str
    shot_id: Optional[int] = None
    target_type: str
    video_path: str
    total_frames: int
    missing_frames: int
    black_frames: int
    fps_measured: Optional[float] = None
    has_audio: bool
    character_detected: bool
    continuity_status: str
    issues: List[Dict[str, Any]] = []
    manual_review_required: bool
    review_flags: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True

class VideoAssembleRequest(BaseModel):
    audio_mode: str = "original"
    audio_url: Optional[str] = None
    audio_volume: float = 1.0

class ExportJobRequest(BaseModel):
    resolution: str = "original"
    fps: int = 30
    format: str = "mp4"
    audio_config: Optional[Dict[str, Any]] = None

class ExportJobResponse(BaseModel):
    id: str
    project_id: str
    status: JobStatus
    progress_percentage: int
    resolution: str
    fps: int
    format: str
    output_url: Optional[str] = None
    duration: Optional[float] = None
    file_size: Optional[int] = None
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class EditorShotData(BaseModel):
    shot_id: int
    start_time: float
    end_time: float
    duration: float
    start_frame: int
    end_frame: int
    camera_type: str
    has_character: bool
    action_description: str
    reconstruction_approach: str
    adjustments: ShotAdjustmentSchema
    versions: List[ShotRenderVersionResponse] = []
    active_version: Optional[ShotRenderVersionResponse] = None
    qc_report: Optional[QualityControlResponse] = None

class EditorProjectDataResponse(BaseModel):
    project_id: str
    title: str
    generation_mode: str
    status: JobStatus
    reference_video_url: Optional[str] = None
    reference_metadata: Optional[Dict[str, Any]] = None
    reconstructed_video_url: Optional[str] = None
    total_duration: float = 0.0
    shots: List[EditorShotData] = []
    overall_qc: Optional[QualityControlResponse] = None
    active_export: Optional[ExportJobResponse] = None


# -------------------------------------------------------------------------
# NEW SUBSYSTEM SCHEMAS (ENVIRONMENT, AI MODELS, WORKERS, SETTINGS)
# -------------------------------------------------------------------------

class EnvironmentAssetSchema(BaseModel):
    id: str
    environment_id: str
    asset_name: str
    category: str
    model_format: str
    file_path: str
    file_size: Optional[int] = None
    position: List[float] = []
    rotation: List[float] = []
    scale: List[float] = []
    material_properties: Optional[Dict[str, Any]] = None
    is_reusable: bool = True

    class Config:
        from_attributes = True


class EnvironmentCreate(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    theme: str = "tactical_pubg"
    map_location: Optional[str] = None
    weather: str = "clear"
    time_of_day: str = "golden_hour"
    preview_url: Optional[str] = None
    scene_config: Optional[Dict[str, Any]] = None


class EnvironmentResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    name: str
    slug: str
    description: Optional[str] = None
    theme: str
    map_location: Optional[str] = None
    weather: str
    time_of_day: str
    preview_url: Optional[str] = None
    scene_config: Optional[Dict[str, Any]] = None
    is_preset: bool
    is_active: bool
    created_at: datetime
    assets: List[EnvironmentAssetSchema] = []

    class Config:
        from_attributes = True


class ModelVersionSchema(BaseModel):
    id: str
    model_id: str
    version_tag: str
    file_size_bytes: Optional[int] = None
    file_sha256: Optional[str] = None
    download_url: Optional[str] = None
    local_path: Optional[str] = None
    is_verified: bool
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ModelRecordSchema(BaseModel):
    id: str
    name: str
    category: str
    version: str
    source_repo: Optional[str] = None
    license: str
    license_url: Optional[str] = None
    is_installed: bool
    is_active: bool
    default_weight_file: str
    local_weight_path: Optional[str] = None
    vram_recommended_mb: int
    requires_gpu: bool
    supports_cpu_fallback: bool
    supported_inputs: List[str] = []
    output_format: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WorkerTaskSchema(BaseModel):
    id: str
    worker_id: Optional[str] = None
    task_type: str
    entity_id: str
    status: JobStatus
    priority: int
    progress_percentage: int
    input_payload: Optional[Dict[str, Any]] = None
    output_payload: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    retry_count: int
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WorkerRecordSchema(BaseModel):
    id: str
    worker_name: str
    worker_type: str
    status: str
    capabilities: List[str] = []
    current_job_id: Optional[str] = None
    gpu_device_name: Optional[str] = None
    gpu_vram_total_mb: int = 0
    gpu_vram_used_mb: int = 0
    cpu_cores: int = 4
    ram_total_mb: int = 8192
    ram_used_mb: int = 2048
    last_heartbeat: datetime
    endpoint_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WorkerHeartbeat(BaseModel):
    worker_name: str
    status: str = "ONLINE"
    gpu_vram_used_mb: Optional[int] = None
    ram_used_mb: Optional[int] = None
    current_job_id: Optional[str] = None


class SystemSettingSchema(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    is_secret: bool
    updated_at: datetime

    class Config:
        from_attributes = True
