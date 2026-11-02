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
    view_type = Column(String, nullable=False, default="unknown")  # front, back, left, right, three_quarter, face_closeup, full_body, unknown
    confidence = Column(Float, default=0.0)
    dimensions = Column(String, nullable=True)  # e.g. "1024x1024"
    quality_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    character = relationship("Character", back_populates="reference_images")


class CharacterGeneration(Base):
    __tablename__ = "character_generations"

    id = Column(String, primary_key=True, default=generate_uuid)
    character_id = Column(String, ForeignKey("characters.id", ondelete="CASCADE"), nullable=False, index=True)
    generation_version = Column(Integer, default=1)
    generation_mode = Column(String, nullable=False, default="SINGLE_IMAGE")  # SINGLE_IMAGE, MULTI_IMAGE, ADVANCED
    status = Column(String, nullable=False, default="QUEUED")  # QUEUED, PROCESSING, COMPLETED, FAILED, CANCELLED
    current_pipeline = Column(Integer, default=1)  # 1 to 4
    current_stage = Column(Integer, default=1)     # 1 to 20
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
    pipeline_number = Column(Integer, nullable=False)  # 1, 2, 3, 4
    stage_number = Column(Integer, nullable=False)     # 1 to 20
    stage_name = Column(String, nullable=False)
    status = Column(String, nullable=False, default="QUEUED")  # QUEUED, PROCESSING, COMPLETED, FAILED, SKIPPED
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
    asset_type = Column(String, nullable=False)  # initial_mesh, refined_mesh, textured_mesh, rigged_model, glb_export, fbx_export, obj_export, thumbnail
    file_path = Column(String, nullable=False)
    file_format = Column(String, nullable=False)  # glb, fbx, obj, ply, png
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
    skeleton_type = Column(String, nullable=False, default="humanoid")  # humanoid, generic
    bone_count = Column(Integer, default=0)
    rig_status = Column(String, default="RIGGED")  # UNRIGGED, RIGGED, WEIGHTED, VALIDATED, FAILED
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
    overall_status = Column(String, default="PASS")  # PASS, WARNING, FAIL
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

    # Character placement
    pos_x = Column(Float, default=0.0)
    pos_y = Column(Float, default=0.0)
    pos_z = Column(Float, default=0.0)
    scale = Column(Float, default=1.0)
    rotation_y = Column(Float, default=0.0)
    ground_offset = Column(Float, default=0.0)

    # Character animation
    speed = Column(Float, default=1.0)
    offset_sec = Column(Float, default=0.0)
    root_movement = Column(Boolean, default=True)

    # Camera
    camera_pos_x = Column(Float, default=0.0)
    camera_pos_y = Column(Float, default=0.0)
    camera_pos_z = Column(Float, default=0.0)
    camera_fov = Column(Float, default=50.0)
    camera_movement = Column(String, default="standard")

    # Lighting
    light_intensity = Column(Float, default=1.0)
    light_color_temp = Column(Float, default=5500.0)
    light_direction = Column(String, default="ambient")

    # Scene
    environment_alignment = Column(Float, default=0.0)

    # General override settings payload
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
    target_type = Column(String, nullable=False, default="shot")  # 'shot' or 'assembled_video'
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
    resolution = Column(String, default="original")  # 720p, 1080p, original
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
