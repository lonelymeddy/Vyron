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
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="characters")
    projects = relationship("Project", back_populates="character")

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
    provider_name = Column(String, nullable=False, default="mock_engine")
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
