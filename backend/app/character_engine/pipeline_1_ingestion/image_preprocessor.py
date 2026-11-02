"""
VYRON AI — Pipeline 1: Image Preprocessor (Stage 2)
Handles EXIF orientation correction, aspect ratio squaring/centering,
resizing, color normalization, and image quality analysis.
"""

import os
from pathlib import Path
from typing import Dict, Any, Tuple
from PIL import Image, ImageOps
import numpy as np

TARGET_RESOLUTION = 1024

class ImagePreprocessor:
    def __init__(self, target_size: int = TARGET_RESOLUTION):
        self.target_size = target_size

    def preprocess_image(self, input_path: str, output_path: str) -> Dict[str, Any]:
        """
        Loads image, corrects EXIF orientation, applies center-padding to square,
        normalizes colors and exports to standardized PNG at target resolution.
        """
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Input image not found: {input_path}")

        Path(output_path).parent.mkdir(parents=True, exist_ok=True)

        with Image.open(input_path) as raw_img:
            # 1. Correct EXIF orientation
            img = ImageOps.exif_transpose(raw_img)
            orig_w, orig_h = img.size

            # Ensure RGBA or RGB
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGBA" if "transparency" in img.info else "RGB")

            # 2. Aspect-ratio preserving pad to square
            max_dim = max(orig_w, orig_h)
            scale = self.target_size / max_dim
            new_w = int(orig_w * scale)
            new_h = int(orig_h * scale)

            resized_img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

            # Create square canvas with transparent or neutral background
            canvas_mode = "RGBA" if resized_img.mode == "RGBA" else "RGB"
            bg_color = (0, 0, 0, 0) if canvas_mode == "RGBA" else (128, 128, 128)
            canvas = Image.new(canvas_mode, (self.target_size, self.target_size), bg_color)

            offset_x = (self.target_size - new_w) // 2
            offset_y = (self.target_size - new_h) // 2
            canvas.paste(resized_img, (offset_x, offset_y))

            # 3. Save preprocessed PNG
            canvas.save(output_path, format="PNG")

            # 4. Compute quality statistics
            np_arr = np.array(canvas)
            mean_brightness = float(np.mean(np_arr[..., :3]))
            std_contrast = float(np.std(np_arr[..., :3]))

            # Laplacian blur detection
            import cv2
            gray = cv2.cvtColor(np_arr[..., :3], cv2.COLOR_RGB2GRAY)
            sharpness_score = float(cv2.Laplacian(gray, cv2.CV_64F).var())

            quality_score = min(1.0, max(0.1, (sharpness_score / 250.0) * 0.5 + (std_contrast / 64.0) * 0.5))

            return {
                "output_path": output_path,
                "target_size": f"{self.target_size}x{self.target_size}",
                "original_dimensions": f"{orig_w}x{orig_h}",
                "sharpness_score": round(sharpness_score, 2),
                "brightness": round(mean_brightness, 2),
                "contrast": round(std_contrast, 2),
                "quality_score": round(quality_score, 2),
                "reconstruction_suitability": "EXCELLENT" if quality_score > 0.6 else ("GOOD" if quality_score > 0.35 else "MARGINAL")
            }

image_preprocessor = ImagePreprocessor()
