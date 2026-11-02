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


@pytest.fixture
def synthetic_reference_video(tmp_path):
    """Creates a synthetic walking-character reference video if external reference is absent."""
    if os.path.exists(REFERENCE_VIDEO_PATH):
        return REFERENCE_VIDEO_PATH

    synth_path = str(tmp_path / "synthetic_ref.mp4")
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    fps = 30.0
    width, height = 720, 1066
    out = cv2.VideoWriter(synth_path, fourcc, fps, (width, height))

    for i in range(45):
        frame = np.full((height, width, 3), (35, 30, 25), dtype=np.uint8)
        cv2.line(frame, (0, 750), (720, 750), (60, 60, 70), 3)
        x_pos = int(360 + (i - 22) * 2)
        y_pos = int(500 + np.sin(i / 4.0) * 15)
        cv2.circle(frame, (x_pos, y_pos - 120), 45, (190, 170, 160), -1)
        cv2.rectangle(frame, (x_pos - 35, y_pos - 75), (x_pos + 35, y_pos + 120), (80, 70, 90), -1)
        cv2.line(frame, (x_pos - 20, y_pos + 120), (x_pos - 25, y_pos + 260), (40, 40, 120), 12)
        cv2.line(frame, (x_pos + 20, y_pos + 120), (x_pos + 25, y_pos + 260), (40, 40, 120), 12)
        out.write(frame)

    out.release()
    return synth_path


def test_video_metadata_extraction(synthetic_reference_video):
    engine = CharacterReplacementEngine()
    meta = engine.get_video_metadata(synthetic_reference_video)
    assert meta["width"] == 720
    assert meta["height"] == 1066
    assert meta["fps"] > 0
    assert meta["total_frames"] > 0


def test_shot_detection(synthetic_reference_video):
    engine = CharacterReplacementEngine()
    shots = engine.detect_shots(synthetic_reference_video)
    assert len(shots) >= 1
    assert shots[0]["start_time"] == 0.0


def test_reconstruction_blueprint_generation(synthetic_reference_video, test_character_image):
    engine = CharacterReplacementEngine()
    blueprint = engine.generate_reconstruction_blueprint(
        synthetic_reference_video, test_character_image
    )
    assert blueprint["version"] == "1.0.0"
    assert blueprint["total_shots"] > 0
    assert len(blueprint["shots"]) > 0


def test_character_replacement_processing(synthetic_reference_video, test_character_image, tmp_path):
    engine = CharacterReplacementEngine()
    output_video = str(tmp_path / "output_test.mp4")

    result = engine.process_character_replacement(
        reference_video_path=synthetic_reference_video,
        character_image_path=test_character_image,
        output_video_path=output_video,
    )

    assert result["status"] == "COMPLETED"
    assert os.path.exists(output_video)
    assert os.path.getsize(output_video) > 1000
    assert result["blender_available"] is True
