from typing import Any, List
from schemas.types import GeneralGoalType
from fastapi import APIRouter, Request, Depends
from db import crud
from db.database import get_db
from sqlmodel import Session

router = APIRouter()


@router.get("/general_goals/")
def get_general_goals(request: Request, db: Session = Depends(get_db)):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    general_goals = crud.get_general_goals(db, user_id)
    return general_goals


@router.post("/general_goals/")
def update_general_goals(
    request: Request,
    goals: List[GeneralGoalType],
    db: Session = Depends(get_db),
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    currGoals = crud.get_general_goals(db, user_id)
    currGoals = set([item.title for item in currGoals])
    newGoals = set([item.title for item in goals])
    for title in currGoals - newGoals:
        crud.delete_general_goal(db, user_id, title)
    for general_goal in goals:
        crud.update_general_goal(db, user_id, general_goal)
    return {"status": "success"}


@router.post("/general_goals/update/")
def update_general_goal(
    request: Request, general_goal: GeneralGoalType, db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    crud.update_general_goal(db, user_id, general_goal)
    return {"status": "success"}


@router.get("/general_goals/habits/")
def get_general_goal_habits(
    request: Request, general_goal: GeneralGoalType, db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    habits = crud.get_habits_based_on_goal(db, user_id, general_goal)
    return habits


@router.get("/general_goals/statistics")
def get_general_goal_statistics(
    request: Request, general_goal: GeneralGoalType, db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    diagramdata = crud.get_statistic_data_based_on_goal(db, user_id, general_goal)
    result = []
    for data in diagramdata:
        result.append(
            {
                "id": data.id,
                "name": data.title,
                "values": [
                    float(value)
                    for subdata in data.data
                    for key, value in subdata.items()
                    if key != "date"
                ],
            }
        )
    return result
