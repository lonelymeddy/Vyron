from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, Project, SourceVideo, JobStatus
from app.schemas import ProjectCreate, ProjectUpdate, ProjectResponse, SourceVideoResponse
from app.auth import get_current_user

router = APIRouter(prefix="/projects", tags=["Project Management"])

@router.get("", response_model=List[ProjectResponse])
def list_projects(
    search: Optional[str] = None,
    mode: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Project).filter(Project.user_id == current_user.id)
    if search:
        query = query.filter(Project.title.ilike(f"%{search}%"))
    if mode:
        query = query.filter(Project.generation_mode == mode)

    return query.order_by(Project.created_at.desc()).all()

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = Project(
        user_id=current_user.id,
        character_id=project_in.character_id,
        title=project_in.title,
        description=project_in.description,
        generation_mode=project_in.generation_mode,
        status=JobStatus.DRAFT,
        prompt_instructions=project_in.prompt_instructions,
        settings=project_in.settings.model_dump() if project_in.settings else {}
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
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
    return project

@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    project_in: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project_in.title is not None:
        project.title = project_in.title
    if project_in.description is not None:
        project.description = project_in.description
    if project_in.character_id is not None:
        project.character_id = project_in.character_id
    if project_in.generation_mode is not None:
        project.generation_mode = project_in.generation_mode
    if project_in.prompt_instructions is not None:
        project.prompt_instructions = project_in.prompt_instructions
    if project_in.settings is not None:
        project.settings = project_in.settings.model_dump()

    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
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

    db.delete(project)
    db.commit()
    return None

@router.post("/{project_id}/source-video", response_model=SourceVideoResponse)
def attach_source_video(
    project_id: str,
    file_name: str,
    video_url: str,
    duration_seconds: Optional[float] = None,
    resolution: Optional[str] = "1080p",
    fps: Optional[float] = 30.0,
    file_size: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    source_video = SourceVideo(
        project_id=project.id,
        file_name=file_name,
        video_url=video_url,
        duration_seconds=duration_seconds,
        resolution=resolution,
        fps=fps,
        file_size=file_size
    )
    db.add(source_video)
    db.commit()
    db.refresh(source_video)
    return source_video
