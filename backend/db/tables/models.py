from email.policy import default
from optparse import Option
from re import S
from pgvector.sqlalchemy import Vector
from token import STRING
from sqlmodel import (
    SQLModel,
    Field,
    Relationship,
    Column,
    String,
    Integer,
    Boolean,
    Float,
)
from sqlalchemy.dialects.postgresql import (
    ARRAY,
    JSONB,
)  # ARRAY contains requires dialect specific type
from sqlalchemy.ext.mutable import Mutable
from datetime import datetime, date, timedelta
from typing import Dict, List, Optional
from core.config import create_settings

settings = create_settings()
timeTravelAmount = settings.timeTravelAmount


class MutableList(Mutable, list):
    def append(self, value):
        list.append(self, value)
        self.changed()

    def pop(self, index=0):
        value = list.pop(self, index)
        self.changed()
        return value

    def remove(self, value):
        list.remove(self, value)
        self.changed()

    def extend(self, value):
        list.extend(self, value)
        self.changed()

    def clear(self):
        list.clear(self)
        self.changed()

    def insert(self, index, value):
        list.insert(self, index, value)
        self.changed()

    def __setitem__(self, index, value):
        list.__setitem__(self, index, value)
        self.changed()

    def __delitem__(self, index):
        list.__delitem__(self, index)
        self.changed()

    @classmethod
    def coerce(cls, key, value):
        if not isinstance(value, MutableList):
            if isinstance(value, list):
                return MutableList(value)
            return Mutable.coerce(key, value)
        else:
            return value


