from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Request, HTTPException
from schemas.types import GoalText, SetupData
from db.database import get_db
from db.crud import (
    change_additional_user_data,
    create_goal_user,
    get_user_by_name,
    get_additional_user_data,
    create_initial_weight_entry,
    update_goal_user,
    update_phaero_note,
)
from sqlmodel import Session
from .utils import create_phaero_default_note, serialize_datetime
from core.config import create_settings

settings = create_settings()
timeTravelAmount = settings.timeTravelAmount
router = APIRouter()


@router.post("/setup_user/")
def update_user_setup(
    request: Request, setup_data: SetupData, db: Session = Depends(get_db)
):
    print(setup_data)
    username = request.state.username
    user_id = get_user_by_name(db, username).id
    try:
        change_additional_user_data(
            db=db, user_id=user_id, additional_user_data=setup_data
        )
        create_initial_weight_entry(
            db=db, user_id=user_id, amount=float(setup_data.weight)
        )
        phaero_default_note = create_phaero_default_note(db=db, user_id=user_id)
        update_phaero_note(
            db,
            user_id=user_id,
            data_json=serialize_datetime(phaero_default_note),
            recorded_at=(datetime.utcnow() + timedelta(days=timeTravelAmount)).date(),
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Could not setup user data")


@router.post("/setup_user/goal/")
def create_user_goal(request: Request, goal: GoalText, db: Session = Depends(get_db)):
    username = request.state.username
    user_id = get_user_by_name(db, username).id

    goal_type = ""
    if (
        goal.goal_text == "cutting"
        or goal.goal_text == "bulking"
        or goal.goal_text == "maintenance"
    ):
        goal_type = "weight"

    goal_data = {
        "goal": goal.goal_text,
        "goal_type": goal_type,
        "goal_start": datetime.utcnow().date(),
        "goal_end": (
            datetime.utcnow() + timedelta(days=timeTravelAmount) + timedelta(days=30)
        ).date(),
    }

    try:
        create_goal_user(db=db, user_id=user_id, goal_data=goal_data)
    except Exception:
        raise HTTPException(status_code=500, detail="Could not setup user data")


@router.post("/setup_user/goal/update/")
def update_user_goal(request: Request, goal: GoalText, db: Session = Depends(get_db)):
    username = request.state.username
    user_id = get_user_by_name(db, username).id

    goal_type = ""
    if (
        goal.goal_text == "cutting"
        or goal.goal_text == "bulking"
        or goal.goal_text == "maintenance"
    ):
        goal_type = "weight"

    goal_data = {
        "goal": goal.goal_text,
        "goal_type": goal_type,
        "goal_start": datetime.utcnow().date(),
        "goal_end": (
            datetime.utcnow() + timedelta(days=timeTravelAmount) + timedelta(days=30)
        ).date(),
    }

    try:
        update_goal_user(db=db, user_id=user_id, goal_data=goal_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=e)


@router.get("/setup_user/check/")
def check_user_setup(request: Request, db: Session = Depends(get_db)):
    username = request.state.username
    user_id = get_user_by_name(db, username).id
    try:
        additional_user_data = get_additional_user_data(db=db, user_id=user_id)
        print(additional_user_data)
        result = False
        if (
            additional_user_data["gender"]
            and additional_user_data["birthday"]
            and additional_user_data["height"]
            and additional_user_data["weight"]
        ):
            result = True
        return result
    except Exception:
        raise HTTPException(status_code=500, detail="Could not check user data setup")


@router.get("/setup_user/")
def get_user_setup(request: Request, db: Session = Depends(get_db)):
    username = request.state.username
    user_id = get_user_by_name(db, username).id
    try:
        return get_additional_user_data(
            db=db,
            user_id=user_id,
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Could not get user data setup")
