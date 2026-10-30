import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, Character
from app.schemas import CharacterCreate, CharacterUpdate, CharacterResponse
from app.auth import get_current_user

router = APIRouter(prefix="/characters", tags=["Character Library"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB

@router.get("", response_model=List[CharacterResponse])
def list_characters(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Character).filter(Character.user_id == current_user.id).order_by(Character.created_at.desc()).all()

@router.post("", response_model=CharacterResponse, status_code=status.HTTP_201_CREATED)
def create_character(
    character_in: CharacterCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    character = Character(
        user_id=current_user.id,
        name=character_in.name,
        description=character_in.description,
        image_url=character_in.image_url,
        storage_path=character_in.storage_path,
        file_size=character_in.file_size,
        mime_type=character_in.mime_type
    )
    db.add(character)
    db.commit()
    db.refresh(character)
    return character

@router.post("/upload", response_model=CharacterResponse, status_code=status.HTTP_201_CREATED)
async def upload_character_image(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if file.content_type and file.content_type not in ALLOWED_IMAGE_TYPES:
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
            raise HTTPException(status_code=400, detail="Invalid image file format. Supported formats: JPG, PNG, WEBP.")

    contents = await file.read()
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Image file exceeds maximum allowed size of 10MB.")

    upload_dir = os.path.join("static", "uploads", "characters")
    os.makedirs(upload_dir, exist_ok=True)

    ext = os.path.splitext(file.filename or "")[1] or ".png"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(upload_dir, filename)

    with open(filepath, "wb") as f:
        f.write(contents)

    image_url = f"/static/uploads/characters/{filename}"
    char_name = name or (file.filename.rsplit(".", 1)[0] if file.filename else "Custom Avatar")

    character = Character(
        user_id=current_user.id,
        name=char_name,
        image_url=image_url,
        storage_path=filepath,
        file_size=len(contents),
        mime_type=file.content_type or "image/png"
    )
    db.add(character)
    db.commit()
    db.refresh(character)
    return character

@router.get("/{character_id}", response_model=CharacterResponse)
def get_character(
    character_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    character = db.query(Character).filter(
        Character.id == character_id,
        Character.user_id == current_user.id
    ).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    return character

@router.patch("/{character_id}", response_model=CharacterResponse)
def update_character(
    character_id: str,
    character_in: CharacterUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    character = db.query(Character).filter(
        Character.id == character_id,
        Character.user_id == current_user.id
    ).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    if character_in.name is not None:
        character.name = character_in.name
    if character_in.description is not None:
        character.description = character_in.description

    db.commit()
    db.refresh(character)
    return character

@router.delete("/{character_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_character(
    character_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    character = db.query(Character).filter(
        Character.id == character_id,
        Character.user_id == current_user.id
    ).first()
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")

    db.delete(character)
    db.commit()
    return None
