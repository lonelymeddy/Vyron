import os
import uuid
import pytest
import cv2
import numpy as np
from app.db.session import SessionLocal
from app.db.models import User, Project, SourceVideo, Character, ShotAdjustment, ShotRenderVersion
from app.services.shot_production_service import shot_production_service

@pytest.fixture
def test_shot_environment(tmp_path):
    db = SessionLocal()
    unique_email = f"shot_user_{uuid.uuid4().hex[:8]}@test.com"
    user = User(email=unique_email, hashed_password="pw", is_active=True)
    db.add(user)
    db.commit()

    char_path = str(tmp_path / "char.png")
    char_img = np.full((100, 50, 3), (200, 100, 50), dtype=np.uint8)
    cv2.imwrite(char_path, char_img)

    character = Character(
        user_id=user.id,
        name="Hero",
        image_url="/static/uploads/char.png",
        storage_path=char_path
    )
    db.add(character)
    db.commit()

    ref_video_path = str(tmp_path / "ref.mp4")
    writer = cv2.VideoWriter(ref_video_path, cv2.VideoWriter_fourcc(*"mp4v"), 30.0, (320, 240))
    for i in range(30):
        frame = np.full((240, 320, 3), 100, dtype=np.uint8)
        writer.write(frame)
    writer.release()

    project = Project(
        user_id=user.id,
        character_id=character.id,
        title="Shot Test Project"
    )
    db.add(project)
    db.commit()

    source_vid = SourceVideo(
        project_id=project.id,
        file_name="ref.mp4",
        video_url="/static/uploads/ref.mp4",
        storage_path=ref_video_path,
        duration_seconds=1.0,
        fps=30.0
    )
    db.add(source_vid)
    db.commit()

    yield db, project, user

    db.close()

def test_adjustments_save_and_retrieve(test_shot_environment):
    db, project, user = test_shot_environment
    adj = shot_production_service.get_or_create_adjustments(db, project.id, shot_id=1)
    assert adj.scale == 1.0

    updated = shot_production_service.save_adjustments(
        db, project.id, shot_id=1,
        updates={"scale": 1.4, "pos_x": 15.0, "light_intensity": 1.2}
    )
    assert updated.scale == 1.4
    assert updated.pos_x == 15.0
    assert updated.light_intensity == 1.2

def test_single_shot_regeneration_and_versioning(test_shot_environment):
    db, project, user = test_shot_environment
    shot_production_service.save_adjustments(db, project.id, shot_id=1, updates={"scale": 1.25})

    v1 = shot_production_service.regenerate_shot(
        db, project.id, shot_id=1, start_time=0.0, end_time=0.5
    )
    assert v1.version_number == 1
    assert v1.is_selected is True
    assert os.path.exists(v1.storage_path)

    shot_production_service.save_adjustments(db, project.id, shot_id=1, updates={"scale": 1.5})
    v2 = shot_production_service.regenerate_shot(
        db, project.id, shot_id=1, start_time=0.0, end_time=0.5
    )
    assert v2.version_number == 2
    assert v2.is_selected is True

    versions = shot_production_service.list_shot_versions(db, project.id, shot_id=1)
    assert len(versions) == 2

    rolled_back = shot_production_service.select_shot_version(db, project.id, shot_id=1, version_id=v1.id)
    assert rolled_back.is_selected is True
    db.refresh(v2)
    assert v2.is_selected is False
