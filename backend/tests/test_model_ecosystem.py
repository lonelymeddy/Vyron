import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_get_hardware_status():
    res = client.get("/api/models/hardware")
    assert res.status_code == 200
    data = res.json()
    assert "blender_installed" in data
    assert "ffmpeg_installed" in data
    assert data["blender_installed"] is True
    assert data["ffmpeg_installed"] is True
    assert data["offline_mode"] is True

def test_list_models():
    res = client.get("/api/models")
    assert res.status_code == 200
    models = res.json()
    assert len(models) >= 4
    model_ids = [m["id"] for m in models]
    assert "triposr" in model_ids
    assert "u2net_human_seg" in model_ids
    assert "mediapipe_pose_landmarker" in model_ids
    assert "blender_humanoid_rigify" in model_ids

def test_get_model_details():
    res = client.get("/api/models/triposr")
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "TripoSR"
    assert data["license"] == "MIT"
    assert data["category"] == "image_to_3d"

def test_check_model_compatibility():
    res = client.get("/api/models/triposr/compatibility")
    assert res.status_code == 200
    data = res.json()
    assert "compatible" in data
    assert data["model_id"] == "triposr"

def test_verify_blender_system_binary():
    res = client.post("/api/models/blender_humanoid_rigify/verify")
    assert res.status_code == 200
    data = res.json()
    assert data["verified"] is True
    assert data["status"] in ["INSTALLED_SYSTEM_BINARY", "VERIFIED_ON_DISK"]
