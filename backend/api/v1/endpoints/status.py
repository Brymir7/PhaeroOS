from core.config import create_settings
from fastapi import APIRouter, Depends, Request
from db import crud
from schemas.types import Message
from db.database import get_db
from sqlmodel import Session

router = APIRouter()


@router.get("/status/")
def check_access():
    return {"status": "ok"}


@router.get("/status/subscription/")
def check_access():
    return {"status": "ok"}


# Example message
current_message = Message(
    text_english="""Welcome to Phaero! :)
    I'm Maxim, the sole developer on the project. So good to have you here and excited for you to use the app!
    To get started either record a voice message or write your note manually, then press on the process button.
    If you want, you can report bugs / feedback in the bottom left corner (the flag icon, it will open up an email menu, or email gorillabrainai@gmail.com).
    You are one of Phaero's first users and I will pay special attention to your feedback.
    Have fun!
    """,
    text_german="""Willkommen bei Phaero! :)
    Ich bin Maxim, der einzige Entwickler des Projekts. Es ist toll, dass du hier bist und ich freue mich darauf, dass du die App benutzt!
    Um loszulegen, entweder eine Sprachnachricht aufnehmen oder deine Notiz manuell schreiben und dann auf die Schaltfläche "Verarbeiten" drücken.
    Wenn du möchtest, kannst du Fehler / Feedback in der unteren linken Ecke melden (das Flaggen-Symbol, es öffnet ein E-Mail-Menü, oder einfach direkt eine E-Mail an gorillabrainai@gmail.com.
    Du bist einer der ersten Benutzer von Phaero und ich werde besonders auf dein Feedback achten.
    Have fun!
    """,
    id="23344667",
)


@router.get("/current-message/")
def get_current_message():
    return current_message


@router.get("/timetravel/")
def get_timtravel(request: Request, db: Session = Depends(get_db)):
    settings = create_settings()
    print(settings.timeTravelAmount)
    return {"timetravel": settings.timeTravelAmount}


@router.get("/current_words_written/")
def get_current_words_written(request: Request, db: Session = Depends(get_db)):
    all_note_words = crud.get_all_note_words(db)
    return {"current_words_written": all_note_words}
