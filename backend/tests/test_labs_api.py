import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture
def auth_headers():
    reg_res = client.post("/api/auth/register", json={
        "email": "labtester@vyronailabs.com",
        "password": "Password123!",
        "full_name": "Lab Tester"
    })
    if reg_res.status_code == 201:
        token = reg_res.json()["access_token"]
    else:
        login_res = client.post("/api/auth/login", json={
            "email": "labtester@vyronailabs.com",
            "password": "Password123!"
        })
        token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_models_endpoint():
    res = client.get("/api/labs/models")
    assert res.status_code == 200
    data = res.json()
    assert data["platform"] == "VYRON AI LABS"
    assert len(data["models"]) >= 12

def test_voices_endpoint():
    res = client.get("/api/labs/voices")
    assert res.status_code == 200
    voices = res.json()["voices"]
    assert len(voices) >= 5
    assert any(v["id"] == "af_sarah" for v in voices)

def test_voice_generation_endpoint(auth_headers):
    res = client.post(
        "/api/labs/voice/generate",
        headers=auth_headers,
        json={
            "text": "Welcome to VYRON AI LABS, your creative laboratory.",
            "voice_id": "af_sarah",
            "speed": 1.0,
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["modality"] == "voice"
    assert data["output_url"].endswith(".wav")
    assert data["duration_seconds"] > 0

def test_voice_cloning_consent_requirement(auth_headers):
    res = client.post(
        "/api/labs/voice/clone/profile",
        headers=auth_headers,
        json={
            "name": "My Voice Clone",
            "sample_audio_url": "/static/uploads/audio/sample.wav",
            "consent_confirmed": False,
        }
    )
    assert res.status_code == 400

    res_ok = client.post(
        "/api/labs/voice/clone/profile",
        headers=auth_headers,
        json={
            "name": "Authorized Voice Profile",
            "sample_audio_url": "/static/uploads/audio/sample.wav",
            "consent_confirmed": True,
        }
    )
    assert res_ok.status_code == 200
    profile_id = res_ok.json()["id"]

    del_res = client.delete(f"/api/labs/voice/clone/profile/{profile_id}", headers=auth_headers)
    assert del_res.status_code == 200

def test_music_generation_endpoint(auth_headers):
    res = client.post(
        "/api/labs/music/generate",
        headers=auth_headers,
        json={
            "prompt": "Uplifting futuristic anthem",
            "genre": "Synthwave",
            "mood": "Energetic",
            "duration": 5,
            "bpm": 128,
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["modality"] == "music"
    assert data["output_url"].endswith(".wav")
    assert data["duration_seconds"] == 5.0

def test_prompt_studio_endpoint(auth_headers):
    res = client.post(
        "/api/labs/tools/prompt-studio/optimize",
        headers=auth_headers,
        json={"prompt": "A futuristic metropolis in rain", "modality": "video"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "cinematography" in data["enhanced_prompt"].lower()

def test_creation_history_and_isolation(auth_headers):
    res = client.get("/api/labs/creations", headers=auth_headers)
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 2
