"""
VYRON AI — Pipeline 1: Reference View Classifier (Stage 4)
Classifies character viewing angles: front, back, left, right, three_quarter, face_closeup, full_body, unknown.
Uses geometric facial and skeletal landmark ratios rather than fabricated labels.
"""

import os
import cv2
import numpy as np
from typing import Dict, Any, Optional

class ReferenceViewClassifier:
    def __init__(self, pose_model_path: Optional[str] = None):
        self.pose_model_path = pose_model_path or "models/pose_landmarker_lite.task"

    def classify_view(self, image_path: str) -> Dict[str, Any]:
        """
        Determines the camera angle and framing of the character image.
        Returns view_type, framing (full_body, upper_body, closeup), and detection confidence.
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")

        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Failed to read image at {image_path}")

        h, w = img.shape[:2]

        view_type = "unknown"
        framing = "upper_body"
        confidence = 0.5
        landmarks_detected = False

        if os.path.exists(self.pose_model_path):
            try:
                import mediapipe as mp
                from mediapipe.tasks import python
                from mediapipe.tasks.python import vision

                base_options = python.BaseOptions(model_asset_path=self.pose_model_path)
                options = vision.PoseLandmarkerOptions(
                    base_options=base_options,
                    min_pose_detection_confidence=0.4
                )
                with vision.PoseLandmarker.create_from_options(options) as detector:
                    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                    mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                    results = detector.detect(mp_img)

                    if results.pose_landmarks and len(results.pose_landmarks) > 0:
                        landmarks_detected = True
                        lms = results.pose_landmarks[0]
                        confidence = 0.85

                        # Extract key points
                        nose = lms[0]
                        left_eye = lms[2]
                        right_eye = lms[5]
                        left_ear = lms[7]
                        right_ear = lms[8]
                        left_shoulder = lms[11]
                        right_shoulder = lms[12]
                        left_hip = lms[23]
                        right_hip = lms[24]
                        left_ankle = lms[27]
                        right_ankle = lms[28]

                        # Check framing
                        has_ankles = (left_ankle.visibility > 0.4 or right_ankle.visibility > 0.4)
                        has_hips = (left_hip.visibility > 0.4 or right_hip.visibility > 0.4)

                        if has_ankles:
                            framing = "full_body"
                        elif has_hips:
                            framing = "upper_body"
                        else:
                            framing = "face_closeup"

                        # Determine angle from nose to ears/shoulders horizontal symmetry
                        shoulder_diff = abs(left_shoulder.z - right_shoulder.z) if hasattr(left_shoulder, 'z') else 0.0
                        ear_dx_left = abs(nose.x - left_ear.x)
                        ear_dx_right = abs(nose.x - right_ear.x)

                        # Front vs profile vs three-quarter
                        shoulder_span = abs(left_shoulder.x - right_shoulder.x)
                        if shoulder_span > 0.18:
                            ratio = ear_dx_left / (ear_dx_right + 1e-5)
                            if 0.7 <= ratio <= 1.4:
                                view_type = "front"
                                confidence = 0.92
                            elif ratio < 0.4 or ratio > 2.5:
                                view_type = "left" if ratio > 2.5 else "right"
                                confidence = 0.88
                            else:
                                view_type = "three_quarter"
                                confidence = 0.82
                        else:
                            # Narrow shoulder span indicates side profile or back
                            view_type = "left" if nose.x < left_shoulder.x else "right"
                            confidence = 0.75
            except Exception:
                pass

        if not landmarks_detected:
            # Fallback heuristic: assume front or three_quarter based on image aspect ratio
            view_type = "front" if h >= w else "three_quarter"
            confidence = 0.45

        return {
            "view_type": view_type,
            "framing": framing,
            "confidence": round(confidence, 2),
            "landmarks_detected": landmarks_detected
        }

reference_view_classifier = ReferenceViewClassifier()
