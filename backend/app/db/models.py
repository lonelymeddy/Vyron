import uuid
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, Enum, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class GenerationMode(str, enum.Enum):
    CHARACTER_REPLACEMENT = "CHARACTER_REPLACEMENT"
    FULL_CGI_RECREATION = "FULL_CGI_RECREATION"
    ORIGINAL_CGI_CREATION = "ORIGINAL_CGI_CREATION"

class JobStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    UPLOADING = "UPLOADING"
    ANALYZING = "ANALYZING"
    STORYBOARDING = "STORYBOARDING"
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    POST_PROCESSING = "POST_PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    characters = relationship("Character", back_populates="user", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    credits = relationship("Credit", back_populates="user", uselist=False, cascade="all, delete-orphan")
    credit_transactions = relationship("CreditTransaction", back_populates="user", cascade="all, delete-orphan")
    creations = relationship("CreationItem", back_populates="user", cascade="all, delete-orphan")
    voice_profiles = relationship("VoiceProfile", back_populates="user", cascade="all, delete-orphan")
    saved_prompts = relationship("PromptTemplate", back_populates="user", cascade="all, delete-orphan")

class Character(Base):
    __tablename__ = "characters"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=False)
    storage_path = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    active_generation_id = Column(String, nullable=True)
    model_asset_url = Column(String, nullable=True)
    rig_status = Column(String, nullable=True, default="UNRIGGED")
    animation_ready = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="characters")
    projects = relationship("Project", back_populates="character")
    reference_images = relationship("CharacterReferenceImage", back_populates="character", cascade="all, delete-orphan")
    generations_3d = relationship("CharacterGeneration", back_populates="character", cascade="all, delete-orphan")
    assets = relationship("CharacterAsset", back_populates="character", cascade="all, delete-orphan")
    rigs = relationship("CharacterRig", back_populates="character", cascade="all, delete-orphan")
    variants = relationship("CharacterVariant", back_populates="character", cascade="all, delete-orphan")


class CharacterReferenceImage(Base):
    __tablename__ = "character_reference_images"

    id = Column(String, primary_key=True, default=generate_uuid)
    character_id = Column(String, ForeignKey("characters.id", ondelete="CASCADE"), nullable=False, index=True)
    original_file_path = Column(String, nullable=False)
    processed_file_path = Column(String, nullable=True)
    mask_file_path = Column(String, nullable=True)
    view_type = Column(String, nullable=False, default="unknown")
    confidence = Column(Float, default=0.0)
    dimensions = Column(String, nullable=True)
    quality_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    character = relationship("Character", back_populates="reference_images")


class CharacterGeneration(Base):
    __tablename__ = "character_generations"

    id = Column(String, primary_key=True, default=generate_uuid)
    character_id = Column(String, ForeignKey("characters.id", ondelete="CASCADE"), nullable=False, index=True)
    generation_version = Column(Integer, default=1)
    generation_mode = Column(String, nullable=False, default="SINGLE_IMAGE")
    status = Column(String, nullable=False, default="QUEUED")
    current_pipeline = Column(Integer, default=1)
    current_stage = Column(Integer, default=1)
    stage_name = Column(String, default="Image Ingestion")
    progress_percentage = Column(Integer, default=0)
    configuration = Column(JSON, nullable=True)
    error_details = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    character = relationship("Character", back_populates="generations_3d")
    pipeline_executions = relationship("PipelineExecution", back_populates="generation", cascade="all, delete-orphan")
    assets = relationship("CharacterAsset", back_populates="generation", cascade="all, delete-orphan")
    quality_report = relationship("CharacterQualityReport", back_populates="generation", uselist=False, cascade="all, delete-orphan")


