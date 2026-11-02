"""
VYRON AI — Pipeline 3: Texture Processor (Stage 12 part 2)
Generates PBR texture atlases: Base Color, Normal map, Roughness map from reference photographs.
"""

import os
import cv2
import numpy as np
from PIL import Image
from pathlib import Path
from typing import Dict, Any

class TextureProcessor:
    def generate_pbr_textures(
        self,
        reference_image_path: str,
        output_dir: str,
        resolution: int = 2048
    ) -> Dict[str, Any]:
        """
        Creates physically-based texture maps:
        - Base color (diffuse albedo)
        - Normal map (Sobel derived surface details)
        - Roughness map
        - Metallic map
        """
        if not os.path.exists(reference_image_path):
            raise FileNotFoundError(f"Reference image not found: {reference_image_path}")

        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)

        # 1. Base Color
        with Image.open(reference_image_path) as img:
            base_color = img.convert("RGB").resize((resolution, resolution), Image.Resampling.LANCZOS)
            base_color_path = str(out_path / "texture_diffuse.png")
            base_color.save(base_color_path)

        # 2. Normal Map generation using Sobel filtering on grayscale
        gray = cv2.imread(base_color_path, cv2.IMREAD_GRAYSCALE)
        sobelx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)

        # Normalize gradients to [-1, 1]
        sobelx = cv2.normalize(sobelx, None, -1.0, 1.0, cv2.NORM_MINMAX)
        sobely = cv2.normalize(sobely, None, -1.0, 1.0, cv2.NORM_MINMAX)
        sobelz = np.ones_like(sobelx)

        # Normalize 3D vector length
        norm = np.sqrt(sobelx**2 + sobely**2 + sobelz**2) + 1e-5
        nx = (sobelx / norm * 0.5 + 0.5) * 255.0
        ny = (sobely / norm * 0.5 + 0.5) * 255.0
        nz = (sobelz / norm * 0.5 + 0.5) * 255.0

        normal_map = np.dstack([nx, ny, nz]).astype(np.uint8)
        normal_map_path = str(out_path / "texture_normal.png")
        cv2.imwrite(normal_map_path, cv2.cvtColor(normal_map, cv2.COLOR_RGB2BGR))

        # 3. Roughness Map
        roughness = np.full((resolution, resolution), 140, dtype=np.uint8)  # default matte ~0.55
        roughness_path = str(out_path / "texture_roughness.png")
        cv2.imwrite(roughness_path, roughness)

        # 4. Metallic Map
        metallic = np.zeros((resolution, resolution), dtype=np.uint8)  # non-metallic organic/cloth
        metallic_path = str(out_path / "texture_metallic.png")
        cv2.imwrite(metallic_path, metallic)

        return {
            "base_color_path": base_color_path,
            "normal_map_path": normal_map_path,
            "roughness_map_path": roughness_path,
            "metallic_map_path": metallic_path,
            "resolution": f"{resolution}x{resolution}",
            "status": "TEXTURES_GENERATED"
        }

texture_processor = TextureProcessor()
