"""
VYRON AI — Background Worker for Character 3D Generation
Executes asynchronous generation jobs in isolated worker threads.
"""

import threading
import logging
from app.db.session import SessionLocal
from app.character_engine.orchestrator import character_engine_orchestrator

logger = logging.getLogger(__name__)

def run_character_generation_job(generation_id: str):
    """Worker job function to run character generation in background."""
    def worker_thread():
        db = SessionLocal()
        try:
            logger.info(f"Worker starting character generation job: {generation_id}")
            character_engine_orchestrator.execute_generation(generation_id, db)
            logger.info(f"Worker finished character generation job: {generation_id}")
        except Exception as e:
            logger.error(f"Worker error processing generation {generation_id}: {e}")
        finally:
            db.close()

    thread = threading.Thread(target=worker_thread, daemon=True)
    thread.start()
    return thread
