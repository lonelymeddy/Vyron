"""
Tests for Reference-Driven Cinematic Reconstruction & Character Replacement Engine.
"""

import os
import pytest
import cv2
import numpy as np
from app.services.character_replacement_engine import CharacterReplacementEngine

REFERENCE_VIDEO_PATH = "/tmp/file_attachments/aa/ssstik.io_1793375470084.mp4"


@pytest.fixture
def test_character_image(tmp_path):
    img_path = str(tmp_path / "test_char.png")
    # Generate 4-channel RGBA avatar
    img = np.zeros((300, 150, 4), dtype=np.uint8)
    cv2.circle(img, (75, 75), 50, (50, 150, 255, 255), -1)  # Head
    cv2.rectangle(img, (30, 130), (120, 280), (200, 100, 50, 255), -1)  # Body
    cv2.imwrite(img_path, img)
    return img_path


def test_video_metadata_extraction():
    engine = CharacterReplacementEngine()
    if not os.path.exists(REFERENCE_VIDEO_PATH):
        pytest.skip("Reference video attachment not available in environment.")

    meta = engine.get_video_metadata(REFERENCE_VIDEO_PATH)
    assert meta["width"] == 720
    assert meta["height"] == 1066
    assert abs(meta["fps"] - 60.0) < 1.0
    assert meta["total_frames"] == 891
    assert meta["has_audio"] is True
    assert meta["audio_codec"] == "aac"


def test_shot_detection():
    engine = CharacterReplacementEngine()
    if not os.path.exists(REFERENCE_VIDEO_PATH):
        pytest.skip("Reference video attachment not available in environment.")

    shots = engine.detect_shots(REFERENCE_VIDEO_PATH)
    assert len(shots) >= 6
    assert shots[0]["start_time"] == 0.0


def test_reconstruction_blueprint_generation(test_character_image):
    engine = CharacterReplacementEngine()
    if not os.path.exists(REFERENCE_VIDEO_PATH):
        pytest.skip("Reference video attachment not available in environment.")

    blueprint = engine.generate_reconstruction_blueprint(
        REFERENCE_VIDEO_PATH, test_character_image
    )
    assert blueprint["version"] == "1.0.0"
    assert blueprint["total_shots"] > 0
    assert blueprint["reference_metadata"]["has_audio"] is True

    # At least one shot must detect character tracking
    has_char_shots = [s for s in blueprint["shots"] if s["has_character"]]
    assert len(has_char_shots) > 0
    assert has_char_shots[0]["pose_summary"] is not None
    assert has_char_shots[0]["reconstruction_approach"] == "APPROACH_A_CHARACTER_REPLACEMENT"


def test_character_replacement_processing(test_character_image, tmp_path):
    engine = CharacterReplacementEngine()
    if not os.path.exists(REFERENCE_VIDEO_PATH):
        pytest.skip("Reference video attachment not available in environment.")

    # Create a trimmed 1.0 second subclip (60 frames) for fast automated verification
    short_ref = str(tmp_path / "short_ref.mp4")
    cap = cv2.VideoCapture(REFERENCE_VIDEO_PATH)
    fps = cap.get(cv2.CAP_PROP_FPS)
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(short_ref, fourcc, fps, (720, 1066))

    for _ in range(60):
        ret, frame = cap.read()
        if not ret:
            break
        out.write(frame)
    cap.release()
    out.release()

    output_video = str(tmp_path / "output_test.mp4")
    result = engine.process_character_replacement(
        reference_video_path=short_ref,
        character_image_path=test_character_image,
        output_video_path=output_video,
    )

    assert result["status"] == "COMPLETED"
    assert os.path.exists(output_video)
    assert os.path.getsize(output_video) > 10000
    assert result["replaced_frames"] > 0
