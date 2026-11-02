"""
VYRON AI — Pipeline 1: Character Segmentation (Stage 3)
Extracts foreground character silhouette and produces clean binary and RGBA alpha masks
using local OpenCV grabCut / thresholding with MediaPipe pose guidance.
No external APIs or cloud services required.
"""

import os
import cv2
import numpy as np
from pathlib import Path
from typing import Dict, Any, Optional

class CharacterSegmentationService:
    def __init__(self, pose_model_path: Optional[str] = None):
        self.pose_model_path = pose_model_path or "models/pose_landmarker_lite.task"

    def segment_character(self, input_image_path: str, output_mask_path: str, output_rgba_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Segments the foreground character from background.
        Outputs:
        1. Grayscale 8-bit mask (255 = character, 0 = background)
        2. Clean cut RGBA image if output_rgba_path provided
        """
        if not os.path.exists(input_image_path):
            raise FileNotFoundError(f"Input image not found: {input_image_path}")

        img = cv2.imread(input_image_path, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError(f"Failed to decode image at {input_image_path}")

        h, w = img.shape[:2]
        Path(output_mask_path).parent.mkdir(parents=True, exist_ok=True)

        # Attempt segmentation via MediaPipe Pose if model exists
        mask = None
        method_used = "opencv_grabcut"

        if os.path.exists(self.pose_model_path):
            try:
                import mediapipe as mp
                from mediapipe.tasks import python
                from mediapipe.tasks.python import vision

                base_options = python.BaseOptions(model_asset_path=self.pose_model_path)
                options = vision.PoseLandmarkerOptions(
                    base_options=base_options,
                    output_segmentation_masks=True,
                    min_pose_detection_confidence=0.4
                )
                with vision.PoseLandmarker.create_from_options(options) as detector:
                    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                    mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                    results = detector.detect(mp_img)

                    if results.segmentation_masks and len(results.segmentation_masks) > 0:
                        mask_np = results.segmentation_masks[0].numpy_view()
                        mask = (mask_np > 0.4).astype(np.uint8) * 255
                        mask = cv2.resize(mask, (w, h), interpolation=cv2.INTER_NEAREST)
                        method_used = "mediapipe_pose_landmarker"
            except Exception as e:
                pass

        if mask is None:
            # Fallback to high-performance local GrabCut with center saliency bounding box
            mask_gc = np.zeros((h, w), np.uint8)
            bgd_model = np.zeros((1, 65), np.float64)
            fgd_model = np.zeros((1, 65), np.float64)

            # Define center bounding box where character typically resides (10% border margin)
            margin_x = int(w * 0.08)
            margin_y = int(h * 0.05)
            rect = (margin_x, margin_y, w - 2 * margin_x, h - 2 * margin_y)

            try:
                cv2.grabCut(img, mask_gc, rect, bgd_model, fgd_model, 3, cv2.GC_INIT_WITH_RECT)
                mask = np.where((mask_gc == 2) | (mask_gc == 0), 0, 255).astype(np.uint8)
                method_used = "grabcut_saliency"
            except Exception:
                # Fallback to center-weighted radial mask
                y, x = np.ogrid[:h, :w]
                cx, cy = w / 2.0, h / 2.0
                dist = ((x - cx) / (w * 0.45)) ** 2 + ((y - cy) / (h * 0.45)) ** 2
                mask = (dist <= 1.0).astype(np.uint8) * 255
                method_used = "elliptical_fallthrough"

        # Smooth edges slightly
        mask = cv2.GaussianBlur(mask, (5, 5), 0)
        mask = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)[1]

        # Save binary mask
        cv2.imwrite(output_mask_path, mask)

        # If RGBA requested, compose
        if output_rgba_path:
            Path(output_rgba_path).parent.mkdir(parents=True, exist_ok=True)
            b, g, r = cv2.split(img)
            rgba = cv2.merge([b, g, r, mask])
            cv2.imwrite(output_rgba_path, rgba)

        foreground_ratio = float(np.sum(mask > 0) / (h * w))

        return {
            "mask_path": output_mask_path,
            "rgba_path": output_rgba_path,
            "method": method_used,
            "foreground_ratio": round(foreground_ratio, 3),
            "is_valid_segmentation": 0.05 <= foreground_ratio <= 0.95
        }

character_segmentation_service = CharacterSegmentationService()
