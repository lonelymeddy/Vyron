"""
VYRON AI — 3D World & Virtual Environment Router
Provides endpoints to list persistent environments, create custom worlds,
inspect environmental assets, and trigger procedural 3D scene exports.
"""

import os
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import Environment, EnvironmentAsset, User
from app.schemas import EnvironmentResponse, EnvironmentCreate, EnvironmentAssetSchema
from app.auth import get_current_user
from app.services.world_engine import world_engine_service

router = APIRouter(prefix="/world-3d", tags=["3D World & Environment Engine"])


@router.get("/presets", response_model=List[EnvironmentResponse])
def get_world_presets(
    theme: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return world_engine_service.list_environments(db, theme=theme)


@router.get("/environments/{slug}", response_model=EnvironmentResponse)
def get_environment_by_slug(
    slug: str,
    db: Session = Depends(get_db)
):
    env = world_engine_service.get_environment_by_slug(db, slug)
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")
    return env


@router.get("/assets", response_model=List[EnvironmentAssetSchema])
def list_reusable_assets(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Retrieve reusable 3D environment assets (structures, vehicles, props)."""
    return world_engine_service.list_assets(db, category=category)


@router.post("/environments", response_model=EnvironmentResponse, status_code=201)
def create_custom_environment(
    env_in: EnvironmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    slug = env_in.slug or env_in.name.lower().replace(" ", "_")
    existing = world_engine_service.get_environment_by_slug(db, slug)
    if existing:
        raise HTTPException(status_code=400, detail="Environment with this slug already exists.")

    return world_engine_service.create_environment(
        db=db,
        name=env_in.name,
        slug=slug,
        description=env_in.description,
        theme=env_in.theme,
        map_location=env_in.map_location,
        weather=env_in.weather,
        time_of_day=env_in.time_of_day,
        scene_config=env_in.scene_config,
        user_id=current_user.id
    )


@router.post("/environments/{slug}/export-scene")
def export_environment_scene(
    slug: str,
    db: Session = Depends(get_db)
):
    env = world_engine_service.get_environment_by_slug(db, slug)
    if not env:
        raise HTTPException(status_code=404, detail="Environment not found")

    out_dir = os.path.join("storage", "environments", "scenes")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, f"{slug}_master.glb")

    res = world_engine_service.generate_procedural_scene(db, slug, out_file)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=f"Failed to generate 3D scene: {res.get('error')}")

    return FileResponse(
        path=out_file,
        filename=f"{slug}_scene.glb",
        media_type="model/gltf-binary"
    )
