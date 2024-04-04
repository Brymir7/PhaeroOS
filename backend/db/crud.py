import re
from typing import Any, Union

from psycopg2 import IntegrityError
from api.v1.endpoints.openAIUtils import get_embedding_from_text
from phaeroAI.noteAI import get_wellbeing_classification
from schemas.types import (
    ChecklistItemFromFrontend,
    HabitItem,
    GeneralGoalType,
)
from sqlalchemy import func
from sqlmodel import Session, select
from sqlalchemy.orm.attributes import flag_modified
from .tables.models import (
    DiagramData,
    ExerciseSpecificData,
    Exercises,
    GeneralGoal,
    Goal,
    Habit,
    Insight,
    MessageData,
    NoteQueries,
    ProcessedNoteData,
    SurveyData,
    Tag,
    TemporaryProcessedUserNoteData,
    User,
    SleepData,
    NoteData,
    NutritionData,
    ExerciseData,
    WeightData,
    StreakData,
    Feedback,
    DailyNoteData,
    DailyAllowancesUser,
    UserSettings,
    Subscription,
    TrainModelData,
    ChecklistItem,
)
from datetime import datetime, timedelta, date
from typing import Optional, List
from core.config import create_settings
from sqlalchemy.types import Date
from dateutil import parser

settings = create_settings()
timeTravelAmount = settings.timeTravelAmount
# Add the necessary import statements for the User class and the Session class
DAILY_TRANSCRIPTIONS_DEFAULT: int = 5
DAILY_TRANSCRIPTIONS_PREMIUM: int = 5
DAILY_PROCESSINGS: int = 50
DAILY_IMAGES_TO_TEXT_DEFAULT = 3
DAILY_FORMATTINGS_DEFAULT = 5
DAILY_EMBEDDINGS_DEFAULT = 5
DAILY_TOKENS_ALLOWANCE = 1500
DAILY_IMAGES = 5
DAILY_CHATS = 50


