import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.db.models import WorkerRecord, WorkerTask

client = TestClient(app)

def test_worker_registration_and_list():
    res = client.post("/api/workers/register", json={
        "worker_name": "gpu_node_alpha",
        "worker_type": "gpu",
        "capabilities": ["reconstruction", "rendering"],
        "gpu_device_name": "NVIDIA RTX 4090",
        "gpu_vram_total_mb": 24576,
        "cpu_cores": 16,
        "ram_total_mb": 32768
    })
    assert res.status_code == 200
    worker = res.json()
    assert worker["worker_name"] == "gpu_node_alpha"
    assert worker["worker_type"] == "gpu"
    assert worker["status"] == "ONLINE"

    list_res = client.get("/api/workers")
    assert list_res.status_code == 200
    workers = list_res.json()
    names = [w["worker_name"] for w in workers]
    assert "gpu_node_alpha" in names

def test_worker_heartbeat():
    res = client.post("/api/workers/heartbeat", json={
        "worker_name": "gpu_node_alpha",
        "status": "BUSY",
        "gpu_vram_used_mb": 12000,
        "ram_used_mb": 8000
    })
    assert res.status_code == 200
    worker = res.json()
    assert worker["status"] == "BUSY"
    assert worker["gpu_vram_used_mb"] == 12000

def test_task_queue_and_progress_lifecycle():
    from app.workers.worker_manager import worker_manager

    db = SessionLocal()
    try:
        # Re-register vyron_local_core as ONLINE
        worker_manager.register_worker(db, "vyron_local_core", worker_type="cpu")

        # Enqueue a task
        task = worker_manager.enqueue_task(
            db=db,
            task_type="character_3d_generation",
            entity_id="test_gen_999",
            input_payload={"mode": "SINGLE_IMAGE"},
            priority=8
        )
        task_id = task.id
    finally:
        db.close()

    res = client.get("/api/workers/tasks?status=QUEUED")
    assert res.status_code == 200
    tasks = res.json()
    assert any(t["id"] == task_id for t in tasks)

    # Claim task with local worker
    claim_res = client.post("/api/workers/tasks/claim?worker_name=vyron_local_core")
    assert claim_res.status_code == 200
    claimed = claim_res.json()
    assert claimed is not None

    # Update progress
    prog_res = client.patch(f"/api/workers/tasks/{claimed['id']}", json={
        "progress_percentage": 50,
        "status": "PROCESSING"
    })
    assert prog_res.status_code == 200
    assert prog_res.json()["progress_percentage"] == 50

    # Complete task
    done_res = client.patch(f"/api/workers/tasks/{claimed['id']}", json={
        "progress_percentage": 100,
        "status": "COMPLETED",
        "output_payload": {"model_url": "/static/uploads/models/test.glb"}
    })
    assert done_res.status_code == 200
    assert done_res.json()["status"] == "COMPLETED"
