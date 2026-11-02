"""
VYRON AI — AI Model Registry & Infrastructure Router
Endpoints for querying verified models, verifying weights, and checking hardware compatibility.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import ModelRecord
from app.schemas import ModelRecordSchema
from app.ai_engine.model_manager import ai_model_manager

router = APIRouter(prefix="/models", tags=["AI Model Infrastructure"])


@router.get("", response_model=List[ModelRecordSchema])
def list_models(
    category: Optional[str] = Query(None, description="Filter by model category"),
    db: Session = Depends(get_db)
):
    return ai_model_manager.list_models(db, category)


@router.get("/hardware", response_model=Dict[str, Any])
def get_hardware_status():
    return ai_model_manager.get_hardware_status()


@router.get("/{model_id}", response_model=ModelRecordSchema)
def get_model(
    model_id: str,
    db: Session = Depends(get_db)
):
    model = ai_model_manager.get_model(db, model_id)
    if not model:
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found.")
    return model


@router.post("/{model_id}/verify", response_model=Dict[str, Any])
def verify_model_weights(
    model_id: str,
    db: Session = Depends(get_db)
):
    res = ai_model_manager.verify_model_weights(db, model_id)
    if not res.get("verified"):
        raise HTTPException(status_code=400, detail=res)
    return res


@router.get("/{model_id}/compatibility", response_model=Dict[str, Any])
def check_model_compatibility(
    model_id: str,
    db: Session = Depends(get_db)
):
    return ai_model_manager.check_hardware_compatibility(db, model_id)