def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_name(db: Session, username: str) -> User:
    return db.query(User).filter(User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


def get_all_users(db: Session) -> List[User]:
    return db.query(User).all()


def get_feedback_state(db: Session, user_id: int):
    _user = get_user(db=db, user_id=user_id)
    return _user.feedback_state


def increase_feedback_and_streak_state(db: Session, user_id: int):
    _user = get_user(db=db, user_id=user_id)
    if not _user:
        return None
    _user.feedback_state = (_user.feedback_state or 0) + 1
    _streak = get_streak_user(db=db, user_id=user_id)
    _streak.streak += 1
    _streak.last_update_time = datetime.utcnow()
    if _streak.max_streak < _streak.streak:
        _streak.max_streak = _streak.streak
    db.add(_user)
    db.add(_streak)
    db.commit()
    db.refresh(_user)
    db.refresh(_streak)
    return _user


def reset_feedback_state(db: Session, user_id: int):
    _user = get_user(db=db, user_id=user_id)

    _user.feedback_state = 0
    db.add(_user)
    db.commit()
    db.refresh(_user)
    return _user


def create_feedback_based_on_dict(
    db: Session,
    user_id: int,
    feedback_dict: dict[str, Any],
    user_judgement: Optional[int] = None,
) -> Feedback:
    _feedback = Feedback(
        tasks_text=feedback_dict["tasks_text"],
        weekly_summary=feedback_dict["weekly_summary"],
        weekly_delta_information=feedback_dict["weekly_delta_information"],
        weekly_delta_diagram_data=str(
            feedback_dict["weekly_delta_diagram_data"]
        ),  # NOTE doesnt exist in first feedback
        advice_on_goals=feedback_dict["advice_on_goals"],
        advice_best_days=feedback_dict["advice_best_days"],
        advice_worst_days=feedback_dict["advice_worst_days"],
        advice_neutral_days=feedback_dict["advice_neutral_days"],
        journal_prompts=feedback_dict["journal_prompts"],
        title=feedback_dict["title"],
        user_id=user_id,
        note_ids=feedback_dict["note_ids"],
        recorded_at=feedback_dict["recorded_at"],
        user_judgement=user_judgement,
    )
    db.add(_feedback)
    db.commit()
    db.refresh(_feedback)
    return _feedback


def get_feedback(db: Session, user_id: int) -> List[Feedback]:
    return (
        db.query(Feedback)
        .filter(Feedback.user_id == user_id)
        .order_by(Feedback.recorded_at.desc())
        .all()
    )


def get_last_feedback(db: Session, user_id: int) -> Feedback:
    return (
        db.query(Feedback)
        .filter(Feedback.user_id == user_id)
        .order_by(Feedback.recorded_at.desc())
        .first()
    )


def update_user(
    db: Session,
    user_id: int,
    username: str = None,
    email: str = None,
    fullName: str = None,
    avatar: str = None,
    streak: int = None,
):
    _user = get_user(db=db, user_id=user_id)
    if username:
        _user.username = username
    if email:
        _user.email = email
    if fullName:
        _user.full_name = fullName
    if avatar:
        _user.avatar = avatar
    if streak:
        _user.streak = streak
    db.commit()
    return _user


def change_additional_user_data(db: Session, user_id: int, additional_user_data: dict):
    user = get_user(db=db, user_id=user_id)
    user.gender = additional_user_data.gender
    user.birthday = additional_user_data.birthday
    user.height = additional_user_data.height
    user.weight = additional_user_data.weight
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_additional_user_data(db: Session, user_id: int):
    """Returns gender, age, height, weight of user.

    Returns:
        _type_: dict = {
            "gender": user.gender,
            "age": user.age,
            "height": user.height,
            "weight": user.weight,
        }
    """
    user = get_user(db=db, user_id=user_id)
    if not user:
        return {}
    additional_user_data = {
        "gender": user.gender,
        "birthday": user.birthday,
        "height": user.height,
        "weight": user.weight,
    }
    return additional_user_data


def create_goal_user(db: Session, user_id: int, goal_data: dict):
    _goal = Goal(
        user_id=user_id,
        goal=goal_data["goal"],
        goal_type=goal_data["goal_type"],
        goal_start=goal_data["goal_start"],
        goal_end=goal_data["goal_end"],
    )
    db.add(_goal)
    db.commit()
    db.refresh(_goal)
    return _goal


def get_goal_user(db: Session, user_id: int, goal_type: str) -> Goal:
    return (
        db.query(Goal)
        .filter(Goal.user_id == user_id)
        .filter(Goal.goal_type == goal_type)
        .first()
    )


def update_goal_user(db: Session, user_id: int, goal_data: dict):
    _goal = get_goal_user(db=db, user_id=user_id, goal_type=goal_data["goal_type"])
    if not _goal:
        raise Exception("No goal found")
    _goal.goal = goal_data["goal"]
    _goal.goal_type = goal_data["goal_type"]
    _goal.goal_start = goal_data["goal_start"]
    _goal.goal_end = goal_data["goal_end"]
    db.add(_goal)
    db.commit()
    db.refresh(_goal)
    return _goal


def get_user_goals(db: Session, user_id: int) -> Goal:
    return db.query(Goal).filter(Goal.user_id == user_id).all()


def create_streak_user(db: Session, user_id: int):
    now = datetime.utcnow()
    _streak = StreakData(
        streak=0,
        max_streak=0,
        user_id=user_id,
        last_update_time=datetime.utcnow()
        - timedelta(days=100),  # to make sure behavior works for first day
    )
    db.add(_streak)
    db.commit()
    db.refresh(_streak)
    return _streak


def get_streak_user(db: Session, user_id: int) -> StreakData:
    return db.query(StreakData).filter(StreakData.user_id == user_id).first()


def increase_streak_user(db: Session, user_id: int):
    _streak = get_streak_user(db=db, user_id=user_id)
    _streak.streak += 1
    _streak.last_update_time = datetime.utcnow()
    if _streak.max_streak < _streak.streak:
        _streak.max_streak = _streak.streak

    db.add(_streak)
    db.commit()
    db.refresh(_streak)
    return _streak


def streak_has_been_modified_tday(db: Session, user_id: int) -> bool:
    _streak = get_streak_user(db=db, user_id=user_id)
    today = (datetime.utcnow() + timedelta(days=timeTravelAmount)).date()
    return _streak.last_update_time.date() == today


def reset_streak_user(db: Session, user_id: int):
    _streak = get_streak_user(db=db, user_id=user_id)
    if not has_created_note_today(db=db, user_id=user_id):
        streakCount = _streak.streak
        if _streak.max_streak < streakCount:
            _streak.max_streak = streakCount
        _streak.streak = 0
    db.add(_streak)
    db.commit()
    db.refresh(_streak)
    return _streak


def reset_streak_user_daily_job(db: Session, user_id: int):
    _streak = get_streak_user(db=db, user_id=user_id)
    if has_created_note_yesterday(db=db, user_id=user_id) or has_created_note_today(
        db, user_id
    ):
        return
    streakCount = _streak.streak
    if _streak.max_streak < streakCount:
        _streak.max_streak = streakCount
    _streak.streak = 0
    db.add(_streak)
    db.commit()
    db.refresh(_streak)
    return _streak


def has_created_note_today(db: Session, user_id: int) -> bool:
    today = (datetime.utcnow() + timedelta(days=timeTravelAmount)).date()
    statement = (
        select(NoteData)
        .where(NoteData.user_id == user_id)
        .where(NoteData.recorded_at == today)
    )
    result = db.exec(statement).first()
    return result is not None


def has_created_note_yesterday(db: Session, user_id: int) -> bool:
    yesterday = (
        datetime.utcnow() + timedelta(days=timeTravelAmount)
    ).date() - timedelta(days=1)
    statement = (
        select(NoteData)
        .where(NoteData.user_id == user_id)
        .where(NoteData.recorded_at == yesterday)
    )
    result = db.exec(statement).first()
    return result is not None


def create_user(
    db: Session,
    username: str,
    email: str,
    hashed_password: str,
    salt: str,
    fullName: str = None,
    avatar: str = None,
):
    _user = User(
        username=username,
        email=email,
        full_name=fullName if fullName else "",
        hashed_password=hashed_password,
        salt=salt,
        avatar=avatar if avatar else "",
    )

    db.add(_user)
    db.commit()
    db.refresh(_user)
    return _user


def create_google_user(
    db: Session,
    username: str,
    email: str,
    fullName: str = None,
    avatar: str = None,
):
    _user = User(
        username=username,
        email=email,
        full_name=fullName,
        avatar=avatar,
    )
    db.add(_user)
    db.commit()
    db.refresh(_user)
    return _user


def remove_user(db: Session, user_id: int):
    _user = get_user(db=db, user_id=user_id)
    db.delete(_user)
    db.commit()
    return True


def add_or_update_personality_user(
    db: Session, user_id: int, personality: str, personality_update_threshold: int
):
    _user = get_user(db=db, user_id=user_id)
    if not _user:
        return None
    _user.personality_summary = personality
    _user.current_personality_update_threshold = personality_update_threshold
    db.add(_user)
    db.commit()
    return _user


def get_personality_from_user(db: Session, user_id: int):
    _user = get_user(db=db, user_id=user_id)
    if not _user:
        return None
    return _user.personality_summary


def create_daily_note(
    db: Session,
    user_id: int,
):
    _noteEntry = DailyNoteData(user_id=user_id, attached_images=[])
    db.add(_noteEntry)
    db.commit()
    db.refresh(_noteEntry)
    return _noteEntry


def add_to_daily_note(
    db: Session,
    user_id: int,
    note: Optional[str] = None,
    image_url: Optional[str] = None,
    has_been_formatted: Optional[bool] = None,
) -> DailyNoteData:
    _noteEntry: DailyNoteData = (
        db.query(DailyNoteData).filter_by(user_id=user_id).first()
    )
    if note:
        _noteEntry.note += note
    if image_url is not None:
        if not _noteEntry.attached_images:
            _noteEntry.attached_images = []
        _noteEntry.attached_images.append(image_url)
    if has_been_formatted is not None:
        _noteEntry.has_been_formatted = has_been_formatted
    db.add(_noteEntry)
    db.commit()
    return _noteEntry


def update_daily_note(
    db: Session,
    user_id: int,
    note: Optional[str] = None,
    image_urls: Optional[list[str]] = None,
    has_been_formatted: Optional[bool] = None,
) -> DailyNoteData:
    _noteEntry: DailyNoteData = (
        db.query(DailyNoteData).filter_by(user_id=user_id).first()
    )
    if image_urls is not None:
        if not _noteEntry.attached_images:
            _noteEntry.attached_images = []
        _noteEntry.attached_images = image_urls
    if note:
        _noteEntry.note = note
    if has_been_formatted is not None:
        _noteEntry.has_been_formatted = has_been_formatted
    db.add(_noteEntry)
    db.commit()
    return _noteEntry


def get_daily_note(db: Session, user_id: int) -> DailyNoteData:
    dailyNote = db.query(DailyNoteData).filter_by(user_id=user_id).first()
    if dailyNote is None:
        return create_daily_note(db, user_id=user_id)
    return dailyNote


def reset_daily_note_for_user(db: Session, user_id: int):
    dailyNote: DailyNoteData = (
        db.query(DailyNoteData).filter_by(user_id=user_id).first()
    )
    dailyNote.note = ""
    dailyNote.attached_images = []
    db.add(dailyNote)
    db.commit()


def get_phaero_note(
    db: Session, user_id: int, specific_date: date, default=None
) -> ProcessedNoteData:
    phaero_note = (
        db.query(ProcessedNoteData)
        .filter_by(user_id=user_id)
        .filter_by(recorded_at=specific_date)
        .first()
    )

    if phaero_note is not None or default is None:
        return phaero_note
    else:
        return update_phaero_note(
            db, user_id=user_id, data_json=default, recorded_at=specific_date
        )


def get_last_phaero_note(db: Session, user_id: int) -> ProcessedNoteData:
    return (
        db.query(ProcessedNoteData)
        .filter_by(user_id=user_id)
        .order_by(ProcessedNoteData.recorded_at.desc())
        .first()
    )


def save_processed_note_data_user(
    db: Session,
    user_id: int,
    default: dict,
):
    """
    phaero_note_dict =
    {'Food': {'FoodList': {}, 'Not found foods': [], 'List of Supplements': []},
    'Note': {'Note': '', 'Rating': 0},
    'Exercise': {'Steps': 0, 'Rating': 0, 'Description': []},
    'Nutrition': {'Total':
        {'Macros': {'fat': [0, 'G'], 'carbs': [0, 'G'], 'fluid': [0, 'ML'], 'sugar': [0, 'G'], 'protein': [0, 'G'], 'calories': [0, 'KCAL']},
        'Micros': {}}},
    'Sleep & Weight': {'Sleep': {'Sleep End': '2023-12-14T06:00:00', 'Sleep Start': '2023-12-13T22:00:00', 'Sleep Quality': 0},
    'Weight': {'Weight': [60, 'KG']}}}
    """
    recorded_at = (datetime.utcnow() + timedelta(days=timeTravelAmount)).date()
    phaero_note_dict = get_phaero_note(  # get phaero note if it exists else create it
        db=db, user_id=user_id, recorded_at=recorded_at, default=default
    )
    phaero_note_dict = phaero_note_dict.data_json
    note = phaero_note_dict["Note"]["Note"]
    if note == "":
        return

    food = phaero_note_dict["Food"]  # {"Food": {"Macros": {}, "Micros": {}}}
    wellbeing = phaero_note_dict["Note"]["Rating"]
    create_or_update_note_entry(
        db=db,
        note=note,
        wellbeing_score=wellbeing,
        user_id=user_id,
        recorded_at=recorded_at,
    )
    # {"Rating": 0, "Description": []}
    exercise = phaero_note_dict[
        "Exercise"
    ]  # {"Steps": 0, "Rating": 0, "Description": []}
    nutrition = phaero_note_dict[  # get list of foods by sampling from food keys IMPORTANT!!!!
        "Nutrition"  # [] = tuple here
    ]  # {"Total": {"Macros": {"fluid": [], "amount": [], "protein": [], "fat", [], "carbs": [], "calories": []}, "Micros": {'micros': {'calcium': [78.84, 'MG'], 'iron': [5.6, 'MG'], 'potassium': [285.34, 'MG'], 'sodium': [867.54, 'MG'], 'vitaminC': [2.76, 'MG'], 'thiamin': [0, 'MG'], 'riboflavin': [0.24, 'MG'], 'niacin': [7.46, 'MG'], 'folate': [266, 'UG']}},}
    supplements = phaero_note_dict["Food"][
        "List of Supplements"
    ]  # {"List of supplements": []}
    listOfFoods = []
    for key in food:
        listOfFoods.append(key)
    macros = nutrition["Total"]["Macros"]
    micros = nutrition["Total"]["Micros"]
    sleep = phaero_note_dict["Sleep & Weight"]["Sleep"]  # sleepstart / sleepend / sleep
    weight = phaero_note_dict["Sleep & Weight"]["Weight"]
    create_or_update_sleep_entry(
        db=db,
        sleep_start=datetime.strptime(sleep["Sleep Start"], "%Y-%m-%dT%H:%M:%S"),
        sleep_end=datetime.strptime(sleep["Sleep End"], "%Y-%m-%dT%H:%M:%S"),
        sleep_quality=sleep["Sleep Quality"],
        user_id=user_id,
        recorded_at=recorded_at,
    )
    create_or_update_exercise_entry(
        db=db,
        exercise_information="\n".join(exercise["Description"]),
        relative_activity_level=exercise["relative Rating"],
        absolute_activity_level=exercise["absolute Rating"],
        steps=exercise["Steps"],
        user_id=user_id,
        recorded_at=recorded_at,
    )
    create_or_update_nutrition_entry(
        db=db,
        calories=macros["calories"][0],
        fluid=macros["fluid"][0],
        carbs=macros["carbs"][0],
        fat=macros["fat"][0],
        sugar=macros["sugar"][0],
        protein=macros["protein"][0],
        nonMacro=str(micros),
        listOfFoods="\n".join(listOfFoods),
        supplements="\n".join(supplements),
        user_id=user_id,
        recorded_at=recorded_at,
    )
    create_or_update_weight_entry(
        db=db,
        amount=weight[0],
        user_id=user_id,
        recorded_at=recorded_at,
    )


def update_phaero_note(
    db: Session, user_id: int, data_json: dict, recorded_at: date
) -> ProcessedNoteData:
    phaero_note_db = (
        db.query(ProcessedNoteData)
        .filter_by(user_id=user_id)
        .filter_by(recorded_at=recorded_at)
        .first()
    )
    if phaero_note_db is not None:
        phaero_note_db.data_json = data_json
        db.add(phaero_note_db)
        db.commit()
        db.refresh(phaero_note_db)
        return phaero_note_db
    else:
        phaero_note = ProcessedNoteData(
            user_id=user_id, data_json=data_json, recorded_at=recorded_at
        )
    db.add(phaero_note)
    db.commit()
    db.refresh(phaero_note)
    return phaero_note  # type: ignore


def update_user_changed_phaero_note(
    db: Session, user_id: int, data_json: dict, recorded_at: date
) -> TemporaryProcessedUserNoteData:
    if (
        db.query(TemporaryProcessedUserNoteData)
        .filter_by(user_id=user_id)
        .filter_by(recorded_at=recorded_at)
        .first()
        is not None
    ):
        phaero_note = (
            db.query(TemporaryProcessedUserNoteData)
            .filter_by(user_id=user_id)
            .filter_by(recorded_at=recorded_at)
            .first()
        )
        phaero_note.data_json = data_json
    else:
        phaero_note = TemporaryProcessedUserNoteData(
            user_id=user_id, data_json=data_json, recorded_at=recorded_at
        )
    db.add(phaero_note)
    db.commit()
    db.refresh(phaero_note)
    return phaero_note


def get_user_changed_phaero_note(
    db: Session, user_id: int, default: dict, recorded_at: date
) -> TemporaryProcessedUserNoteData:
    phaero_note = (
        db.query(TemporaryProcessedUserNoteData)
        .filter_by(user_id=user_id)
        .filter_by(recorded_at=recorded_at)
        .first()
    )
    if phaero_note is not None:
        return phaero_note
    else:
        return update_user_changed_phaero_note(
            db, user_id=user_id, data_json=default, recorded_at=recorded_at
        )


def add_value_score_to_note(db: Session, user_id: int, value_score: int):
    _noteEntry = (
        db.query(NoteData)
        .filter_by(
            user_id=user_id,
            recorded_at=(datetime.utcnow() + timedelta(days=timeTravelAmount)).date(),
        )
        .first()
    )
    _noteEntry.value_score = value_score
    db.add(_noteEntry)
    db.commit()
    return _noteEntry


def add_wellbeing_description_to_note(
    db: Session,
    user_id: int,
    wellbeing_description: str,
    recorded_at: date = (datetime.utcnow() + timedelta(days=timeTravelAmount)).date(),
):
    _noteEntry = (
        db.query(NoteData)
        .filter_by(
            user_id=user_id,
            recorded_at=recorded_at,
        )
        .first()
    )
    if _noteEntry is None:
        print("|ERROR| No note found")
    _noteEntry.summarizing_description = wellbeing_description
    db.add(_noteEntry)
    db.commit()
    return _noteEntry


def add_embedding_to_note(
    db: Session,
    user_id: int,
    embedding: list[float],
    recorded_at: date = (datetime.utcnow() + timedelta(days=timeTravelAmount)).date(),
):
    _noteEntry = (
        db.query(NoteData)
        .filter_by(
            user_id=user_id,
            recorded_at=recorded_at,
        )
        .first()
    )
    if _noteEntry is None:
        print("|ERROR| No note found")
    _noteEntry.embedding = embedding
    db.add(_noteEntry)
    db.commit()
    return _noteEntry


import numpy as np


def add_embedding_to_all_notes(db: Session):
    notes = db.query(NoteData).all()
    for note in notes:
        if (
            note.embedding is None
            or note.embedding.size == 0
            or np.sum(np.abs(note.embedding)) < 0.1
        ):
            note.embedding = get_embedding_from_text(note.note)
            db.add(note)
            db.commit()
    return notes


def add_embedding_to_user_notes(db: Session, user_id: int):
    notes = db.query(NoteData).filter(NoteData.user_id == user_id).all()
    for note in notes:
        if (
            note.embedding is None
            or note.embedding.size == 0
            or np.sum(np.abs(note.embedding)) < 0.1
        ):
            note.embedding = get_embedding_from_text(note.note)
            db.add(note)
            db.commit()
    return notes


def add_summarizing_description_to_all_notes(db: Session):
    notes = db.query(NoteData).all()
    for note in notes:
        if note.summarizing_description is None or note.summarizing_description == "":
            note.summarizing_description = get_wellbeing_classification(note.note)
            db.add(note)
            db.commit()
    return notes


def add_summarizing_description_to_user_notes(db: Session, user_id: int):
    notes = db.query(NoteData).filter(NoteData.user_id == user_id).all()
    for note in notes:
        if note.summarizing_description is None or note.summarizing_description == "":
            note.summarizing_description = get_wellbeing_classification(note.note)
            db.add(note)
            db.commit()
    return notes


def get_cardio_exercises(db: Session) -> list[str]:
    exercises = db.query(Exercises).filter(Exercises.exercise_type == "cardio").all()
    return [exercise.name for exercise in exercises]


def get_weightlifting_exercises(db: Session) -> list[str]:  # -> Any:
    exercises = db.query(Exercises).filter(Exercises.exercise_type == "weight").all()
    return [exercise.name for exercise in exercises]


def get_bodyweight_exercises(db: Session) -> list[str]:
    exercises = (
        db.query(Exercises).filter(Exercises.exercise_type == "bodyweight").all()
    )
    return [exercise.name for exercise in exercises]


def create_or_update_note_entry(
    db: Session,
    user_id: int,
    note: str,
    wellbeing_score: int,
    tags: list[int] = [],
    recorded_at: date = (datetime.utcnow() + timedelta(days=timeTravelAmount)).date(),
    add_to_statistics: bool = True,
    attached_images: list[str] = [],
):
    _noteEntry = (
        db.query(NoteData).filter_by(user_id=user_id, recorded_at=recorded_at).first()
    )
    if _noteEntry is None:
        _noteEntry = NoteData(
            value_score=None,
            note=note,
            wellbeing_score=wellbeing_score,
            next_review=recorded_at + timedelta(days=7),
            tags=tags,
            recorded_at=recorded_at,
            user_id=user_id,
            attached_images=attached_images,
        )
    else:
        _noteEntry.note = note
        if tags:
            _noteEntry.tags = tags
        _noteEntry.wellbeing_score = wellbeing_score
    if add_to_statistics:
        dataJson = {
            "Score": wellbeing_score,
            "date": recorded_at.isoformat(),
        }
        add_or_update_diagram_data_point(
            db,
            user_id=user_id,
            data=dataJson,
            title="Wellbeing",
            specific_date=recorded_at,
        )
    db.add(_noteEntry)
    db.commit()
    return _noteEntry


def add_image_to_note(db: Session, user_id: int, image_url: str, imageText: str):
    _noteEntry = (
        db.query(NoteData)
        .filter_by(
            user_id=user_id,
            recorded_at=(datetime.utcnow() + timedelta(days=timeTravelAmount)).date(),
        )
        .first()
    )
    if _noteEntry is None:
        print("|ERROR| No note found")
        return
    if not _noteEntry.attached_images:
        _noteEntry.attached_images = []
    _noteEntry.attached_images.append(image_url)
    _noteEntry.note += imageText
    db.add(_noteEntry)
    db.commit()
    return _noteEntry


# def create_exercise_entry(
#     db: Session,
#     user_id: int,
#     exercise_information: str,
#     steps: int,
#     activity_level: int,
#     recorded_at: date = (datetime.utcnow() + timedelta(days=timeTravelAmount)).date(),
# ):
#     _exerciseEntry = ExerciseData(
#         exercise_information=exercise_information,
#         recorded_at=recorded_at,
#         steps=steps,
#         activity_level=activity_level,
#         user_id=user_id,
#     )
#     dataJson = {
#         "Steps": steps,
#         "date": recorded_at.isoformat(),
#     }
#     add_or_update_diagram_data_point(
#         db, user_id=user_id, data=dataJson, title="Steps", unit="per day"
#     )
#     db.add(_exerciseEntry)
#     db.commit()
#     return _exerciseEntry


def create_or_update_exercise_entry(
    db: Session,
    user_id: int,
    exercise_information: str,
    steps: int,
    relative_activity_level: float,
    absolute_activity_level: float,
    recorded_at: date,
):
    _exerciseEntry = (
        db.query(ExerciseData)
        .filter_by(user_id=user_id, recorded_at=recorded_at)
        .first()
    )
    if _exerciseEntry is None:
        _exerciseEntry = ExerciseData(
            exercise_information=exercise_information,
            recorded_at=recorded_at,
            steps=steps,
            relative_activity_level=relative_activity_level,
            absolute_activity_level=absolute_activity_level,
            user_id=user_id,
            calories_burned=0,
        )
    else:
        _exerciseEntry.exercise_information = exercise_information
        _exerciseEntry.steps = steps

    dataJson = {
        "Steps": steps,
        "date": recorded_at.isoformat(),
    }
    add_or_update_diagram_data_point(
        db,
        user_id=user_id,
        data=dataJson,
        title="Steps",
        unit="per day",
        specific_date=recorded_at,
    )
    dataJson = {
        "Relative Activity Level": relative_activity_level,
        "date": recorded_at.isoformat(),
    }
    add_or_update_diagram_data_point(
        db,
        user_id=user_id,
        data=dataJson,
        title="Relative Activity Level",
        unit="per day",
        specific_date=recorded_at,
    )
    dataJson = {
        "Absolute Activity Level": absolute_activity_level,
        "date": recorded_at.isoformat(),
    }
    add_or_update_diagram_data_point(
        db,
        user_id=user_id,
        data=dataJson,
        title="Absolute Activity Level",
        unit="per day",
        specific_date=recorded_at,
    )
    db.add(_exerciseEntry)
    db.commit()
    return _exerciseEntry


def create_or_update_sleep_entry(
    db: Session,
    user_id: int,
    sleep_start: datetime,
    sleep_end: datetime,
    sleep_quality: int,
    recorded_at: date = (datetime.utcnow() + timedelta(days=timeTravelAmount)).date(),
):
    _sleepEntry = (
        db.query(SleepData).filter_by(user_id=user_id, recorded_at=recorded_at).first()
    )
    if _sleepEntry is None:
        _sleepEntry = SleepData(
            sleep_start=sleep_start,
            sleep_end=sleep_end,
            recorded_at=recorded_at,
            sleep_quality=sleep_quality,
            user_id=user_id,
        )
    else:
        _sleepEntry.sleep_start = sleep_start
        _sleepEntry.sleep_end = sleep_end
        _sleepEntry.sleep_quality = sleep_quality

    dataJson = {
        "Duration": (sleep_end - sleep_start).seconds / 3600,
        "date": recorded_at.isoformat(),
    }
    add_or_update_diagram_data_point(
        db,
        user_id=user_id,
        data=dataJson,
        title="Sleep",
        unit="hours",
        specific_date=recorded_at,
    )
    db.add(_sleepEntry)
    db.commit()
    return _sleepEntry


def update_sleep_quality_entry(
    db: Session,
    user_id: int,
    sleep_quality: int,
    recorded_at: date = (datetime.utcnow() + timedelta(days=timeTravelAmount)).date(),
):
    entry = (
        db.query(SleepData).filter_by(user_id=user_id, recorded_at=recorded_at).one()
    )

    if sleep_quality is not None:
        entry.sleep_quality = sleep_quality
    db.add(entry)
    db.commit()
    return entry


# def create_weight_entry(
#     db: Session, user_id: int, amount: float, recorded_at: date = (datetime.utcnow() + timedelta(days=timeTravelAmount)).date()
# ):
#     _weightEntry = WeightData(
#         amount=amount,
#         recorded_at=recorded_at,
#         user_id=user_id,
#     )
#     dataJson = {
#         "Weight": amount,
#         "date": recorded_at.isoformat(),
#     }
#     add_or_update_diagram_data_point(
#         db, user_id=user_id, data=dataJson, title="Weight", unit="kg"
#     )
#     db.add(_weightEntry)
#     db.commit()
#     return _weightEntry


def create_or_update_weight_entry(
    db: Session,
    user_id: int,
    amount: float,
    recorded_at: date,
):
    _weightEntry = (
        db.query(WeightData).filter_by(user_id=user_id, recorded_at=recorded_at).first()
    )
    if _weightEntry is None:
        _weightEntry = WeightData(
            amount=amount,
            recorded_at=recorded_at,
            user_id=user_id,
        )
    else:
        _weightEntry.amount = amount
    dataJson = {
        "Weight": amount,
        "date": recorded_at.isoformat(),
    }
    add_or_update_diagram_data_point(
        db,
        user_id=user_id,
        data=dataJson,
        title="Weight",
        unit="kg",
        specific_date=recorded_at,
    )
    db.add(_weightEntry)
    db.commit()
    return _weightEntry


def create_initial_weight_entry(
    db: Session,
    user_id: int,
    amount: float,
    recorded_at: date = (datetime.utcnow() + timedelta(days=timeTravelAmount)).date(),
):
    _weightEntry = WeightData(
        amount=amount,
        recorded_at=recorded_at,
        user_id=user_id,
    )
    db.add(_weightEntry)
    db.commit()
    return _weightEntry


def create_or_update_nutrition_entry(
    db: Session,
    user_id: int,
    calories: int,
    carbs: int,
    fat: int,
    fluid: int,
    protein: int,
    sugar: int,
    nonMacro: str,
    supplements: str,
    listOfFoods: str,
    recorded_at: date,
):
    _nutritionEntry = (
        db.query(NutritionData)
        .filter_by(user_id=user_id, recorded_at=recorded_at)
        .first()
    )
    if _nutritionEntry is None:
        _nutritionEntry = NutritionData(
            calories=calories,
            recorded_at=recorded_at,
            fat=fat,
            protein=protein,
            carbs=carbs,
            fluid=fluid,
            sugar=sugar,
            non_macro=nonMacro,
            list_of_foods=listOfFoods,
            supplements=supplements,
            user_id=user_id,
        )
    else:
        _nutritionEntry.calories = calories
        _nutritionEntry.fat = fat
        _nutritionEntry.protein = protein
        _nutritionEntry.carbs = carbs
        _nutritionEntry.fluid = fluid
        _nutritionEntry.sugar = sugar
        _nutritionEntry.non_macro = nonMacro
        _nutritionEntry.list_of_foods = listOfFoods
        _nutritionEntry.supplements = supplements

    dataJson = {
        "Calories": calories,
        "date": recorded_at.isoformat(),
    }
    add_or_update_diagram_data_point(
        db,
        user_id=user_id,
        data=dataJson,
        title="Calories",
        unit="KCAL",
        specific_date=recorded_at,
    )
    dataJson = {
        "Carbs": carbs,
        "Fat": fat,
        "Protein": protein,
        "date": recorded_at.isoformat(),
    }
    add_or_update_diagram_data_point(
        db,
        user_id=user_id,
        data=dataJson,
        title="Nutrition",
        unit="g",
        specific_date=recorded_at,
    )
    dataJson = {
        "Water": fluid,
        "date": recorded_at.isoformat(),
    }
    add_or_update_diagram_data_point(
        db,
        user_id=user_id,
        data=dataJson,
        title="Hydration",
        unit="ml",
        specific_date=recorded_at,
    )
    db.add(_nutritionEntry)
    db.commit()
    return _nutritionEntry


def update_note_entry(
    db: Session,
    user_id: int,
    recorded_at: date = (datetime.utcnow() + timedelta(days=timeTravelAmount)).date(),
    note: str = None,
):
    entry = db.query(NoteData).filter_by(user_id=user_id, recorded_at=recorded_at).one()

    if note is not None:
        entry.note = note
    db.add(entry)
    db.commit()
    return entry


def get_note_entries(
    db: Session,
    user_id: int,
    last_x_days: int = 90,
    order: bool = False,
    newest_first: bool = False,
    limited_amount: int = 100,
) -> list[tuple[NoteData]]:
    query = db.query(NoteData).filter(NoteData.user_id == user_id)
    if last_x_days > 0:
        timeframe = (
            datetime.utcnow() + timedelta(days=timeTravelAmount)
        ).date() - timedelta(days=last_x_days)
        query = query.filter(NoteData.recorded_at >= timeframe)
    if order or newest_first:
        if newest_first:
            query = query.order_by(NoteData.recorded_at.desc())
        else:
            query = query.order_by(NoteData.recorded_at.asc())
    if limited_amount > 0:
        query = query.limit(limited_amount)
    return db.exec(query)


def get_all_note_words(db: Session) -> int:
    all_note_strings = db.query(NoteData.note).all()
    all_note_words = 0
    for note in all_note_strings:
        all_note_words += len(note[0].split())
    return all_note_words


def get_note_entries_with_ids(
    db: Session, user_id: int, note_ids: list[int]
) -> List[NoteData]:
    return (
        db.query(NoteData)
        .filter(NoteData.user_id == user_id)
        .filter(NoteData.id.in_(note_ids))
        .all()
    )


def get_note_ids_for_user(db: Session, user_id: int) -> List[int]:
    return db.query(NoteData.id).filter(NoteData.user_id == user_id).all()


def get_note_entries_timeframe(
    db: Session, user_id, start_date: date, end_date: date
) -> NoteData:
    return (
        db.query(NoteData)
        .filter(NoteData.user_id == user_id)
        .filter(NoteData.recorded_at >= start_date)
        .filter(NoteData.recorded_at <= end_date)
        .all()
    )


def get_last_note_entry(db: Session, user_id: int) -> NoteData:
    return (
        db.query(NoteData)
        .filter(NoteData.user_id == user_id)
        .order_by(NoteData.recorded_at.desc())
        .first()
    )


def get_specific_date_note_entry(
    db: Session, user_id: int, recorded_at: date
) -> NoteData:
    return (
        db.query(NoteData)
        .filter(NoteData.user_id == user_id)
        .filter(NoteData.recorded_at == recorded_at)
        .first()
    )


def get_note_entries_by_similarity_to_text(
    db: Session,
    user_id: int,
    text_embedding: list[float],
    last_x_days: int = 90,
    limit: int = 90,
) -> List[NoteData]:
    query = db.query(NoteData).filter(NoteData.user_id == user_id)
    if last_x_days > 0:
        timeframe = (
            datetime.utcnow() + timedelta(days=timeTravelAmount)
        ).date() - timedelta(days=last_x_days)
        query = query.filter(NoteData.recorded_at >= timeframe)
    return db.exec(query.order_by(NoteData.embedding.max_inner_product(text_embedding)).limit(limit))  # type: ignore


def get_note_entry(db: Session, note_id: int) -> NoteData:
    return db.query(NoteData).filter(NoteData.id == note_id)


def get_note_entry_by_note(db: Session, user_id: int, note: str) -> NoteData:
    return (
        db.query(NoteData)
        .filter(NoteData.user_id == user_id)
        .filter(NoteData.note == note)
        .first()
    )


def get_amount_of_notes(db: Session, user_id: int):
    return db.query(NoteData).filter(NoteData.user_id == user_id).count()


def get_exercise_diagram_data(
    db: Session,
    user_id: int,
    last_x_days: int = 90,
    order: bool = False,
    newest_first: bool = False,
    limited_amount: int = 100,
) -> ExerciseData:
    query = db.query(ExerciseData).filter(ExerciseData.user_id == user_id)
    if last_x_days > 0:
        timeframe = (
            datetime.utcnow() + timedelta(days=timeTravelAmount)
        ).date() - timedelta(days=last_x_days)
        query = query.filter(ExerciseData.recorded_at >= timeframe)
    if order or newest_first:
        if newest_first:
            query = query.order_by(ExerciseData.recorded_at.desc())
        else:
            query = query.order_by(ExerciseData.recorded_at)
    if limited_amount > 0:
        query = query.limit(limited_amount)
    return db.exec(query)


def get_exercise_specific_data(
    db: Session,
    user_id: int,
    last_x_days: int = 90,
    order: bool = False,
    newest_first: bool = False,
    limited_amount_days: int = 100,  # NOTE theres multiple entries per day and we want to limit the amount of days
) -> ExerciseSpecificData:
    query = db.query(ExerciseSpecificData).filter(
        ExerciseSpecificData.user_id == user_id
    )
    subquery = (
        db.query(ExerciseSpecificData.recorded_at.cast(Date).label("recorded_date"))
        .distinct()
        .order_by(ExerciseSpecificData.recorded_at.desc())
        .limit(limited_amount_days)
        .subquery()
    )
    query = query.join(
        subquery,
        func.date(ExerciseSpecificData.recorded_at) == subquery.c.recorded_date,
    )
    if last_x_days > 0:
        timeframe = (
            datetime.utcnow() + timedelta(days=timeTravelAmount)
        ).date() - timedelta(days=last_x_days)
        query = query.filter(ExerciseSpecificData.recorded_at >= timeframe)
    if order or newest_first:
        if newest_first:
            query = query.order_by(ExerciseSpecificData.recorded_at.desc())
        else:
            query = query.order_by(ExerciseSpecificData.recorded_at)

    return db.exec(query)


def get_exercise_name_from_id(db: Session, exercise_id: int):
    return db.query(Exercises).filter(Exercises.id == exercise_id).first().name


def get_exercise_id_from_name(db: Session, exercise_name: str):
    return db.query(Exercises).filter(Exercises.name == exercise_name).first().id


def get_exercise_specific_data_from_name(db: Session, exercise_name: str):
    exercise_name = exercise_name.lower()

    def remove_suffix(word, suffix):
        if word.endswith(suffix):
            return word[: -len(suffix)]
        return word

    def remove_numbers_from_string(string: str) -> str:
        return "".join([char for char in string if not char.isdigit()]).strip()

    def remove_number_in_brackets_from_string(string: str) -> str:
        return re.sub(r"\(\d+\)", "", string).strip()

    def create_permutation_of_name(name: str):
        name_without_numbers = (
            remove_numbers_from_string(name).replace("(", "").replace(")", "").strip()
        )
        name_without_parenthesis = remove_number_in_brackets_from_string(
            name_without_numbers
        )
        return list(
            set(
                [
                    name,
                    remove_suffix(name, "s"),
                    remove_suffix(name, "es"),
                    remove_suffix(name, "ing"),
                    remove_suffix(name.replace("-", " "), "s"),
                    remove_suffix(name.replace("-", " "), "es"),
                    remove_suffix(name.replace("-", " "), "ing"),
                    name_without_numbers,
                    name_without_parenthesis,
                    remove_suffix(name_without_numbers, "s"),
                    remove_suffix(name_without_numbers, "es"),
                    remove_suffix(name_without_numbers, "ing"),
                    remove_suffix(name_without_numbers.replace("-", " "), "s"),
                    remove_suffix(name_without_numbers.replace("-", " "), "es"),
                    remove_suffix(name_without_numbers.replace("-", " "), "ing"),
                    remove_suffix(name_without_parenthesis, "s"),
                    remove_suffix(name_without_parenthesis, "es"),
                    remove_suffix(name_without_parenthesis, "ing"),
                    remove_suffix(name_without_parenthesis.replace("-", " "), "s"),
                    remove_suffix(name_without_parenthesis.replace("-", " "), "es"),
                    remove_suffix(name_without_parenthesis.replace("-", " "), "ing"),
                ]
            )
        )

    res = (
        db.query(Exercises).filter(func.lower(Exercises.name) == exercise_name).first()
    )
    if not res:
        for name in create_permutation_of_name(exercise_name):
            res = db.query(Exercises).filter(func.lower(Exercises.name) == name).first()
            if res:
                break
    return res


def get_exercise_specific_data_from_id(db: Session, exercise_id: int):
    return db.query(Exercises).filter(Exercises.id == exercise_id).first()


def get_weight_diagram_data(
    db: Session,
    user_id: int,
    last_x_days: int = 90,
    order: bool = False,
    newest_first: bool = False,
    limited_amount: int = 100,
):
    query = db.query(WeightData).filter(WeightData.user_id == user_id)
    if last_x_days > 0:
        timeframe = datetime.utcnow().date() - timedelta(days=last_x_days)
        query = query.filter(WeightData.recorded_at >= timeframe)
    if order:
        if newest_first:
            query = query.order_by(WeightData.recorded_at.desc())
        else:
            query = query.order_by(WeightData.recorded_at)
    if limited_amount > 0:
        query = query.limit(limited_amount)
    return db.exec(query)


def get_last_weight_entry(db: Session, user_id: int):
    return (
        db.query(WeightData)
        .filter(WeightData.user_id == user_id)
        .order_by(WeightData.recorded_at.desc())
        .first()
    )


def get_sleep_diagram_data(
    db: Session,
    user_id: int,
    last_x_days: int = 90,
    order: bool = False,
    newest_first: bool = False,
    limited_amount: int = 100,
) -> SleepData:
    query = db.query(SleepData).filter(SleepData.user_id == user_id)
    if last_x_days > 0:
        timeframe = datetime.utcnow().date() - timedelta(days=last_x_days)
        query = query.filter(SleepData.recorded_at >= timeframe)
    if order or newest_first:
        if newest_first:
            query = query.order_by(SleepData.recorded_at.desc())
        else:
            query = query.order_by(SleepData.recorded_at)
    if limited_amount > 0:
        query = query.limit(limited_amount)

    return db.exec(query)


def get_last_sleep_entry(
    db: Session, user_id: int, recorded_at: Optional[date] = None
) -> SleepData:
    if recorded_at is not None:
        return (
            db.query(SleepData)
            .filter(SleepData.user_id == user_id)
            .filter(SleepData.recorded_at == recorded_at)
            .first()
        )
    return (
        db.query(SleepData)
        .filter(SleepData.user_id == user_id)
        .order_by(SleepData.recorded_at.desc())
        .first()
    )


def get_nutrition_diagram_data(
    db: Session,
    user_id: int,
    last_x_days: int = 90,
    order: bool = False,
    newest_first: bool = False,
    limited_amount: int = 100,
):
    query = db.query(NutritionData).filter(NutritionData.user_id == user_id)
    if last_x_days > 0:
        timeframe = datetime.utcnow().date() - timedelta(days=last_x_days)
        query = query.filter(NutritionData.recorded_at >= timeframe)
    if order or newest_first:
        if newest_first:
            query = query.order_by(NutritionData.recorded_at.desc())
        else:
            query = query.order_by(NutritionData.recorded_at)
    if limited_amount > 0:
        query = query.limit(limited_amount)

    return db.exec(query)


def add_diagram_data(db: Session, user_id: int, title: str, unit: str = ""):
    if db.query(DiagramData).filter_by(title=title, user_id=user_id).first():
        return

    _newDiagramData = DiagramData(title=title, data=[], user_id=user_id, unit=unit)
    db.add(_newDiagramData)
    db.commit()
    return _newDiagramData


def add_or_update_diagram_data_point(
    db: Session,
    user_id: int,
    data: dict[str, Any],
    title: str,
    unit: str = "",
    specific_date: Optional[date] = None,
):
    diagram_data_list: DiagramData = (
        db.query(DiagramData)
        .filter(DiagramData.user_id == user_id)
        .filter(DiagramData.title == title)
        .first()
    )

    if not diagram_data_list:
        add_diagram_data(db, user_id, title, unit)
        diagram_data_list = (
            db.query(DiagramData)
            .filter(DiagramData.user_id == user_id)
            .filter(DiagramData.title == title)
            .first()
        )

    if specific_date:
        updated = False
        for item in diagram_data_list.data:
            if item.get("date") == specific_date.isoformat():
                item.update(data)
                updated = True
                break
        if not updated:
            diagram_data_list.data.append(data)
    else:
        if diagram_data_list.data:
            if diagram_data_list.data[-1].get("date") == data.get("date"):
                diagram_data_list.data[-1] = data
            else:
                diagram_data_list.data.append(data)
        else:
            diagram_data_list.data = [data]

    # Remove duplicates and keep the latest entry
    unique_data = {}
    for item in diagram_data_list.data:
        unique_data[item["date"]] = item

    # Sort the data by date
    sorted_data = sorted(unique_data.values(), key=lambda x: x["date"])
    diagram_data_list.data = sorted_data
    flag_modified(
        diagram_data_list, "data"
    )  # sqlalchemy doesnt like dict update in list
    db.add(diagram_data_list)
    db.commit()
    return diagram_data_list


def get_user_diagram_data(db: Session, user_id: int, title: str = "all"):
    if title == "all":
        diagram_data_list = (
            db.query(DiagramData).filter(DiagramData.user_id == user_id).all()
        )
        return diagram_data_list

    diagram_data_list = (
        db.query(DiagramData)
        .filter(DiagramData.user_id == user_id)
        .filter(DiagramData.title == title)
        .first()
    )
    if not diagram_data_list:
        return

    return diagram_data_list


def create_daily_allowances_user(
    db: Session, user_id: int, default_allowances: bool = False
):
    _subscription = get_subscription(db=db, user_id=user_id)
    daily_transcriptions = 0
    daily_processings = 0
    daily_formattings = 0
    daily_embeddings = 0
    total_tokens = 0
    daily_images = 0
    if _subscription is None and not default_allowances:
        raise Exception("No subscription found for user")
    if default_allowances:
        daily_transcriptions = DAILY_TRANSCRIPTIONS_PREMIUM
    else:
        daily_transcriptions = (
            DAILY_TRANSCRIPTIONS_PREMIUM
            if _subscription.subscription_tier == "Phaero Premium"
            else DAILY_TRANSCRIPTIONS_DEFAULT
        )

    daily_processings = DAILY_PROCESSINGS
    daily_image_to_text = DAILY_IMAGES_TO_TEXT_DEFAULT
    daily_formattings = DAILY_FORMATTINGS_DEFAULT
    daily_embeddings = DAILY_EMBEDDINGS_DEFAULT
    total_tokens = DAILY_TOKENS_ALLOWANCE
    daily_images = DAILY_IMAGES
    _dailyAllowances = DailyAllowancesUser(
        user_id=user_id,
        daily_transcriptions=daily_transcriptions,
        daily_processings=daily_processings,
        daily_image_to_text=daily_image_to_text,
        daily_formattings=daily_formattings,
        daily_embeddings=daily_embeddings,
        total_tokens=total_tokens,
        daily_images=daily_images,
    )
    db.add(_dailyAllowances)
    db.commit()
    db.refresh(_dailyAllowances)
    return _dailyAllowances


def get_daily_allowance_formatting(db: Session, user_id: int) -> tuple[int, bool]:
    """Returns Allowance and True if user has daily formatting allowance, else False"""
    _dailyAllowances = (
        db.query(DailyAllowancesUser)
        .filter(DailyAllowancesUser.user_id == user_id)
        .first()
    )
    if _dailyAllowances is None:
        raise Exception("No daily allowances found for user")
    if _dailyAllowances.daily_formatting <= 0:
        return 0, False
    else:
        return _dailyAllowances.daily_formatting, True


def set_daily_allowance_formatting(db: Session, user_id: int, amount: int):
    _dailyAllowances = (
        db.query(DailyAllowancesUser)
        .filter(DailyAllowancesUser.user_id == user_id)
        .first()
    )
    _dailyAllowances.daily_formatting = amount
    db.add(_dailyAllowances)
    db.commit()


def reset_daily_allowances_user(db: Session, user_id: int):
    _dailyAllowances: DailyAllowancesUser = (
        db.query(DailyAllowancesUser)
        .filter(DailyAllowancesUser.user_id == user_id)
        .first()
    )
    if _dailyAllowances is None:
        raise Exception("No daily allowances found for user")
    _subscription = get_subscription(db=db, user_id=user_id)
    if not _subscription:
        print("No subscription found for user", user_id)
        _dailyAllowances.daily_transcriptions = DAILY_TRANSCRIPTIONS_DEFAULT
        _dailyAllowances.daily_processings = DAILY_PROCESSINGS
        _dailyAllowances.daily_image_to_text = DAILY_IMAGES_TO_TEXT_DEFAULT
        _dailyAllowances.daily_formatting = DAILY_FORMATTINGS_DEFAULT
        _dailyAllowances.daily_embeddings = DAILY_EMBEDDINGS_DEFAULT
        _dailyAllowances.total_tokens = DAILY_TOKENS_ALLOWANCE
        _dailyAllowances.daily_images = DAILY_IMAGES
        _dailyAllowances.daily_chats = DAILY_CHATS
        db.add(_dailyAllowances)
        db.commit()
        return _dailyAllowances
    dailyTranscriptionAllowance = (
        DAILY_TRANSCRIPTIONS_PREMIUM
        if _subscription.subscription_tier == "Phaero Premium"
        else DAILY_TRANSCRIPTIONS_DEFAULT
    )
    if (
        _dailyAllowances.last_reset == datetime.utcnow().date()
    ):  # idempotency for a single day
        return
    _dailyAllowances.daily_transcriptions = dailyTranscriptionAllowance
    _dailyAllowances.daily_processings = DAILY_PROCESSINGS
    _dailyAllowances.daily_image_to_text = DAILY_IMAGES_TO_TEXT_DEFAULT
    _dailyAllowances.daily_formatting = DAILY_FORMATTINGS_DEFAULT
    _dailyAllowances.daily_embeddings = DAILY_EMBEDDINGS_DEFAULT
    _dailyAllowances.total_tokens += DAILY_TOKENS_ALLOWANCE
    _dailyAllowances.daily_images = DAILY_IMAGES
    _dailyAllowances.daily_chats = DAILY_CHATS
    _dailyAllowances.last_reset = datetime.utcnow().date()
    db.add(_dailyAllowances)
    db.commit()
    db.refresh(_dailyAllowances)
    return _dailyAllowances


def get_allowance_tokens(db: Session, user_id: int) -> int:
    _dailyAllowances = (
        db.query(DailyAllowancesUser)
        .filter(DailyAllowancesUser.user_id == user_id)
        .first()
    )
    if _dailyAllowances is None:
        raise Exception("No daily allowances found for user")
    return _dailyAllowances.total_tokens


def set_allowance_tokens(db: Session, user_id: int, amount: int):
    _dailyAllowances = (
        db.query(DailyAllowancesUser)
        .filter(DailyAllowancesUser.user_id == user_id)
        .first()
    )
    _dailyAllowances.total_tokens = amount
    db.add(_dailyAllowances)
    db.commit()


def get_daily_allowance_embedding(db: Session, user_id: int) -> tuple[int, bool]:
    """Returns Allowance and True if user has daily embedding allowance, else False"""
    _dailyAllowances = (
        db.query(DailyAllowancesUser)
        .filter(DailyAllowancesUser.user_id == user_id)
        .first()
    )
    if _dailyAllowances is None:
        raise Exception("No daily allowances found for user")
    if _dailyAllowances.daily_embeddings <= 0:
        return 0, False
    else:
        return _dailyAllowances.daily_embeddings, True


def set_daily_allowance_embedding(db: Session, user_id: int, amount: int):
    _dailyAllowances = (
        db.query(DailyAllowancesUser)
        .filter(DailyAllowancesUser.user_id == user_id)
        .first()
    )
    _dailyAllowances.daily_embeddings = amount
    db.add(_dailyAllowances)
    db.commit()


def reduce_daily_allowance_embedding(db: Session, user_id: int) -> DailyAllowancesUser:
    """Reduces daily embedding allowance by 1"""
    _dailyAllowances = (
        db.query(DailyAllowancesUser)
        .filter(DailyAllowancesUser.user_id == user_id)
        .first()
    )
    if _dailyAllowances is None:
        raise Exception("No daily allowances found for user")
    if _dailyAllowances.daily_embeddings <= 0:
        raise Exception("Negative allowance for daily embedding. Check logic.")
    _dailyAllowances.daily_embeddings -= 1
    db.add(_dailyAllowances)
    db.commit()
    db.refresh(_dailyAllowances)
    return _dailyAllowances


def reduce_daily_allowance_chat(db: Session, user_id: int) -> DailyAllowancesUser:
    """Reduces daily chat allowance by 1"""
    _dailyAllowances: DailyAllowancesUser = (
        db.query(DailyAllowancesUser)
        .filter(DailyAllowancesUser.user_id == user_id)
        .first()
    )
    if _dailyAllowances is None:
        raise Exception("No daily allowances found for user")
    if _dailyAllowances.daily_chats <= 0:
        raise Exception("Negative allowance for daily chat. Check logic.")
    _dailyAllowances.daily_chats -= 1
    db.add(_dailyAllowances)
    db.commit()
    db.refresh(_dailyAllowances)
    return _dailyAllowances


def get_daily_allowance_chat(db: Session, user_id: int) -> tuple[int, bool]:
    """Returns Allowance and True if user has daily chat allowance, else False"""
    _dailyAllowances: DailyAllowancesUser = (
        db.query(DailyAllowancesUser)
        .filter(DailyAllowancesUser.user_id == user_id)
        .first()
    )
    if _dailyAllowances is None:
        raise Exception("No daily allowances found for user")
    if _dailyAllowances.daily_chats <= 0:
        return 0, False
    else:
        return _dailyAllowances.daily_chats, True


def get_daily_allowance_image(db: Session, user_id: int) -> tuple[int, bool]:
    """Returns Allowance and True if user has daily image allowance, else False"""
    _dailyAllowances = (
        db.query(DailyAllowancesUser)
        .filter(DailyAllowancesUser.user_id == user_id)
        .first()
    )
    if _dailyAllowances is None:
        raise Exception("No daily allowances found for user")
    if _dailyAllowances.daily_images <= 0:
        return 0, False
    else:
        return _dailyAllowances.daily_images, True


def set_daily_allowance_image(db: Session, user_id: int, amount: int):
    _dailyAllowances = (
        db.query(DailyAllowancesUser)
        .filter(DailyAllowancesUser.user_id == user_id)
        .first()
    )
    _dailyAllowances.daily_images = amount
    db.add(_dailyAllowances)
    db.commit()


def reduce_daily_allowance_image(db: Session, user_id: int) -> DailyAllowancesUser:
    """Reduces daily image allowance by 1"""
    _dailyAllowances = (
        db.query(DailyAllowancesUser)
        .filter(DailyAllowancesUser.user_id == user_id)
        .first()
    )
    if _dailyAllowances is None:
        raise Exception("No daily allowances found for user")
    if _dailyAllowances.daily_images <= 0:
        raise Exception("Negative allowance for daily image. Check logic.")
    _dailyAllowances.daily_images -= 1
    db.add(_dailyAllowances)
    db.commit()
    db.refresh(_dailyAllowances)
    return _dailyAllowances


def get_daily_allowance_transcription(db: Session, user_id: int) -> tuple[int, bool]:
    """Returns Allowance and True if user has daily transcription allowance, else False"""
    _dailyAllowances = (
        db.query(DailyAllowancesUser)
        .filter(DailyAllowancesUser.user_id == user_id)
        .first()
    )
    if _dailyAllowances is None:
        raise Exception("No daily allowances found for user")
    if _dailyAllowances.daily_transcriptions <= 0:
        return 0, False
    else:
        return _dailyAllowances.daily_transcriptions, True


def get_daily_allowance_processing(db: Session, user_id: int) -> tuple[int, bool]:
    """Returns Allowance and True if user has daily processings allowance, else False"""
    _dailyAllowances = (
        db.query(DailyAllowancesUser)
        .filter(DailyAllowancesUser.user_id == user_id)
        .first()
    )
    if _dailyAllowances is None:
        raise Exception("No daily allowances found for user")
    if _dailyAllowances.daily_processings <= 0:
        return 0, False
    else:
        return _dailyAllowances.daily_processings, True


def set_daily_image_to_text(db: Session, user_id: int, amount: int):
    _dailyAllowances = (
        db.query(DailyAllowancesUser)
        .filter(DailyAllowancesUser.user_id == user_id)
        .first()
    )
    _dailyAllowances.daily_image_to_text = amount
    db.add(_dailyAllowances)
    db.commit()


def get_daily_image_to_text(db: Session, user_id: int) -> tuple[int, bool]:
    """Returns Allowance and True if user has daily image to text allowance, else False"""
    _dailyAllowances = (
        db.query(DailyAllowancesUser)
        .filter(DailyAllowancesUser.user_id == user_id)
        .first()
    )
    if _dailyAllowances is None:
        raise Exception("No daily allowances found for user")
    if _dailyAllowances.daily_image_to_text <= 0:
        return 0, False
    else:
        return _dailyAllowances.daily_image_to_text, True


def reduce_daily_image_to_text(db: Session, user_id: int) -> DailyAllowancesUser:
    """Reduces daily image to text allowance by 1"""
    _dailyAllowances = (
        db.query(DailyAllowancesUser)
        .filter(DailyAllowancesUser.user_id == user_id)
        .first()
    )
    if _dailyAllowances is None:
        print("No daily allowances found for user")
    if _dailyAllowances.daily_image_to_text <= 0:
        print("Negative allowance for daily image to text. Check logic.")
    _dailyAllowances.daily_image_to_text -= 1
    db.add(_dailyAllowances)
    db.commit()
    db.refresh(_dailyAllowances)
    return _dailyAllowances


def reduce_daily_allowance_processing(db: Session, user_id: int) -> DailyAllowancesUser:
    """Reduces daily processing allowance by 1"""
    _dailyAllowances = (
        db.query(DailyAllowancesUser)
        .filter(DailyAllowancesUser.user_id == user_id)
        .first()
    )
    if _dailyAllowances is None:
        raise Exception("No daily allowances found for user")
    if _dailyAllowances.daily_processings <= 0:
        raise Exception("Negative allowance for daily processing. Check logic.")
    _dailyAllowances.daily_processings -= 1
    db.add(_dailyAllowances)
    db.commit()
    db.refresh(_dailyAllowances)
    return _dailyAllowances


def set_daily_allowance_processing(db: Session, user_id: int, amount: int):
    _dailyAllowances = (
        db.query(DailyAllowancesUser)
        .filter(DailyAllowancesUser.user_id == user_id)
        .first()
    )
    _dailyAllowances.daily_processings = amount
    db.add(_dailyAllowances)
    db.commit()


def reduce_daily_allowance_transcription(
    db: Session, user_id: int
) -> DailyAllowancesUser:
    """Reduces daily transcription allowance by 1"""
    _dailyAllowances = (
        db.query(DailyAllowancesUser)
        .filter(DailyAllowancesUser.user_id == user_id)
        .first()
    )
    if _dailyAllowances is None:
        raise Exception("No daily allowances found for user")
    if _dailyAllowances.daily_transcriptions <= 0:
        raise Exception("Negative allowance for daily transcription. Check logic.")
    _dailyAllowances.daily_transcriptions -= 1
    db.add(_dailyAllowances)
    db.commit()
    db.refresh(_dailyAllowances)
    return _dailyAllowances


def set_daily_allowance_transcription(db: Session, user_id: int, amount: int):
    _dailyAllowances = (
        db.query(DailyAllowancesUser)
        .filter(DailyAllowancesUser.user_id == user_id)
        .first()
    )
    _dailyAllowances.daily_transcriptions = amount
    db.add(_dailyAllowances)
    db.commit()


def create_user_settings(db: Session, user_id: int) -> UserSettings:
    _userSettings = UserSettings(
        user_id=user_id,
    )
    db.add(_userSettings)
    db.commit()
    db.refresh(_userSettings)
    return _userSettings


def get_settings(db: Session, user_id: int) -> Optional[UserSettings]:
    return db.query(UserSettings).filter(UserSettings.user_id == user_id).first()


def update_settings_user(
    db: Session,
    user_id: int,
    language: str = None,
    timezone: str = None,
    auto_process: bool = None,
):
    _settings = get_settings(db=db, user_id=user_id)
    if _settings is None:
        raise Exception("No settings found for user")
    if language is not None:
        _settings.language = language
    if timezone is not None:
        _settings.timezone = timezone
    if auto_process is not None:
        _settings.auto_process = auto_process
    db.add(_settings)
    db.commit()


def create_subscription_user(
    db: Session,
    customer_id: str = "",
    subscription_status: str = "inactive",
    subscription_tier: str = "",
    user_id: int = None,
) -> Subscription:
    _subscription = Subscription(
        customer_id=customer_id,
        subscription_status=subscription_status,
        subscription_tier=subscription_tier,
        user_id=user_id,
    )
    db.add(_subscription)
    db.commit()
    db.refresh(_subscription)
    return _subscription


def update_subscription_user(
    db: Session,
    user_id: int,
    subscription_status: str = "",
    customer_id: str = "",
    expires_on: date = None,
) -> Subscription:
    _subscription = (
        db.query(Subscription).filter(Subscription.user_id == user_id).first()
    )
    if _subscription is None:
        raise Exception("No subscription found for user")
    if subscription_status:
        _subscription.subscription_status = subscription_status
    if customer_id:
        _subscription.customer_id = customer_id
    if expires_on:
        _subscription.expires_on = expires_on
    db.add(_subscription)
    db.commit()
    db.refresh(_subscription)
    return _subscription


def update_or_create_subscription_customer_id(
    db: Session,
    user_id: int = None,
    subscription_status: str = "",
    subscription_tier: str = "",
    customer_id: str = "",
    email: str = "",
    expires_on: date = None,
) -> Subscription:
    _subscription = (
        db.query(Subscription).filter(Subscription.customer_id == customer_id).first()
    )
    if _subscription is None:
        _subscription = (
            db.query(Subscription).filter(Subscription.user_id == user_id).first()
        )
        if _subscription is None:
            _subscription = create_subscription_user(
                db=db,
                subscription_status=subscription_status,
                customer_id=customer_id,
                user_id=user_id,
                subscription_tier=subscription_tier,
            )
    if user_id:
        _subscription.user_id = user_id
    if email and _subscription.user_id is None:
        _subscription.email = email
        user_id = get_user_by_email(db=db, email=email).id
        _subscription.user_id = user_id
    if subscription_status != "":
        _subscription.subscription_status = subscription_status
    if expires_on:
        _subscription.expires_on = expires_on
    if subscription_tier:
        _subscription.subscription_tier = subscription_tier
    db.add(_subscription)
    db.commit()
    db.refresh(_subscription)
    return _subscription


def get_subscription(db: Session, user_id: int) -> Optional[Subscription]:
    return db.query(Subscription).filter(Subscription.user_id == user_id).first()


def create_or_get_survey_data_user(
    db: Session, user_id: int, survey_type: str, survey_dict: dict, specific_date: date
) -> SurveyData:
    """
    sleepQuestion1: [false, "Did it take you a long time to fall asleep? (>30min)"],
    sleepQuestion2: [false, "Did you wake up during the night?"],
    sleepQuestion3: [false, "Did you still feel tired when you woke up?"],
    sleepQuestion4: [false, "Did you feel tired during the day?"],
    sleepQuestion5: [false, "Did you have a lack of energy during the day?"],
    """
    boolValueList = []
    for question, boolValueQuestionStrTuple in survey_dict.items():
        boolValue, question = boolValueQuestionStrTuple
        boolValueList.append(boolValue)
    surveyForToday = (
        db.query(SurveyData)
        .filter(SurveyData.user_id == user_id)
        .filter(SurveyData.survey_type == survey_type)
        .filter(SurveyData.recorded_at == specific_date)
        .first()
    )
    if surveyForToday:
        return surveyForToday

    _surveyData = SurveyData(
        user_id=user_id,
        survey_type=survey_type,
        answer1=boolValueList[0],
        answer2=boolValueList[1],
        answer3=boolValueList[2],
        answer4=boolValueList[3],
        answer5=boolValueList[4],
        recorded_at=specific_date,
    )
    db.add(_surveyData)
    db.commit()
    db.refresh(_surveyData)
    return _surveyData


def get_survey_data_user(
    db: Session,
    user_id: int,
    last_x_days: int = 90,
    order: bool = False,
    newest_first: bool = False,
    limited_amount: int = 100,
) -> SurveyData:
    query = db.query(SurveyData).filter(SurveyData.user_id == user_id)
    if last_x_days > 0:
        timeframe = datetime.utcnow().date() - timedelta(days=last_x_days)
        query = query.filter(SurveyData.recorded_at >= timeframe)
    if order or newest_first:
        if newest_first:
            query = query.order_by(SurveyData.recorded_at.desc())
        else:
            query = query.order_by(SurveyData.recorded_at)
    if limited_amount > 0:
        query = query.limit(limited_amount)
    return db.exec(query)


def update_today_survey(
    db: Session,
    user_id: int,
    survey_type: str,
    answers: list[bool],
    specific_date: date,
):
    surveyData = (
        db.query(SurveyData)
        .filter(SurveyData.user_id == user_id)
        .filter(SurveyData.survey_type == survey_type)
        .filter(SurveyData.recorded_at == specific_date)
        .first()
    )
    if surveyData is None:
        return None
    surveyData.answer1 = answers[0]
    surveyData.answer2 = answers[1]
    surveyData.answer3 = answers[2]
    surveyData.answer4 = answers[3]
    surveyData.answer5 = answers[4]
    db.add(surveyData)
    db.commit()


def create_basic_tags(db: Session):
    tags = [
        "Headache",
        "Anxiety",
    ]
    all_db_tags = get_all_tag_names(db)
    for tag in tags:
        _tag = Tag(name=tag)
        if _tag.name not in all_db_tags:
            db.add(_tag)
            db.commit()


def get_all_tag_names(db: Session) -> list[str]:
    _tags = db.query(Tag).all()
    return [tag.name for tag in _tags]


def get_all_tags(db: Session) -> list[tuple[int, str]]:
    _tags = db.query(Tag).all()
    return [{"id": tag.id, "name": tag.name} for tag in _tags]


def get_tag_id_from_name(db: Session, tag_name: str) -> int:
    return db.query(Tag).filter(Tag.name == tag_name).first().id


def get_tag_name_from_id(db: Session, tag_id: int) -> str:
    return db.query(Tag).filter(Tag.id == tag_id).first().name


def create_exercise(
    db: Session,
    name: str,
    exercise_type: str,
    duration: bool,
    weight: bool,
    sets: bool,
    reps: bool,
    rest: bool,
    distance: bool,
    calories: bool,
    elevation: bool,
) -> Exercises:
    _exercise = db.query(Exercises).filter(Exercises.name == name).first()
    if _exercise:
        return _exercise

    _exercise = Exercises(
        name=name,
        exercise_type=exercise_type,
        duration=duration,
        weight=weight,
        sets=sets,
        reps=reps,
        reps_in_reserve=reps,
        rest=rest,
        distance=distance,
        calories=calories,
        elevation=elevation,
    )
    db.add(_exercise)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        # Fetch the exercise again after rollback to ensure it's returned if already exists
        _exercise = db.query(Exercises).filter(Exercises.name == name).first()
        if _exercise:
            return _exercise
        else:
            raise

    db.refresh(_exercise)
    return _exercise


def get_all_exercises(db: Session) -> list[Exercises]:
    return db.query(Exercises).all()


def create_embeddings_for_all_notes(db: Session):
    notes = db.query(NoteData).filter(NoteData.embedding == None).all()
    for note in notes:
        if note.embedding is None and note.note:
            note.embedding = get_embedding_from_text(note.note)
    db.commit()


def create_basic_exercises(db: Session):
    create_exercise(
        db, "Dumbbell Row", "weight", False, True, True, True, True, False, False, False
    )
    create_exercise(
        db, "Wrist Roller", "weight", False, True, True, True, True, False, False, False
    )
    create_exercise(
        db, "Wrist Curl", "weight", False, True, True, True, True, False, False, False
    )
    create_exercise(
        db,
        "Forearm Machine",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db, "Butterfly", "weight", False, True, True, True, True, False, False, False
    )
    create_exercise(
        db,
        "Reverse Butterfly",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db, "Bench Press", "weight", False, True, True, True, True, False, False, False
    )
    create_exercise(
        db, "Bicep Curl", "weight", False, True, True, True, True, False, False, False
    )
    create_exercise(
        db,
        "Bicep Curl (Barbell)",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Bicep Rope Curl",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Calf Raise",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db, "Squat", "weight", False, True, True, True, True, False, False, False
    )
    create_exercise(
        db,
        "Stiff Leg Deadlift",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Farmer's Walk",
        "weight",
        False,
        True,
        True,
        True,
        True,
        True,
        False,
        False,
    )
    create_exercise(
        db,
        "Sumo Deadlift",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db, "Deadlift", "weight", False, True, True, True, True, False, False, False
    )
    create_exercise(
        db, "Cable Curl", "weight", False, True, True, True, True, False, False, False
    )
    create_exercise(
        db, "Seated Row", "weight", False, True, True, True, True, False, False, False
    )
    create_exercise(
        db,
        "Shoulder press",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Dumbbell Bench Press",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        elevation=False,
    )
    create_exercise(
        db,
        "Dumbbell Shoulder Press",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Stiff Leg Deadlift",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Romanian Deadlift",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Leg Curl",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Hamstring Curl",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Leg Extension",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Quad Extension",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Paused Squat",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Front Squat",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Paused Bench Press",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Paused Deadlift",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Deficit Deadlift",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Block Pull Deadlift",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Dumbbell Curl",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db, "Barbell Curl", "weight", False, True, True, True, True, False, False, False
    )
    create_exercise(
        db, "Dip Machine", "weight", False, True, True, True, True, False, False, False
    )
    create_exercise(
        db, "Barbell Row", "weight", False, True, True, True, True, False, False, False
    )
    create_exercise(
        db,
        "Sled Leg Press",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db, "Leg Press", "weight", False, True, True, True, True, False, False, False
    )
    create_exercise(
        db,
        "Bent over row",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Skull Crushers",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db, "Cable flyes", "weight", False, True, True, True, True, False, False, False
    )
    create_exercise(
        db,
        "Cable Lateral Raise",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )

    create_exercise(
        db, "Cable Row", "weight", False, True, True, True, True, False, False, False
    )
    create_exercise(
        db, "Face Pulls", "weight", False, True, True, True, True, False, False, False
    )
    create_exercise(
        db,
        "Rear Delt Flyes",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Incline Bench Press",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Incline Dumbbell Bench Press",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Incline Dumbbell Press",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Dips (Weighted)",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Chin Ups (Weighted)",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Pull ups (Weighted)",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Push ups (Weighted)",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Lateral Raise",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Dumbbell Lateral Raise",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db, "Hammer Curl", "weight", False, True, True, True, True, False, False, False
    )
    create_exercise(
        db,
        "Preacher curl",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Tricep extension",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Overhead tricep extension",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Tricep pushdown",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db, "Lat pulldown", "weight", False, True, True, True, True, False, False, False
    )
    create_exercise(
        db,
        "Lat pullovers",
        "weight",
        False,
        True,
        True,
        True,
        True,
        False,
        False,
        False,
    )

    # following are basic cardio exercises
    create_exercise(
        db, "Running", "cardio", True, False, False, False, False, True, True, False
    )
    create_exercise(
        db, "Cycling", "cardio", True, False, False, False, False, True, True, False
    )
    create_exercise(
        db, "Swimming", "cardio", True, False, False, False, False, True, True, False
    )
    create_exercise(
        db, "Rowing", "cardio", True, False, False, False, False, True, True, False
    )
    create_exercise(
        db,
        "Jumping Rope",
        "cardio",
        True,
        False,
        False,
        False,
        False,
        True,
        True,
        False,
    )
    create_exercise(
        db, "Walking", "cardio", True, False, False, False, False, True, True, False
    )
    create_exercise(
        db,
        "Treadmill Walking",
        "cardio",
        True,
        False,
        False,
        False,
        False,
        True,
        True,
        False,
    )
    create_exercise(
        db,
        "Treadmill Running",
        "cardio",
        True,
        False,
        False,
        False,
        False,
        True,
        True,
        False,
    )
    create_exercise(
        db, "Treadmill", "cardio", True, False, False, False, False, True, True, False
    )
    create_exercise(
        db,
        "High Intensity Interval Training (HIIT)",
        "cardio",
        True,
        False,
        False,
        False,
        False,
        True,
        True,
        False,
    )
    create_exercise(
        db,
        "Tennis",
        "cardio",
        True,
        False,
        False,
        False,
        False,
        True,
        True,
        False,
    )
    create_exercise(
        db,
        "Soccer",
        "cardio",
        True,
        False,
        False,
        False,
        False,
        True,
        True,
        False,
    )
    create_exercise(
        db,
        "Basketball",
        "cardio",
        True,
        False,
        False,
        False,
        False,
        True,
        True,
        False,
    )
    create_exercise(
        db,
        "Football",
        "cardio",
        True,
        False,
        False,
        False,
        False,
        True,
        True,
        False,
    )
    create_exercise(
        db,
        "Volleyball",
        "cardio",
        True,
        False,
        False,
        False,
        False,
        True,
        True,
        False,
    )
    create_exercise(
        db,
        "Badminton",
        "cardio",
        True,
        False,
        False,
        False,
        False,
        True,
        True,
        False,
    )
    create_exercise(
        db,
        "Table Tennis",
        "cardio",
        True,
        False,
        False,
        False,
        False,
        True,
        True,
        False,
    )
    create_exercise(
        db,
        "Climbing",
        "cardio",
        True,
        False,
        False,
        False,
        False,
        True,
        True,
        True,
    )
    create_exercise(
        db,
        "Boxing",
        "cardio",
        True,
        False,
        False,
        False,
        False,
        True,
        True,
        False,
    )
    create_exercise(
        db,
        "Kickboxing",
        "cardio",
        True,
        False,
        False,
        False,
        False,
        True,
        True,
        False,
    )
    create_exercise(
        db,
        "Wrestling",
        "cardio",
        True,
        False,
        False,
        False,
        False,
        True,
        True,
        False,
    )
    # following are basic bodyweight exercises
    create_exercise(
        db, "Dips", "bodyweight", False, False, True, True, True, False, False, False
    )
    create_exercise(
        db,
        "Chin Ups",
        "bodyweight",
        False,
        False,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Pull ups",
        "bodyweight",
        False,
        False,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Push ups",
        "bodyweight",
        False,
        False,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db, "Squats", "bodyweight", False, False, True, True, True, False, False, False
    )
    create_exercise(
        db,
        "Planks",
        "bodyweight",
        True,
        False,
        False,
        False,
        False,
        False,
        False,
        False,
    )
    create_exercise(
        db, "Lunges", "bodyweight", False, False, True, True, True, False, False, False
    )
    create_exercise(
        db, "Burpees", "bodyweight", True, False, True, True, True, False, False, False
    )
    create_exercise(
        db, "Sit ups", "bodyweight", True, False, True, True, True, False, False, False
    )
    create_exercise(
        db, "Crunches", "bodyweight", True, False, True, True, True, False, False, False
    )
    create_exercise(
        db,
        "Leg Raises",
        "bodyweight",
        True,
        False,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Mountain Climbers",
        "bodyweight",
        True,
        False,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Russian Twists",
        "bodyweight",
        True,
        False,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Supermans",
        "bodyweight",
        True,
        False,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Jumping Jacks",
        "bodyweight",
        True,
        False,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Wall Sit",
        "bodyweight",
        True,
        False,
        False,
        False,
        False,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Handstand Pushups",
        "bodyweight",
        False,
        False,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Squats",
        "bodyweight",
        False,
        False,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Plank to Pushups",
        "bodyweight",
        False,
        False,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Diamond Pushups",
        "bodyweight",
        False,
        False,
        True,
        True,
        True,
        False,
        False,
        False,
    )

    create_exercise(
        db,
        "Front Lever",
        "bodyweight",
        False,
        False,
        True,
        True,
        True,
        False,
        False,
        False,
    )
    create_exercise(
        db,
        "Skiing",
        "cardio",
        True,
        False,
        False,
        False,
        False,
        True,
        True,
        True,
    )
    create_exercise(
        db,
        "Ski Touring",
        "cardio",
        True,
        False,
        False,
        False,
        False,
        True,
        True,
        True,
    )
    create_exercise(
        db,
        "Snowboarding",
        "cardio",
        True,
        False,
        False,
        False,
        False,
        True,
        True,
        False,
    )
    create_exercise(
        db,
        "Mountain Biking",
        "cardio",
        True,
        False,
        False,
        False,
        False,
        True,
        True,
        True,
    )
    create_exercise(
        db,
        "Mountain Hiking",
        "cardio",
        True,
        False,
        False,
        False,
        False,
        True,
        True,
        True,
    )


def create_model_data(
    db: Session, input_lang, input_text, output_text, type_of_data: str = ""
):
    _modelData = TrainModelData(
        input_lang=input_lang,
        input_text=input_text,
        output_text=output_text,
        type_of_data=type_of_data,
    )
    db.add(_modelData)
    db.commit()
    db.refresh(_modelData)
    return _modelData


def get_checklist_user(db: Session, user_id: int) -> list[ChecklistItem]:
    checklist_items = (
        db.query(ChecklistItem).filter(ChecklistItem.user_id == user_id).all()
    )
    return checklist_items


def get_completed_checklist_items_count(db: Session, user_id: int) -> int:
    return (
        db.query(ChecklistItem)
        .filter(ChecklistItem.user_id == user_id)
        .filter(ChecklistItem.checked == True)
        .count()
    )


def get_checklist_item_by_id(db: Session, user_id: int, id: int) -> ChecklistItem:
    return (
        db.query(ChecklistItem)
        .filter(ChecklistItem.user_id == user_id)
        .filter(ChecklistItem.id == id)
        .first()
    )


def create_checklist_subtask(
    db: Session,
    title: str,
    priority: int,
    expiration_date: str,
    user_id: int,
    parent_id: int,
    repeat_every: int = 0,
):
    expiration_datetime = parser.isoparse(expiration_date)
    expiration_date_obj = expiration_datetime.date()
    _item = ChecklistItem(
        user_id=user_id,
        title=title,
        priority=priority,
        expiration_date=expiration_date_obj,
        checked=False,
        parent_id=parent_id,
        repeat_every=repeat_every,
        subtasks=[],
    )
    db.add(_item)
    _parent_element = get_checklist_item_by_id(db, user_id, parent_id)
    if not _parent_element:
        raise Exception("Parent element not found")
    if _parent_element.subtasks is None:
        _parent_element.subtasks = []
    _parent_element.subtasks.append(_item.id)  # type: ignore
    db.add(_parent_element)
    db.commit()
    db.refresh(_item)
    return _item


def save_checklist_item(
    db: Session,
    title: str,
    priority: int,
    expiration_date: str,
    checked: bool,
    user_id: int,
    id_: int,
    parent_id: Optional[int] = None,
    subtasks: list[ChecklistItemFromFrontend] = [],
    repeat_every: int = 0,
):
    expiration_datetime = parser.isoparse(expiration_date)
    if expiration_datetime.hour > 22:
        expiration_date_obj = (expiration_datetime + timedelta(days=1)).date()
    else:
        expiration_date_obj = expiration_datetime.date()
    _item = (
        db.query(ChecklistItem)
        .filter(ChecklistItem.user_id == user_id)
        .filter(ChecklistItem.id == id_)
        .first()
    )
    if not _item:
        if parent_id:
            _item = create_checklist_subtask(
                db=db,
                title=title,
                priority=priority,
                expiration_date=expiration_date,
                checked=checked,
                user_id=user_id,
                parent_id=parent_id,
                repeat_every=repeat_every,
            )
        else:
            _item = create_checklist_item(
                db=db,
                title=title,
                priority=priority,
                expiration_date=expiration_date,
                user_id=user_id,
                repeat_every=repeat_every,
            )
    for subtask in subtasks:
        save_checklist_item(
            db=db,
            title=subtask.title,
            priority=subtask.priority,
            expiration_date=subtask.expiration_date,
            checked=subtask.checked,
            subtasks=subtask.subtasks,
            parent_id=_item.id,
            user_id=user_id,
            id_=subtask.id,
            repeat_every=subtask.repeat_every,
        )
    _item.title = title
    _item.priority = priority
    _item.expiration_date = expiration_date_obj
    _item.checked = checked
    _item.repeat_every = repeat_every
    db.add(_item)
    db.commit()
    db.refresh(_item)
    return _item


def create_checklist_item(
    db: Session,
    title: str,
    priority: int,
    expiration_date: str,
    user_id: int,
    repeat_every: int = 0,
):
    expiration_datetime = parser.isoparse(expiration_date)
    expiration_date_obj = expiration_datetime.date()
    _item = ChecklistItem(
        user_id=user_id,
        title=title,
        priority=priority,
        expiration_date=expiration_date_obj,
        repeat_every=repeat_every,
    )
    db.add(_item)
    db.commit()
    db.refresh(_item)
    return _item


def delete_checklist_item(db: Session, _id: int, user_id: int):
    _item = (
        db.query(ChecklistItem)
        .filter(ChecklistItem.user_id == user_id)
        .filter(ChecklistItem.id == _id)
        .first()
    )
    if not _item:
        return
    subtasks = (
        db.query(ChecklistItem)
        .filter(ChecklistItem.parent_id == _id)
        .filter(ChecklistItem.user_id == user_id)
        .all()
    )
    parent = (
        db.query(ChecklistItem)
        .filter(ChecklistItem.id == _item.parent_id)
        .filter(ChecklistItem.user_id == user_id)
        .first()
    )
    if parent:
        parent.subtasks = [
            subtask_id for subtask_id in parent.subtasks if subtask_id != _id
        ]
        db.add(parent)
    for subtask in subtasks:
        delete_checklist_item(db, subtask.id, user_id)
        db.delete(subtask)
    db.delete(_item)
    db.commit()
    return


def reset_checklist(db: Session, user_id: int):
    raise Exception("Not implemented")


def get_habits(db: Session, user_id: int) -> list[Habit]:
    habits = db.query(Habit).filter(Habit.user_id == user_id).all()
    return habits


def get_habit_count(db: Session, user_id: int) -> int:
    return db.query(Habit).filter(Habit.user_id == user_id).count()


def create_habit(
    db: Session,
    user_id: int,
    title: str,
    description: str,
    progress: Optional[list[bool]],
    number_progress: Optional[list[int]],
    max_number: Optional[int],
    repeat_every: Optional[int],
    repeat_every_certain_days: Optional[list[int]],
    color: Optional[str],
    recorded_at: str,
    icon: str,
):
    recorded_at_datetime = parser.isoparse(recorded_at)
    recorded_at_date = recorded_at_datetime.date()
    if not progress and not number_progress:
        raise Exception("Progress or number_progress must be set")
    if progress and number_progress:
        raise Exception("Only one of progress or number_progress can be set")
    if repeat_every and repeat_every_certain_days:
        raise Exception(
            "Only one of repeat_every or repeat_every_certain_days can be set"
        )
    if not repeat_every and not repeat_every_certain_days:
        raise Exception("Either repeat_every or repeat_every_certain_days must be set")
    _habit = Habit(
        user_id=user_id,
        title=title,
        description=description,
        progress=progress,
        number_progress=number_progress,
        repeat_every=repeat_every,
        repeat_every_certain_days=repeat_every_certain_days,
        max_number=max_number,
        color=color,
        recorded_at=recorded_at_date,
        icon=icon,
    )
    db.add(_habit)
    db.commit()
    db.refresh(_habit)
    return _habit


def delete_habit_id(db: Session, user_id: int, habit_id: int):
    _habit = (
        db.query(Habit)
        .filter(Habit.user_id == user_id)
        .filter(Habit.id == habit_id)
        .first()
    )
    if not _habit:
        return
    db.delete(_habit)
    db.commit()


def delete_habit_title(db: Session, user_id: int, habit_title: str):
    _habit = (
        db.query(Habit)
        .filter(Habit.user_id == user_id)
        .filter(Habit.title == habit_title)
        .first()
    )
    if not _habit:
        return
    db.delete(_habit)
    db.commit()


def update_habits(db: Session, user_id: int, habits: list[HabitItem]):
    for updatedState in habits:
        _habit: Habit = (
            db.query(Habit)
            .filter(Habit.user_id == user_id)
            .filter(Habit.title == updatedState.title)
            .first()
        )
        if _habit is None:
            create_habit(
                db,
                user_id,
                updatedState.title,
                updatedState.description,
                updatedState.progress,
                updatedState.number_progress,
                updatedState.max_number,
                updatedState.repeat_every,
                updatedState.repeat_every_days,
                updatedState.color,
                updatedState.recorded_at,
                updatedState.icon,
            )
            return
        _habit.title = updatedState.title
        _habit.description = updatedState.description
        _habit.progress = updatedState.progress
        _habit.number_progress = updatedState.number_progress
        _habit.repeat_every = updatedState.repeat_every
        _habit.repeat_every_certain_days = updatedState.repeat_every_days
        _habit.color = updatedState.color
        _habit.max_number = updatedState.max_number
        _habit.recorded_at = parser.isoparse(updatedState.recorded_at).date()
        _habit.icon = updatedState.icon
        db.add(_habit)
    db.commit()


def create_general_goal(db: Session, user_id: int, goal: GeneralGoalType):
    _goal = GeneralGoal(
        user_id=user_id,
        title=goal.title,
        description=goal.description,
        flags=goal.flags,
        progress=goal.progress,
        autoComplete=goal.autoCompletion,
        numberGoals=goal.numberGoals,
        relationType=goal.relationType,
        habit_ids=goal.habit_ids,
        statistic_ids=goal.statistic_ids,
        created_at=datetime.utcnow().date(),
    )
    db.add(_goal)
    db.commit()
    db.refresh(_goal)
    return _goal


def get_general_goals(db: Session, user_id: int) -> list[GeneralGoal]:
    goals = db.query(GeneralGoal).filter(GeneralGoal.user_id == user_id).all()
    return goals


def update_general_goal(db: Session, user_id: int, generalGoal: GeneralGoalType):
    _goal = (
        db.query(GeneralGoal)
        .filter(GeneralGoal.user_id == user_id)
        .filter(GeneralGoal.title == generalGoal.title)
        .filter(GeneralGoal.description == generalGoal.description)
        .first()
    )
    if not _goal:
        create_general_goal(db, user_id, generalGoal)
        return
    _goal.title = generalGoal.title
    _goal.description = generalGoal.description
    _goal.flags = generalGoal.flags
    _goal.progress = generalGoal.progress
    _goal.autoComplete = generalGoal.autoCompletion
    _goal.numberGoals = generalGoal.numberGoals
    _goal.relationType = generalGoal.relationType
    _goal.habit_ids = generalGoal.habit_ids
    _goal.statistic_ids = generalGoal.statistic_ids
    db.add(_goal)
    db.commit()
    db.refresh(_goal)
    return _goal


def delete_general_goal(db: Session, user_id: int, title: str):
    _goal = (
        db.query(GeneralGoal)
        .filter(GeneralGoal.user_id == user_id)
        .filter(GeneralGoal.title == title)
        .first()
    )
    if not _goal:
        return
    db.delete(_goal)
    db.commit()
    return


def get_statistic_data_based_on_goal(
    db: Session, user_id: int, generalGoal: GeneralGoalType
) -> list[DiagramData]:
    goal: GeneralGoal = (
        db.query(GeneralGoal)
        .filter(GeneralGoal.title == generalGoal.title)
        .filter(GeneralGoal.description == generalGoal.description)
        .first()
    )
    if not goal:
        return []
    statistics = db.query(DiagramData).filter(DiagramData.user_id == user_id).all()
    statistics = [
        statistic for statistic in statistics if statistic.id in goal.statistic_ids
    ]
    return statistics


def get_habits_based_on_goal(
    db: Session, user_id: int, generalGoal: GeneralGoalType
) -> list[Habit]:
    goal: GeneralGoal = (
        db.query(GeneralGoal)
        .filter(GeneralGoal.title == generalGoal.title)
        .filter(GeneralGoal.description == generalGoal.description)
        .first()
    )
    if not goal:
        return []
    habits: list[Habit] = db.query(Habit).filter(Habit.user_id == user_id).all()
    habits = [habit for habit in habits if habit.id in goal.habit_ids]
    return habits


def get_previously_used_headlines(
    db: Session, user_id: int, last_x_days: int
) -> list[str]:
    def get_data_from_iterator(iterator):
        data = []
        for tupleObject in iterator:
            data.append(tupleObject[0])
        return data

    _notes: list[NoteData] = get_data_from_iterator(
        get_note_entries(db, user_id, last_x_days=last_x_days, newest_first=True)
    )
    headlines: list[str] = []

    def truncate_headline(max_length: int, headline: str) -> str:
        """Truncate the headline at the first whitespace after the maximum length."""
        if len(headline) <= max_length:
            return headline  # No truncation needed if headline is within the max length

        # Find the first whitespace after the maximum length
        end_index = re.search(r"\s", headline[max_length:])
        if end_index:
            return headline[: max_length + end_index.start()]
        else:
            return headline[:max_length]

    max_length = 35
    for note in _notes:
        text_headlines = re.findall(r"^(#+)\s+(.+)$", note.note, re.MULTILINE)
        headlines.extend(
            [
                truncate_headline(max_length, (" ".join(headline).strip().rstrip(":")))
                for headline in text_headlines
            ]
        )
    headlines = list(set(headlines))
    filtered_prev_headlines = []
    for headline in headlines:
        if len(headline.split("#")) < 2:
            pass
        else:
            filtered_prev_headlines.append(headline)
    return filtered_prev_headlines


def get_all_note_queries(db: Session, user_id: int) -> list[NoteQueries]:
    return db.query(NoteQueries).filter(NoteQueries.user_id == user_id).all()


def get_note_query(db: Session, user_id: int, query: str) -> NoteQueries:
    return (
        db.query(NoteQueries)
        .filter(NoteQueries.user_id == user_id)
        .filter(func.lower(NoteQueries.query) == query.lower().strip())
        .first()
    )


def get_embedding_for_query(db: Session, user_id: int, query: str):
    note_query = get_note_query(db, user_id, query)
    if note_query:
        return note_query.query_embedding
    return None


def save_query_embedding(db: Session, user_id: int, query: str, embedding: list[float]):
    note_query = get_note_query(db, user_id, query)
    if note_query:
        raise Exception("Query already exists")
    else:
        note_query = NoteQueries(
            user_id=user_id, query=query, query_embedding=embedding
        )
        db.add(note_query)
        db.commit()
        db.refresh(note_query)
        return note_query


def create_insight(
    db: Session,
    user_id: int,
    prompt: str,
    result: str,
    used_note_ids: list[int],
    recorded_at: date,
):
    _insight = Insight(
        user_id=user_id,
        prompt=prompt,
        result=result,
        used_note_ids=used_note_ids,
        recorded_at=recorded_at,
    )
    db.add(_insight)
    db.commit()
    db.refresh(_insight)
    return _insight


def get_insight(db: Session, user_id, prompt: str, used_note_ids: list[int]):
    return (
        db.query(Insight)
        .filter(Insight.user_id == user_id)
        .filter(Insight.prompt == prompt)
        .filter(Insight.used_note_ids == used_note_ids)
        .first()
    )


def get_insights(db: Session, user_id: int) -> Insight:
    return db.query(Insight).filter(Insight.user_id == user_id).all()


def get_notes_for_review(
    db: Session, user_id: int, current_date: date
) -> List[NoteData]:
    # Calculate past review milestones
    milestones = [
        7,
        30,
        90,
        180,
        365,
    ]

    notes_to_review = db.query(NoteData).filter(NoteData.user_id == user_id).all()
    notes_to_review = [
        note
        for note in notes_to_review
        if (
            note.next_review <= current_date
            or abs((note.recorded_at - current_date).days) in milestones
        )
    ]

    return notes_to_review


# Function to update note after review
def update_note_review(
    db: Session,
    user_id: int,
    note_id: int,
    recall_score: int,
    review_notes: str,
    next_review: Optional[date] = None,
):
    def calculate_next_review_date(recall_score: int, repetition_number: int):

        last_review_date = date.today()
        if recall_score < 2:
            return last_review_date + timedelta(
                days=1
            )  # repeat the next day if recall was poor
        elif recall_score == 2:
            return last_review_date + timedelta(days=2)
        elif recall_score == 3:
            return last_review_date + timedelta(
                days=2**repetition_number
            )  # increase interval based on repetition number
        elif recall_score == 4:
            return date.today() + timedelta(days=1000)  # repeat after a year
        else:
            return last_review_date

    note: NoteData = (
        db.query(NoteData)
        .filter(NoteData.user_id == user_id)
        .filter(NoteData.id == note_id)
        .first()
    )
    previous_review_date = note.next_review
    if not note.repetition:
        note.repetition = 1
    if not note.review_notes:
        note.review_notes = ""
    note.review_notes = review_notes
    if next_review:
        note.next_review = next_review
    else:  # the above meeans it hasnt been reviewed yet
        note.next_review = calculate_next_review_date(recall_score, note.repetition)
        if previous_review_date != note.next_review:
            note.repetition += 1
    db.add(note)
    db.commit()


from sqlmodel import select


def get_list_of_foods_every_day(
    db: Session, user_id: int, last_x_days: int = 7
) -> list[str]:
    result = db.exec(
        select(NutritionData.list_of_foods)
        .where(NutritionData.user_id == user_id)
        .where(NutritionData.recorded_at >= date.today() - timedelta(days=last_x_days))
    )
    return result.all()  # type: ignore


def get_percentage_of_macronutrient_per_food_for_every_day(
    db: Session, user_id: int, last_x_days: int = 7, macro_nutrient: str = "calories"
) -> list[dict[str, float]]:
    result = db.exec(
        select(ProcessedNoteData.data_json)
        .where(ProcessedNoteData.user_id == user_id)
        .where(
            ProcessedNoteData.recorded_at >= date.today() - timedelta(days=last_x_days)
        )
    )
    processedNotes = result.all()
    percentage_of_calories_per_food = []
    for processedNote in processedNotes:
        if macro_nutrient not in processedNote["Nutrition"]["Total"]["Macros"]:
            continue
        totalofMacro = processedNote["Nutrition"]["Total"]["Macros"][macro_nutrient][0]
        foodList = processedNote["Food"]["FoodList"].keys()
        dayDict = {}
        for food in foodList:
            if (
                totalofMacro == 0
                or macro_nutrient
                not in processedNote["Food"]["FoodList"][food]["Macros"]
            ):
                dayDict[food] = 0
                continue
            dayDict[food] = (
                processedNote["Food"]["FoodList"][food]["Macros"][macro_nutrient][0]
                / totalofMacro
            )
        percentage_of_calories_per_food.append(dayDict)
    return percentage_of_calories_per_food


def get_messages_for_specific_day(
    db: Session, user_id: int, specific_date: date = date.today()
) -> List[MessageData]:
    start_datetime = datetime.combine(specific_date, datetime.min.time())
    end_datetime = datetime.combine(specific_date, datetime.max.time())

    return (
        db.query(MessageData)
        .filter(MessageData.user_id == user_id)
        .filter(MessageData.recorded_at >= start_datetime)
        .filter(MessageData.recorded_at <= end_datetime)
        .order_by(MessageData.recorded_at)
        .all()
    )


def add_system_message_for_day(
    db: Session,
    user_id: int,
    message: str,
    phaero_note_dict: Optional[dict] = None,
    phaero_note_dict_diff: Optional[dict] = None,
    display: Optional[str] = None,
    has_confirmed: Optional[bool] = None,
    specific_date: date = date.today(),
    note_ids: Optional[list[int]] = None,
):
    _message = MessageData(
        user_id=user_id,
        message=message,
        recorded_at=datetime.combine(specific_date, datetime.now().time()),
        typeof_message="system",
    )
    if phaero_note_dict is not None:
        _message.phaero_note_dict = phaero_note_dict
    if phaero_note_dict_diff is not None:
        _message.phaero_note_dict_diff_json = phaero_note_dict_diff
    if display is not None:
        _message.display = display
    if has_confirmed is not None:
        _message.has_confirmed = has_confirmed
    if note_ids:
        _message.used_note_ids = note_ids
    db.add(_message)
    db.commit()
    db.refresh(_message)
    return _message


def add_initial_sys_message_for_day(
    db: Session,
    user_id: int,
    message: str,
    specific_date: date = date.today(),
    display: Optional[str] = None,
    has_confirmed: Optional[bool] = None,
):
    _curr_messages = get_messages_for_specific_day(db, user_id, specific_date)
    print(specific_date, _curr_messages)
    messages = [message.message for message in _curr_messages]
    if message in messages:
        return
    _message = MessageData(
        user_id=user_id,
        message=message,
        recorded_at=datetime.combine(specific_date, datetime.now().time()),
        typeof_message="system",
    )
    if display is not None:
        _message.display = display
    if has_confirmed is not None:
        _message.has_confirmed = has_confirmed
    db.add(_message)
    db.commit()
    db.refresh(_message)
    return _message


def create_unique_for_day_sys_message(
    db: Session,
    user_id: int,
    message: str,
    specific_date: date = date.today(),
    display: Optional[str] = None,
    has_confirmed: Optional[bool] = None,
):
    _curr_messages = get_messages_for_specific_day(db, user_id, specific_date)
    messages = [message.message for message in _curr_messages]
    if message in messages:
        return
    _message = MessageData(
        user_id=user_id,
        message=message,
        recorded_at=datetime.combine(specific_date, datetime.now().time()),
        typeof_message="system",
    )
    if display is not None:
        _message.display = display
    if has_confirmed is not None:
        _message.has_confirmed = has_confirmed
    db.add(_message)
    db.commit()
    db.refresh(_message)
    return _message


def add_user_message_for_day(
    db: Session, user_id: int, message: str, specific_date: date = date.today()
):
    print("Adding user message for day", specific_date)
    _message = MessageData(
        user_id=user_id,
        message=message,
        recorded_at=datetime.combine(specific_date, datetime.now().time()),
        typeof_message="user",
    )
    db.add(_message)
    db.commit()
    db.refresh(_message)
    return _message


def get_avg_wellbeing_score(
    db: Session, user_id: int, last_x_days: Optional[int] = None
) -> float:
    if not last_x_days:
        result = db.exec(
            select(NoteData.wellbeing_score).where(NoteData.user_id == user_id)
        )
    else:
        result = db.exec(
            select(NoteData.wellbeing_score)
            .where(NoteData.user_id == user_id)
            .where(NoteData.recorded_at >= date.today() - timedelta(days=last_x_days))
        )
    wellbeing_scores = result.all()
    if not wellbeing_scores:
        return 0
    return sum(score for score in wellbeing_scores if score) / len(wellbeing_scores)


def get_avg_calories(
    db: Session, user_id: int, last_x_days: Optional[int] = None
) -> float:
    if not last_x_days:
        result = db.exec(
            select(NutritionData.calories).where(NutritionData.user_id == user_id)
        )
    else:
        result = db.exec(
            select(NutritionData.calories)
            .where(NutritionData.user_id == user_id)
            .where(
                NutritionData.recorded_at >= date.today() - timedelta(days=last_x_days)
            )
        )
    calories = result.all()
    if not calories:
        return 0
    return sum(calorie for calorie in calories if calorie) / len(calories)


def get_avg_fluid_Intake(
    db: Session, user_id: int, last_x_days: Optional[int] = None
) -> float:
    if not last_x_days:
        result = db.exec(
            select(NutritionData.fluid).where(NutritionData.user_id == user_id)
        )
    else:
        result = db.exec(
            select(NutritionData.fluid)
            .where(NutritionData.user_id == user_id)
            .where(
                NutritionData.recorded_at >= date.today() - timedelta(days=last_x_days)
            )
        )
    fluid_intake = result.all()
    if not fluid_intake:
        return 0
    return sum(fluid for fluid in fluid_intake if fluid) / len(fluid_intake)


def get_avg_step_count(
    db: Session, user_id: int, last_x_days: Optional[int] = None
) -> float:
    if not last_x_days:
        result = db.exec(
            select(ExerciseData.steps).where(ExerciseData.user_id == user_id)
        )
    else:
        result = db.exec(
            select(ExerciseData.steps)
            .where(ExerciseData.user_id == user_id)
            .where(
                ExerciseData.recorded_at >= date.today() - timedelta(days=last_x_days)
            )
        )
    step_counts = result.all()
    if not step_counts:
        return 0
    return sum(step_count for step_count in step_counts if step_count) / len(
        step_counts
    )


def get_avg_bed_and_wake_up_time_and_duration(
    db: Session, user_id: int, last_x_days: Optional[int] = None
) -> tuple[str, str, str]:
    if not last_x_days:
        result = db.exec(
            select(SleepData.sleep_start, SleepData.sleep_end).where(
                SleepData.user_id == user_id
            )
        )
    else:
        result = db.exec(
            select(SleepData.sleep_start, SleepData.sleep_end)
            .where(SleepData.user_id == user_id)
            .where(SleepData.recorded_at >= date.today() - timedelta(days=last_x_days))
        )
    bed_and_wake_up_times = result.all()
    if not bed_and_wake_up_times:
        return "00:00", "00:00", "00:00"

    bed_and_wake_up_times = [time for time in bed_and_wake_up_times if time]
    bed_times = [time[0] for time in bed_and_wake_up_times]
    wake_up_times = [time[1] for time in bed_and_wake_up_times]

    # Normalize times to handle crossing midnight
    bed_time_seconds = []
    for bed_time in bed_times:
        seconds = bed_time.hour * 3600 + bed_time.minute * 60 + bed_time.second
        if bed_time.hour < 12:
            seconds += 24 * 3600  # Adjust times past midnight
        bed_time_seconds.append(seconds)

    wake_up_time_seconds = [
        (wake_up_time.hour * 3600 + wake_up_time.minute * 60 + wake_up_time.second)
        for wake_up_time in wake_up_times
    ]

    avg_bed_time_seconds = sum(bed_time_seconds) / len(bed_time_seconds)
    avg_wake_up_time_seconds = sum(wake_up_time_seconds) / len(wake_up_time_seconds)

    avg_bed_time = (
        avg_bed_time_seconds % (24 * 3600)
    ) / 3600  # Convert seconds back to hours, normalizing to 24-hour format
    avg_wake_up_time = avg_wake_up_time_seconds / 3600  # Convert seconds back to hours

    # Calculate average duration
    avg_duration_seconds = avg_wake_up_time_seconds - avg_bed_time_seconds
    if avg_duration_seconds < 0:
        avg_duration_seconds += 24 * 3600  # Adjust for crossing midnight

    avg_bed_time_hour = int(avg_bed_time)
    avg_bed_time_minute = int((avg_bed_time - avg_bed_time_hour) * 60)

    avg_wake_up_time_hour = int(avg_wake_up_time)
    avg_wake_up_time_minute = int((avg_wake_up_time - avg_wake_up_time_hour) * 60)

    avg_duration_hour = int(avg_duration_seconds // 3600)
    avg_duration_minute = int((avg_duration_seconds % 3600) // 60)

    avg_bed_time_str = f"{avg_bed_time_hour:02}:{avg_bed_time_minute:02}"
    avg_wake_up_time_str = f"{avg_wake_up_time_hour:02}:{avg_wake_up_time_minute:02}"
    avg_duration_str = f"{avg_duration_hour:02}:{avg_duration_minute:02}"

    return avg_bed_time_str, avg_wake_up_time_str, avg_duration_str


def get_avg_weight(
    db: Session, user_id: int, last_x_days: Optional[int] = None
) -> float:
    if not last_x_days:
        result = db.exec(select(WeightData.amount).where(WeightData.user_id == user_id))
    else:
        result = db.exec(
            select(WeightData.amount)
            .where(WeightData.user_id == user_id)
            .where(WeightData.recorded_at >= date.today() - timedelta(days=last_x_days))
        )
    weights = result.all()
    if not weights:
        return 0
    return sum(weight for weight in weights if weight) / len(weights)
