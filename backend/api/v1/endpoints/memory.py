from schemas.types import MemoryQuery, MemoryReviews
from fastapi import APIRouter, Request, Depends
from db import crud
from db.database import get_db
from sqlmodel import Session

from datetime import datetime, date  # Import the 'date' module

router = APIRouter()


@router.post("/memory/")
def get_memory(request: Request, memory: MemoryQuery, db: Session = Depends(get_db)):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    user_date = datetime.strptime(memory.userDate.strip(), "%Y-%m-%d").date()
    notes = crud.get_notes_for_review(db, user_id, user_date)
    serializable_notes = []
    for note in notes:
        serializable_notes.append(
            {
                "id": note.id,
                "note": note.note,
                "review_notes": note.review_notes if note.review_notes else "",
                "next_review": (
                    note.next_review if note.next_review else memory.userDate
                ),
                "repetition": note.repetition if note.repetition else 0,
                "recall_score": 0,
                "recorded_at": note.recorded_at,
            }
        )
    serializable_notes = sorted(
        serializable_notes, key=lambda x: x["id"], reverse=False
    )
    return {"notes": serializable_notes}


@router.post("/memory/review/")
def update_memory_with_review(
    request: Request, memory_reviews: MemoryReviews, db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    reviews = memory_reviews.memoryReviews
    for review in reviews:
        next_review_date = (
            datetime.strptime(review.next_review.strip(), "%Y-%m-%d").date()
            if review.recall_score == 0  # this means it hasnt been reviewed yet
            else None
        )
        crud.update_note_review(
            db,
            user_id,
            review.id,
            review.recall_score,
            review.review_notes,
            next_review_date,
        )
    return {"status": "success"}
