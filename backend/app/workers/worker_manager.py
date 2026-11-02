"""
VYRON AI — Background Worker & Job Queue Infrastructure Manager
Manages worker node registration, heartbeat tracking, priority queuing,
task state dispatching, progress tracking, and failure recovery.
"""

import os
import uuid
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.db.models import WorkerRecord, WorkerTask, JobStatus

logger = logging.getLogger(__name__)


class WorkerManager:
    def register_worker(
        self,
        db: Session,
        worker_name: str,
        worker_type: str = "cpu",
        capabilities: Optional[List[str]] = None,
        gpu_device_name: Optional[str] = None,
        gpu_vram_total_mb: int = 0,
        cpu_cores: int = 4,
        ram_total_mb: int = 8192,
        endpoint_url: Optional[str] = None
    ) -> WorkerRecord:
        worker = db.query(WorkerRecord).filter(WorkerRecord.worker_name == worker_name).first()
        if not worker:
            worker = WorkerRecord(
                worker_name=worker_name,
                worker_type=worker_type,
                status="ONLINE",
                capabilities=capabilities or ["reconstruction", "rendering"],
                gpu_device_name=gpu_device_name,
                gpu_vram_total_mb=gpu_vram_total_mb,
                cpu_cores=cpu_cores,
                ram_total_mb=ram_total_mb,
                endpoint_url=endpoint_url,
                last_heartbeat=datetime.utcnow()
            )
            db.add(worker)
        else:
            worker.status = "ONLINE"
            worker.worker_type = worker_type
            if capabilities:
                worker.capabilities = capabilities
            if gpu_device_name:
                worker.gpu_device_name = gpu_device_name
            if gpu_vram_total_mb:
                worker.gpu_vram_total_mb = gpu_vram_total_mb
            worker.cpu_cores = cpu_cores
            worker.ram_total_mb = ram_total_mb
            if endpoint_url:
                worker.endpoint_url = endpoint_url
            worker.last_heartbeat = datetime.utcnow()

        db.commit()
        db.refresh(worker)
        return worker

    def process_heartbeat(
        self,
        db: Session,
        worker_name: str,
        status: str = "ONLINE",
        gpu_vram_used_mb: Optional[int] = None,
        ram_used_mb: Optional[int] = None,
        current_job_id: Optional[str] = None
    ) -> Optional[WorkerRecord]:
        worker = db.query(WorkerRecord).filter(WorkerRecord.worker_name == worker_name).first()
        if not worker:
            return None

        worker.status = status
        worker.last_heartbeat = datetime.utcnow()
        if gpu_vram_used_mb is not None:
            worker.gpu_vram_used_mb = gpu_vram_used_mb
        if ram_used_mb is not None:
            worker.ram_used_mb = ram_used_mb
        worker.current_job_id = current_job_id

        db.commit()
        db.refresh(worker)
        return worker

    def check_workers_health(self, db: Session, timeout_seconds: int = 120) -> List[WorkerRecord]:
        threshold = datetime.utcnow() - timedelta(seconds=timeout_seconds)
        stale_workers = db.query(WorkerRecord).filter(
            WorkerRecord.status != "OFFLINE",
            WorkerRecord.last_heartbeat < threshold
        ).all()

        for w in stale_workers:
            w.status = "OFFLINE"
        if stale_workers:
            db.commit()

        return db.query(WorkerRecord).all()

    def enqueue_task(
        self,
        db: Session,
        task_type: str,
        entity_id: str,
        input_payload: Optional[Dict[str, Any]] = None,
        priority: int = 5
    ) -> WorkerTask:
        task = WorkerTask(
            task_type=task_type,
            entity_id=entity_id,
            status=JobStatus.QUEUED,
            priority=priority,
            progress_percentage=0,
            input_payload=input_payload or {},
            created_at=datetime.utcnow()
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    def claim_next_task(self, db: Session, worker_name: str) -> Optional[WorkerTask]:
        worker = db.query(WorkerRecord).filter(WorkerRecord.worker_name == worker_name).first()
        if not worker or worker.status != "ONLINE":
            return None

        task = db.query(WorkerTask).filter(
            WorkerTask.status == JobStatus.QUEUED
        ).order_by(WorkerTask.priority.desc(), WorkerTask.created_at.asc()).first()

        if task:
            task.worker_id = worker.id
            task.status = JobStatus.PROCESSING
            task.started_at = datetime.utcnow()
            worker.current_job_id = task.id
            db.commit()
            db.refresh(task)

        return task

    def update_task_progress(
        self,
        db: Session,
        task_id: str,
        progress_percentage: int,
        status: JobStatus = JobStatus.PROCESSING,
        output_payload: Optional[Dict[str, Any]] = None,
        error_message: Optional[str] = None
    ) -> Optional[WorkerTask]:
        task = db.query(WorkerTask).filter(WorkerTask.id == task_id).first()
        if not task:
            return None

        task.progress_percentage = progress_percentage
        task.status = status
        if output_payload:
            task.output_payload = output_payload
        if error_message:
            task.error_message = error_message

        if status in (JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED):
            task.completed_at = datetime.utcnow()
            if task.worker_id:
                worker = db.query(WorkerRecord).filter(WorkerRecord.id == task.worker_id).first()
                if worker and worker.current_job_id == task.id:
                    worker.current_job_id = None

        db.commit()
        db.refresh(task)
        return task


worker_manager = WorkerManager()
