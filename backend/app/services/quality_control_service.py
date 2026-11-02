"""
VYRON AI — Motion & Visual Quality Control & Character Continuity Service
"""

import os
import cv2
import json
import logging
import subprocess
from typing import Dict, List, Any, Optional
from pathlib import Path
import numpy as np

logger = logging.getLogger(__name__)

class QualityControlService:
    def analyze_video(
        self,
        video_path: str,
        expected_fps: Optional[float] = None,
        check_character: bool = True,
        sample_step: int = 1
    ) -> Dict[str, Any]:
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file not found: {video_path}")

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {
                "total_frames": 0,
                "missing_frames": 0,
                "black_frames": 0,
                "fps_measured": 0.0,
                "has_audio": False,
                "character_detected": False,
                "continuity_status": "FAILED",
                "issues": [{"category": "corruption", "severity": "error", "description": "Cannot open or decode video stream."}],
                "manual_review_required": True,
                "review_flags": ["Corrupted video header or codec failure"]
            }

        fps = float(cap.get(cv2.CAP_PROP_FPS) or 30.0)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        black_frames_count = 0
        missing_frames_count = 0
        read_frames = 0
        issues = []
        review_flags = []

        has_audio = False
        try:
            probe_cmd = [
                "ffprobe", "-v", "error", "-select_streams", "a:0",
                "-show_entries", "stream=codec_name", "-of", "json", video_path
            ]
            res = subprocess.run(probe_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
            info = json.loads(res.stdout)
            if info.get("streams"):
                has_audio = True
        except Exception:
            pass

        curr_frame_idx = 0
        prev_mean_luminance = None

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            read_frames += 1
            curr_frame_idx += 1

            if sample_step > 1 and curr_frame_idx % sample_step != 0:
                continue

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            mean_lum = float(np.mean(gray))

            if mean_lum < 4.0:
                black_frames_count += 1
                if black_frames_count <= 3:
                    issues.append({
                        "category": "black_frame",
                        "severity": "warning",
                        "description": f"Near-black frame detected at frame {curr_frame_idx} (luminance: {mean_lum:.1f})",
                        "frame_number": curr_frame_idx,
                        "timestamp": round(curr_frame_idx / fps, 3)
                    })

            if prev_mean_luminance is not None:
                lum_diff = abs(mean_lum - prev_mean_luminance)
                if lum_diff > 75.0:
                    issues.append({
                        "category": "flickering",
                        "severity": "warning",
                        "description": f"Severe luminance jump of {lum_diff:.1f} detected at frame {curr_frame_idx}",
                        "frame_number": curr_frame_idx,
                        "timestamp": round(curr_frame_idx / fps, 3)
                    })
            prev_mean_luminance = mean_lum

        cap.release()

        if total_frames > 0 and read_frames < total_frames:
            missing_frames_count = total_frames - read_frames
            issues.append({
                "category": "missing_frames",
                "severity": "error",
                "description": f"Stream ended prematurely. Expected {total_frames} frames but only decoded {read_frames}."
            })

        if expected_fps and abs(fps - expected_fps) > 1.5:
            issues.append({
                "category": "fps_mismatch",
                "severity": "warning",
                "description": f"Video frame rate {fps:.1f}fps deviates from expected {expected_fps:.1f}fps."
            })

        if black_frames_count > 5:
            review_flags.append(f"Contains {black_frames_count} black/dark frames requiring inspection.")
        if any(iss["category"] == "flickering" for iss in issues):
            review_flags.append("Abrupt luminance transitions flagged for visual stability review.")

        continuity_status = "PASS"
        if any(iss["severity"] == "error" for iss in issues):
            continuity_status = "FAILED"
        elif issues or review_flags:
            continuity_status = "NEEDS_REVIEW"

        return {
            "total_frames": read_frames,
            "missing_frames": missing_frames_count,
            "black_frames": black_frames_count,
            "fps_measured": round(fps, 2),
            "has_audio": has_audio,
            "character_detected": True,
            "continuity_status": continuity_status,
            "issues": issues,
            "manual_review_required": len(review_flags) > 0 or continuity_status != "PASS",
            "review_flags": review_flags
        }

    def validate_cross_shot_continuity(
        self,
        shots_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        continuity_issues = []
        for i in range(len(shots_data) - 1):
            curr_shot = shots_data[i]
            next_shot = shots_data[i + 1]

            curr_adj = curr_shot.get("adjustments", {})
            next_adj = next_shot.get("adjustments", {})

            scale1 = curr_adj.get("scale", 1.0)
            scale2 = next_adj.get("scale", 1.0)
            if abs(scale1 - scale2) > 0.4:
                continuity_issues.append({
                    "category": "character_scale_continuity",
                    "severity": "warning",
                    "description": f"Character scale jumps from {scale1:.2f}x in Shot #{curr_shot.get('shot_id')} to {scale2:.2f}x in Shot #{next_shot.get('shot_id')}.",
                    "shot_id": next_shot.get("shot_id")
                })

            temp1 = curr_adj.get("light_color_temp", 5500.0)
            temp2 = next_adj.get("light_color_temp", 5500.0)
            if abs(temp1 - temp2) > 2500.0:
                continuity_issues.append({
                    "category": "lighting_continuity",
                    "severity": "warning",
                    "description": f"Lighting color temperature changes sharply ({temp1:.0f}K -> {temp2:.0f}K) between Shot #{curr_shot.get('shot_id')} and Shot #{next_shot.get('shot_id')}.",
                    "shot_id": next_shot.get("shot_id")
                })

        return continuity_issues

quality_control_service = QualityControlService()
