from schemas.types import HabitItems
from fastapi import APIRouter, Request, Depends
from db import crud
from db.database import get_db
from sqlmodel import Session

router = APIRouter()


@router.get("/habits/")
def get_habits(request: Request, db: Session = Depends(get_db)):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    habits = crud.get_habits(db, user_id)
    return {"habits": habits}


@router.post("/habits/update/")
def update_habits(
    request: Request, habit_items: HabitItems, db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    currHabits = crud.get_habits(db, user_id)
    currHabitsItems = set([item.title for item in currHabits])
    newHabitItems = set([item.title for item in habit_items.habit_items])
    for title in currHabitsItems - newHabitItems:
        crud.delete_habit_title(db, user_id, title)  # type: ignore
    crud.update_habits(db, user_id, habit_items.habit_items)
    return {"status": "success"}
