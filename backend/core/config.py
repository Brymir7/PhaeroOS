import os
from dotenv import load_dotenv, find_dotenv
from pydantic import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Phaero"
    VERSION: str = "0.1"
    BACKEND_CORS_ORIGINS = "http://127.0.0.1:5173/"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "mysecretkey")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "docker")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "phaerodb")
    POSTGRES_CONTAINER: str = os.getenv("POSTGRES_CONTAINER", "phaeroDB")
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "id")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "secret")
    TRANSCRIPTION_API_URL: str = os.getenv(
        "TRANSCRIPTION_API_URL", "ERROR no transcription url"
    )
    DEV_TRANSCRIPTION_API_URL: str = os.getenv(
        "DEV_TRANSCRIPTION_API_URL", "ERROR no dev transcription URL"
    )
    DEV_MODE: bool = os.getenv("DEV_MODE", False)
    OPENAI_KEY: str = os.getenv("OPENAI_KEY", "key")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "docker")
    POSTGRES_URL: str = os.getenv(
        "POSTGRES_URL",
        f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_CONTAINER}:5432/{POSTGRES_DB}",
    )
    DB_ECHO_LOG: bool = os.getenv("DB_ECHO_LOG", False)
    SUBSCRIPTION_WHITELIST: str = os.getenv("SUBSCRIPTION_WHITELIST", "")
    OWN_TRANSCRIPTION_SERVER_URL: str = os.getenv("OWN_TRANSCRIPTION_SERVER_URL", "")
    timeTravelAmount: int = os.getenv("timeTravelAmount", 0)
    ASSEMBLYAI_API_KEY: str = os.getenv("ASSEMBLYAI_API_KEY", "ERROR no assemblyai key")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "ERROR no groq key")

def create_settings():
    load_dotenv(find_dotenv())
    settings = Settings()
    return settings


# Load variables from .env file


# Instantiate settings
