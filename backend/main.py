from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import crud
from middlewares.authentication_checker.middleware import AuthenticationChecker
from api.app import router as api_router
from core.config import create_settings
from db.database import SQLModel, engine, get_db_context_managed
from db.crud import (
    create_basic_exercises,
    create_basic_tags,
    create_embeddings_for_all_notes,
)
from starlette.middleware.base import BaseHTTPMiddleware
from interval_jobs import (
    note_ai_job,
    reset_general_daily_job,
)
from apscheduler.schedulers.background import BackgroundScheduler
from contextlib import asynccontextmanager
from db.tables.models import NoteData, NoteQueries
from sqlalchemy import Index
from ragatouille import RAGPretrainedModel

DAILY_JOB_INTERVAL = 60 * 60 * 24  # 24 hours in seconds
TEMPORARY_TEST_INTERVAL = 60 * 60 * 24  # 5 minutes in seconds
settings = create_settings()
from filelock import FileLock
import os

default_cache_path = os.path.join(
    os.path.expanduser("~"), ".cache", "huggingface", "transformers"
)
os.environ["TRANSFORMERS_CACHE"] = default_cache_path
RAGATOUILLE_INDICES_PATH = ".ragatouille/colbert/indexes/"


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)

    with get_db_context_managed() as db:
        create_basic_tags(db)
        create_basic_exercises(db)
        create_embeddings_for_all_notes(db)

    try:
        index = Index(
            "embedding_idx_note_data",
            NoteData.embedding,
            postgresql_using="hnsw",
            postgresql_with={"m": 16, "ef_construction": 64},
            postgresql_ops={"embedding": "vector_ip_ops"},
        )
        index.create(engine)
    except Exception as e:
        print(e)
        print("Index embedding_idx_note_data already exists, skipping...")
    try:
        index = Index(
            "embedding_idx_query_note_data",
            NoteQueries.query_embedding,
            postgresql_using="hnsw",
            postgresql_with={"m": 16, "ef_construction": 64},
            postgresql_ops={"embedding": "vector_ip_ops"},
        )
        index.create(engine)
    except Exception as e:
        print(e)
        print("Index embedding_idx_query_note_data already exists, skipping...")
    cache_dir = os.getenv("TRANSFORMERS_CACHE", "./models/")
    if not os.path.exists(cache_dir):
        os.makedirs(cache_dir)
    lock_path = os.path.join(cache_dir, "model.safetensors")
    RAG_PATH = os.path.join(RAGATOUILLE_INDICES_PATH, "Phaero_FAQ")
    if not os.path.exists(RAG_PATH):
        print("Execute python create_rag_faq.py before starting the server.")
    with FileLock(lock_path):
        RAG = RAGPretrainedModel.from_index(RAG_PATH)
        app.state.RAG = RAG
        app.state.RAG.search("test", k=1)  # warmup
    if settings.DEV_MODE:
        print("DEV MODE")
        yield

    scheduler = BackgroundScheduler()
    scheduler.add_job(reset_general_daily_job, "cron", minute=0)
    scheduler.add_job(note_ai_job, "cron", minute=0)
    scheduler.start()
    yield
    print("app stopped...")
    scheduler.shutdown(wait=False)


app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION, lifespan=lifespan)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:7000",
    "https://test.phaero.net",
    "https://app.phaero.net",
    "https://stripe.com",
    "https://checkout.stripe.com",
    "https://www.stripe.com",
    "https://api.stripe.com",
]
if settings.DEV_MODE:
    origins = ["*"]
    print(origins)
# Middleware: CORS
app.add_middleware(
    CORSMiddleware,
    # allow_origins=(settings.BACKEND_CORS_ORIGINS, origins),
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

# Add AuthenticationChecker middleware
middleware_auth = AuthenticationChecker()
app.add_middleware(BaseHTTPMiddleware, dispatch=middleware_auth)

# Add SubscriptionChecker middleware


# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)
