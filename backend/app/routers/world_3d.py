from typing import List
from fastapi import APIRouter
from app.schemas import Asset3D, WorldPreset

router = APIRouter(prefix="/world-3d", tags=["3D Asset & World Engine"])

AVAILABLE_WORLD_PRESETS: List[WorldPreset] = [
    WorldPreset(
        id="erangel_city",
        name="Erangel City Ruins",
        description="Gritty urban environment with abandoned structures, dramatic shadows and cinematic sunset lighting.",
        map_location="Pochinki Urban District",
        weather="sunset",
        preview_url="/static/presets/erangel_city.jpg"
    ),
    WorldPreset(
        id="military_airfield",
        name="Sosnovka Airbase",
        description="High-tech military runway with hangars, tactical vehicles, and atmospheric fog.",
        map_location="Sosnovka Island",
        weather="fog",
        preview_url="/static/presets/sosnovka_airbase.jpg"
    )
]

AVAILABLE_3D_ASSETS: List[Asset3D] = [
    Asset3D(
        id="asset_vehicle_01",
        category="vehicle",
        name="Tactical Buggy Extreme",
        thumbnail_url="/static/assets/tactical_buggy.jpg",
        tags=["vehicle", "offroad", "pubg"],
        is_pubg_style=True
    )
]

@router.get("/presets", response_model=List[WorldPreset])
def get_world_presets():
    return AVAILABLE_WORLD_PRESETS

@router.get("/assets", response_model=List[Asset3D])
def get_3d_assets(category: str = None):
    if category:
        return [asset for asset in AVAILABLE_3D_ASSETS if asset.category == category]
    return AVAILABLE_3D_ASSETS
