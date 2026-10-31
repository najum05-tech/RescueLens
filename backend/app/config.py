from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str = "sqlite:///./rescuelens.db"
    secret_key: str = "dev-only-change-me"
    access_token_minutes: int = 480
    cors_origins: str = "http://localhost:5173"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    upload_dir: str = "uploads"
    max_image_mb: int = 8
    max_video_mb: int = 50
    seed_admin_email: str = "admin@rescuelens.dev"
    seed_admin_password: str = "ChangeMe123!"
    seed_operator_email: str = "operator@rescuelens.dev"
    seed_operator_password: str = "ChangeMe123!"


settings = Settings()
