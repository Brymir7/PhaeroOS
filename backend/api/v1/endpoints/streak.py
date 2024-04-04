from datetime import date
from fastapi import APIRouter, Depends, Request
from api.v1.endpoints.utils import get_data_from_iterator
from db.database import get_db
from db import crud
from sqlmodel import Session

router = APIRouter()


@router.get("/streak/")
def get_streak(request: Request, db: Session = Depends(get_db)):
    username = request.state.username  # from middleware
    user_id = crud.get_user_by_name(db, username).id

    # robustness
    if not crud.has_created_note_yesterday(db, user_id):
        crud.reset_streak_user(db, user_id)

    userStreak = crud.get_streak_user(db, user_id)
    recorded_a_note_at: list[date] = [
        note.recorded_at
        for note in get_data_from_iterator(
            crud.get_note_entries(
                db, user_id, newest_first=True, limited_amount=-1, last_x_days=1000
            )
        )
    ]
    habitCount = crud.get_habit_count(db, user_id)
    completedChecklistCount = crud.get_completed_checklist_items_count(db, user_id)
    avgCalories = crud.get_avg_calories(db, user_id)

    avgFluid = crud.get_avg_fluid_Intake(db, user_id)

    avgBedtime, avgWaketime, avgSleepDuration = (
        crud.get_avg_bed_and_wake_up_time_and_duration(db, user_id)
    )
    avgSteps = crud.get_avg_step_count(db, user_id)
    avgWellbeing = crud.get_avg_wellbeing_score(db, user_id)
    return {
        "userId": user_id,
        "currentStreak": userStreak.streak,
        "maxStreak": userStreak.max_streak,
        "recordedANoteAt": recorded_a_note_at,
        "habitCount": habitCount,
        "completedChecklistCount": completedChecklistCount,
        "avgCalories": avgCalories,
        "avgSleepDuration": avgSleepDuration,
        "avgFluid": avgFluid,
        "avgBedtime": avgBedtime,
        "avgWaketime": avgWaketime,
        "avgSteps": avgSteps,
        "avgWellbeing": avgWellbeing,
    }

    # except Exception as e:
    #   raise HTTPException(status_code=500, detail=str(e))
