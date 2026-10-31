import time
import asyncio
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.session import get_db, SessionLocal
from app.db.models import (
    User, Project, Character, Generation, GenerationJob, GenerationShotModel,
    GeneratedVideo, Credit, CreditTransaction, JobStatus, GenerationMode,
    Storyboard, StoryboardSceneModel
)
from app.schemas import (
    GenerationCreate, GenerationResponse, ProviderCapabilityInfo,
    StoryboardResponse, StoryboardUpdate, StoryboardSceneSchema
)
from app.auth import get_current_user
from app.config import settings
from app.ai_engine.registry import ai_registry
from app.ai_engine.schemas import (
    GenerationJobRequest, ShotPlan, ProductionSettings
)
from app.ai_engine.orchestrator import orchestrator
from app.services.video_analysis import video_analysis_service
from app.services.character_service import character_service
from app.services.customization import customization_parser
from app.services.video_assembly import video_assembly_service

router = APIRouter(prefix="/generations", tags=["AI Generation Center"])

PROVIDER_NAME_MAP = {
    "kling_ai": "kling",
    "kling": "kling",
    "runway_gen3": "runway",
    "runway": "runway",
    "mock_engine": "mock_engine",
}

def run_async_in_thread(coro):
    """Utility to run async orchestrator functions inside synchronous background tasks."""
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    return loop.run_until_complete(coro)

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
            generation.status = JobStatus.FAILED
            generation.error_message = (
                f"AI Provider '{generation.provider_name}' is not configured on this server. "
                "Please configure API keys in environment or select an available provider."
            )
            project.status = JobStatus.FAILED

            failed_job = GenerationJob(
                generation_id=generation.id,
                step_name="Provider Verification",
                status=JobStatus.FAILED,
                logs=f"Error: {generation.error_message}"
            )
            db.add(failed_job)

            # Refund credits for unconfigured provider
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

        generation.started_at = datetime.utcnow()

        # Step 1: Character reference analysis
        generation.status = JobStatus.ANALYZING
        generation.progress_percentage = 15
        project.status = JobStatus.ANALYZING
        db.commit()

        character_img_url = ""
        char_refs = []
        if project.character:
            character_img_url = project.character.image_url
            char_refs = [character_img_url]
            char_prof = character_service.analyze_character_image(
                image_path=project.character.storage_path or character_img_url,
                character_id=project.character.id
            )
            char_prompt_enhancement = character_service.format_character_prompt_enhancement(char_prof)
        else:
            char_prompt_enhancement = "Photorealistic character visual consistency."

        job1 = GenerationJob(
            generation_id=generation.id,
            step_name="Character Identity Conditioning",
            status=JobStatus.COMPLETED,
            logs=f"Character features extracted. Conditioning prompt: {char_prompt_enhancement[:80]}..."
        )
        db.add(job1)
        db.commit()

        # Step 2: Storyboard & Scene Planning
        generation.status = JobStatus.STORYBOARDING
        generation.progress_percentage = 30
        project.status = JobStatus.STORYBOARDING
        db.commit()

        # Retrieve or create storyboard scenes
        storyboard = db.query(Storyboard).filter(Storyboard.project_id == project.id).first()
        shot_plans: List[ShotPlan] = []

        if storyboard and storyboard.scenes:
            for sc in storyboard.scenes:
                shot_plans.append(ShotPlan(
                    shot_id=f"shot_{generation.id}_{sc.scene_number}",
                    scene_number=sc.scene_number,
                    duration_seconds=sc.duration_seconds,
                    prompt_text=f"{sc.generation_instructions}. {char_prompt_enhancement}",
                    character_action=sc.character_action,
                    camera_direction=sc.camera_direction,
                    environment_desc=sc.environment,
                    character_reference_urls=char_refs,
                    reference_video_url=project.source_videos[0].video_url if project.source_videos else None
                ))
        else:
            # Single shot plan default
            prod_settings = customization_parser.parse_prompt(
                prompt=project.prompt_instructions or "",
                base_settings=project.settings
            )
            ref_vid = project.source_videos[0].video_url if project.source_videos else None
            shot_plans.append(ShotPlan(
                shot_id=f"shot_{generation.id}_1",
                scene_number=1,
                duration_seconds=float(prod_settings.duration_seconds or 5),
                prompt_text=f"{project.prompt_instructions or 'Cinematic action shot'}. {char_prompt_enhancement}",
                character_action=prod_settings.character.action,
                camera_direction=prod_settings.camera.movement,
                environment_desc=prod_settings.environment.location,
                character_reference_urls=char_refs,
                reference_video_url=ref_vid
            ))

        job2 = GenerationJob(
            generation_id=generation.id,
            step_name="Storyboard Planning",
            status=JobStatus.COMPLETED,
            logs=f"Planned {len(shot_plans)} cinematic shot(s) for rendering."
        )
        db.add(job2)
        db.commit()

        # Step 3: Multi-shot AI Generation
        generation.status = JobStatus.PROCESSING
        generation.progress_percentage = 40
        project.status = JobStatus.PROCESSING
        db.commit()

        generated_shot_urls: List[str] = []
        job_req = GenerationJobRequest(
            job_id=generation.id,
            project_id=project.id,
            mode=project.generation_mode,
            character_image_url=character_img_url,
            character_reference_urls=char_refs,
            reference_video_url=project.source_videos[0].video_url if project.source_videos else None,
            prompt_instructions=project.prompt_instructions,
            preferred_provider=provider_key
        )

        for idx, shot in enumerate(shot_plans):
            shot_rec = GenerationShotModel(
                generation_id=generation.id,
                scene_number=shot.scene_number,
                status=JobStatus.PROCESSING
            )
            db.add(shot_rec)
            db.commit()

            # Execute shot through orchestrator
            res_shot = run_async_in_thread(
                orchestrator.generate_shot(provider=provider, shot=shot, request=job_req)
            )

            shot_rec.status = res_shot.status
            shot_rec.provider_task_id = res_shot.provider_task_id
            shot_rec.output_url = res_shot.output_url
            shot_rec.error_message = res_shot.error_message
            db.commit()

            if res_shot.status == JobStatus.COMPLETED and res_shot.output_url:
                generated_shot_urls.append(res_shot.output_url)
            else:
                raise Exception(f"Failed to generate shot #{shot.scene_number}: {res_shot.error_message}")

            pct = 40 + int(((idx + 1) / len(shot_plans)) * 40)
            generation.progress_percentage = pct
            db.commit()

        job3 = GenerationJob(
            generation_id=generation.id,
            step_name="AI Video Rendering",
            status=JobStatus.COMPLETED,
            logs=f"Successfully rendered {len(generated_shot_urls)} shot clip(s)."
        )
        db.add(job3)
        db.commit()

        # Step 4: Multi-Shot Assembly & Post-Processing
        generation.status = JobStatus.POST_PROCESSING
        generation.progress_percentage = 90
        project.status = JobStatus.POST_PROCESSING
        db.commit()

        final_video_url = video_assembly_service.assemble_shots(
            shot_urls=generated_shot_urls,
            output_filename=f"final_{generation.id}"
        )

        job4 = GenerationJob(
            generation_id=generation.id,
            step_name="Shot Assembly & Color Grading",
            status=JobStatus.COMPLETED,
            logs="Assembled clips, encoded audio tracks, and rendered final cinematic master."
        )
        db.add(job4)

        # Mark completed
        generation.status = JobStatus.COMPLETED
        generation.progress_percentage = 100
        generation.completed_at = datetime.utcnow()
        project.status = JobStatus.COMPLETED

        thumbnail_url = "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop"
        res_setting = "1080p"
        if project.settings and isinstance(project.settings, dict):
            res_setting = project.settings.get("resolution", "1080p")

        gen_video = GeneratedVideo(
            generation_id=generation.id,
            video_url=final_video_url,
            thumbnail_url=thumbnail_url,
            duration_seconds=float(len(shot_plans) * 5.0),
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
                job_err = GenerationJob(
                    generation_id=gen.id,
                    step_name="Generation Failure",
                    status=JobStatus.FAILED,
                    logs=gen.error_message
                )
                db.add(job_err)

                # Refund user credits on failure
                credit = db.query(Credit).filter(Credit.user_id == user_id).first()
                if credit:
                    credit.balance += 10
                    refund_tx = CreditTransaction(
                        user_id=user_id,
                        amount=10,
                        description=f"Automatic Refund for failed job {gen.id}"
                    )
                    db.add(refund_tx)

                db.commit()
        except Exception:
            pass
    finally:
        if should_close:
            db.close()


@router.get("/providers", response_model=List[ProviderCapabilityInfo])
def get_provider_capabilities():
    """Discover real AI providers and their granular capabilities."""
    return ai_registry.list_available_providers()


@router.post("/storyboard/generate/{project_id}", response_model=StoryboardResponse)
def generate_project_storyboard(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    video_path = ""
    if project.source_videos:
        video_path = project.source_videos[0].storage_path or project.source_videos[0].video_url

    plan = video_analysis_service.analyze_source_video(
        video_path=video_path,
        project_id=project.id,
        title=f"Storyboard for {project.title}"
    )

    # Save to db
    existing = db.query(Storyboard).filter(Storyboard.project_id == project.id).first()
    if existing:
        db.delete(existing)
        db.commit()

    sb = Storyboard(
        project_id=project.id,
        title=plan.title,
        total_scenes=plan.total_scenes,
        estimated_duration_seconds=plan.estimated_duration_seconds
    )
    db.add(sb)
    db.commit()
    db.refresh(sb)

    for sc in plan.scenes:
        sc_m = StoryboardSceneModel(
            storyboard_id=sb.id,
            scene_number=sc.scene_number,
            title=sc.title,
            duration_seconds=sc.duration_seconds,
            character_action=sc.character_action,
            environment=sc.environment,
            camera_direction=sc.camera_direction,
            lighting=sc.lighting,
            objects=sc.objects,
            vehicles=sc.vehicles,
            generation_instructions=sc.generation_instructions
        )
        db.add(sc_m)

    db.commit()
    db.refresh(sb)
    return sb


@router.put("/storyboard/{storyboard_id}", response_model=StoryboardResponse)
def update_storyboard(
    storyboard_id: str,
    update_in: StoryboardUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sb = db.query(Storyboard).join(Project).filter(
        Storyboard.id == storyboard_id,
        Project.user_id == current_user.id
    ).first()
    if not sb:
        raise HTTPException(status_code=404, detail="Storyboard not found")

    if update_in.title:
        sb.title = update_in.title

    # Delete existing scenes and replace
    for old_sc in sb.scenes:
        db.delete(old_sc)

    total_duration = 0.0
    for sc in update_in.scenes:
        total_duration += sc.duration_seconds
        new_sc = StoryboardSceneModel(
            storyboard_id=sb.id,
            scene_number=sc.scene_number,
            title=sc.title,
            duration_seconds=sc.duration_seconds,
            character_action=sc.character_action,
            environment=sc.environment,
            camera_direction=sc.camera_direction,
            lighting=sc.lighting,
            objects=sc.objects,
            vehicles=sc.vehicles,
            generation_instructions=sc.generation_instructions
        )
        db.add(new_sc)

    sb.total_scenes = len(update_in.scenes)
    sb.estimated_duration_seconds = total_duration
    db.commit()
    db.refresh(sb)
    return sb


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

    # Prevent duplicate active generation submissions for the same project
    active_gen = db.query(Generation).filter(
        Generation.project_id == project.id,
        Generation.status.in_([JobStatus.QUEUED, JobStatus.PROCESSING, JobStatus.ANALYZING, JobStatus.STORYBOARDING])
    ).first()
    if active_gen:
        raise HTTPException(status_code=400, detail="A generation job is already actively processing for this project.")

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
        progress_percentage=0,
        cost_credits=10.0
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
