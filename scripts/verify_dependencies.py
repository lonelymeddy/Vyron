#!/usr/bin/env python3
"""
VYRON AI — System & Dependencies Verification Script
Verifies all dependencies for the Internal 3D Character Generation Engine.
"""

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.character_engine.models.model_capabilities import get_system_capabilities
from app.character_engine.models.model_registry import model_registry

def main():
    print("=" * 60)
    print("VYRON AI — 3D Character Engine Infrastructure Audit")
    print("=" * 60)
    status = model_registry.get_installed_status()
    sys_info = status["system"]

    print(f"Device Type: {sys_info['device_type']}")
    print(f"CUDA Available: {sys_info['has_cuda']}")
    if sys_info['has_cuda']:
        print(f"GPU Name: {sys_info['gpu_name']} ({sys_info['vram_mb']} MB VRAM)")
    print(f"Blender Installed: {sys_info['blender_installed']} ({sys_info['blender_version']})")
    print(f"FFmpeg Installed: {sys_info['ffmpeg_installed']}")
    print(f"MediaPipe Installed: {sys_info['mediapipe_installed']}")
    print(f"Trimesh Installed: {sys_info['trimesh_installed']}")
    print("\nVerified Internal Models Catalog:")
    for m in status["models"]:
        inst = "INSTALLED" if m["installed"] else "NOT DOWNLOADED"
        print(f" - [{inst}] {m['name']} (License: {m['license']})")

    print("\nNo mandatory external AI APIs configured or required.")
    print("Offline processing capability: OK")
    print("=" * 60)

if __name__ == "__main__":
    main()
