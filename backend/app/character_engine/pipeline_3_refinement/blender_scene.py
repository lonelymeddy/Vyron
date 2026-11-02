"""
VYRON AI — Pipeline 3: Material Builder & Optimization (Stages 13, 14, 15)
Assembles PBR materials in Blender, creates optimized LODs, and saves the master Blender scene.
"""

import os
import subprocess
import tempfile
import json
import logging
from pathlib import Path
from typing import Dict, Any

logger = logging.getLogger(__name__)

class BlenderSceneBuilder:
    def __init__(self, blender_bin: str = "blender"):
        self.blender_bin = blender_bin

    def build_scene_and_pbr_mesh(
        self,
        input_mesh_path: str,
        textures: Dict[str, str],
        output_blend_path: str,
        output_glb_path: str
    ) -> Dict[str, Any]:
        """
        Creates a complete Blender scene with Principled BSDF PBR material,
        attaches Base Color, Normal Map, and Roughness, and exports preview GLB.
        """
        if not os.path.exists(input_mesh_path):
            raise FileNotFoundError(f"Input mesh not found: {input_mesh_path}")

        Path(output_blend_path).parent.mkdir(parents=True, exist_ok=True)
        Path(output_glb_path).parent.mkdir(parents=True, exist_ok=True)

        diffuse = textures.get("base_color_path", "")
        normal = textures.get("normal_map_path", "")
        roughness = textures.get("roughness_map_path", "")

        script_content = f"""
import bpy
import json

bpy.ops.wm.read_homefile(use_empty=True)
bpy.ops.wm.obj_import(filepath="{input_mesh_path}")

obj = bpy.context.selected_objects[0]
bpy.context.view_layer.objects.active = obj
obj.name = "VyronCharacterMesh"

# Create PBR Principled BSDF Material
mat = bpy.data.materials.new(name="VyronPBRMaterial")
mat.use_nodes = True
nodes = mat.node_tree.nodes
links = mat.node_tree.links

bsdf = nodes.get("Principled BSDF")

# Base color texture
if os.path.exists("{diffuse}"):
    tex_diffuse = nodes.new('ShaderNodeTexImage')
    tex_diffuse.image = bpy.data.images.load("{diffuse}")
    links.new(tex_diffuse.outputs['Color'], bsdf.inputs['Base Color'])

# Normal map texture
if os.path.exists("{normal}"):
    tex_normal = nodes.new('ShaderNodeTexImage')
    tex_normal.image = bpy.data.images.load("{normal}")
    tex_normal.image.colorspace_settings.name = 'Non-Color'
    norm_node = nodes.new('ShaderNodeNormalMap')
    links.new(tex_normal.outputs['Color'], norm_node.inputs['Color'])
    links.new(norm_node.outputs['Normal'], bsdf.inputs['Normal'])

# Roughness texture
if os.path.exists("{roughness}"):
    tex_roughness = nodes.new('ShaderNodeTexImage')
    tex_roughness.image = bpy.data.images.load("{roughness}")
    tex_roughness.image.colorspace_settings.name = 'Non-Color'
    links.new(tex_roughness.outputs['Color'], bsdf.inputs['Roughness'])

obj.data.materials.append(mat)

# Save .blend master scene
bpy.ops.wm.save_as_mainfile(filepath="{output_blend_path}")

# Export textured GLB
bpy.ops.export_scene.gltf(
    filepath="{output_glb_path}",
    export_format='GLB',
    export_materials='EXPORT',
    export_image_format='AUTO'
)

print("VYRON_BLENDER_SCENE_SUCCESS")
"""
        with tempfile.NamedTemporaryFile("w", suffix=".py", delete=False) as tf:
            tf.write("import os\n" + script_content)
            script_path = tf.name

        try:
            # Use isolated system environment so Blender uses its system Python libraries
            clean_env = {
                "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
                "HOME": os.environ.get("HOME", "/tmp")
            }

            res = subprocess.run(
                [self.blender_bin, "--background", "--python", script_path],
                capture_output=True,
                text=True,
                env=clean_env,
                timeout=45
            )
            if "VYRON_BLENDER_SCENE_SUCCESS" not in res.stdout or not os.path.exists(output_glb_path):
                raise RuntimeError(f"Blender scene creation failed: {res.stderr}")

            return {
                "blend_scene_path": output_blend_path,
                "textured_glb_path": output_glb_path,
                "status": "SCENE_PREPARED"
            }
        finally:
            if os.path.exists(script_path):
                os.remove(script_path)

blender_scene_builder = BlenderSceneBuilder()
