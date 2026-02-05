from typing import Optional
from google.cloud import storage
from loguru import logger
from app.core.config import settings


class GCPStorageClient:
    def __init__(self):
        self.client = None
        self.bucket_name = settings.GCP_STORAGE_BUCKET

    def get_client(self):
        if not self.client:
            try:
                self.client = storage.Client(project=settings.GOOGLE_CLOUD_PROJECT)
                logger.info("GCP Storage client initialized")
            except Exception as e:
                logger.error(f"Failed to initialize GCP Storage client: {e}")
        return self.client

    async def upload_file(
        self,
        source_file_path: str,
        destination_blob_name: str,
        content_type: Optional[str] = None,
    ) -> Optional[str]:
        try:
            client = self.get_client()
            bucket = client.bucket(self.bucket_name)
            blob = bucket.blob(destination_blob_name)

            blob.upload_from_filename(source_file_path, content_type=content_type)

            logger.info(f"Uploaded {source_file_path} to {destination_blob_name}")
            return f"gs://{self.bucket_name}/{destination_blob_name}"
        except Exception as e:
            logger.error(f"Failed to upload file: {e}")
            return None

    async def upload_bytes(
        self,
        data: bytes,
        destination_blob_name: str,
        content_type: Optional[str] = None,
    ) -> Optional[str]:
        try:
            client = self.get_client()
            bucket = client.bucket(self.bucket_name)
            blob = bucket.blob(destination_blob_name)

            blob.upload_from_string(data, content_type=content_type)

            logger.info(f"Uploaded bytes to {destination_blob_name}")
            return f"gs://{self.bucket_name}/{destination_blob_name}"
        except Exception as e:
            logger.error(f"Failed to upload bytes: {e}")
            return None

    async def download_file(
        self, source_blob_name: str, destination_file_path: str
    ) -> bool:
        try:
            client = self.get_client()
            bucket = client.bucket(self.bucket_name)
            blob = bucket.blob(source_blob_name)

            blob.download_to_filename(destination_file_path)

            logger.info(f"Downloaded {source_blob_name} to {destination_file_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to download file: {e}")
            return False

    async def get_signed_url(
        self, source_blob_name: str, expiration_minutes: int = 60
    ) -> Optional[str]:
        try:
            from google.cloud import storage

            client = self.get_client()
            bucket = client.bucket(self.bucket_name)
            blob = bucket.blob(source_blob_name)

            url = blob.generate_signed_url(
                version="v4", expiration_minutes=expiration_minutes, method="GET"
            )

            return url
        except Exception as e:
            logger.error(f"Failed to generate signed URL: {e}")
            return None

    async def delete_file(self, blob_name: str) -> bool:
        try:
            client = self.get_client()
            bucket = client.bucket(self.bucket_name)
            blob = bucket.blob(blob_name)

            blob.delete()

            logger.info(f"Deleted {blob_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete file: {e}")
            return False

    async def list_files(self, prefix: Optional[str] = None) -> list:
        try:
            client = self.get_client()
            bucket = client.bucket(self.bucket_name)
            blobs = bucket.list_blobs(prefix=prefix)

            return [blob.name for blob in blobs]
        except Exception as e:
            logger.error(f"Failed to list files: {e}")
            return []


gcp_storage = GCPStorageClient()
