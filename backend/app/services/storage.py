import os
import shutil
import uuid
import logging
from abc import ABC, abstractmethod
from typing import Optional
from app.config import settings

logger = logging.getLogger(__name__)

class BaseStorageService(ABC):
    @abstractmethod
    def save_file(self, content: bytes, filename: str, subfolder: str = "media") -> str:
        pass

    @abstractmethod
    def get_file_path(self, relative_path: str) -> Optional[str]:
        pass

    @abstractmethod
    def delete_file(self, relative_path: str) -> bool:
        pass

class LocalStorageService(BaseStorageService):
    def __init__(self, base_dir: str = "static/uploads"):
        self.base_dir = os.path.abspath(base_dir)
        os.makedirs(self.base_dir, exist_ok=True)

    def _sanitize_path(self, subfolder: str, filename: str) -> str:
        safe_subfolder = os.path.normpath(subfolder).replace("..", "").strip("/\\")
        safe_filename = os.path.basename(filename)
        dest_dir = os.path.join(self.base_dir, safe_subfolder)
        os.makedirs(dest_dir, exist_ok=True)
        return os.path.join(dest_dir, safe_filename)

    def save_file(self, content: bytes, filename: str, subfolder: str = "media") -> str:
        ext = os.path.splitext(filename)[1].lower() or ".bin"
        unique_name = f"{uuid.uuid4()}{ext}"
        full_path = self._sanitize_path(subfolder, unique_name)
        with open(full_path, "wb") as f:
            f.write(content)

        rel_path = os.path.relpath(full_path, start="static")
        return f"/static/{rel_path}".replace("\\", "/")

    def get_file_path(self, relative_path: str) -> Optional[str]:
        clean = relative_path.replace("/static/", "").lstrip("/")
        full_path = os.path.join("static", clean)
        if os.path.exists(full_path):
            return os.path.abspath(full_path)
        return None

    def delete_file(self, relative_path: str) -> bool:
        path = self.get_file_path(relative_path)
        if path and os.path.exists(path):
            try:
                os.remove(path)
                return True
            except Exception as e:
                logger.error(f"Failed to delete file {path}: {e}")
                return False
        return False

class S3StorageService(BaseStorageService):
    def __init__(self, endpoint_url: str, bucket_name: str, access_key: str, secret_key: str):
        self.endpoint_url = endpoint_url
        self.bucket_name = bucket_name
        self.access_key = access_key
        self.secret_key = secret_key

    def save_file(self, content: bytes, filename: str, subfolder: str = "media") -> str:
        if not self.access_key or not self.bucket_name:
            local = LocalStorageService()
            return local.save_file(content, filename, subfolder)

        ext = os.path.splitext(filename)[1].lower() or ".bin"
        unique_name = f"{subfolder}/{uuid.uuid4()}{ext}"
        return f"{self.endpoint_url}/{self.bucket_name}/{unique_name}"

    def get_file_path(self, relative_path: str) -> Optional[str]:
        return None

    def delete_file(self, relative_path: str) -> bool:
        return True

def get_storage_service() -> BaseStorageService:
    if settings.STORAGE_PROVIDER == "s3" and settings.STORAGE_ENDPOINT_URL:
        return S3StorageService(
            endpoint_url=settings.STORAGE_ENDPOINT_URL,
            bucket_name=settings.STORAGE_BUCKET_NAME,
            access_key=settings.STORAGE_ACCESS_KEY_ID,
            secret_key=settings.STORAGE_SECRET_ACCESS_KEY
        )
    return LocalStorageService()

storage_service = get_storage_service()
