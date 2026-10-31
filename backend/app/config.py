from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    database_url: str = "sqlite:///./rescuelens.db"
    secret_key: str = "dev-only-change-me"
    access_token_minutes: int = 480
    cors_origins: str = "http://localhost:5173"
    ai_provider: str = "huggingface"
    huggingface_api_key: str = ""
    huggingface_base_url: str = "https://api-inference.huggingface.co"
    hf_text_model: str = "mistralai/Mistral-7B-Instruct-v0.3"
    hf_embedding_model: str = "ibm-granite/granite-embedding-97m-multilingual-r2"
    hf_image_model: str = "moondream/moondream-2b-2025-04-14-4bit"
    hf_request_timeout: int = 30
    upload_dir: str = "uploads"
    max_image_mb: int = 8
    max_video_mb: int = 50
    seed_admin_email: str = "admin@rescuelens.dev"
    seed_admin_password: str = "ChangeMe123!"
    seed_operator_email: str = "operator@rescuelens.dev"
    seed_operator_password: str = "ChangeMe123!"


settings = Settings()
