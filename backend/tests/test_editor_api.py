import os
import uuid
import pytest
import cv2
import numpy as np
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.models import User, Project, SourceVideo, Character, JobStatus
from app.auth import create_access_token

client = TestClient(app)

@pytest.fixture
def auth_headers_and_project(tmp_path):
    db = SessionLocal()
    unique_email = f"editor_test_{uuid.uuid4().hex[:8]}@vyron.ai"
    user = User(email=unique_email, hashed_password="pw", is_active=True)
    db.add(user)
    db.commit()

    token = create_access_token(data={"sub": user.id})
    headers = {"Authorization": f"Bearer {token}"}

    char_path = str(tmp_path / "char.png")
    char_img = np.full((120, 60, 3), (220, 120, 40), dtype=np.uint8)
    cv2.imwrite(char_path, char_img)
    character = Character(
        user_id=user.id,
        name="EditorAvatar",
        image_url="/static/uploads/char.png",
        storage_path=char_path
    )
    db.add(character)
    db.commit()

    vid_path = str(tmp_path / "test_ref.mp4")
    writer = cv2.VideoWriter(vid_path, cv2.VideoWriter_fourcc(*"mp4v"), 30.0, (320, 240))
    for i in range(30):
        frame = np.full((240, 320, 3), 100, dtype=np.uint8)
        writer.write(frame)
    writer.release()

    project = Project(
        user_id=user.id,
        character_id=character.id,
        title="Production Studio Project",
        status=JobStatus.COMPLETED
    )
    db.add(project)
    db.commit()

    source_vid = SourceVideo(
        project_id=project.id,
        file_name="test_ref.mp4",
        video_url="/static/uploads/test_ref.mp4",
        storage_path=vid_path,
        duration_seconds=1.0,
        fps=30.0
    )
    db.add(source_vid)
    db.commit()

    yield headers, project.id, db

    db.close()


def test_get_editor_bundle(auth_headers_and_project):
    headers, project_id, db = auth_headers_and_project
    res = client.get(f"/api/projects/{project_id}/editor", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["project_id"] == project_id
    assert len(data["shots"]) >= 1
    assert data["shots"][0]["shot_id"] == 1


def test_shot_adjustments_api(auth_headers_and_project):
    headers, project_id, db = auth_headers_and_project
    res = client.get(f"/api/projects/{project_id}/shots/1/adjustments", headers=headers)
    assert res.status_code == 200
    assert res.json()["scale"] == 1.0

    update_res = client.put(
        f"/api/projects/{project_id}/shots/1/adjustments",
        headers=headers,
        json={"scale": 1.35, "pos_x": 10.0, "light_intensity": 1.15}
    )
    assert update_res.status_code == 200
    assert update_res.json()["scale"] == 1.35
    assert update_res.json()["pos_x"] == 10.0


def test_quality_control_api(auth_headers_and_project):
    headers, project_id, db = auth_headers_and_project
    res = client.post(f"/api/projects/{project_id}/quality-control", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_frames" in data
    assert "continuity_status" in data


def test_export_api(auth_headers_and_project):
    headers, project_id, db = auth_headers_and_project
    export_res = client.post(
        f"/api/projects/{project_id}/export",
        headers=headers,
        json={"resolution": "720p", "fps": 30, "format": "mp4"}
    )
    assert export_res.status_code == 200
    job_id = export_res.json()["id"]

    status_res = client.get(f"/api/projects/{project_id}/export/{job_id}", headers=headers)
    assert status_res.status_code == 200
    assert status_res.json()["id"] == job_id
