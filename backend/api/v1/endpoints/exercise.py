from fastapi import APIRouter, Depends, Request
from db.database import get_db
from sqlmodel import Session
from db import exerciseDB

router = APIRouter()


@router.get("/exercise/")
def get_list_of_exercises(request: Request, db: Session = Depends(get_db)):
    exercises = exerciseDB.get_list_of_exercises()
    booleans = (
        exerciseDB.get_available_stats_for_exercises()
    )  # tells type of exercsie and available stats
    res = {}
    for idx, exercise in enumerate(exercises):
        res[exercise] = booleans[idx]
    return res
