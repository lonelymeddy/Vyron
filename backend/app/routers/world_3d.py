from typing import List
from fastapi import APIRouter
from app.schemas import Asset3D, WorldPreset

router = APIRouter(prefix="/world-3d", tags=["3D Asset & World Engine"])

MOCK_WORLD_PRESETS: List[WorldPreset] = [
    WorldPreset(
        id="erangel_city",
        name="Erangel City Ruins",
        description="Gritty urban environment with abandoned structures, dramatic shadows and cinematic sunset lighting.",
        map_location="Pochinki Urban District",
        weather="sunset",
        preview_url="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop"
    ),
    WorldPreset(
        id="military_airfield",
        name="Sosnovka Airbase",
        description="High-tech military runway with hangars, tactical vehicles, and atmospheric fog.",
        map_location="Sosnovka Island",
        weather="fog",
        preview_url="https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=800&auto=format&fit=crop"
    )
]

MOCK_3D_ASSETS: List[Asset3D] = [
    Asset3D(
        id="asset_vehicle_01",
        category="vehicle",
        name="Tactical Buggy Extreme",
        thumbnail_url="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=400&auto=format&fit=crop",
        tags=["vehicle", "offroad", "pubg"],
        is_pubg_style=True
    )
]

@router.get("/presets", response_model=List[WorldPreset])
def get_world_presets():
    return MOCK_WORLD_PRESETS

@router.get("/assets", response_model=List[Asset3D])
def get_3d_assets(category: str = None):
    if category:
        return [asset for asset in MOCK_3D_ASSETS if asset.category == category]
    return MOCK_3D_ASSETS
