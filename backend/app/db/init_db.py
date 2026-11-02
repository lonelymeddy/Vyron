import os
import sys
import logging

# Ensure backend root directory is in sys.path when script is executed directly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.db.session import engine, Base
from app.db.models import (
    User, Character, Project, SourceVideo, Generation,
    GenerationJob, GeneratedVideo, Credit, CreditTransaction,
    AIProvider, UsageLog, ShotAdjustment, ShotRenderVersion,
    QualityControlReport, ExportJob, CharacterReferenceImage,
    CharacterGeneration, PipelineExecution, CharacterAsset,
    CharacterRig, CharacterVariant, CharacterQualityReport
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    # Perform lightweight schema migration for existing SQLite database if columns are missing
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            # Check characters table columns
            if engine.url.get_backend_name() == "sqlite":
                res = conn.execute(text("PRAGMA table_info(characters)"))
                existing_cols = [row[1] for row in res.fetchall()]
                if "active_generation_id" not in existing_cols:
                    conn.execute(text("ALTER TABLE characters ADD COLUMN active_generation_id VARCHAR"))
                if "model_asset_url" not in existing_cols:
                    conn.execute(text("ALTER TABLE characters ADD COLUMN model_asset_url VARCHAR"))
                if "rig_status" not in existing_cols:
                    conn.execute(text("ALTER TABLE characters ADD COLUMN rig_status VARCHAR DEFAULT 'UNRIGGED'"))
                if "animation_ready" not in existing_cols:
                    conn.execute(text("ALTER TABLE characters ADD COLUMN animation_ready BOOLEAN DEFAULT 0"))
                conn.commit()
    except Exception as e:
        logger.warning(f"Column migration check note: {e}")

    logger.info("Database tables initialized successfully!")

if __name__ == "__main__":
    init_db()
