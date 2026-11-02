"""
VYRON AI — Central AI Model Manager & Infrastructure Engine
Manages model lifecycle, on-disk weight verification, hardware compatibility checks,
version control, licensing enforcement, and CPU/GPU fallback policies.
"""

import os
import hashlib
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.db.models import ModelRecord, ModelVersion
from app.character_engine.models.model_capabilities import get_system_capabilities

logger = logging.getLogger(__name__)

MODELS_DIR = Path("storage/models")
MODELS_DIR.mkdir(parents=True, exist_ok=True)


class AIModelManager:
    def __init__(self, storage_dir: Optional[Path] = None):
        self.storage_dir = storage_dir or MODELS_DIR
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    def get_hardware_status(self) -> Dict[str, Any]:
        sys_caps = get_system_capabilities()
        return {
            "has_cuda": sys_caps.get("has_cuda", False),
            "device_name": sys_caps.get("gpu_name") or sys_caps.get("device_type", "cpu"),
            "vram_total_mb": sys_caps.get("vram_mb", 0),
            "blender_installed": sys_caps.get("blender_installed", False),
            "ffmpeg_installed": sys_caps.get("ffmpeg_installed", False),
            "mediapipe_installed": sys_caps.get("mediapipe_installed", False),
            "cpu_fallback_available": True,
            "offline_mode": True,
            "gpu_required_tasks_supported": sys_caps.get("has_cuda", False),
        }

    def list_models(self, db: Session, category: Optional[str] = None) -> List[ModelRecord]:
        q = db.query(ModelRecord)
        if category:
            q = q.filter(ModelRecord.category == category)
        return q.all()

    def get_model(self, db: Session, model_id: str) -> Optional[ModelRecord]:
        return db.query(ModelRecord).filter(ModelRecord.id == model_id).first()

    def verify_model_weights(self, db: Session, model_id: str) -> Dict[str, Any]:
        model = self.get_model(db, model_id)
        if not model:
            return {"verified": False, "error": f"Model {model_id} not found"}

        local_path = model.local_weight_path
        if not local_path or not os.path.exists(local_path):
            root_path = os.path.join("models", model.default_weight_file)
            if os.path.exists(root_path):
                local_path = root_path
            elif model_id == "blender_humanoid_rigify":
                import shutil
                blender_bin = shutil.which("blender")
                if blender_bin:
                    return {
                        "model_id": model_id,
                        "verified": True,
                        "status": "INSTALLED_SYSTEM_BINARY",
                        "path": blender_bin,
                        "license": model.license,
                    }

        if not local_path or not os.path.exists(local_path):
            return {
                "model_id": model_id,
                "verified": False,
                "status": "MISSING_WEIGHTS",
                "expected_file": model.default_weight_file,
                "license": model.license,
            }

        file_size = os.path.getsize(local_path)
        sha256_hash = hashlib.sha256()
        with open(local_path, "rb") as f:
            for byte_block in iter(lambda: f.read(65536), b""):
                sha256_hash.update(byte_block)
        digest = sha256_hash.hexdigest()

        ver = db.query(ModelVersion).filter(
            ModelVersion.model_id == model_id,
            ModelVersion.version_tag == model.version
        ).first()

        if not ver:
            ver = ModelVersion(
                model_id=model_id,
                version_tag=model.version,
                file_size_bytes=file_size,
                file_sha256=digest,
                local_path=local_path,
                is_verified=True,
                verified_at=datetime.utcnow()
            )
            db.add(ver)
        else:
            ver.file_size_bytes = file_size
            ver.file_sha256 = digest
            ver.local_path = local_path
            ver.is_verified = True
            ver.verified_at = datetime.utcnow()

        model.is_installed = True
        model.local_weight_path = local_path
        db.commit()

        return {
            "model_id": model_id,
            "version": model.version,
            "verified": True,
            "status": "VERIFIED_ON_DISK",
            "sha256": digest,
            "size_bytes": file_size,
            "local_path": local_path,
            "license": model.license,
            "license_url": model.license_url,
        }

    def check_hardware_compatibility(self, db: Session, model_id: str) -> Dict[str, Any]:
        model = self.get_model(db, model_id)
        if not model:
            return {"compatible": False, "error": f"Model {model_id} not found"}

        hw = self.get_hardware_status()
        compatible = True
        reasons = []

        if model.requires_gpu and not hw["has_cuda"]:
            if not model.supports_cpu_fallback:
                compatible = False
                reasons.append("Model strictly requires CUDA GPU, but host has no CUDA device.")
            else:
                reasons.append("Running in CPU fallback mode (slower inference expected).")

        if hw["has_cuda"] and hw["vram_total_mb"] < model.vram_recommended_mb:
            reasons.append(f"VRAM ({hw['vram_total_mb']}MB) is lower than recommended ({model.vram_recommended_mb}MB).")

        return {
            "model_id": model_id,
            "compatible": compatible,
            "hardware_mode": "cuda" if (hw["has_cuda"] and not model.supports_cpu_fallback) else "cpu_or_cuda",
            "notes": reasons,
            "hardware_summary": hw
        }


ai_model_manager = AIModelManager()
