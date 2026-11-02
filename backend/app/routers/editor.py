"""
VYRON AI — Cinematic Production Studio & Shot Refinement Router
"""

import os
import logging
import threading
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.session import get_db, SessionLocal
from app.auth import get_current_user
from app.db.models import (
    User, Project, SourceVideo, Generation, GeneratedVideo,
    ShotAdjustment, ShotRenderVersion, QualityControlReport,
    ExportJob, JobStatus
)
from app.schemas import (
    ShotAdjustmentSchema, ShotAdjustmentUpdate, ShotRenderVersionResponse,
    QualityControlResponse, VideoAssembleRequest, ExportJobRequest,
    ExportJobResponse, EditorProjectDataResponse, EditorShotData
)
from app.services.character_replacement_engine import CharacterReplacementEngine
from app.services.shot_production_service import shot_production_service
from app.services.quality_control_service import quality_control_service
from app.services.export_service import export_service

logger = logging.getLogger(__name__)

router = APIRouter(tags=["cinematic-editor"])


@router.get("/projects/{project_id}/editor", response_model=EditorProjectDataResponse)
def get_editor_project_data(
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

    ref_video = project.source_videos[0] if project.source_videos else None
    ref_video_url = ref_video.video_url if ref_video else None
    ref_video_path = (ref_video.storage_path or ref_video.video_url) if ref_video else None

    completed_gen = next((g for g in reversed(project.generations) if g.status == JobStatus.COMPLETED), None)
    if not completed_gen and project.generations:
        completed_gen = project.generations[-1]

    recon_video_url = None
    if completed_gen and completed_gen.generated_videos:
        recon_video_url = completed_gen.generated_videos[0].video_url

    engine = CharacterReplacementEngine()
    shots_blueprint = []
    ref_metadata = None
    if ref_video_path and os.path.exists(ref_video_path):
        try:
            bp = engine.generate_reconstruction_blueprint(ref_video_path)
            shots_blueprint = bp.get("shots", [])
            ref_metadata = bp.get("reference_metadata")
        except Exception:
            shots_blueprint = []

    if not shots_blueprint:
        shots_blueprint = [{
            "shot_id": 1,
            "start_time": 0.0,
            "end_time": ref_metadata.get("duration", 10.0) if ref_metadata else 10.0,
            "duration": ref_metadata.get("duration", 10.0) if ref_metadata else 10.0,
            "start_frame": 0,
            "end_frame": int((ref_metadata.get("duration", 10.0) if ref_metadata else 10.0) * 30),
            "camera_type": "Eye-level medium",
            "has_character": True,
            "action_description": "Cinematic shot",
            "reconstruction_approach": "APPROACH_A_CHARACTER_REPLACEMENT"
        }]

    editor_shots: List[EditorShotData] = []
    for sb in shots_blueprint:
        s_id = sb["shot_id"]
        adj = shot_production_service.get_or_create_adjustments(db, project_id, s_id)
        versions = shot_production_service.list_shot_versions(db, project_id, s_id)
        active_ver = next((v for v in versions if v.is_selected), versions[0] if versions else None)

        qc = db.query(QualityControlReport).filter(
            QualityControlReport.project_id == project_id,
            QualityControlReport.shot_id == s_id
        ).order_by(QualityControlReport.created_at.desc()).first()

        editor_shots.append(EditorShotData(
            shot_id=s_id,
            start_time=float(sb.get("start_time", 0.0)),
            end_time=float(sb.get("end_time", 5.0)),
            duration=float(sb.get("duration", 5.0)),
            start_frame=int(sb.get("start_frame", 0)),
            end_frame=int(sb.get("end_frame", 150)),
            camera_type=sb.get("camera_type", "Standard"),
            has_character=bool(sb.get("has_character", True)),
            action_description=sb.get("action_description", ""),
            reconstruction_approach=sb.get("reconstruction_approach", ""),
            adjustments=ShotAdjustmentSchema.model_validate(adj),
            versions=[ShotRenderVersionResponse.model_validate(v) for v in versions],
            active_version=ShotRenderVersionResponse.model_validate(active_ver) if active_ver else None,
            qc_report=QualityControlResponse.model_validate(qc) if qc else None
        ))

    overall_qc = db.query(QualityControlReport).filter(
        QualityControlReport.project_id == project_id,
        QualityControlReport.target_type == "assembled_video"
    ).order_by(QualityControlReport.created_at.desc()).first()

    active_export = db.query(ExportJob).filter(
        ExportJob.project_id == project_id
    ).order_by(ExportJob.created_at.desc()).first()

    tot_dur = sum(s.duration for s in editor_shots)

    return EditorProjectDataResponse(
        project_id=project.id,
        title=project.title,
        generation_mode=project.generation_mode.value if hasattr(project.generation_mode, "value") else str(project.generation_mode),
        status=project.status,
        reference_video_url=ref_video_url,
        reference_metadata=ref_metadata,
        reconstructed_video_url=recon_video_url,
        total_duration=round(tot_dur, 2),
        shots=editor_shots,
        overall_qc=QualityControlResponse.model_validate(overall_qc) if overall_qc else None,
        active_export=ExportJobResponse.model_validate(active_export) if active_export else None
    )


@router.get("/projects/{project_id}/shots/{shot_id}/adjustments", response_model=ShotAdjustmentSchema)
def get_shot_adjustments(
    project_id: str,
    shot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    adj = shot_production_service.get_or_create_adjustments(db, project_id, shot_id)
    return adj


@router.put("/projects/{project_id}/shots/{shot_id}/adjustments", response_model=ShotAdjustmentSchema)
def update_shot_adjustments(
    project_id: str,
    shot_id: int,
    payload: ShotAdjustmentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    updated = shot_production_service.save_adjustments(
        db, project_id, shot_id, payload.model_dump(exclude_unset=True)
    )
    return updated


@router.post("/projects/{project_id}/shots/{shot_id}/regenerate", response_model=ShotRenderVersionResponse)
def regenerate_single_shot(
    project_id: str,
    shot_id: int,
    start_time: float,
    end_time: float,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    try:
        new_version = shot_production_service.regenerate_shot(
            db, project_id, shot_id, start_time, end_time
        )
        return new_version
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to regenerate shot: {str(e)}")


@router.get("/projects/{project_id}/shots/{shot_id}/versions", response_model=List[ShotRenderVersionResponse])
def get_shot_version_history(
    project_id: str,
    shot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return shot_production_service.list_shot_versions(db, project_id, shot_id)


@router.post("/projects/{project_id}/shots/{shot_id}/versions/{version_id}/select", response_model=ShotRenderVersionResponse)
def restore_shot_version(
    project_id: str,
    shot_id: int,
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    selected = shot_production_service.select_shot_version(db, project_id, shot_id, version_id)
    if not selected:
        raise HTTPException(status_code=404, detail="Version not found")

    return selected


@router.post("/projects/{project_id}/quality-control", response_model=QualityControlResponse)
def run_project_quality_control(
    project_id: str,
    shot_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    target_video_path = None
    target_type = "shot" if shot_id else "assembled_video"

    if shot_id:
        versions = shot_production_service.list_shot_versions(db, project_id, shot_id)
        active_ver = next((v for v in versions if v.is_selected), versions[0] if versions else None)
        if active_ver and active_ver.storage_path and os.path.exists(active_ver.storage_path):
            target_video_path = active_ver.storage_path
    else:
        completed_gen = next((g for g in reversed(project.generations) if g.status == JobStatus.COMPLETED), None)
        if completed_gen and completed_gen.generated_videos:
            gv = completed_gen.generated_videos[0]
            target_video_path = gv.storage_path or gv.video_url
            if target_video_path and target_video_path.startswith("/static/"):
                target_video_path = target_video_path.lstrip("/")

    if not target_video_path or not os.path.exists(target_video_path):
        if project.source_videos:
            sv = project.source_videos[0]
            target_video_path = sv.storage_path or sv.video_url
            if target_video_path and target_video_path.startswith("/static/"):
                target_video_path = target_video_path.lstrip("/")

    if not target_video_path or not os.path.exists(target_video_path):
        raise HTTPException(status_code=400, detail="No rendered video file available on disk to inspect.")

    qc_res = quality_control_service.analyze_video(target_video_path)

    report = QualityControlReport(
        project_id=project_id,
        shot_id=shot_id,
        target_type=target_type,
        video_path=target_video_path,
        total_frames=qc_res["total_frames"],
        missing_frames=qc_res["missing_frames"],
        black_frames=qc_res["black_frames"],
        fps_measured=qc_res["fps_measured"],
        has_audio=qc_res["has_audio"],
        character_detected=qc_res["character_detected"],
        continuity_status=qc_res["continuity_status"],
        issues=qc_res["issues"],
        manual_review_required=qc_res["manual_review_required"],
        review_flags=qc_res["review_flags"]
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return report


def background_export_worker(export_job_id: str, project_id: str):
    db = SessionLocal()
    try:
        job = db.query(ExportJob).filter(ExportJob.id == export_job_id).first()
        project = db.query(Project).filter(Project.id == project_id).first()
        if not job or not project:
            return

        job.status = JobStatus.PROCESSING
        job.progress_percentage = 20
        db.commit()

        engine = CharacterReplacementEngine()
        ref_video_path = project.source_videos[0].storage_path or project.source_videos[0].video_url if project.source_videos else None
        shots_bp = []
        if ref_video_path and os.path.exists(ref_video_path):
            try:
                bp = engine.generate_reconstruction_blueprint(ref_video_path)
                shots_bp = bp.get("shots", [])
            except Exception:
                pass

        shot_files = []
        if shots_bp:
            for s in shots_bp:
                s_id = s["shot_id"]
                versions = shot_production_service.list_shot_versions(db, project_id, s_id)
                active_ver = next((v for v in versions if v.is_selected), versions[0] if versions else None)
                if active_ver and active_ver.storage_path and os.path.exists(active_ver.storage_path):
                    shot_files.append(active_ver.storage_path)

        if not shot_files:
            completed_gen = next((g for g in reversed(project.generations) if g.status == JobStatus.COMPLETED), None)
            if completed_gen and completed_gen.generated_videos:
                cand = completed_gen.generated_videos[0].storage_path or completed_gen.generated_videos[0].video_url
                if cand and cand.startswith("/static/"):
                    cand = cand.lstrip("/")
                if cand and os.path.exists(cand):
                    shot_files.append(cand)
            elif ref_video_path and os.path.exists(ref_video_path):
                shot_files.append(ref_video_path)

        if not shot_files:
            raise ValueError("No video segments found for assembly.")

        job.progress_percentage = 50
        db.commit()

        out_dir = os.path.join("static", "uploads", "exports", project_id)
        os.makedirs(out_dir, exist_ok=True)
        filename = f"export_{job.id}.{job.format}"
        out_path = os.path.join(out_dir, filename)

        audio_cfg = job.audio_config or {}
        res = export_service.assemble_and_export(
            shot_filepaths=shot_files,
            output_filepath=out_path,
            resolution=job.resolution,
            target_fps=job.fps,
            audio_mode=audio_cfg.get("mode", "original"),
            reference_audio_path=ref_video_path,
            custom_audio_path=audio_cfg.get("custom_audio_path"),
            audio_volume=float(audio_cfg.get("volume", 1.0))
        )

        job.status = JobStatus.COMPLETED
        job.progress_percentage = 100
        job.output_url = f"/static/uploads/exports/{project_id}/{filename}"
        job.storage_path = out_path
        job.duration = res.get("duration")
        job.file_size = res.get("file_size")
        job.completed_at = datetime.utcnow()
        db.commit()

    except Exception as e:
        logger.error(f"Export worker failed for job {export_job_id}: {e}")
        job = db.query(ExportJob).filter(ExportJob.id == export_job_id).first()
        if job:
            job.status = JobStatus.FAILED
            job.error_message = str(e)
            db.commit()
    finally:
        db.close()


@router.post("/projects/{project_id}/export", response_model=ExportJobResponse)
def trigger_project_export(
    project_id: str,
    payload: ExportJobRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(Project.id == project_id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    job = ExportJob(
        project_id=project_id,
        resolution=payload.resolution,
        fps=payload.fps,
        format=payload.format,
        audio_config=payload.audio_config or {},
        status=JobStatus.QUEUED,
        progress_percentage=0
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    threading.Thread(target=background_export_worker, args=(job.id, project_id), daemon=True).start()

    return job


@router.get("/projects/{project_id}/export/{export_id}", response_model=ExportJobResponse)
def get_export_job_status(
    project_id: str,
    export_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    job = db.query(ExportJob).filter(
        ExportJob.id == export_id,
        ExportJob.project_id == project_id
    ).first()
    if not job:
        raise HTTPException(status_code=404, detail="Export job not found")

    return job
