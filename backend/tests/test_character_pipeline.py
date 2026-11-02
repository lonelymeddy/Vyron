import os
import io
import pytest
from PIL import Image
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal, Base, engine
from app.db.models import User, Character, CharacterGeneration
from app.character_engine.orchestrator import character_engine_orchestrator

client = TestClient(app)

@pytest.fixture
def auth_headers():
    # Register / login test user
    email = f"test3d_{os.urandom(4).hex()}@vyron.ai"
    reg = client.post("/api/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "3D Character Tester"
    })
    token = reg.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_character_system_status():
    res = client.get("/api/system/character-engine/status")
    assert res.status_code == 200
    data = res.json()
    assert "system" in data
    assert "models" in data
    assert data["system"]["blender_installed"] is True
    assert data["system"]["ffmpeg_installed"] is True

def test_character_models_manifest():
    res = client.get("/api/system/character-engine/models")
    assert res.status_code == 200
    catalog = res.json()
    assert "triposr" in catalog
    assert "blender_humanoid_rigify" in catalog

def test_full_character_3d_pipeline_orchestration(auth_headers):
    # 1. Create a character via image upload
    img = Image.new("RGB", (400, 600), color=(120, 150, 200))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    upload_res = client.post(
        "/api/characters/upload",
        files={"file": ("test_avatar.jpg", buf, "image/jpeg")},
        data={"name": "Tactical Vanguard"},
        headers=auth_headers
    )
    assert upload_res.status_code == 201
    char_id = upload_res.json()["id"]

    # 2. Add extra reference image
    buf2 = io.BytesIO()
    img.save(buf2, format="PNG")
    buf2.seek(0)
    ref_res = client.post(
        f"/api/characters/{char_id}/references",
        files={"file": ("side_view.png", buf2, "image/png")},
        data={"view_type": "three_quarter"},
        headers=auth_headers
    )
    assert ref_res.status_code == 201

    # 3. Trigger 3D generation
    gen_res = client.post(
        f"/api/characters/{char_id}/generate",
        json={"generation_mode": "SINGLE_IMAGE", "generate_rig": True},
        headers=auth_headers
    )
    assert gen_res.status_code == 201
    gen_id = gen_res.json()["id"]

    # 4. Run orchestrator directly with test DB session to verify all 20 stages synchronously
    db = SessionLocal()
    try:
        res = character_engine_orchestrator.execute_generation(gen_id, db)
        assert res["status"] == "COMPLETED"
        assert res["model_url"].endswith(".glb")
        assert os.path.exists(res["model_url"].lstrip("/"))
    finally:
        db.close()

    # 5. Query status via API endpoint
    status_res = client.get(f"/api/character-generations/{gen_id}", headers=auth_headers)
    assert status_res.status_code == 200
    st_data = status_res.json()
    assert st_data["status"] == "COMPLETED"
    assert st_data["progress_percentage"] == 100
    assert len(st_data["pipeline_executions"]) >= 13  # All recorded processing stages

    # 6. Quality report check
    qc_res = client.get(f"/api/characters/{char_id}/quality-report", headers=auth_headers)
    assert qc_res.status_code == 200
    assert qc_res.json()["overall_status"] == "PASS"

    # 7. Rig check
    rig_res = client.get(f"/api/characters/{char_id}/rig", headers=auth_headers)
    assert rig_res.status_code == 200
    assert rig_res.json()["bone_count"] == 16

    # 8. Export download test
    exp_res = client.post(f"/api/characters/{char_id}/export?format=glb", headers=auth_headers)
    assert exp_res.status_code == 200
    assert len(exp_res.content) > 1000  # Valid binary GLB content
