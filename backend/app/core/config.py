from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./prism.db"
    jwt_secret: str = "development-only-change-me"
    access_token_minutes: int = 30
    refresh_token_days: int = 7
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "prism-documents"
    cors_origins: str = ""

    @property
    def allowed_origins(self) -> list[str]:
        configured = [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        return configured


@lru_cache
def get_settings() -> Settings:
    return Settings()
