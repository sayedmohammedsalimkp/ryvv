from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_ENV: str = "development"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:3000"

    SUPABASE_URL: str = "https://placeholder.supabase.co"

    # New dashboard names
    SUPABASE_PUBLISHABLE_KEY: str = ""
    SUPABASE_SECRET_KEY: str = ""

    # Legacy names (still work)
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""

    # Telegram bot
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_WEBHOOK_SECRET: str = ""
    TELEGRAM_MODE: str = "webhook"  # webhook | polling | off
    TELEGRAM_BOT_USERNAME: str = ""

    # Groq (GPT-OSS + Whisper)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-20b"
    GROQ_WHISPER_MODEL: str = "whisper-large-v3-turbo"

    # Observability (optional — leave blank to disable)
    SENTRY_DSN: str = ""
    SENTRY_RELEASE: str = ""

    @property
    def is_production(self) -> bool:
        return (self.APP_ENV or "").lower() in {"production", "prod"}

    @model_validator(mode="after")
    def resolve_keys(self):
        # Render/dashboard pastes often add trailing spaces/newlines → 401 from Supabase
        self.SUPABASE_URL = (self.SUPABASE_URL or "").strip().rstrip("/")
        self.SUPABASE_PUBLISHABLE_KEY = (self.SUPABASE_PUBLISHABLE_KEY or "").strip()
        self.SUPABASE_SECRET_KEY = (self.SUPABASE_SECRET_KEY or "").strip()
        self.SUPABASE_KEY = (self.SUPABASE_KEY or "").strip()
        self.SUPABASE_SERVICE_ROLE_KEY = (self.SUPABASE_SERVICE_ROLE_KEY or "").strip()
        self.TELEGRAM_BOT_TOKEN = (self.TELEGRAM_BOT_TOKEN or "").strip()
        self.TELEGRAM_WEBHOOK_SECRET = (self.TELEGRAM_WEBHOOK_SECRET or "").strip()

        if not self.SUPABASE_KEY:
            self.SUPABASE_KEY = self.SUPABASE_PUBLISHABLE_KEY or "placeholder"
        if not self.SUPABASE_SERVICE_ROLE_KEY:
            self.SUPABASE_SERVICE_ROLE_KEY = self.SUPABASE_SECRET_KEY or "placeholder"
        if self.SUPABASE_KEY == "placeholder" and self.SUPABASE_PUBLISHABLE_KEY:
            self.SUPABASE_KEY = self.SUPABASE_PUBLISHABLE_KEY
        if (
            self.SUPABASE_SERVICE_ROLE_KEY == "placeholder"
            and self.SUPABASE_SECRET_KEY
        ):
            self.SUPABASE_SERVICE_ROLE_KEY = self.SUPABASE_SECRET_KEY
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
