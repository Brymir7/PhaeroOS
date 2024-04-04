from fastapi import APIRouter, FastAPI
from api.v1.endpoints import (
    chat,
    streak,
    avatar,
    diagrams_data,
    checklist,
    food,
    phaero_note,
    transcription,
    user_setup,
    settings,
    exercise,
    status,
    habits,
    general_goals,
    insights,
    memory,
)
from api.v1.auth import auth

app = FastAPI()
router = APIRouter()


router.include_router(streak.router, prefix="", tags=["streak"])
router.include_router(avatar.router, prefix="", tags=["avatar"])
router.include_router(diagrams_data.router, prefix="/diagrams", tags=["diagrams_data"])
router.include_router(checklist.router, prefix="", tags=["checklist"])
router.include_router(habits.router, prefix="", tags=["habits"])
router.include_router(food.router, prefix="", tags=["checklist"])
router.include_router(phaero_note.router, prefix="", tags=["phaero_note"])
router.include_router(transcription.router, prefix="", tags=["transcription"])
router.include_router(auth.router, prefix="/auth", tags=["auth"])
router.include_router(user_setup.router, prefix="", tags=["user_setup"])
router.include_router(settings.router, prefix="", tags=["settings"])
router.include_router(exercise.router, prefix="", tags=["exercise"])
router.include_router(status.router, prefix="", tags=["status"])
router.include_router(general_goals.router, prefix="", tags=["general_goals"])
router.include_router(insights.router, prefix="", tags=["insights"])
router.include_router(memory.router, prefix="", tags=["memory"])
router.include_router(chat.router, prefix="/chat", tags=["chat"])
