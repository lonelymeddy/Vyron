"""
VYRON AI — Pipeline 1: Image Upload & Ingestion Service (Stage 1)
Validates file headers, formats, dimensions, sizes, and secures storage paths.
"""

import os
import uuid
from typing import Dict, Any, Tuple
from pathlib import Path
from PIL import Image

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15MB
MIN_DIMENSION = 128
MAX_DIMENSION = 8192

class ImageUploadService:
    def __init__(self, base_storage: str = "storage/characters"):
        self.base_storage = Path(base_storage)
        self.base_storage.mkdir(parents=True, exist_ok=True)

    def validate_and_save(
        self,
        file_bytes: bytes,
        original_filename: str,
        user_id: str,
        character_id: str
    ) -> Dict[str, Any]:
        """
        Validates image binary and saves to user/character storage using a generated UUID name.
        Never trusts user provided filenames or extensions.
        """
        if len(file_bytes) > MAX_FILE_SIZE:
            raise ValueError(f"Image file exceeds maximum allowed size of {MAX_FILE_SIZE // (1024*1024)}MB")

        if len(file_bytes) == 0:
            raise ValueError("Uploaded file is empty.")

        # Inspect format and dimensions with Pillow
        import io
        try:
            with Image.open(io.BytesIO(file_bytes)) as img:
                img.verify()
        except Exception as e:
            raise ValueError(f"Corrupted or invalid image data: {str(e)}")

        # Reopen after verify() to inspect properties
        with Image.open(io.BytesIO(file_bytes)) as img:
            format_name = (img.format or "").upper()
            width, height = img.size

        if format_name not in ["JPEG", "PNG", "WEBP"]:
            raise ValueError(f"Unsupported image format: {format_name}. Supported: JPEG, PNG, WEBP.")

        if width < MIN_DIMENSION or height < MIN_DIMENSION:
            raise ValueError(f"Image dimensions too small ({width}x{height}). Minimum is {MIN_DIMENSION}x{MIN_DIMENSION}.")

        if width > MAX_DIMENSION or height > MAX_DIMENSION:
            raise ValueError(f"Image dimensions too large ({width}x{height}). Maximum is {MAX_DIMENSION}x{MAX_DIMENSION}.")

        ext_map = {"JPEG": ".jpg", "PNG": ".png", "WEBP": ".webp"}
        safe_ext = ext_map.get(format_name, ".png")

        # Storage directory
        target_dir = self.base_storage / f"user_{user_id}" / f"character_{character_id}" / "references" / "original"
        target_dir.mkdir(parents=True, exist_ok=True)

        file_id = str(uuid.uuid4())
        dest_filename = f"{file_id}{safe_ext}"
        dest_path = target_dir / dest_filename

        with open(dest_path, "wb") as f:
            f.write(file_bytes)

        return {
            "file_id": file_id,
            "original_filename": original_filename,
            "storage_path": str(dest_path),
            "file_size": len(file_bytes),
            "width": width,
            "height": height,
            "format": format_name.lower(),
        }

upload_service = ImageUploadService()
