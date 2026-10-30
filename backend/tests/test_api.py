import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db
from app.routers.generations import process_generation_background

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_unauthorized_access(client):
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/characters").status_code == 401
    assert client.get("/api/projects").status_code == 401
    assert client.get("/api/generations").status_code == 401
    assert client.get("/api/credits/balance").status_code == 401

def test_user_registration_and_login(client):
    reg_payload = {
        "email": "creator@vyron.ai",
        "password": "Password123!",
        "full_name": "VYRON Creator"
    }
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 200, res.text
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "creator@vyron.ai"

    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res_me = client.get("/api/auth/me", headers=headers)
    assert res_me.status_code == 200
    assert res_me.json()["full_name"] == "VYRON Creator"

    res_login = client.post("/api/auth/login", json={"email": "creator@vyron.ai", "password": "Password123!"})
    assert res_login.status_code == 200
    assert "access_token" in res_login.json()

    res_credits = client.get("/api/credits/balance", headers=headers)
    assert res_credits.status_code == 200
    assert res_credits.json()["balance"] == 100

def test_character_crud_and_upload(client):
    reg = client.post("/api/auth/register", json={
        "email": "character_tester@vyron.ai",
        "password": "Password123!"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload character image file
    fake_image = io.BytesIO(b"fake image bytes content")
    res_upload = client.post(
        "/api/characters/upload",
        files={"file": ("test_avatar.png", fake_image, "image/png")},
        data={"name": "Uploaded Operator"},
        headers=headers
    )
    assert res_upload.status_code == 201, res_upload.text
    char_id = res_upload.json()["id"]
    assert res_upload.json()["name"] == "Uploaded Operator"
    assert "/static/uploads/characters/" in res_upload.json()["image_url"]

    # Rename character
    res_patch = client.patch(
        f"/api/characters/{char_id}",
        json={"name": "Renamed Ghost Operator"},
        headers=headers
    )
    assert res_patch.status_code == 200
    assert res_patch.json()["name"] == "Renamed Ghost Operator"

    # List characters
    res_list = client.get("/api/characters", headers=headers)
    assert res_list.status_code == 200
    assert len(res_list.json()) == 1

    # Delete character
    res_del = client.delete(f"/api/characters/{char_id}", headers=headers)
    assert res_del.status_code == 204

def test_project_and_source_video_upload(client):
    reg = client.post("/api/auth/register", json={
        "email": "director@vyron.ai",
        "password": "Password123!"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    proj_data = {
        "title": "PUBG Pochinki Heist",
        "description": "Action scene in Pochinki city",
        "generation_mode": "CHARACTER_REPLACEMENT",
        "prompt_instructions": "Place my character driving a black sports car in Pochinki sunset."
    }
    res_proj = client.post("/api/projects", json=proj_data, headers=headers)
    assert res_proj.status_code == 201
    proj_id = res_proj.json()["id"]

    # Upload reference video
    fake_video = io.BytesIO(b"fake video content mp4")
    res_video = client.post(
        f"/api/projects/{proj_id}/source-video/upload",
        files={"file": ("sample_action.mp4", fake_video, "video/mp4")},
        headers=headers
    )
    assert res_video.status_code == 200, res_video.text
    assert res_video.json()["project_id"] == proj_id
    assert "/static/uploads/videos/" in res_video.json()["video_url"]

    # Retrieve project
    res_get = client.get(f"/api/projects/{proj_id}", headers=headers)
    assert res_get.status_code == 200
    assert len(res_get.json()["source_videos"]) == 1

def test_generation_execution_and_credit_deduction(client, db_session):
    reg = client.post("/api/auth/register", json={
        "email": "producer@vyron.ai",
        "password": "Password123!"
    })
    user_id = reg.json()["user"]["id"]
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    proj = client.post("/api/projects", json={
        "title": "Erangel Assault",
        "generation_mode": "FULL_CGI_RECREATION"
    }, headers=headers).json()

    # Start generation with mock_engine
    gen_res = client.post("/api/generations", json={
        "project_id": proj["id"],
        "provider_name": "mock_engine"
    }, headers=headers)
    assert gen_res.status_code == 201
    gen_id = gen_res.json()["id"]

    # Check credits deducted
    res_credits = client.get("/api/credits/balance", headers=headers)
    assert res_credits.json()["balance"] == 90

    # Run background processing directly in test with test db session
    process_generation_background(gen_id, user_id, db=db_session)

    # Check completed generation status
    res_status = client.get(f"/api/generations/{gen_id}", headers=headers)
    assert res_status.status_code == 200
    assert res_status.json()["status"] == "COMPLETED"
    assert res_status.json()["progress_percentage"] == 100
    assert len(res_status.json()["generated_videos"]) == 1

def test_unconfigured_ai_provider_refunds_credits(client, db_session):
    reg = client.post("/api/auth/register", json={
        "email": "unconfig_tester@vyron.ai",
        "password": "Password123!"
    })
    user_id = reg.json()["user"]["id"]
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    proj = client.post("/api/projects", json={
        "title": "Kling AI Request",
        "generation_mode": "CHARACTER_REPLACEMENT"
    }, headers=headers).json()

    # Request unconfigured Kling AI provider
    gen_res = client.post("/api/generations", json={
        "project_id": proj["id"],
        "provider_name": "kling_ai"
    }, headers=headers)
    assert gen_res.status_code == 201
    gen_id = gen_res.json()["id"]

    # Balance temporary 90
    assert client.get("/api/credits/balance", headers=headers).json()["balance"] == 90

    # Run background processing where provider check fails
    process_generation_background(gen_id, user_id, db=db_session)

    # Check generation marked FAILED with explanation
    res_status = client.get(f"/api/generations/{gen_id}", headers=headers)
    assert res_status.status_code == 200
    assert res_status.json()["status"] == "FAILED"
    assert "not configured" in res_status.json()["error_message"]

    # Credits refunded back to 100!
    assert client.get("/api/credits/balance", headers=headers).json()["balance"] == 100

def test_user_resource_isolation(client):
    reg1 = client.post("/api/auth/register", json={"email": "userA@vyron.ai", "password": "Password123!"})
    tokenA = reg1.json()["access_token"]
    headersA = {"Authorization": f"Bearer {tokenA}"}

    reg2 = client.post("/api/auth/register", json={"email": "userB@vyron.ai", "password": "Password123!"})
    tokenB = reg2.json()["access_token"]
    headersB = {"Authorization": f"Bearer {tokenB}"}

    # User A creates character and project
    charA = client.post("/api/characters", json={"name": "Avatar A", "image_url": "http://img.com/a.png"}, headers=headersA).json()
    projA = client.post("/api/projects", json={"title": "Project A", "generation_mode": "ORIGINAL_CGI_CREATION"}, headers=headersA).json()

    # User B attempts to access User A's character and project
    assert client.get(f"/api/characters/{charA['id']}", headers=headersB).status_code == 404
    assert client.get(f"/api/projects/{projA['id']}", headers=headersB).status_code == 404
    assert client.delete(f"/api/projects/{projA['id']}", headers=headersB).status_code == 404
