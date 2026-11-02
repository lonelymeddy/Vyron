#!/usr/bin/env python3
"""
VYRON AI — Model Weight Downloader & Installer Script
Ensures local model weights are downloaded to persistent storage without redundant fetches.
"""

import os
import sys
import urllib.request
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

STORAGE_MODELS = "storage/models"

def main():
    logger.info("Checking persistent model directories...")
    os.makedirs(f"{STORAGE_MODELS}/image_to_3d", exist_ok=True)
    os.makedirs(f"{STORAGE_MODELS}/segmentation", exist_ok=True)
    os.makedirs(f"{STORAGE_MODELS}/rigging", exist_ok=True)
    os.makedirs(f"{STORAGE_MODELS}/manifests", exist_ok=True)

    # Check for pose landmarker
    pose_dest = f"{STORAGE_MODELS}/rigging/pose_landmarker_lite.task"
    if not os.path.exists(pose_dest) and not os.path.exists("models/pose_landmarker_lite.task"):
        url = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
        logger.info(f"Downloading MediaPipe Pose Landmarker to {pose_dest}...")
        try:
            urllib.request.urlretrieve(url, pose_dest)
            logger.info("Downloaded MediaPipe Pose Landmarker successfully.")
        except Exception as e:
            logger.warning(f"Could not download model automatically: {e}")
    else:
        logger.info("Pose Landmarker model is already available locally.")

    logger.info("Local model directory configuration completed.")

if __name__ == "__main__":
    main()
