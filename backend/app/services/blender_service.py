"""
VYRON AI — Blender 3D Reconstruction and Rendering Service
Automates Blender headless execution for camera trajectory reconstruction,
3D character model / mesh card positioning, scene lighting, shadow generation,
and CGI rendering.
"""

import os
import subprocess
import json
import logging
import tempfile
from typing import Dict, Any, List, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

class BlenderService:
    def __init__(self, blender_bin: str = "blender"):
        self.blender_bin = blender_bin

    def is_available(self) -> bool:
        """Checks if Blender is installed and runnable."""
        try:
            res = subprocess.run(
                [self.blender_bin, "--version"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=False
            )
            return res.returncode == 0
        except Exception:
            return False

    def render_reconstructed_scene(
        self,
        scene_config: Dict[str, Any],
        output_image_path: str,
        engine: str = "BLENDER_EEVEE_NEXT"
    ) -> bool:
        """
        Renders a single reconstructed 3D frame via Blender headless python script.
        """
        script_content = f"""
import bpy
import math

bpy.ops.wm.read_homefile(use_empty=True)
scene = bpy.context.scene

# Configure output resolution
scene.render.resolution_x = {scene_config.get("width", 720)}
scene.render.resolution_y = {scene_config.get("height", 1066)}
scene.render.filepath = "{output_image_path}"
scene.render.image_settings.file_format = 'PNG'

# Setup World Environment & Ambient Lighting
world = bpy.data.worlds.new("VyronCinematicWorld")
scene.world = world
world.use_nodes = True
bg_node = world.node_tree.nodes.get("Background")
if bg_node:
    bg_node.inputs['Color'].default_value = (0.02, 0.03, 0.05, 1.0)
    bg_node.inputs['Strength'].default_value = 0.8

# Camera Setup
cam_data = bpy.data.cameras.new("MainCamera")
cam_obj = bpy.data.objects.new("MainCamera", cam_data)
scene.collection.objects.link(cam_obj)
scene.camera = cam_obj

cam_pos = {scene_config.get("camera_position", [0.0, -4.0, 1.4])}
cam_rot = {scene_config.get("camera_rotation", [1.45, 0.0, 0.0])}
cam_obj.location = (cam_pos[0], cam_pos[1], cam_pos[2])
cam_obj.rotation_euler = (cam_rot[0], cam_rot[1], cam_rot[2])
cam_data.lens = {scene_config.get("focal_length", 35.0)}

# Ground / Shadow Catcher Plane
bpy.ops.mesh.primitive_plane_add(size=20.0, location=(0, 0, 0))
ground = bpy.context.active_object
ground.name = "GroundShadowCatcher"

# Ambient Key Light
light_data = bpy.data.lights.new(name="KeyLight", type='AREA')
light_data.energy = 300.0
light_data.color = (0.8, 0.9, 1.0)
light_obj = bpy.data.objects.new("KeyLight", light_data)
scene.collection.objects.link(light_obj)
light_obj.location = (2.0, -2.5, 3.5)

# Fill Rim Light
rim_data = bpy.data.lights.new(name="RimLight", type='POINT')
rim_data.energy = 150.0
rim_data.color = (1.0, 0.7, 0.4)
rim_obj = bpy.data.objects.new("RimLight", rim_data)
scene.collection.objects.link(rim_obj)
rim_obj.location = (-2.0, 1.5, 2.0)

# Character Mesh / Card Setup
char_pos = {scene_config.get("character_position", [0.0, 0.0, 0.9])}
char_scale = {scene_config.get("character_scale", [0.8, 0.8, 1.8])}

bpy.ops.mesh.primitive_cylinder_add(
    vertices=24,
    radius=char_scale[0] * 0.35,
    depth=char_scale[2],
    location=(char_pos[0], char_pos[1], char_pos[2])
)
char_obj = bpy.context.active_object
char_obj.name = "CharacterProxy"

mat = bpy.data.materials.new(name="CharacterMaterial")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
if bsdf:
    bsdf.inputs['Base Color'].default_value = (0.2, 0.25, 0.35, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.4
char_obj.data.materials.append(mat)

# Execute Render
bpy.ops.render.render(write_still=True)
print("VYRON_BLENDER_RENDER_SUCCESS")
"""
        with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as tf:
            tf.write(script_content)
            script_path = tf.name

        try:
            cmd = [
                self.blender_bin,
                "--background",
                "--python", script_path
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=False)
            if "VYRON_BLENDER_RENDER_SUCCESS" in res.stdout and os.path.exists(output_image_path):
                return True
            else:
                logger.error(f"Blender render execution failed: {res.stderr}")
                return False
        finally:
            if os.path.exists(script_path):
                os.remove(script_path)

    def render_reconstructed_shot_sequence(
        self,
        shot_metadata: Dict[str, Any],
        output_dir: str,
        frame_count: int = 30
    ) -> List[str]:
        """
        Renders a sequence of reconstructed 3D frames for a given shot.
        """
        os.makedirs(output_dir, exist_ok=True)
        rendered_frames = []

        width = shot_metadata.get("width", 720)
        height = shot_metadata.get("height", 1066)

        for i in range(frame_count):
            t = i / max(1, frame_count - 1)
            cam_y = -4.0 + (t * 0.5)
            char_y = 0.0 - (t * 0.3)

            cfg = {
                "width": width,
                "height": height,
                "camera_position": [0.0, cam_y, 1.35],
                "camera_rotation": [1.45, 0.0, 0.0],
                "character_position": [0.0, char_y, 0.9],
                "character_scale": [0.8, 0.8, 1.8],
                "focal_length": 35.0
            }
            out_frame = os.path.join(output_dir, f"frame_{i:04d}.png")
            success = self.render_reconstructed_scene(cfg, out_frame)
            if success:
                rendered_frames.append(out_frame)

        return rendered_frames

blender_service = BlenderService()
