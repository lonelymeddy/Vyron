from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, Project, Generation, GenerationJob, Credit, CreditTransaction, JobStatus
from app.schemas import GenerationCreate, GenerationResponse
from app.auth import get_current_user
from app.config import settings

router = APIRouter(prefix="/generations", tags=["AI Generation Center"])

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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == gen_in.project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    credit = db.query(Credit).filter(Credit.user_id == current_user.id).first()
    if not credit or credit.balance < 10:
        raise HTTPException(status_code=400, detail="Insufficient generation credits. 10 credits required.")

    credit.balance -= 10
    transaction = CreditTransaction(
        user_id=current_user.id,
        amount=-10,
        description=f"AI Video Generation for project: {project.title}"
    )
    db.add(transaction)

    provider = gen_in.provider_name or settings.DEFAULT_AI_PROVIDER

    generation = Generation(
        project_id=project.id,
        provider_name=provider,
        status=JobStatus.QUEUED,
        progress_percentage=0
    )
    db.add(generation)
    db.commit()
    db.refresh(generation)

    step1 = GenerationJob(
        generation_id=generation.id,
        step_name="Scene Analysis & Character Prep",
        status=JobStatus.PROCESSING,
        logs="Initializing character feature extractor..."
    )
    db.add(step1)

    project.status = JobStatus.PROCESSING
    db.commit()
    db.refresh(generation)

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
