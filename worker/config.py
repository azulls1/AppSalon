from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/1"

    supabase_url: str
    supabase_service_role_key: str

    smtp_host: str
    smtp_port: int = 2525
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from_email: str = "cuentas@appsalon.com"
    smtp_from_name: str = "AppSalon"

    # Twilio para SMS (opcional — si vacío, modo log)
    twilio_account_sid: str | None = None
    twilio_auth_token:  str | None = None
    twilio_from_number: str | None = None

    app_base_url: str = "http://localhost:4200"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