class PipelineExecution(Base):
    __tablename__ = "pipeline_executions"

    id = Column(String, primary_key=True, default=generate_uuid)
    generation_id = Column(String, ForeignKey("character_generations.id", ondelete="CASCADE"), nullable=False, index=True)
    pipeline_number = Column(Integer, nullable=False)
    stage_number = Column(Integer, nullable=False)
    stage_name = Column(String, nullable=False)
    status = Column(String, nullable=False, default="QUEUED")
    input_metadata = Column(JSON, nullable=True)
    output_metadata = Column(JSON, nullable=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    error_details = Column(Text, nullable=True)

    generation = relationship("CharacterGeneration", back_populates="pipeline_executions")


class CharacterAsset(Base):
    __tablename__ = "character_assets"

    id = Column(String, primary_key=True, default=generate_uuid)
    character_id = Column(String, ForeignKey("characters.id", ondelete="CASCADE"), nullable=False, index=True)
    generation_id = Column(String, ForeignKey("character_generations.id", ondelete="CASCADE"), nullable=True, index=True)
    asset_type = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_format = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    character = relationship("Character", back_populates="assets")
    generation = relationship("CharacterGeneration", back_populates="assets")
    rig = relationship("CharacterRig", back_populates="asset", uselist=False, cascade="all, delete-orphan")


class CharacterRig(Base):
    __tablename__ = "character_rigs"

    id = Column(String, primary_key=True, default=generate_uuid)
    character_id = Column(String, ForeignKey("characters.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_id = Column(String, ForeignKey("character_assets.id", ondelete="CASCADE"), nullable=False, unique=True)
    skeleton_type = Column(String, nullable=False, default="humanoid")
    bone_count = Column(Integer, default=0)
    rig_status = Column(String, default="RIGGED")
    has_deformation_tested = Column(Boolean, default=False)
    validation_results = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    character = relationship("Character", back_populates="rigs")
    asset = relationship("CharacterAsset", back_populates="rig")


class CharacterVariant(Base):
    __tablename__ = "character_variants"

    id = Column(String, primary_key=True, default=generate_uuid)
    character_id = Column(String, ForeignKey("characters.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_version_id = Column(String, nullable=True)
    variant_name = Column(String, nullable=False)
    configuration = Column(JSON, nullable=True)
    asset_id = Column(String, ForeignKey("character_assets.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    character = relationship("Character", back_populates="variants")


class CharacterQualityReport(Base):
    __tablename__ = "character_quality_reports"

    id = Column(String, primary_key=True, default=generate_uuid)
    generation_id = Column(String, ForeignKey("character_generations.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    geometry_results = Column(JSON, nullable=True)
    texture_results = Column(JSON, nullable=True)
    rigging_results = Column(JSON, nullable=True)
    export_results = Column(JSON, nullable=True)
    overall_status = Column(String, default="PASS")
    created_at = Column(DateTime, default=datetime.utcnow)

    generation = relationship("CharacterGeneration", back_populates="quality_report")

class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    character_id = Column(String, ForeignKey("characters.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    generation_mode = Column(Enum(GenerationMode), nullable=False, default=GenerationMode.CHARACTER_REPLACEMENT)
    status = Column(Enum(JobStatus), nullable=False, default=JobStatus.DRAFT)
    prompt_instructions = Column(Text, nullable=True)
    settings = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="projects")
    character = relationship("Character", back_populates="projects")
    source_videos = relationship("SourceVideo", back_populates="project", cascade="all, delete-orphan")
    generations = relationship("Generation", back_populates="project", cascade="all, delete-orphan")
    storyboard = relationship("Storyboard", back_populates="project", uselist=False, cascade="all, delete-orphan")

class Storyboard(Base):
    __tablename__ = "storyboards"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    title = Column(String, nullable=False)
    total_scenes = Column(Integer, default=1)
    estimated_duration_seconds = Column(Float, default=15.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="storyboard")
    scenes = relationship("StoryboardSceneModel", back_populates="storyboard", cascade="all, delete-orphan", order_by="StoryboardSceneModel.scene_number")

class StoryboardSceneModel(Base):
    __tablename__ = "storyboard_scenes"

    id = Column(String, primary_key=True, default=generate_uuid)
    storyboard_id = Column(String, ForeignKey("storyboards.id", ondelete="CASCADE"), nullable=False, index=True)
    scene_number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    duration_seconds = Column(Float, default=5.0)
    character_action = Column(Text, nullable=False)
    environment = Column(Text, nullable=False)
    camera_direction = Column(String, nullable=False)
    lighting = Column(String, nullable=False)
    objects = Column(JSON, nullable=True)
    vehicles = Column(String, nullable=True)
    generation_instructions = Column(Text, nullable=False)

    storyboard = relationship("Storyboard", back_populates="scenes")

class SourceVideo(Base):
    __tablename__ = "source_videos"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String, nullable=False)
    video_url = Column(String, nullable=False)
    storage_path = Column(String, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    resolution = Column(String, nullable=True)
    fps = Column(Float, nullable=True)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="source_videos")

class Generation(Base):
    __tablename__ = "generations"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_id = Column(String, nullable=True)
    provider_name = Column(String, nullable=False, default="vyron_reconstruction_engine")
    provider_task_id = Column(String, nullable=True)
    status = Column(Enum(JobStatus), nullable=False, default=JobStatus.QUEUED)
    progress_percentage = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    cost_credits = Column(Float, default=10.0)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="generations")
    jobs = relationship("GenerationJob", back_populates="generation", cascade="all, delete-orphan")
    shots = relationship("GenerationShotModel", back_populates="generation", cascade="all, delete-orphan")
    generated_videos = relationship("GeneratedVideo", back_populates="generation", cascade="all, delete-orphan")

class GenerationJob(Base):
    __tablename__ = "generation_jobs"

    id = Column(String, primary_key=True, default=generate_uuid)
    generation_id = Column(String, ForeignKey("generations.id", ondelete="CASCADE"), nullable=False, index=True)
    step_name = Column(String, nullable=False)
    status = Column(Enum(JobStatus), nullable=False, default=JobStatus.QUEUED)
    logs = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    generation = relationship("Generation", back_populates="jobs")

class GenerationShotModel(Base):
    __tablename__ = "generation_shots"

    id = Column(String, primary_key=True, default=generate_uuid)
    generation_id = Column(String, ForeignKey("generations.id", ondelete="CASCADE"), nullable=False, index=True)
    scene_number = Column(Integer, nullable=False)
    status = Column(Enum(JobStatus), nullable=False, default=JobStatus.QUEUED)
    provider_task_id = Column(String, nullable=True)
    output_url = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    generation = relationship("Generation", back_populates="shots")

class GeneratedVideo(Base):
    __tablename__ = "generated_videos"

    id = Column(String, primary_key=True, default=generate_uuid)
    generation_id = Column(String, ForeignKey("generations.id", ondelete="CASCADE"), nullable=False, index=True)
    video_url = Column(String, nullable=False)
    thumbnail_url = Column(String, nullable=True)
    storage_path = Column(String, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    resolution = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    generation = relationship("Generation", back_populates="generated_videos")

class Credit(Base):
    __tablename__ = "credits"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    balance = Column(Integer, default=100)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="credits")

class CreditTransaction(Base):
    __tablename__ = "credit_transactions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    description = Column(String, nullable=False)
    reference_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="credit_transactions")

class AIProvider(Base):
    __tablename__ = "ai_providers"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, unique=True)
    display_name = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    capabilities = Column(JSON, nullable=False)
    config_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class UsageLog(Base):
    __tablename__ = "usage_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=True, index=True)
    endpoint = Column(String, nullable=False)
    action = Column(String, nullable=False)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class ShotAdjustment(Base):
    __tablename__ = "shot_adjustments"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    shot_id = Column(Integer, nullable=False, index=True)

    pos_x = Column(Float, default=0.0)
    pos_y = Column(Float, default=0.0)
    pos_z = Column(Float, default=0.0)
    scale = Column(Float, default=1.0)
    rotation_y = Column(Float, default=0.0)
    ground_offset = Column(Float, default=0.0)

    speed = Column(Float, default=1.0)
    offset_sec = Column(Float, default=0.0)
    root_movement = Column(Boolean, default=True)

    camera_pos_x = Column(Float, default=0.0)
    camera_pos_y = Column(Float, default=0.0)
    camera_pos_z = Column(Float, default=0.0)
    camera_fov = Column(Float, default=50.0)
    camera_movement = Column(String, default="standard")

    light_intensity = Column(Float, default=1.0)
    light_color_temp = Column(Float, default=5500.0)
    light_direction = Column(String, default="ambient")

    environment_alignment = Column(Float, default=0.0)
    custom_params = Column(JSON, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ShotRenderVersion(Base):
    __tablename__ = "shot_render_versions"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    shot_id = Column(Integer, nullable=False, index=True)
    version_number = Column(Integer, nullable=False, default=1)
    video_url = Column(String, nullable=False)
    storage_path = Column(String, nullable=True)
    duration = Column(Float, nullable=True)
    resolution = Column(String, nullable=True)
    fps = Column(Float, nullable=True)
    is_selected = Column(Boolean, default=True)
    status = Column(Enum(JobStatus), nullable=False, default=JobStatus.COMPLETED)
    adjustments_snapshot = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class QualityControlReport(Base):
    __tablename__ = "quality_control_reports"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    shot_id = Column(Integer, nullable=True, index=True)
    target_type = Column(String, nullable=False, default="shot")
    video_path = Column(String, nullable=False)
    total_frames = Column(Integer, default=0)
    missing_frames = Column(Integer, default=0)
    black_frames = Column(Integer, default=0)
    fps_measured = Column(Float, nullable=True)
    has_audio = Column(Boolean, default=False)
    character_detected = Column(Boolean, default=True)
    continuity_status = Column(String, default="PASS")
    issues = Column(JSON, default=list)
    manual_review_required = Column(Boolean, default=False)
    review_flags = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

class ExportJob(Base):
    __tablename__ = "export_jobs"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(Enum(JobStatus), nullable=False, default=JobStatus.QUEUED)
    progress_percentage = Column(Integer, default=0)
    resolution = Column(String, default="original")
    fps = Column(Integer, default=30)
    format = Column(String, default="mp4")
    audio_config = Column(JSON, nullable=True)
    output_url = Column(String, nullable=True)
    storage_path = Column(String, nullable=True)
    duration = Column(Float, nullable=True)
    file_size = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class Environment(Base):
    __tablename__ = "environments"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    theme = Column(String, nullable=False, default="tactical_pubg")
    map_location = Column(String, nullable=True)
    weather = Column(String, nullable=False, default="clear")
    time_of_day = Column(String, nullable=False, default="golden_hour")
    preview_url = Column(String, nullable=True)
    scene_config = Column(JSON, nullable=True)
    is_preset = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assets = relationship("EnvironmentAsset", back_populates="environment", cascade="all, delete-orphan")


class EnvironmentAsset(Base):
    __tablename__ = "environment_assets"

    id = Column(String, primary_key=True, default=generate_uuid)
    environment_id = Column(String, ForeignKey("environments.id", ondelete="CASCADE"), nullable=False, index=True)
    asset_name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    model_format = Column(String, nullable=False, default="glb")
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)
    position = Column(JSON, default=list)
    rotation = Column(JSON, default=list)
    scale = Column(JSON, default=list)
    material_properties = Column(JSON, nullable=True)
    is_reusable = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    environment = relationship("Environment", back_populates="assets")


class VideoAnalysisResult(Base):
    __tablename__ = "video_analysis_results"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    video_path = Column(String, nullable=False)
    duration_seconds = Column(Float, nullable=False)
    total_frames = Column(Integer, nullable=False)
    fps = Column(Float, nullable=False)
    resolution = Column(String, nullable=False)
    has_audio = Column(Boolean, default=False)
    shot_count = Column(Integer, default=1)
    detected_shots = Column(JSON, nullable=False)
    character_tracking = Column(JSON, nullable=True)
    camera_movement = Column(JSON, nullable=True)
    lighting_profile = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ReconstructionBlueprintModel(Base):
    __tablename__ = "reconstruction_blueprints"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    analysis_id = Column(String, ForeignKey("video_analysis_results.id", ondelete="SET NULL"), nullable=True)
    reconstruction_strategy = Column(String, nullable=False, default="ADAPTIVE_3D_HYBRID")
    estimated_complexity = Column(String, default="MODERATE")
    total_shots = Column(Integer, default=1)
    character_replacement_plan = Column(JSON, nullable=False)
    camera_reconstruction_plan = Column(JSON, nullable=False)
    lighting_match_profile = Column(JSON, nullable=True)
    continuity_rules = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ModelRecord(Base):
    __tablename__ = "model_records"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    version = Column(String, nullable=False, default="1.0.0")
    source_repo = Column(String, nullable=True)
    license = Column(String, nullable=False, default="MIT")
    license_url = Column(String, nullable=True)
    is_installed = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    default_weight_file = Column(String, nullable=False)
    local_weight_path = Column(String, nullable=True)
    vram_recommended_mb = Column(Integer, default=0)
    requires_gpu = Column(Boolean, default=False)
    supports_cpu_fallback = Column(Boolean, default=True)
    supported_inputs = Column(JSON, default=list)
    output_format = Column(String, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    versions = relationship("ModelVersion", back_populates="model", cascade="all, delete-orphan")


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(String, primary_key=True, default=generate_uuid)
    model_id = Column(String, ForeignKey("model_records.id", ondelete="CASCADE"), nullable=False, index=True)
    version_tag = Column(String, nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    file_sha256 = Column(String, nullable=True)
    download_url = Column(String, nullable=True)
    local_path = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    model = relationship("ModelRecord", back_populates="versions")


class WorkerRecord(Base):
    __tablename__ = "worker_records"

    id = Column(String, primary_key=True, default=generate_uuid)
    worker_name = Column(String, nullable=False, unique=True)
    worker_type = Column(String, nullable=False, default="cpu")
    status = Column(String, nullable=False, default="ONLINE")
    capabilities = Column(JSON, default=list)
    current_job_id = Column(String, nullable=True)
    gpu_device_name = Column(String, nullable=True)
    gpu_vram_total_mb = Column(Integer, default=0)
    gpu_vram_used_mb = Column(Integer, default=0)
    cpu_cores = Column(Integer, default=4)
    ram_total_mb = Column(Integer, default=8192)
    ram_used_mb = Column(Integer, default=2048)
    last_heartbeat = Column(DateTime, default=datetime.utcnow)
    endpoint_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tasks = relationship("WorkerTask", back_populates="worker")


class WorkerTask(Base):
    __tablename__ = "worker_tasks"

    id = Column(String, primary_key=True, default=generate_uuid)
    worker_id = Column(String, ForeignKey("worker_records.id", ondelete="SET NULL"), nullable=True, index=True)
    task_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    status = Column(Enum(JobStatus), nullable=False, default=JobStatus.QUEUED)
    priority = Column(Integer, default=5)
    progress_percentage = Column(Integer, default=0)
    input_payload = Column(JSON, nullable=True)
    output_payload = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    max_retries = Column(Integer, default=3)
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    worker = relationship("WorkerRecord", back_populates="tasks")


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_secret = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# -------------------------------------------------------------------------
# VYRON AI LABS - MULTIMODAL CREATION MODELS
# -------------------------------------------------------------------------

class CreationModality(str, enum.Enum):
    IMAGE = "image"
    VIDEO = "video"
    VOICE = "voice"
    MUSIC = "music"

class CreationItem(Base):
    __tablename__ = "creation_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    modality = Column(String, nullable=False, index=True)
    task_type = Column(String, nullable=False)
    model_name = Column(String, nullable=False)
    prompt = Column(Text, nullable=True)
    negative_prompt = Column(Text, nullable=True)
    status = Column(Enum(JobStatus), nullable=False, default=JobStatus.COMPLETED)
    output_url = Column(String, nullable=False)
    thumbnail_url = Column(String, nullable=True)
    storage_path = Column(String, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    dimensions = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String, nullable=True)
    parameters = Column(JSON, nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="creations")


class VoiceProfile(Base):
    __tablename__ = "voice_profiles"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    sample_audio_url = Column(String, nullable=False)
    sample_storage_path = Column(String, nullable=True)
    consent_confirmed = Column(Boolean, nullable=False, default=False)
    consent_timestamp = Column(DateTime, default=datetime.utcnow)
    voice_features = Column(JSON, nullable=True)
    model_name = Column(String, default="OpenVoice V2")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="voice_profiles")


class PromptTemplate(Base):
    __tablename__ = "prompt_templates"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    modality = Column(String, nullable=False)
    prompt_text = Column(Text, nullable=False)
    negative_prompt = Column(Text, nullable=True)
    tags = Column(JSON, default=list)
    is_favorite = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="saved_prompts")
