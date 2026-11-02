"""
VYRON AI — Internal 3D Character Model Registry & Manifest Manager
Registers verified open-source local models, tracks on-disk weights,
and enforces zero mandatory external API dependencies.
"""

import os
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from app.character_engine.models.model_capabilities import get_system_capabilities

logger = logging.getLogger(__name__)

STORAGE_BASE = Path("storage/models")

# Manifest of open-source models supported by VYRON AI Character Engine
VERIFIED_MODEL_CATALOG = {
    "triposr": {
        "id": "triposr",
        "name": "TripoSR (Stability AI / VAST)",
        "source_repo": "https://github.com/VAST-AI-Research/TripoSR",
        "license": "MIT",
        "category": "image_to_3d",
        "default_weight_file": "model.ckpt",
        "vram_recommended_mb": 6000,
        "supported_inputs": ["single_image", "multi_image_projection"],
        "output_format": "obj/glb",
        "description": "Fast feed-forward 3D reconstruction model generating textured 3D meshes from single or multi-view images."
    },
    "u2net_human_seg": {
        "id": "u2net_human_seg",
        "name": "U2-Net / Rembg Human Silhouette Segmenter",
        "source_repo": "https://github.com/danielgatis/rembg",
        "license": "MIT",
        "category": "segmentation",
        "default_weight_file": "u2net.onnx",
        "vram_recommended_mb": 2000,
        "supported_inputs": ["rgb_image"],
        "output_format": "alpha_mask",
        "description": "High-accuracy background isolation and human subject matting for reference preprocessing."
    },
    "mediapipe_pose_landmarker": {
        "id": "mediapipe_pose_landmarker",
        "name": "MediaPipe Pose Landmarker Lite",
        "source_repo": "https://developers.google.com/mediapipe/solutions/vision/pose_landmarker",
        "license": "Apache 2.0",
        "category": "pose_and_rigging",
        "default_weight_file": "pose_landmarker_lite.task",
        "vram_recommended_mb": 0,
        "supported_inputs": ["rgb_image"],
        "output_format": "33_3d_landmarks",
        "description": "Extracts 33 humanoid landmark points for view angle classification, proportions, and bone alignment."
    },
    "blender_humanoid_rigify": {
        "id": "blender_humanoid_rigify",
        "name": "Blender Automated Humanoid Rigging Engine",
        "source_repo": "https://www.blender.org",
        "license": "GPL v3",
        "category": "rigging",
        "default_weight_file": "bpy_rigify",
        "vram_recommended_mb": 0,
        "supported_inputs": ["mesh_geometry"],
        "output_format": "skinned_humanoid_armature",
        "description": "Generates a complete humanoid deformation skeleton with automatic skin heat weighting."
    }
}


class ModelRegistry:
    def __init__(self, storage_dir: Optional[str] = None):
        self.storage_dir = Path(storage_dir) if storage_dir else STORAGE_BASE
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.manifest_file = self.storage_dir / "manifests" / "installed_models.json"
        self.manifest_file.parent.mkdir(parents=True, exist_ok=True)
        self._ensure_manifest()

    def _ensure_manifest(self):
        if not self.manifest_file.exists():
            initial_data = {
                "installed": {},
                "catalog_version": "1.0.0"
            }
            with open(self.manifest_file, "w") as f:
                json.dump(initial_data, f, indent=2)

    def get_catalog(self) -> Dict[str, Any]:
        return VERIFIED_MODEL_CATALOG

    def get_installed_status(self) -> Dict[str, Any]:
        system_caps = get_system_capabilities()
        models_status = []

        for model_id, meta in VERIFIED_MODEL_CATALOG.items():
            category_dir = self.storage_dir / meta["category"]
            expected_file = category_dir / meta["default_weight_file"]

            # Check models directory in root as well for pre-packaged tasks
            root_model_file = Path("models") / meta["default_weight_file"]

            is_installed = expected_file.exists() or root_model_file.exists()
            if model_id == "blender_humanoid_rigify":
                is_installed = system_caps["blender_installed"]
            elif model_id == "mediapipe_pose_landmarker":
                is_installed = root_model_file.exists() or expected_file.exists() or system_caps["mediapipe_installed"]

            active_path = str(expected_file) if expected_file.exists() else (str(root_model_file) if root_model_file.exists() else None)

            models_status.append({
                **meta,
                "installed": is_installed,
                "local_path": active_path,
                "requires_gpu": meta["vram_recommended_mb"] > 0,
                "gpu_supported": system_caps["has_cuda"],
            })

        return {
            "system": system_caps,
            "models": models_status,
            "external_api_dependencies": None,
            "offline_mode_capable": True,
        }

model_registry = ModelRegistry()
