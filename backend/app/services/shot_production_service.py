"""
VYRON AI — Shot Production & Refinement Service
"""

import os
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.models import Project, ShotAdjustment, ShotRenderVersion, JobStatus
from app.services.character_replacement_engine import CharacterReplacementEngine

logger = logging.getLogger(__name__)

class ShotProductionService:
    def __init__(self):
        self.engine = CharacterReplacementEngine()

    def get_or_create_adjustments(self, db: Session, project_id: str, shot_id: int) -> ShotAdjustment:
        adj = db.query(ShotAdjustment).filter(
            ShotAdjustment.project_id == project_id,
            ShotAdjustment.shot_id == shot_id
        ).first()

        if not adj:
            adj = ShotAdjustment(
                project_id=project_id,
                shot_id=shot_id,
                pos_x=0.0,
                pos_y=0.0,
                pos_z=0.0,
                scale=1.0,
                rotation_y=0.0,
                ground_offset=0.0,
                speed=1.0,
                offset_sec=0.0,
                root_movement=True,
                camera_pos_x=0.0,
                camera_pos_y=0.0,
                camera_pos_z=0.0,
                camera_fov=50.0,
                camera_movement="standard",
                light_intensity=1.0,
                light_color_temp=5500.0,
                light_direction="ambient",
                environment_alignment=0.0,
                custom_params={}
            )
            db.add(adj)
            db.commit()
            db.refresh(adj)

        return adj

    def save_adjustments(
        self,
        db: Session,
        project_id: str,
        shot_id: int,
        updates: Dict[str, Any]
    ) -> ShotAdjustment:
        adj = self.get_or_create_adjustments(db, project_id, shot_id)
        for key, val in updates.items():
            if val is not None and hasattr(adj, key):
                setattr(adj, key, val)
        adj.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(adj)
        return adj

    def list_shot_versions(self, db: Session, project_id: str, shot_id: int) -> List[ShotRenderVersion]:
        return db.query(ShotRenderVersion).filter(
            ShotRenderVersion.project_id == project_id,
            ShotRenderVersion.shot_id == shot_id
        ).order_by(ShotRenderVersion.version_number.desc()).all()

    def select_shot_version(self, db: Session, project_id: str, shot_id: int, version_id: str) -> Optional[ShotRenderVersion]:
        versions = db.query(ShotRenderVersion).filter(
            ShotRenderVersion.project_id == project_id,
            ShotRenderVersion.shot_id == shot_id
        ).all()

        target_ver = None
        for v in versions:
            if v.id == version_id:
                v.is_selected = True
                target_ver = v
            else:
                v.is_selected = False

        if target_ver:
            db.commit()
            db.refresh(target_ver)
        return target_ver

    def regenerate_shot(
        self,
        db: Session,
        project_id: str,
        shot_id: int,
        start_time: float,
        end_time: float,
        progress_callback: Optional[callable] = None
    ) -> ShotRenderVersion:
        project = db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError("Project not found")

        if not project.source_videos:
            raise ValueError("Project has no source reference video")

        ref_video_path = project.source_videos[0].storage_path or project.source_videos[0].video_url
        if not os.path.exists(ref_video_path):
            raise FileNotFoundError(f"Reference video missing at {ref_video_path}")

        char_path = None
        if project.character:
            char_path = project.character.storage_path or project.character.image_url
        if not char_path or not os.path.exists(char_path):
            raise FileNotFoundError("Character image missing for shot regeneration")

        adj = self.get_or_create_adjustments(db, project_id, shot_id)
        adjustments_dict = {
            "pos_x": adj.pos_x,
            "pos_y": adj.pos_y,
            "pos_z": adj.pos_z,
            "scale": adj.scale,
            "rotation_y": adj.rotation_y,
            "ground_offset": adj.ground_offset,
            "speed": adj.speed,
            "offset_sec": adj.offset_sec,
            "root_movement": adj.root_movement,
            "light_intensity": adj.light_intensity,
            "light_color_temp": adj.light_color_temp,
            "camera_fov": adj.camera_fov,
            "camera_movement": adj.camera_movement,
        }

        existing_versions = self.list_shot_versions(db, project_id, shot_id)
        next_version = (existing_versions[0].version_number + 1) if existing_versions else 1

        out_dir = os.path.join("static", "uploads", "shots", project_id)
        os.makedirs(out_dir, exist_ok=True)
        filename = f"shot_{shot_id}_v{next_version}.mp4"
        out_filepath = os.path.join(out_dir, filename)

        res = self.engine.process_single_shot(
            reference_video_path=ref_video_path,
            character_image_path=char_path,
            start_time=start_time,
            end_time=end_time,
            output_video_path=out_filepath,
            adjustments=adjustments_dict,
            progress_callback=progress_callback
        )

        for v in existing_versions:
            v.is_selected = False

        new_version = ShotRenderVersion(
            project_id=project_id,
            shot_id=shot_id,
            version_number=next_version,
            video_url=f"/static/uploads/shots/{project_id}/{filename}",
            storage_path=out_filepath,
            duration=res.get("duration"),
            resolution=res.get("resolution"),
            fps=res.get("fps"),
            is_selected=True,
            status=JobStatus.COMPLETED,
            adjustments_snapshot=adjustments_dict
        )
        db.add(new_version)
        db.commit()
        db.refresh(new_version)
        return new_version

shot_production_service = ShotProductionService()
