import pytest
import os
import uuid
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.models import User
from app.auth import get_password_hash, create_access_token

client = TestClient(app)

@pytest.fixture
def auth_headers():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "world_tester@vyron.ai").first()
    if not user:
        user = User(
            email="world_tester@vyron.ai",
            hashed_password=get_password_hash("password123"),
            full_name="World Tester",
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    db.close()
    return {"Authorization": f"Bearer {token}"}

def test_list_world_presets():
    res = client.get("/api/world-3d/presets")
    assert res.status_code == 200
    presets = res.json()
    assert len(presets) >= 3
    slugs = [p["slug"] for p in presets]
    assert "erangel_city" in slugs
    assert "military_airfield" in slugs
    assert "vikendi_snow" in slugs

def test_get_environment_by_slug():
    res = client.get("/api/world-3d/environments/erangel_city")
    assert res.status_code == 200
    env = res.json()
    assert env["name"] == "Erangel City Ruins"
    assert env["theme"] == "tactical_pubg"
    assert "scene_config" in env

def test_create_custom_environment(auth_headers):
    unique_slug = f"miramar_{uuid.uuid4().hex[:6]}"
    res = client.post("/api/world-3d/environments", json={
        "name": "Miramar Desert Compound",
        "slug": unique_slug,
        "description": "High-altitude arid canyon with adobe ruins and harsh sunlight.",
        "theme": "desert_outpost",
        "weather": "clear",
        "time_of_day": "noon",
        "scene_config": {"sun_intensity": 3.5}
    }, headers=auth_headers)
    assert res.status_code == 201
    env = res.json()
    assert env["slug"] == unique_slug
    assert env["theme"] == "desert_outpost"

def test_procedural_scene_export():
    res = client.post("/api/world-3d/environments/erangel_city/export-scene")
    assert res.status_code == 200
    assert res.headers["content-type"] == "model/gltf-binary"
    assert len(res.content) > 1000
