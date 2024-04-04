import os
from re import U
from typing import Optional
from filelock import FileLock, Timeout
from groq import Groq
from openai import OpenAI
from sqlmodel import Session
from api.v1.endpoints.chat import groq_Prompt
from api.v1.endpoints.utils import serialize_datetime
import db
from db import crud
from db.database import get_db
from db.crud import (
    add_embedding_to_user_notes,
    add_summarizing_description_to_user_notes,
    get_all_users,
    get_daily_allowance_processing,
    reset_daily_note_for_user,
    reset_checklist,
    reset_streak_user_daily_job,
    reset_daily_allowances_user,
    get_settings,
    get_daily_note,
    update_daily_note,
    get_phaero_note,
    update_phaero_note,
)
from core.config import create_settings
from db.tables.models import User, UserSettings


settings = create_settings()
timeTravelAmount = settings.timeTravelAmount

import logging
from datetime import datetime, timedelta
import pytz

GROQ_API_KEY = settings.GROQ_API_KEY

GROQ_CLIENT = Groq(
    api_key=GROQ_API_KEY,
)
THRESHOLDS_PERSONALITY_UPDATE = [1, 3, 7, 14, 30, 60, 90, 180, 365]
USE_THE_LAST_X_JOURNALS_FOR_PERSONALITY = 30
RESET_ONCE_A_DAY = timedelta(days=1)


def createOpenAIClient():
    settings = create_settings()
    client = OpenAI(
        api_key=settings.OPENAI_KEY,
    )
    return client


def ask_gpt(
    query: str, model: str = "gpt-4-turbo", temperature: float = 0.0
) -> Optional[str]:
    client = createOpenAIClient()
    chat_completion = client.chat.completions.create(
        model=model,
        temperature=temperature,
        messages=[{"role": "user", "content": query}],
    )
    result = chat_completion.choices[0].message.content
    return result


def ai_format_note(note: str, userSettings: UserSettings) -> Optional[str]:
    prompt = f"note: {note}. Do it in {userSettings.language}. Please create a structured journal entry out of my note. Transform questions into thoughts or ideas. Main headline is one #. Format it in an aesthetic, hierarchical manner. Return only the markdown now:"
    formatted_note = groq_Prompt(
        prompt,
        GROQ_CLIENT,
        "",
        sys_language=("german" if userSettings.language == "german" else "english"),
    )
    return formatted_note


def create_personality_summary(summarizing_descriptions: list[str]) -> Optional[str]:
    input_text = "summarizing_descriptions of user's journal" + " ".join(
        summarizing_descriptions
    )
    prompt = "Characterize the user's interests, and behavior. Extract the user's experience level in all areas that interest him, (beginner, intermediate, advanced, expert) after. Keep it short. Take a deep breath, do your best!"
    result = ask_gpt(input_text + "\n\n" + prompt, model="gpt-4o", temperature=1.0)
    return result


def reset_general_daily_job():
    db = next(get_db())
    try:
        logging.info("|RESET DAILY JOB|")
        # print("|RESET DAILY JOB|")
        _users = get_all_users(db=db)

        for user in _users:
            settings = get_settings(db=db, user_id=user.id)
            if not settings:
                continue

            user_timezone = pytz.timezone(settings.timezone)
            user_local_time = datetime.now(user_timezone)

            if user_local_time.hour == 3:
                logging.info("|RESET daily note JOB|")
                _, canProcess = get_daily_allowance_processing(db=db, user_id=user.id)
                reset_daily_note_for_user(db=db, user_id=user.id)
                logging.info("|RESET allowance JOB|")
                reset_daily_allowances_user(db=db, user_id=user.id)
                logging.info("|RESET streak JOB|")
                reset_streak_user_daily_job(db=db, user_id=user.id)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

RAGATOUILLE_INDICES_PATH = ".ragatouille/colbert/indexes/"

def infer_locale_from_timezone(timezone: str) -> str:
    if timezone == "Europe/Berlin":
        return "de_DE"
    return "en_US"


def get_all_notes_user(db: Session, user_id: int):
    all_note_for_user = crud.get_note_entries(
        db=db,
        user_id=user_id,
        last_x_days=10000,
        order=True,
        newest_first=True,
        limited_amount=10000,
    )
    return [note[0] for note in all_note_for_user]


