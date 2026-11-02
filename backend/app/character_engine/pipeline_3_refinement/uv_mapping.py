"""
VYRON AI — Pipeline 3: UV Mapping Service (Stage 12 part 1)
Generates non-overlapping Smart UV Project unwraps with margin spacing in Blender headless mode.
"""

import os
import subprocess
import tempfile
import json
import logging
from pathlib import Path
from typing import Dict, Any

logger = logging.getLogger(__name__)

class UVMappingService:
    def __init__(self, blender_bin: str = "blender"):
        self.blender_bin = blender_bin

    def generate_uv_unwrap(self, input_mesh_path: str, output_mesh_path: str) -> Dict[str, Any]:
        """
        Unwraps mesh geometry using Blender Smart UV project algorithm.
        """
        if not os.path.exists(input_mesh_path):
            raise FileNotFoundError(f"Input mesh not found: {input_mesh_path}")

        Path(output_mesh_path).parent.mkdir(parents=True, exist_ok=True)

        script_content = f"""
import bpy
import json

bpy.ops.wm.read_homefile(use_empty=True)
bpy.ops.wm.obj_import(filepath="{input_mesh_path}")

obj = bpy.context.selected_objects[0]
bpy.context.view_layer.objects.active = obj
obj.select_set(True)

bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')

# Execute Smart UV Project with angle limit 66 deg and island margin 0.02
bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.02)

bpy.ops.object.mode_set(mode='OBJECT')

uv_layers = [layer.name for layer in obj.data.uv_layers]
has_uv = len(uv_layers) > 0

bpy.ops.wm.obj_export(filepath="{output_mesh_path}", export_uv=True)

stats = {{
    "uv_layers": uv_layers,
    "has_uv": has_uv
}}
print("VYRON_UV_UNWRAP_SUCCESS:" + json.dumps(stats))
"""
        with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as tf:
            tf.write(script_content)
            script_path = tf.name

        try:
            clean_env = {
                "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
                "HOME": os.environ.get("HOME", "/tmp")
            }
            res = subprocess.run([self.blender_bin, "--background", "--python", script_path], capture_output=True, text=True, env=clean_env, timeout=30)
            stats = {}
            for line in res.stdout.split("\n"):
                if "VYRON_UV_UNWRAP_SUCCESS:" in line:
                    json_str = line.split("VYRON_UV_UNWRAP_SUCCESS:")[1]
                    stats = json.loads(json_str)

            if not os.path.exists(output_mesh_path):
                raise RuntimeError(f"UV Unwrap failed: {res.stderr}")

            return {
                "uv_mesh_path": output_mesh_path,
                "has_uv": stats.get("has_uv", False),
                "uv_layers": stats.get("uv_layers", []),
                "island_margin": 0.02,
                "status": "UV_UNWRAPPED"
            }
        finally:
            if os.path.exists(script_path):
                os.remove(script_path)

uv_mapping_service = UVMappingService()
