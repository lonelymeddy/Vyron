"""
VYRON AI — Internal 3D World & Virtual Environment Engine
Procedural generation of terrain, atmospheric lighting, architectural ruins,
props, and automated Blender 3D scene assembly.
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.db.models import Environment, EnvironmentAsset
from app.services.blender_service import blender_service

logger = logging.getLogger(__name__)

ENVIRONMENTS_STORAGE = Path("storage/environments")
ENVIRONMENTS_STORAGE.mkdir(parents=True, exist_ok=True)


class WorldEngineService:
    def __init__(self, storage_dir: Optional[Path] = None):
        self.storage_dir = storage_dir or ENVIRONMENTS_STORAGE
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    def list_environments(self, db: Session, theme: Optional[str] = None) -> List[Environment]:
        q = db.query(Environment).filter(Environment.is_active == True)
        if theme:
            q = q.filter(Environment.theme == theme)
        return q.all()

    def get_environment_by_slug(self, db: Session, slug: str) -> Optional[Environment]:
        return db.query(Environment).filter(Environment.slug == slug).first()

    def list_assets(self, db: Session, category: Optional[str] = None) -> List[EnvironmentAsset]:
        q = db.query(EnvironmentAsset).filter(EnvironmentAsset.is_reusable == True)
        if category:
            q = q.filter(EnvironmentAsset.category == category)
        return q.all()

    def create_environment(
        self,
        db: Session,
        name: str,
        slug: str,
        description: Optional[str] = None,
        theme: str = "tactical_pubg",
        map_location: Optional[str] = None,
        weather: str = "clear",
        time_of_day: str = "golden_hour",
        scene_config: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None
    ) -> Environment:
        env = Environment(
            name=name,
            slug=slug,
            description=description,
            theme=theme,
            map_location=map_location,
            weather=weather,
            time_of_day=time_of_day,
            scene_config=scene_config or {},
            user_id=user_id,
            is_preset=False,
            is_active=True
        )
        db.add(env)
        db.commit()
        db.refresh(env)
        return env

    def add_asset_to_environment(
        self,
        db: Session,
        environment_id: str,
        asset_name: str,
        category: str,
        model_format: str,
        file_path: str,
        position: Optional[List[float]] = None,
        rotation: Optional[List[float]] = None,
        scale: Optional[List[float]] = None,
        material_properties: Optional[Dict[str, Any]] = None
    ) -> EnvironmentAsset:
        asset = EnvironmentAsset(
            environment_id=environment_id,
            asset_name=asset_name,
            category=category,
            model_format=model_format,
            file_path=file_path,
            position=position or [0.0, 0.0, 0.0],
            rotation=rotation or [0.0, 0.0, 0.0],
            scale=scale or [1.0, 1.0, 1.0],
            material_properties=material_properties or {},
            is_reusable=True
        )
        db.add(asset)
        db.commit()
        db.refresh(asset)
        return asset

    def generate_procedural_scene(
        self,
        db: Session,
        environment_slug: str,
        output_glb_path: str
    ) -> Dict[str, Any]:
        env = self.get_environment_by_slug(db, environment_slug)
        cfg = env.scene_config if (env and env.scene_config) else {}

        os.makedirs(os.path.dirname(output_glb_path), exist_ok=True)

        import tempfile
        import subprocess

        # Write parameters safely to a temporary JSON file to avoid Python string injection
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as jf:
            json.dump({
                "sky_color": cfg.get("sky_color", [0.75, 0.45, 0.25]),
                "sun_intensity": float(cfg.get("sun_intensity", 2.0)),
                "structures_count": int(cfg.get("structures_count", 4)),
                "output_path": output_glb_path
            }, jf)
            config_json_path = jf.name

        blender_script = f"""
import bpy
import math
import json
import sys

with open(r"{config_json_path}", "r") as f:
    config = json.load(f)

bpy.ops.wm.read_homefile(use_empty=True)
scene = bpy.context.scene

# Configure World Sky
world = bpy.data.worlds.new("EnvironmentWorld")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
if bg:
    sc = config.get("sky_color", [0.75, 0.45, 0.25])
    bg.inputs['Color'].default_value = (float(sc[0]), float(sc[1]), float(sc[2]), 1.0)
    bg.inputs['Strength'].default_value = float(config.get("sun_intensity", 2.0))

# Procedural Terrain Plane
bpy.ops.mesh.primitive_grid_add(x_subdivisions=32, y_subdivisions=32, size=50.0, location=(0, 0, 0))
terrain = bpy.context.active_object
terrain.name = "ProceduralTerrain"

mat_terrain = bpy.data.materials.new(name="TerrainMaterial")
mat_terrain.use_nodes = True
bsdf = mat_terrain.node_tree.nodes.get("Principled BSDF")
if bsdf:
    bsdf.inputs['Base Color'].default_value = (0.15, 0.18, 0.12, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.85
terrain.data.materials.append(mat_terrain)

# Tactical Ruins / Structures
struct_count = int(config.get("structures_count", 4))
for i in range(struct_count):
    angle = (i / max(1, struct_count)) * 2 * math.pi
    bx = math.cos(angle) * 8.0
    by = math.sin(angle) * 8.0
    bpy.ops.mesh.primitive_cube_add(size=3.0, location=(bx, by, 1.5))
    struct = bpy.context.active_object
    struct.name = f"TacticalRuin_{{i}}"

# Sun / Key Light
light_data = bpy.data.lights.new(name="SunLight", type='SUN')
light_data.energy = 5.0
light_obj = bpy.data.objects.new("SunLight", light_data)
scene.collection.objects.link(light_obj)
light_obj.rotation_euler = (0.78, 0.35, 1.2)

# Export Scene to GLB
bpy.ops.export_scene.gltf(
    filepath=config["output_path"],
    export_format='GLB',
    use_selection=False
)
print("VYRON_WORLD_EXPORT_SUCCESS")
"""
        with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as tf:
            tf.write(blender_script)
            script_path = tf.name

        try:
            clean_env = {
                "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
                "HOME": os.environ.get("HOME", "/tmp")
            }
            cmd = ["blender", "--background", "--python", script_path]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, env=clean_env, check=False)
            if os.path.exists(output_glb_path):
                return {
                    "success": True,
                    "environment_slug": environment_slug,
                    "scene_path": output_glb_path,
                    "file_size": os.path.getsize(output_glb_path)
                }
            else:
                logger.error(f"Failed to generate 3D world scene: {res.stderr}")
                return {"success": False, "error": res.stderr}
        finally:
            if os.path.exists(script_path):
                os.remove(script_path)
            if os.path.exists(config_json_path):
                os.remove(config_json_path)


world_engine_service = WorldEngineService()
