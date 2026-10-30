import os
import sys
import logging

# Ensure backend root directory is in sys.path when script is executed directly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.db.session import engine, Base
from app.db.models import (
    User, Character, Project, SourceVideo, Generation,
    GenerationJob, GeneratedVideo, Credit, CreditTransaction,
    AIProvider, UsageLog
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully!")

if __name__ == "__main__":
    init_db()
