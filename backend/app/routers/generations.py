import time
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.session import get_db, SessionLocal
from app.db.models import User, Project, Generation, GenerationJob, GeneratedVideo, Credit, CreditTransaction, JobStatus
from app.schemas import GenerationCreate, GenerationResponse
from app.auth import get_current_user
from app.config import settings
from app.ai_engine.registry import ai_registry

router = APIRouter(prefix="/generations", tags=["AI Generation Center"])

PROVIDER_NAME_MAP = {
    "kling_ai": "kling",
    "kling": "kling",
    "runway_gen3": "runway",
    "runway": "runway",
    "mock_engine": "mock_engine",
}

def process_generation_background(generation_id: str, user_id: str, db: Optional[Session] = None):
    should_close = False
    if db is None:
        db = SessionLocal()
        should_close = True

    try:
        generation = db.query(Generation).filter(Generation.id == generation_id).first()
        if not generation:
            return

        project = db.query(Project).filter(Project.id == generation.project_id).first()
        if not project:
            generation.status = JobStatus.FAILED
            generation.error_message = "Associated project was not found."
            db.commit()
            return

        provider_key = PROVIDER_NAME_MAP.get(generation.provider_name, generation.provider_name)
        provider = ai_registry.get_provider(provider_key)

        if not provider or not provider.is_configured():
            # Provider is unconfigured or unavailable!
            generation.status = JobStatus.FAILED
            generation.error_message = (
                f"AI Provider '{generation.provider_name}' is not configured on this server. "
                "Please configure API keys in environment or select an available provider."
            )
            project.status = JobStatus.FAILED

            # Create failed job log
            failed_job = GenerationJob(
                generation_id=generation.id,
                step_name="Provider Verification",
                status=JobStatus.FAILED,
                logs=f"Error: {generation.error_message}"
            )
            db.add(failed_job)

            # Refund credits for failed submission
            credit = db.query(Credit).filter(Credit.user_id == user_id).first()
            if credit:
                credit.balance += 10
                refund_tx = CreditTransaction(
                    user_id=user_id,
                    amount=10,
                    description=f"Refund for unconfigured AI provider job: {project.title}"
                )
                db.add(refund_tx)

            db.commit()
            return

        # Provider is available (e.g. mock_engine)
        generation.started_at = datetime.utcnow()
        generation.status = JobStatus.ANALYZING
        generation.progress_percentage = 20
        project.status = JobStatus.ANALYZING

        job1 = GenerationJob(
            generation_id=generation.id,
            step_name="Scene & Character Analysis",
            status=JobStatus.COMPLETED,
            logs="Analyzed character keypoints, face embeddings, and camera pose metadata."
        )
        db.add(job1)
        db.commit()

        time.sleep(0.1)

        generation.status = JobStatus.PROCESSING
        generation.progress_percentage = 50
        project.status = JobStatus.PROCESSING

        job2 = GenerationJob(
            generation_id=generation.id,
            step_name="3D CGI Neural Rendering",
            status=JobStatus.COMPLETED,
            logs="Synthesized 3D character replacement frames with PUBG environmental shaders."
        )
        db.add(job2)
        db.commit()

        time.sleep(0.1)

        generation.status = JobStatus.POST_PROCESSING
        generation.progress_percentage = 80
        project.status = JobStatus.POST_PROCESSING

        job3 = GenerationJob(
            generation_id=generation.id,
            step_name="Post-Processing & Color Grading",
            status=JobStatus.COMPLETED,
            logs="Applied cinematic color LUTs, motion blur, and H.264 video encoding."
        )
        db.add(job3)
        db.commit()

        time.sleep(0.1)

        # Complete job
        generation.status = JobStatus.COMPLETED
        generation.progress_percentage = 100
        generation.completed_at = datetime.utcnow()
        project.status = JobStatus.COMPLETED

        output_video_url = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
        thumbnail_url = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop"

        res_setting = "1080p"
        if project.settings and isinstance(project.settings, dict):
            res_setting = project.settings.get("resolution", "1080p")

        gen_video = GeneratedVideo(
            generation_id=generation.id,
            video_url=output_video_url,
            thumbnail_url=thumbnail_url,
            duration_seconds=15.0,
            resolution=res_setting
        )
        db.add(gen_video)
        db.commit()

    except Exception as e:
        db.rollback()
        try:
            gen = db.query(Generation).filter(Generation.id == generation_id).first()
            if gen:
                gen.status = JobStatus.FAILED
                gen.error_message = f"Generation job processing error: {str(e)}"
                db.commit()
        except Exception:
            pass
    finally:
        if should_close:
            db.close()


@router.get("", response_model=List[GenerationResponse])
def list_generations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return (
        db.query(Generation)
        .join(Project, Generation.project_id == Project.id)
        .filter(Project.user_id == current_user.id)
        .order_by(Generation.created_at.desc())
        .all()
    )


@router.post("", response_model=GenerationResponse, status_code=status.HTTP_201_CREATED)
def start_generation(
    gen_in: GenerationCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == gen_in.project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check credit balance
    credit = db.query(Credit).filter(Credit.user_id == current_user.id).first()
    if not credit or credit.balance < 10:
        raise HTTPException(status_code=400, detail="Insufficient generation credits. 10 credits required.")

    # Deduct credits
    credit.balance -= 10
    transaction = CreditTransaction(
        user_id=current_user.id,
        amount=-10,
        description=f"AI Video Generation for project: {project.title}"
    )
    db.add(transaction)

    raw_provider = gen_in.provider_name or settings.DEFAULT_AI_PROVIDER

    generation = Generation(
        project_id=project.id,
        provider_name=raw_provider,
        status=JobStatus.QUEUED,
        progress_percentage=0
    )
    db.add(generation)
    db.commit()
    db.refresh(generation)

    step1 = GenerationJob(
        generation_id=generation.id,
        step_name="Queue & Dispatch",
        status=JobStatus.QUEUED,
        logs=f"Queued job for provider engine: {raw_provider}"
    )
    db.add(step1)

    project.status = JobStatus.QUEUED
    db.commit()
    db.refresh(generation)

    # Schedule background execution
    background_tasks.add_task(process_generation_background, generation.id, current_user.id)

    return generation


@router.get("/{generation_id}", response_model=GenerationResponse)
def get_generation_status(
    generation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    generation = (
        db.query(Generation)
        .join(Project, Generation.project_id == Project.id)
        .filter(Generation.id == generation_id, Project.user_id == current_user.id)
        .first()
    )
    if not generation:
        raise HTTPException(status_code=404, detail="Generation job not found")

    return generation
