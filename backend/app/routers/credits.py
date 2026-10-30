from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, Credit, CreditTransaction
from app.schemas import CreditResponse, CreditTransactionResponse
from app.auth import get_current_user

router = APIRouter(prefix="/credits", tags=["Credits & Usage"])

@router.get("/balance", response_model=CreditResponse)
def get_credit_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    credit = db.query(Credit).filter(Credit.user_id == current_user.id).first()
    if not credit:
        credit = Credit(user_id=current_user.id, balance=100)
        db.add(credit)
        db.commit()
        db.refresh(credit)
    return credit

@router.get("/transactions", response_model=List[CreditTransactionResponse])
def list_credit_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return (
        db.query(CreditTransaction)
        .filter(CreditTransaction.user_id == current_user.id)
        .order_by(CreditTransaction.created_at.desc())
        .limit(50)
        .all()
    )
