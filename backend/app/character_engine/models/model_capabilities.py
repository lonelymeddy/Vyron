"""
VYRON AI — Internal 3D Character Engine Model Capabilities & System Discovery
Detects local system capabilities: CUDA, VRAM, RAM, Blender, FFmpeg, PyTorch, MediaPipe.
"""

import os
import shutil
import subprocess
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

def get_system_capabilities() -> Dict[str, Any]:
    """
    Scans the host system to determine real available hardware and software dependencies.
    No simulated values — reports genuine execution capacity.
    """
    has_cuda = False
    gpu_name = None
    vram_mb = 0
    device_type = "cpu"

    try:
        import torch
        has_cuda = torch.cuda.is_available()
        if has_cuda:
            gpu_name = torch.cuda.get_device_name(0)
            vram_mb = int(torch.cuda.get_device_properties(0).total_memory / (1024 * 1024))
            device_type = "cuda"
    except Exception as e:
        logger.warning(f"Failed to inspect PyTorch CUDA: {e}")

    # Blender check
    blender_path = shutil.which("blender")
    blender_version = None
    if blender_path:
        try:
            res = subprocess.run([blender_path, "--version"], capture_output=True, text=True, timeout=5)
            first_line = res.stdout.strip().split("\n")[0]
            blender_version = first_line
        except Exception:
            blender_version = "Unknown version"

    # FFmpeg check
    ffmpeg_path = shutil.which("ffmpeg")
    ffmpeg_available = bool(ffmpeg_path)

    # MediaPipe check
    mediapipe_available = False
    try:
        import mediapipe
        mediapipe_available = True
    except Exception:
        pass

    # Trimesh check
    trimesh_available = False
    try:
        import trimesh
        trimesh_available = True
    except Exception:
        pass

    return {
        "device_type": device_type,
        "has_cuda": has_cuda,
        "gpu_name": gpu_name,
        "vram_mb": vram_mb,
        "blender_installed": bool(blender_path),
        "blender_path": blender_path,
        "blender_version": blender_version,
        "ffmpeg_installed": ffmpeg_available,
        "ffmpeg_path": ffmpeg_path,
        "mediapipe_installed": mediapipe_available,
        "trimesh_installed": trimesh_available,
        "supports_fast_gpu_inference": has_cuda and vram_mb >= 6000,
        "supports_blender_rigging": bool(blender_path),
        "reconstruction_engine": "vyron_native_internal_3d"
    }
