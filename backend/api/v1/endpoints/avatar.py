from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import FileResponse
from pathlib import Path
from db import crud
from db.database import get_db
from sqlmodel import Session

router = APIRouter()


@router.get("/username/")
def get_account_name(request: Request):
    try:
        username = request.state.username  # from middleware
        return {"username": username}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