class User(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    username: str = Field(max_length=64, index=True, nullable=False)
    email: str = Field(index=True, unique=True, nullable=False)
    hashed_password: Optional[str] = Field(max_length=128)
    refresh_token: Optional[str] = Field(max_length=256)
    salt: Optional[str] = Field(max_length=32)
    avatar: Optional[str] = Field(max_length=64)
    feedback_state: int = Field(default=0, nullable=False)
    streak: Optional["StreakData"] = Relationship(back_populates="user")
    weights: Optional[List["WeightData"]] = Relationship(back_populates="user")
    sleep_records: Optional[List["SleepData"]] = Relationship(back_populates="user")
    notes: Optional[List["NoteData"]] = Relationship(back_populates="user")
    daily_note: Optional["DailyNoteData"] = Relationship(back_populates="user")
    nutrition_records: Optional[List["NutritionData"]] = Relationship(
        back_populates="user"
    )
    exercise_records: Optional[List["ExerciseData"]] = Relationship(
        back_populates="user"
    )
    feedback_records: Optional[List["Feedback"]] = Relationship(back_populates="user")
    checklist_items: Optional[List["ChecklistItem"]] = Relationship(
        back_populates="user"
    )
    diagram_data: Optional[List["DiagramData"]] = Relationship(back_populates="user")
    processed_notes: Optional[List["ProcessedNoteData"]] = Relationship(
        back_populates="user"
    )
    user_daily_allowances: Optional["DailyAllowancesUser"] = Relationship(
        back_populates="user"
    )
    user_settings: Optional["UserSettings"] = Relationship(back_populates="user")
    goals: Optional["Goal"] = Relationship(back_populates="user")
    gender: Optional[str] = Field(max_length=32)
    height: Optional[int] = Field()
    weight: Optional[int] = Field()
    birthday: Optional[date] = Field()
    personality_summary: Optional[str] = Field()
    current_personality_update_threshold: int = Field(default=0)


class TemporaryProcessedUserNoteData(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    recorded_at: date = Field(index=True, nullable=False)
    data_json: Dict = Field(sa_column=Column(JSONB))
    user_id: int = Field(
        default=None, index=True, foreign_key="user.id", nullable=False
    )


class ProcessedNoteData(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    recorded_at: date = Field(index=True, nullable=False)
    data_json: Dict = Field(sa_column=Column(JSONB))
    user_id: int = Field(
        default=None, index=True, foreign_key="user.id", nullable=False
    )
    user: Optional[User] = Relationship(back_populates="processed_notes")


class StreakData(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    streak: Optional[int] = Field(default=0)
    max_streak: Optional[int] = Field(default=0)
    user_id: int = Field(
        default=None, index=True, foreign_key="user.id", nullable=False
    )
    user: Optional[User] = Relationship(back_populates="streak")
    last_update_time: datetime = Column(
        default=datetime.utcnow(), onupdate=datetime.utcnow()
    )  # onupdate doesn't properly workmake sure it gets reset on first day


class WeightData(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    amount: float = Field()
    recorded_at: date = Field(index=True, nullable=False)
    user_id: int = Field(
        default=None, index=True, foreign_key="user.id", nullable=False
    )
    # caloric_value: Optional[int] = Field()
    user: Optional[User] = Relationship(back_populates="weights")


class SleepData(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sleep_start: datetime = Field(nullable=False)
    sleep_end: datetime = Field(nullable=False)
    sleep_quality: int = Field(nullable=False)
    user_id: int = Field(
        default=None, index=True, foreign_key="user.id", nullable=False
    )
    user: Optional[User] = Relationship(back_populates="sleep_records")
    recorded_at: date = Field(index=True, nullable=False)


class NoteData(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    value_score: Optional[int] = (
        Field()
    )  # optional for now, until we get a score from ai model < is the value of how important the note is
    wellbeing_score: Optional[int] = Field()
    summarizing_description: str = Field(default="")
    tags: Optional[List[int]] = Field(
        sa_column=Column(MutableList.as_mutable(ARRAY(Integer)))
    )
    note: str = Field(nullable=False)
    recorded_at: date = Field(index=True, nullable=False)
    user_id: int = Field(
        default=None, index=True, foreign_key="user.id", nullable=False
    )
    user: Optional[User] = Relationship(back_populates="notes")
    embedding: List[float] = Field(
        sa_column=Column(Vector(1536)), default=[0] * 1536
    )  # 1536 is the size of the embedding | text-embedding-3-small
    attached_images: Optional[List[str]] = Field(
        sa_column=Column(MutableList.as_mutable(ARRAY(String)))
    )
    next_review: date = Field(
        default=datetime.now().date() + timedelta(days=timeTravelAmount)
    )
    review_notes: str = Field(default="")
    repetition: int = Field(default=0)


class MessageData(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        default=None, index=True, foreign_key="user.id", nullable=False
    )
    message: str = Field(default="")
    typeof_message: str = Field(default="system")  # system or user or interactive
    phaero_note_dict: Optional[Dict] = Field(sa_column=Column(JSONB))
    phaero_note_dict_diff_json: Optional[Dict] = Field(sa_column=Column(JSONB))
    has_confirmed: Optional[bool] = Field()
    display: Optional[str] = Field()
    recorded_at: datetime = Field(index=True, nullable=False)
    used_note_ids: Optional[List[int]] = Field(
        sa_column=Column(MutableList.as_mutable(ARRAY(Integer)))
    )  # list of note ids that this message is related to / got created by


class NoteQueries(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        default=None, index=True, foreign_key="user.id", nullable=False
    )
    query: str = Field(default="")
    result: str = Field(default="")
    query_embedding: List[float] = Field(
        sa_column=Column(Vector(1536))
    )  # 1536 is the size of the embedding | text-embedding-3-small


class Insight(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        default=None, index=True, foreign_key="user.id", nullable=False
    )
    recorded_at: date = Field(index=True, nullable=False)
    prompt: str = Field(default="")
    result: str = Field(default="")
    used_note_ids: List[int] = Field(
        sa_column=Column(MutableList.as_mutable(ARRAY(Integer)))
    )


class DailyNoteData(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    note: str = Field(default="")
    user_id: int = Field(
        default=None, index=True, foreign_key="user.id", nullable=False
    )
    user: Optional[User] = Relationship(back_populates="daily_note")
    attached_images: List[str] = Field(
        sa_column=Column(MutableList.as_mutable(ARRAY(String)))
    )
    has_been_formatted: bool = Field(default=False)


class NutritionData(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    calories: Optional[int] = Field()
    fluid: Optional[int] = Field()
    supplements: Optional[str] = Field()
    carbs: Optional[int] = (
        Field()
    )  # optional for now, until we get a score from ai model
    fat: Optional[int] = Field()  # optional for now, until we get a score from ai model
    protein: Optional[int] = (
        Field()
    )  # optional for now, until we get a score from ai model
    sugar: int = Field()
    non_macro: Optional[str] = (
        Field()
    )  # just a long string with "{"Mineral": 100mg, "Vitamin": 100mg}"
    list_of_foods: Optional[str] = Field()  # saved as ['item', 'item2', 'item3']
    recorded_at: date = Field(index=True, nullable=False)
    user_id: int = Field(
        default=None, index=True, foreign_key="user.id", nullable=False
    )
    user: Optional[User] = Relationship(back_populates="nutrition_records")


class ExerciseData(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    # intensity: Optional[int] = Field(
    #     index=True
    # )  # optional for now, until we get a score from ai model, maybe a list of intensities for different Exercises
    calories_burned: Optional[int] = (
        Field()
    )  # optional for now, until we get a score from ai model
    steps: Optional[int] = (
        Field()
    )  # optional for now, until we get a score from ai model
    exercise_information: str = Field(nullable=False)
    relative_activity_level: Optional[float] = Field()
    absolute_activity_level: Optional[float] = Field()
    recorded_at: date = Field(index=True, nullable=False)
    user_id: int = Field(
        default=None, index=True, foreign_key="user.id", nullable=False
    )

    user: Optional[User] = Relationship(back_populates="exercise_records")


class Exercises(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, nullable=False, unique=True)
    exercise_type: str = Field(index=True, nullable=False)
    duration: bool = Field(default=False)
    weight: bool = Field(default=False)
    sets: bool = Field(default=False)
    reps: bool = Field(default=False)
    reps_in_reserve: bool = Field(default=False)
    rest: bool = Field(default=False)
    distance: bool = Field(default=False)
    calories: bool = Field(default=False)
    elevation: bool = Field(default=False)


class ExerciseSpecificData(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        default=None, index=True, foreign_key="user.id", nullable=False
    )
    exercise_id: int = Field(
        default=None, index=True, foreign_key="exercises.id", nullable=False
    )
    duration: Optional[float] = Field()
    weight: Optional[float] = Field()
    sets: Optional[int] = Field()
    reps: Optional[int] = Field()
    reps_in_reserve: Optional[int] = Field()
    rest: Optional[float] = Field()
    distance: Optional[float] = Field()
    calories: Optional[float] = Field()
    elevation: Optional[float] = Field()
    recorded_at: date = Field(index=True, nullable=False)


class Feedback(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        default=None, index=True, foreign_key="user.id", nullable=False
    )
    user: Optional[User] = Relationship(back_populates="feedback_records")
    tasks_text: str = Field(nullable=True)
    weekly_summary: str = Field(nullable=True)
    weekly_delta_information: str = Field(nullable=True)
    weekly_delta_diagram_data: str = Field(nullable=True)
    advice_on_goals: str = Field(nullable=True)
    advice_best_days: str = Field(nullable=True)
    advice_neutral_days: str = Field(nullable=True)
    advice_worst_days: str = Field(nullable=True)
    journal_prompts: str = Field(nullable=True)  # separate by new line
    note_ids: List[int] = Field(
        sa_column=Column(MutableList.as_mutable(ARRAY(Integer)))
    )  # foreign key to note ids (wellbeing patterns)
    title: str = Field(index=True, nullable=True)
    user_judgement: Optional[int] = Field(index=True)  # how the user likes the feedback
    recorded_at: date = Field(index=True, nullable=False)


class DiagramData(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True, nullable=False)
    data: List[Dict] = Field(sa_column=Column(MutableList.as_mutable(JSONB)))
    unit: str = Field(default="")
    user_id: int = Field(
        default=None, index=True, foreign_key="user.id", nullable=False
    )
    user: Optional[User] = Relationship(back_populates="diagram_data")


class ChecklistItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        default=None, index=True, foreign_key="user.id", nullable=False
    )
    title: str = Field(index=True, nullable=False)
    checked: bool = Field(default=False)
    expiration_date: date = Field(default=None, nullable=False)
    priority: int = Field(default=0)
    repeat_every: int = Field(default=0)
    user: Optional[User] = Relationship(back_populates="checklist_items")
    subtasks: List[int] = Field(
        sa_column=Column(MutableList.as_mutable(ARRAY(Integer)))
    )
    parent_id: Optional[int] = Field(default=None, index=True)


class DailyAllowancesUser(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user: Optional[User] = Relationship(back_populates="user_daily_allowances")
    user_id: int = Field(
        default=None, index=True, foreign_key="user.id", nullable=False
    )
    daily_transcriptions: int = Field(default=0)
    daily_processings: int = Field(default=0)
    daily_image_to_text: int = Field(default=0)
    daily_formatting: int = Field(default=0)
    daily_embeddings: int = Field(default=0)
    total_tokens: int = Field(default=0)
    daily_images: int = Field(default=0)
    last_reset: date = Field(default=datetime.now().date(), nullable=False)
    daily_chats: int = Field(default=50)


class UserSettings(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user: Optional[User] = Relationship(back_populates="user_settings")
    user_id: int = Field(
        default=None, index=True, foreign_key="user.id", nullable=False
    )
    timezone: str = Field(default="Europe/Berlin")
    language: str = Field(default="english")
    auto_process: bool = Field(default=True)


# allow Options to create custom Fields / Data to track. (Specific nutritional data) < upsell this feature
# allow tracking of social media
# allow tracking of screen time


class Subscription(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    client_reference_id: Optional[str] = Field()
    customer_id: Optional[str] = Field()
    subscription_status: Optional[str] = Field()
    subscription_tier: Optional[str] = Field()
    email: Optional[str] = Field(unique=True)
    user_id: int = Field(default=None, index=True, foreign_key="user.id", unique=True)
    expires_on: Optional[date] = Field()


# only numerically verifiable goals allowed, weight loss vs better physique
class Goal(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(default=None, index=True, foreign_key="user.id")
    user: Optional[User] = Relationship(back_populates="goals")
    goal: str = Field()
    goal_type: str = Field()
    goal_start: date = Field()
    goal_end: date = Field()


class SurveyData(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id", nullable=False)
    survey_type: str = Field(default="sleep", nullable=False)
    answer1: bool = Field(nullable=False)
    answer2: bool = Field(nullable=False)
    answer3: bool = Field(nullable=False)
    answer4: bool = Field(nullable=False)
    answer5: bool = Field(nullable=False)
    recorded_at: date = Field(nullable=False)


class Tag(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, nullable=False)


class TrainModelData(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    input_lang: str = Field(nullable=False)
    input_text: str = Field(nullable=False)
    output_text: str = Field(nullable=False)
    type_of_data: Optional[str] = Field()


class Habit(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        default=None, index=True, foreign_key="user.id", nullable=False
    )
    title: str = Field(index=True, nullable=False)
    description: str = Field(default="")
    progress: Optional[List[bool]] = Field(
        sa_column=Column(MutableList.as_mutable(ARRAY(Boolean)))
    )
    number_progress: Optional[List[int]] = Field(
        sa_column=Column(MutableList.as_mutable(ARRAY(Integer)))
    )
    max_number: Optional[int] = Field()
    icon: str = Field(default="")  # icon name
    repeat_every: Optional[int] = Field(default=0)
    repeat_every_certain_days: Optional[List[int]] = Field(
        sa_column=Column(MutableList.as_mutable(ARRAY(Integer)))
    )
    color: str = Field(default="")
    recorded_at: date = Field(nullable=False)  # last time the habit was updated


class GeneralGoal(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(
        default=None, index=True, foreign_key="user.id", nullable=False
    )
    title: str = Field(index=True, nullable=False)
    description: str = Field(default="")
    flags: List[str] = Field(sa_column=Column(MutableList.as_mutable(ARRAY(String))))
    progress: List[bool] = Field(
        sa_column=Column(MutableList.as_mutable(ARRAY(Boolean)))
    )
    autoComplete: Optional[bool] = Field(default=False)
    numberGoals: Optional[List[float]] = Field(
        sa_column=Column(MutableList.as_mutable(ARRAY(Float)))
    )
    relationType: Optional[str] = Field(default="")  # icon name
    habit_ids: List[int] = Field(
        sa_column=Column(MutableList.as_mutable(ARRAY(Integer)))
    )
    statistic_ids: List[int] = Field(
        sa_column=Column(MutableList.as_mutable(ARRAY(Integer)))
    )
    created_at: date = Field(nullable=False)  # first time the goal was created
