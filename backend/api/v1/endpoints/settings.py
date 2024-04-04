from fastapi import APIRouter, Depends, Request, HTTPException
from schemas.types import AutoProcess, Language, Settings, Timezone
from db.database import get_db
from db.crud import get_user_goals, update_settings_user, get_user_by_name, get_settings
from sqlmodel import Session

router = APIRouter()


@router.post("/settings/")
def update_settings(
    request: Request, settings: Settings, db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = get_user_by_name(db, username).id
    print("settings:", settings)
    language = "english"
    if settings.language:
        language = settings.language
    try:
        update_settings_user(
            db=db,
            user_id=user_id,
            language=language,
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Could not update settings")


@router.get("/settings/")
def fetch_settings(request: Request, db: Session = Depends(get_db)):
    username = request.state.username
    user_id = get_user_by_name(db, username).id
    try:
        _settings = get_settings(db=db, user_id=user_id)
        filtered_settings = {
            "language": _settings.language,
            "timezone": _settings.timezone,
        }

        return filtered_settings
    except Exception:
        raise HTTPException(status_code=500, detail="Could not get settings")


@router.get("/settings/language/")
def fetch_settings_language(request: Request, db: Session = Depends(get_db)):
    username = request.state.username
    user_id = get_user_by_name(db, username).id
    try:
        return get_settings(db=db, user_id=user_id).language
    except Exception:
        raise HTTPException(status_code=500, detail="Could not get settings")


@router.post("/settings/language/")
def update_settings_language(
    request: Request, language: Language, db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = get_user_by_name(db, username).id
    try:
        update_settings_user(db=db, user_id=user_id, language=language.language)
    except Exception:
        raise HTTPException(status_code=500, detail="Could not update settings")


@router.post("/settings/timezone/")
def update_settings_timezone(
    request: Request, timezone: Timezone, db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = get_user_by_name(db, username).id
    try:
        update_settings_user(db=db, user_id=user_id, timezone=timezone.timezone)
    except Exception:
        raise HTTPException(status_code=500, detail="Could not update settings")


@router.post("/settings/auto_process/")
def update_settings_auto_processing(
    request: Request, auto_process: AutoProcess, db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = get_user_by_name(db, username).id
    try:
        update_settings_user(
            db=db, user_id=user_id, auto_process=auto_process.auto_process
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Could not update settings")


@router.get("/settings/auto_process/")
def get_settings_auto_process(request: Request, db: Session = Depends(get_db)):
    username = request.state.username
    user_id = get_user_by_name(db, username).id
    try:
        return get_settings(db=db, user_id=user_id).auto_process
    except Exception:
        raise HTTPException(status_code=500, detail="Could not get settings")


@router.get("/settings/goal/")
def fetch_settings_goals(request: Request, db: Session = Depends(get_db)):
    username = request.state.username
    user_id = get_user_by_name(db, username).id
    try:
        print(get_user_goals(db=db, user_id=user_id))
        return get_user_goals(db=db, user_id=user_id)
    except Exception:
        raise HTTPException(status_code=500, detail="Could not get settings")
