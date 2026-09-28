import hashlib
import io
import uuid

from minio import Minio

from app.core.config import get_settings


class ObjectStorage:
    def __init__(self):
        settings = get_settings()
        self.bucket = settings.minio_bucket
        self.client = Minio(settings.minio_endpoint, access_key=settings.minio_access_key, secret_key=settings.minio_secret_key, secure=False)

    def _ensure_bucket(self) -> None:
        if not self.client.bucket_exists(self.bucket):
            self.client.make_bucket(self.bucket)

    def put(self, data: bytes, content_type: str) -> tuple[str, str]:
        self._ensure_bucket()
        key = f"documents/{uuid.uuid4()}"
        self.client.put_object(self.bucket, key, io.BytesIO(data), len(data), content_type=content_type)
        return key, hashlib.sha256(data).hexdigest()

    def get(self, key: str) -> bytes:
        response = self.client.get_object(self.bucket, key)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()


storage = ObjectStorage()
