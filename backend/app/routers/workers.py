"""
VYRON AI — Worker & Task Queue Infrastructure Router
Endpoints for worker nodes to register, send heartbeats, claim queued jobs, and report progress.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import WorkerRecord, WorkerTask, JobStatus
from app.schemas import WorkerRecordSchema, WorkerTaskSchema, WorkerHeartbeat
from app.workers.worker_manager import worker_manager

router = APIRouter(prefix="/workers", tags=["Processing Workers & Workload Infrastructure"])


@router.get("", response_model=List[WorkerRecordSchema])
def list_workers(
    db: Session = Depends(get_db)
):
    return worker_manager.check_workers_health(db)


@router.post("/register", response_model=WorkerRecordSchema)
def register_worker(
    worker_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    worker_name = worker_data.get("worker_name")
    if not worker_name:
        raise HTTPException(status_code=400, detail="worker_name is required")

    return worker_manager.register_worker(
        db=db,
        worker_name=worker_name,
        worker_type=worker_data.get("worker_type", "cpu"),
        capabilities=worker_data.get("capabilities"),
        gpu_device_name=worker_data.get("gpu_device_name"),
        gpu_vram_total_mb=worker_data.get("gpu_vram_total_mb", 0),
        cpu_cores=worker_data.get("cpu_cores", 4),
        ram_total_mb=worker_data.get("ram_total_mb", 8192),
        endpoint_url=worker_data.get("endpoint_url")
    )


@router.post("/heartbeat", response_model=Optional[WorkerRecordSchema])
def record_heartbeat(
    heartbeat: WorkerHeartbeat,
    db: Session = Depends(get_db)
):
    worker = worker_manager.process_heartbeat(
        db=db,
        worker_name=heartbeat.worker_name,
        status=heartbeat.status,
        gpu_vram_used_mb=heartbeat.gpu_vram_used_mb,
        ram_used_mb=heartbeat.ram_used_mb,
        current_job_id=heartbeat.current_job_id
    )
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not registered.")
    return worker


@router.get("/tasks", response_model=List[WorkerTaskSchema])
def list_tasks(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(WorkerTask)
    if status:
        q = q.filter(WorkerTask.status == status)
    return q.order_by(WorkerTask.created_at.desc()).limit(50).all()


@router.post("/tasks/claim", response_model=Optional[WorkerTaskSchema])
def claim_task(
    worker_name: str = Query(...),
    db: Session = Depends(get_db)
):
    task = worker_manager.claim_next_task(db, worker_name)
    if not task:
        return None
    return task


@router.patch("/tasks/{task_id}", response_model=WorkerTaskSchema)
def update_task_progress(
    task_id: str,
    update_data: Dict[str, Any],
    db: Session = Depends(get_db)
):
    st = update_data.get("status", JobStatus.PROCESSING)
    task = worker_manager.update_task_progress(
        db=db,
        task_id=task_id,
        progress_percentage=update_data.get("progress_percentage", 0),
        status=st,
        output_payload=update_data.get("output_payload"),
        error_message=update_data.get("error_message")
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found.")
    return task
