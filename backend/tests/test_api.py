import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base, get_db

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

    res_credits = client.get("/api/credits/balance", headers=headers)
    assert res_credits.status_code == 200
    assert res_credits.json()["balance"] == 100

def test_character_crud(client):
    reg = client.post("/api/auth/register", json={
        "email": "character_tester@vyron.ai",
        "password": "Password123!"
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    char_data = {
        "name": "Ghost Sniper",
        "description": "Tactical ghost character with camo outfit",
        "image_url": "https://assets.vyron.ai/characters/ghost_sniper.jpg"
    }
    res_create = client.post("/api/characters", json=char_data, headers=headers)
    assert res_create.status_code == 201
    char_id = res_create.json()["id"]
    assert res_create.json()["name"] == "Ghost Sniper"

    res_list = client.get("/api/characters", headers=headers)
    assert res_list.status_code == 200
    assert len(res_list.json()) == 1

    res_get = client.get(f"/api/characters/{char_id}", headers=headers)
    assert res_get.status_code == 200
    assert res_get.json()["id"] == char_id

    res_del = client.delete(f"/api/characters/{char_id}", headers=headers)
    assert res_del.status_code == 204

def test_project_and_generation_flow(client):
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

    gen_data = {
        "project_id": proj_id,
        "provider_name": "mock_engine"
    }
    res_gen = client.post("/api/generations", json=gen_data, headers=headers)
    assert res_gen.status_code == 201
    gen_id = res_gen.json()["id"]

    res_status = client.get(f"/api/generations/{gen_id}", headers=headers)
    assert res_status.status_code == 200
    assert res_status.json()["status"] in ["QUEUED", "PROCESSING"]

    res_credits = client.get("/api/credits/balance", headers=headers)
    assert res_credits.json()["balance"] == 90
