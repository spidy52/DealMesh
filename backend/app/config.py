from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
from pathlib import Path
import os

# Resolve project root and .env path dynamically
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = ROOT_DIR / ".env"

class Settings(BaseSettings):
    PROJECT_NAME: str = "DealMesh"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "dealmesh_secure_hmac_secret_2026_super_key_jwt_token_dealmesh"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./dealmesh.db"
    
    # OpenRouter LLM Free Models (Configured via .env)
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "nvidia/nemotron-3.5-lightning:free"
    OPENROUTER_FALLBACK_MODEL: str = "google/gemma-4-26b-a4b-it:free"
    
    # Razorpay Credentials (Configured via .env)
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""
    
    # DMCP Protocol Settings
    DMCP_VERSION: str = "1.0.0"
    DMCP_TOKEN_TTL_SECONDS: int = 900
    DMCP_DEFAULT_TIMEOUT_MS: int = 5000
    DMCP_TOKEN_SALT: str = "dealmesh_dmcp_salt_token_2026"
    
    # Live Web Search & Scraping (Firecrawl) (Configured via .env)
    FIRECRAWL_API_KEY: str = ""
    SEARCH_PROVIDER: str = "firecrawl"
    
    model_config = SettingsConfigDict(
        env_file=(str(ENV_PATH), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True
    )

settings = Settings()

