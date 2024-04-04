from phaeroAI import insightAI
from schemas.types import InsightBackend, InsightFrontendQuery
from fastapi import APIRouter, Request, Depends, HTTPException
from db import crud
from db.database import get_db
from sqlmodel import Session

from datetime import datetime, date  # Import the 'date' module

router = APIRouter()


@router.post("/insights/create/")
def create_insight(
    request: Request, insight: InsightFrontendQuery, db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    start_time = datetime.strptime(insight.start_time, "%d-%m-%Y").date()
    end_time = datetime.strptime(insight.end_time, "%d-%m-%Y").date()
    tokens = insightAI.get_insight_token_cost(
        db, user_id, insight.prompt, start_time, end_time
    )
    available_tokens = crud.get_allowance_tokens(db, user_id)
    if tokens > available_tokens:
        raise HTTPException(
            status_code=400,
            detail="Not enough tokens to create insight",
        )
    crud.set_allowance_tokens(
        db, user_id, max(available_tokens - tokens, 0)
    )  # JUST MAKING SURE its above 0
    try:
        result = insightAI.create_insight(
            db, user_id, insight.prompt, start_time, end_time
        )
    except Exception as e:
        print(e)
        crud.set_allowance_tokens(db, user_id, available_tokens + tokens)
        raise HTTPException(
            status_code=400,
            detail="Error creating insight",
        )
    return {"insight": result}


@router.get("/insights/")
def get_insights(request: Request, db: Session = Depends(get_db)):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    insights = crud.get_insights(db, user_id)
    insight_dict = []
    for insight in insights:
        insight_dict.append(
            {
                "prompt": insight.prompt,
                "result": insight.result,
                "recorded_at": insight.recorded_at,
                "used_note_strings": [
                    note.note
                    for note_id in insight.used_note_ids
                    for note in crud.get_note_entry(db, note_id)
                ],
            }
        )
    return {"insights": insight_dict}


@router.post("/insights/tokens/")
def get_token_cost_for_query(
    request: Request, insight: InsightFrontendQuery, db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    start_time = datetime.strptime(insight.start_time, "%d-%m-%Y").date()
    end_time = datetime.strptime(insight.end_time, "%d-%m-%Y").date()
    tokens = insightAI.get_insight_token_cost(
        db, user_id, insight.prompt, start_time, end_time
    )
    available_tokens = crud.get_allowance_tokens(db, user_id)
    return {"tokens": tokens, "available_tokens": available_tokens}


@router.get("/insights/allowance/")
def get_allowance(request: Request, db: Session = Depends(get_db)):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    allowance = crud.get_allowance_tokens(db, user_id)
    return {"allowance": allowance}