def generate_user_personality_summary(db: Session, user: User):
    all_notes = get_all_notes_user(db, user.id)
    print("GENERATING; PERSONALITY SUMMARY")
    last_30_notes = all_notes[:USE_THE_LAST_X_JOURNALS_FOR_PERSONALITY]
    summarizing_descriptions_last_x_journals = [
        note.summarizing_description for note in last_30_notes
    ]
    summarizing_descriptions_last_x_journals = [
        description
        for description in summarizing_descriptions_last_x_journals
        if description is not None and len(description.split(" ")) > 20
    ]
    previous_update_threshold = user.current_personality_update_threshold
    next_threshold = next(
        (
            threshold
            for threshold in THRESHOLDS_PERSONALITY_UPDATE
            if threshold > previous_update_threshold and threshold >= len(all_notes)
        ),
        None,
    )
    if (
        next_threshold is not None and len(all_notes) >= next_threshold
    ) or user.personality_summary is None:
        personality_summary = create_personality_summary(
            summarizing_descriptions_last_x_journals
        )
        if user.personality_summary is None or next_threshold is None:
            crud.add_or_update_personality_user(
                db, user.id, "No personality summary available", 3
            )
            return
        if personality_summary:
            crud.add_or_update_personality_user(
                db, user.id, personality_summary, next_threshold
            )


def note_ai_job():
    db = next(get_db())
    lock_file_to_prevent_multiple_jobs = FileLock("note_ai_job.lock")
    try:
        logging.info("|AI JOB|")
        _users = get_all_users(db=db)
        try:
            lock_file_to_prevent_multiple_jobs.acquire()
        except:
            print("Another process is working on the note ai. Exiting...")
            return
        for user in _users:
            settings = get_settings(db=db, user_id=user.id)
            if not settings:
                continue
            user_timezone = pytz.timezone(settings.timezone)
            user_local_time = datetime.now(user_timezone)
            if user_local_time.hour == 2:
                logging.info("|AI JOB|")
                add_summarizing_description_to_user_notes(db=db, user_id=user.id)
                add_embedding_to_user_notes(db=db, user_id=user.id)
                daily_note = get_daily_note(db=db, user_id=user.id)
                if (
                    len(daily_note.note.split(" ")) > 25
                    and daily_note.has_been_formatted == False
                ):
                    update_daily_note(
                        db=db,
                        user_id=user.id,
                        note=daily_note.note,
                        has_been_formatted=True,
                    )  # NOTE avoid race conditions with multiple uvicorn workers
                    formatted_note = ai_format_note(daily_note.note, settings)
                    if formatted_note and len(formatted_note.split(" ")) >= (
                        len(daily_note.note.split(" ")) * 0.5
                    ):
                        phaero_note = get_phaero_note(
                            db=db,
                            user_id=user.id,
                            specific_date=(user_local_time - timedelta(days=1)).date(),
                        )
                        update_daily_note(
                            db=db,
                            user_id=user.id,
                            note=formatted_note,
                            has_been_formatted=True,
                        )
                        if phaero_note:
                            phaero_note.data_json["Note"]["Note"] = formatted_note
                            update_phaero_note(
                                db=db,
                                user_id=user.id,
                                recorded_at=(
                                    user_local_time - timedelta(days=1)
                                ).date(),
                                data_json=serialize_datetime(phaero_note.data_json),
                            )
            if user_local_time.hour == 4:
                generate_user_personality_summary(db, user)

    except Exception as e:
        lock_file_to_prevent_multiple_jobs.release()
        print(f"Error: {e}")
    finally:
        db.close()


def reset_checklist_job():
    db = next(get_db())
    try:
        _users = get_all_users(db=db)
        for user in _users:
            settings = get_settings(db=db, user_id=user.id)
            if not settings:
                continue
            user_timezone = pytz.timezone(settings.timezone)
            user_local_time = datetime.now(user_timezone)
            if user_local_time.hour == 2:
                logging.info("|RESET checklist JOB|")
                reset_checklist(db=db, user_id=user.id)

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()
