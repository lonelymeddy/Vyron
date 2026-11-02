"""
VYRON AI — Character 3D Generation & Studio Endpoints
Full internal REST API for 3D character reconstruction, reference tracking,
pipeline progression, rigging verification, quality reports, and exports.
"""

import os
import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import (
    User, Character, CharacterReferenceImage, CharacterGeneration,
    PipelineExecution, CharacterAsset, CharacterRig, CharacterQualityReport
)
from app.schemas import (
    CharacterResponse, CharacterGenerationCreate, CharacterGenerationResponse,
    CharacterReferenceImageResponse, CharacterAssetResponse, CharacterQualityReportResponse,
    CharacterRigResponse
)
from app.auth import get_current_user
from app.character_engine.pipeline_1_ingestion.upload_service import upload_service
from app.character_engine.pipeline_1_ingestion.image_preprocessor import image_preprocessor
from app.character_engine.pipeline_1_ingestion.view_classifier import reference_view_classifier
from app.character_engine.models.model_registry import model_registry
from app.workers.character_worker import run_character_generation_job

router = APIRouter(tags=["3D Character Generation Studio"])

# 1. System Status & Model Manifest
@router.get("/system/character-engine/status")
def get_engine_status():
    """Returns local hardware, Blender status, and offline execution capabilities."""
    return model_registry.get_installed_status()

@router.get("/system/character-engine/models")
def get_engine_models():
    """Lists registered verified open-source local models with licenses."""
    return model_registry.get_catalog()

# 2. Reference Images Management
@router.post("/characters/{character_id}/references", response_model=CharacterReferenceImageResponse, status_code=status.HTTP_201_CREATED)
async def upload_character_reference(
    character_id: str,
    file: UploadFile = File(...),
    view_type: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    char = db.query(Character).filter(Character.id == character_id, Character.user_id == current_user.id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")

    content = await file.read()
    try:
        saved = upload_service.validate_and_save(content, file.filename or "reference.png", current_user.id, character_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Preprocess
    proc_dir = os.path.join("storage", "characters", f"user_{current_user.id}", f"character_{character_id}", "references", "processed")
    os.makedirs(proc_dir, exist_ok=True)
    proc_path = os.path.join(proc_dir, f"{saved['file_id']}_1024.png")
    prep_meta = image_preprocessor.preprocess_image(saved["storage_path"], proc_path)

    # Classify angle if not specified
    classified_view = view_type
    confidence = 1.0
    if not classified_view or classified_view == "unknown":
        view_info = reference_view_classifier.classify_view(proc_path)
        classified_view = view_info["view_type"]
        confidence = view_info["confidence"]

    ref_img = CharacterReferenceImage(
        character_id=character_id,
        original_file_path=saved["storage_path"],
        processed_file_path=proc_path,
        view_type=classified_view or "unknown",
        confidence=confidence,
        dimensions=saved["format"],
        quality_metadata=prep_meta
    )
    db.add(ref_img)
    db.commit()
    db.refresh(ref_img)
    return ref_img

@router.get("/characters/{character_id}/references", response_model=List[CharacterReferenceImageResponse])
def get_character_references(
    character_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    char = db.query(Character).filter(Character.id == character_id, Character.user_id == current_user.id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")
    return db.query(CharacterReferenceImage).filter(CharacterReferenceImage.character_id == character_id).all()

# 3. 3D Generation Execution & Job Tracking
@router.post("/characters/{character_id}/generate", response_model=CharacterGenerationResponse, status_code=status.HTTP_201_CREATED)
def start_3d_character_generation(
    character_id: str,
    config: Optional[CharacterGenerationCreate] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    char = db.query(Character).filter(Character.id == character_id, Character.user_id == current_user.id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")

    # Get version count
    existing_count = db.query(CharacterGeneration).filter(CharacterGeneration.character_id == character_id).count()

    generation = CharacterGeneration(
        character_id=character_id,
        generation_version=existing_count + 1,
        generation_mode=config.generation_mode if config else "SINGLE_IMAGE",
        status="QUEUED",
        current_pipeline=1,
        current_stage=1,
        stage_name="Image Verification",
        progress_percentage=0,
        configuration=config.dict() if config else {}
    )
    db.add(generation)
    db.commit()
    db.refresh(generation)

    # Spawn worker thread
    run_character_generation_job(generation.id)

    return generation

@router.get("/character-generations/{generation_id}", response_model=CharacterGenerationResponse)
def get_generation_status(
    generation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    gen = db.query(CharacterGeneration).filter(CharacterGeneration.id == generation_id).first()
    if not gen:
        raise HTTPException(status_code=404, detail="Generation job not found")
    return gen

@router.post("/character-generations/{generation_id}/retry", response_model=CharacterGenerationResponse)
def retry_generation(
    generation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    gen = db.query(CharacterGeneration).filter(CharacterGeneration.id == generation_id).first()
    if not gen:
        raise HTTPException(status_code=404, detail="Generation job not found")

    gen.status = "QUEUED"
    gen.progress_percentage = 0
    gen.error_details = None
    db.commit()
    db.refresh(gen)

    run_character_generation_job(gen.id)
    return gen

# 4. Assets, Quality Report & Rigging
@router.get("/characters/{character_id}/assets", response_model=List[CharacterAssetResponse])
def get_character_assets(
    character_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    char = db.query(Character).filter(Character.id == character_id, Character.user_id == current_user.id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")
    return db.query(CharacterAsset).filter(CharacterAsset.character_id == character_id).all()

@router.get("/characters/{character_id}/quality-report", response_model=Optional[CharacterQualityReportResponse])
def get_quality_report(
    character_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    char = db.query(Character).filter(Character.id == character_id, Character.user_id == current_user.id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")

    if not char.active_generation_id:
        return None

    return db.query(CharacterQualityReport).filter(CharacterQualityReport.generation_id == char.active_generation_id).first()

@router.get("/characters/{character_id}/rig", response_model=Optional[CharacterRigResponse])
def get_character_rig(
    character_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    char = db.query(Character).filter(Character.id == character_id, Character.user_id == current_user.id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")
    return db.query(CharacterRig).filter(CharacterRig.character_id == character_id).first()

@router.post("/characters/{character_id}/export")
def download_character_export(
    character_id: str,
    format: str = Query("glb", regex="^(glb|obj|fbx)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    char = db.query(Character).filter(Character.id == character_id, Character.user_id == current_user.id).first()
    if not char:
        raise HTTPException(status_code=404, detail="Character not found")

    asset = db.query(CharacterAsset).filter(
        CharacterAsset.character_id == character_id,
        CharacterAsset.file_format == format
    ).order_by(CharacterAsset.created_at.desc()).first()

    if not asset or not os.path.exists(asset.file_path):
        # Fallback to model_asset_url if requesting GLB
        if format == "glb" and char.model_asset_url and os.path.exists(char.model_asset_url.lstrip("/")):
            return FileResponse(
                path=char.model_asset_url.lstrip("/"),
                filename=f"{char.name.replace(' ', '_')}.glb",
                media_type="model/gltf-binary"
            )
        raise HTTPException(status_code=404, detail=f"No exported {format.upper()} asset available for this character.")

    media_types = {
        "glb": "model/gltf-binary",
        "obj": "text/plain",
        "fbx": "application/octet-stream"
    }

    return FileResponse(
        path=asset.file_path,
        filename=f"{char.name.replace(' ', '_')}.{format}",
        media_type=media_types.get(format, "application/octet-stream")
    )
