from optparse import Option
from pydantic import BaseModel, validator
from typing import Any, Optional

import pydantic
from regex import B


class userLoginInformation(BaseModel):
    email_address: str
    password: str


class userSignUpInformation(BaseModel):
    username: str
    email_address: str
    password: str


class emailUserProfile(BaseModel):
    id: str
    email: str
    verified_email: bool
    name: str
    given_name: str
    family_name: str
    picture: str
    locale: str


class authCodeResponse(BaseModel):
    code: str
    scope: str
    authuser: str
    prompt: str


class tokenResponse(BaseModel):
    access_token: str
    expires_in: int
    id_token: str
    refresh_token: str
    scope: str
    token_type: str


class SleepData(BaseModel):
    sleep_start: str
    sleep_end: str
    start_date: str
    end_date: str


class NotesData(BaseModel):
    note: str
    recorded_at: Optional[str]
    # maybe add when it was recorded such that AI model can suggess changing the time to increase credibility


class NoteQuery(BaseModel):
    last_x_days: int
    note: str


class NoteTextQuery(BaseModel):
    last_x_days: int
    text: str


class ExerciseData(BaseModel):
    note: str
    recorded_at: Optional[str]
    # maybe add when it was recorded such that AI model can suggess changing the time to increase credibility


class NutritionData(BaseModel):
    note: str
    recorded_at: Optional[str]
    # maybe add when it was recorded such that AI model can suggess changing the time to increase credibility


class WeightData(BaseModel):
    amount: float
    recorded_at: Optional[str]
    # maybe add when it was recorded such that AI model can suggess changing the time to increase credibility


class DiagramDataPoint(BaseModel):
    title: str
    data: dict


# class SearchData(BaseModel):
#    user_id: int
#    search_term: str
#    last_x_days: Optional[int]


class AccessToken(BaseModel):
    access_token: str


class RefreshToken(BaseModel):
    refresh_token: str


class GoogleAuthCode(BaseModel):
    code: str
    scope: Optional[str]
    authuser: Optional[str]
    prompt: Optional[str]


class IndexJSON(BaseModel):
    index: int


class Note(BaseModel):
    note: str


class NoteWithWellbeing(BaseModel):
    note: str
    score: int


class ProcessedNote(BaseModel):
    note_dict: dict
    recorded_at: Optional[str]


class UpdatedPhaeroNote(BaseModel):
    note_dict: dict


class Food(BaseModel):
    name: str
    amount: str
    portion_size: str
    protein: str
    fat: str
    carbs: str
    sugar: str
    calories: str


class Recipe(BaseModel):
    name: str
    dictFoodIngredients: dict  # ingredient -> grams


class FoodName(BaseModel):
    name: str


class OptionalDate(BaseModel):
    recorded_at: Optional[str]


class CallID(BaseModel):
    call_id: str


class Settings(BaseModel):
    language: str
    timezone: str


class SetupData(BaseModel):
    gender: str
    birthday: str
    height: int
    weight: int


class GoalText(BaseModel):
    goal_text: str


class Language(BaseModel):
    language: str


class Timeframe(BaseModel):
    last_x_days: int


class SubscriptionItem(BaseModel):
    name: str
    plan: str


class Message(BaseModel):
    text_english: str
    text_german: str
    id: str  # Unique identifier or timestamp


class Timezone(BaseModel):
    timezone: str


class PaperQueryJSON(BaseModel):
    query: str


class TestData(BaseModel):
    test_data: list


class ScoresPlusSurveys(BaseModel):
    """
    sleepQuestion1: [false, "Did you fall asleep quickly?"],
    sleepQuestion2: [false, "Did you wake up during the night?"],
    sleepQuestion3: [false, "Did you feel rested when you woke up?"],
    sleepQuestion4: [false, "Did you feel tired during the day?"],
    sleepQuestion5: [false, "Did you have a lack of energy during the day?"],
    --------------------------------------------------------------------------
    wellbeingQuestion5: [false, "Would you like to feel like this more often?"],
    --------------------------------------------------------------------------
    """

    wellbeing_score: int
    sleep_survey: dict[str, tuple[bool, str]]
    attached_tags: list[int]


class SleepSurvey(BaseModel):
    sleep_survey: dict[str, tuple[bool, str]]


class NoteWithUserScores(BaseModel):
    note: str
    scores: ScoresPlusSurveys


class Survey(BaseModel):
    answers: dict[str, list[bool]]
    type: str


class WeekReflection(BaseModel):
    reflection: str


class ProgressIndicatorString(BaseModel):
    progress_indicator: str


class ImageIndices(BaseModel):
    image_indices: list[int]


from typing import ForwardRef


class ChecklistItemFromFrontend(BaseModel):
    title: str
    checked: bool
    expiration_date: str
    priority: int
    repeat_every: int
    subtasks: list["ChecklistItemFromFrontend"] = []
    parent_id: Optional[int] = None
    id: int


ChecklistItemFromFrontend.update_forward_refs()


class ChecklistItems(BaseModel):
    checklist_items: list[ChecklistItemFromFrontend]


class ChecklistItemId(BaseModel):
    checklist_item_id: int


class HabitItem(BaseModel):
    id: int
    title: str
    description: str
    progress: Optional[list[bool]]
    number_progress: Optional[list[int]]
    max_number: Optional[int]
    recorded_at: str
    icon: str
    repeat_every: Optional[int]
    repeat_every_days: Optional[list[int]]
    color: str


class HabitItems(BaseModel):
    habit_items: list[HabitItem]


class GeneralGoalType(BaseModel):
    title: str
    description: str
    flags: list[str]
    progress: list[bool]
    autoCompletion: bool
    relationType: int
    numberGoals: list[float]
    habit_ids: list[int]
    statistic_ids: list[int]


class DiagramDataList(BaseModel):
    title: str
    values: list[float]


class InsightFrontend(BaseModel):
    prompt: str
    result: str
    used_notes: list[str]
    recorded_at: str


class InsightFrontendQuery(BaseModel):
    prompt: str
    start_time: str
    end_time: str


class InsightBackend(BaseModel):
    prompt: str
    result: str
    used_note_ids: list[int]
    recorded_at: str


class MemoryQuery(BaseModel):
    userDate: str


class MemoryReview(BaseModel):
    id: int
    note: str
    review_notes: str
    repetition: int
    recall_score: int
    next_review: str
    recorded_at: str


class MemoryReviews(BaseModel):
    memoryReviews: list[MemoryReview]


class PhaeroNote(BaseModel):
    note: str
    recorded_at: str


from typing import Dict, Tuple, List, Optional, Union
from pydantic import BaseModel
from datetime import date, datetime, timedelta


class Steps(BaseModel):
    steps: int


class ExerciseRating(BaseModel):
    absolute_rating: float
    relative_rating: float = 0.0


class Exercises(BaseModel):
    Bodyweight_Exercises: Dict[str, Any]
    Cardio_Exercises: Dict[str, Any]
    Weight_Lifting_Exercises: Dict[str, Any]
    Other_Exercises: Dict[str, Any]


class Nutrients(BaseModel):
    macros: Dict[str, Tuple[float, str]]
    micros: Dict[str, Tuple[float, str]]


class NotFoundFoodNutrients(BaseModel):
    macros: Dict[str, Tuple[float, str]]
    micros: Dict[str, Tuple[float, str]]
    StatsFrom: str


class FoodList(BaseModel):
    data: Dict[str, Nutrients]


class ListOfSupplements(BaseModel):
    data: List[str]


class NotFoundFood(BaseModel):
    data: Dict[str, NotFoundFoodNutrients]


class Weight(BaseModel):
    weight: float


class SleepQuality(BaseModel):
    quality: int


class SleepStart(BaseModel):
    start: datetime


class SleepEnd(BaseModel):
    end: datetime


class AutoProcess(BaseModel):
    auto_process: bool


class EntryDataDiff(BaseModel):
    diff: dict

    def apply_diff(self, entry_data: "EntryData") -> "EntryData":
        data = entry_data.to_dict()

        def apply_recursive(diff, target):
            for key, value in diff.items():
                if value is None:
                    if key in target:
                        del target[key]
                elif isinstance(value, dict) and isinstance(target.get(key), dict):
                    apply_recursive(value, target[key])
                else:
                    target[key] = value

        apply_recursive(self.diff, data)
        return EntryData.from_dict(data)

    def to_dict(self) -> dict:
        return self.diff


class EntryData(BaseModel):
    exercises: Exercises
    steps: Steps
    exerciseRating: ExerciseRating
    default_sleep_start: Optional[datetime]
    default_sleep_end: Optional[datetime]
    default_weight: Optional[float]
    notFoundFood: NotFoundFood
    foodList: FoodList
    listOfSupplements: ListOfSupplements
    total: Nutrients

    note: str
    wellbeing_rating: int

    sleep_quality: SleepQuality
    sleep_start: SleepStart
    sleep_end: SleepEnd

    weight: Weight

    @classmethod
    def from_dict(
        cls,
        data: dict,
        default_sleep_start: Optional[datetime] = None,
        default_sleep_end: Optional[datetime] = None,
        default_weight: Optional[float] = None,
    ) -> "EntryData":
        # Convert food list and not found foods to proper Nutrients objects
        def convert_to_nutrients(food_data):
            return {
                name: Nutrients(
                    macros={
                        str(k): (float(v[0]), str(v[1]))
                        for k, v in nutrients["Macros"].items()
                    },
                    micros={
                        str(k): (float(v[0]), str(v[1]))
                        for k, v in nutrients.get("Micros", {}).items()
                    },
                )
                for name, nutrients in food_data.items()
            }

        def convert_to_not_found_food_nutrients(food_data):
            return {
                name: NotFoundFoodNutrients(
                    macros={
                        str(k): (float(v[0]), str(v[1]))
                        for k, v in nutrients["Macros"].items()
                    },
                    micros={
                        str(k): (float(v[0]), str(v[1]))
                        for k, v in nutrients.get("Micros", {}).items()
                    },
                    StatsFrom=nutrients.get("StatsFrom", ""),
                )
                for name, nutrients in food_data.items()
            }

        return cls(
            default_sleep_end=default_sleep_end,
            default_sleep_start=default_sleep_start,
            default_weight=default_weight,
            exercises=Exercises(
                Bodyweight_Exercises=data["Exercise"]["Exercises"][
                    "Bodyweight Exercises"
                ],
                Cardio_Exercises=data["Exercise"]["Exercises"]["Cardio Exercises"],
                Weight_Lifting_Exercises=data["Exercise"]["Exercises"][
                    "Weight Lifting Exercises"
                ],
                Other_Exercises=data["Exercise"]["Exercises"]["Other Exercises"],
            ),
            steps=Steps(steps=data["Exercise"]["Steps"]),
            exerciseRating=ExerciseRating(
                absolute_rating=data["Exercise"]["absolute Rating"],
                relative_rating=data["Exercise"]["relative Rating"],
            ),
            notFoundFood=NotFoundFood(
                data=convert_to_not_found_food_nutrients(
                    data["Food"]["Not found foods"]
                )
            ),
            foodList=FoodList(data=convert_to_nutrients(data["Food"]["FoodList"])),
            listOfSupplements=ListOfSupplements(
                data=data["Food"]["List of Supplements"]
            ),
            total=Nutrients(
                macros={
                    str(k): (float(v[0]), str(v[1]))
                    for k, v in data["Nutrition"]["Total"]["Macros"].items()
                },
                micros={},
            ),
            note=data["Note"]["Note"],
            wellbeing_rating=data["Note"]["Rating"],
            sleep_quality=SleepQuality(quality=data["Sleep & Weight"]["Sleep Quality"]),
            sleep_start=SleepStart(
                start=datetime.fromisoformat(str(data["Sleep & Weight"]["Sleep Start"]))
            ),
            sleep_end=SleepEnd(
                end=datetime.fromisoformat(str(data["Sleep & Weight"]["Sleep End"]))
            ),
            weight=Weight(weight=float(data["Sleep & Weight"]["Weight"][0])),
        )

    def to_dict(self) -> dict:
        # Convert Nutrients objects back to dictionary format for macros and micros
        def convert_nutrient_data_to_dict(nutrient_data):
            return {
                name: {
                    "Macros": guarantee_all_macro_fields_set(
                        {k: list(v) for k, v in nutrient.macros.items()}
                    ),
                    "Micros": {k: list(v) for k, v in nutrient.micros.items()},
                }
                for name, nutrient in nutrient_data.items()
            }

        def convert_not_found_food_nutrient_data_to_dict(nutrient_data):
            return {
                name: {
                    "Macros": guarantee_all_macro_fields_set(
                        {k: list(v) for k, v in nutrient.macros.items()}
                    ),
                    "Micros": {k: list(v) for k, v in nutrient.micros.items()},
                    "StatsFrom": nutrient.StatsFrom,
                }
                for name, nutrient in nutrient_data.items()
            }

        def sum_macros(food_data):
            total_macros = {}
            for _, nutrients in food_data.items():
                for macro, values in nutrients.macros.items():
                    if macro in total_macros:
                        total_macros[macro] = [
                            total_macros[macro][0] + values[0],
                            values[1],
                        ]  # Sum the values, retain the unit
                    else:
                        total_macros[macro] = values
            return total_macros

        total_macros = sum_macros(self.foodList.data)
        total_macros["fluid"] = self.total.macros.get("fluid", [0, "ML"])
        total_macros["protein"] = total_macros.get("protein", [0, "G"])
        total_macros["carbs"] = total_macros.get("carbs", [0, "G"])
        total_macros["fat"] = total_macros.get("fat", [0, "G"])
        total_macros["sugar"] = total_macros.get("sugar", [0, "G"])
        total_macros["calories"] = total_macros.get(
            "calories",
            [
                total_macros["fat"][0] * 9
                + total_macros["carbs"][0] * 4
                + total_macros["protein"][0] * 4,
                "KCAL",
            ],
        )

        def guarantee_all_macro_fields_set(data):
            for macro in ["protein", "fat", "carbs", "sugar"]:
                if macro not in data:
                    data[macro] = [0, "G"]
            if "amount" not in data:
                data["amount"] = [100, "G"]
            if "calories" not in data:
                data["calories"] = [
                    data["fat"][0] * 9 + data["carbs"][0] * 4 + data["protein"][0] * 4,
                    "KCAL",
                ]
            return data

        return {
            "Food": {
                "FoodList": convert_nutrient_data_to_dict(self.foodList.data),
                "Not found foods": convert_not_found_food_nutrient_data_to_dict(
                    self.notFoundFood.data
                ),
                "List of Supplements": self.listOfSupplements.data,
            },
            "Note": {"Note": self.note, "Rating": self.wellbeing_rating},
            "Exercise": {
                "Steps": self.steps.steps,
                "absolute Rating": self.exerciseRating.absolute_rating,
                "relative Rating": self.exerciseRating.relative_rating,
                "Exercises": {
                    "Other Exercises": self.exercises.Other_Exercises,
                    "Cardio Exercises": self.exercises.Cardio_Exercises,
                    "Bodyweight Exercises": self.exercises.Bodyweight_Exercises,
                    "Weight Lifting Exercises": self.exercises.Weight_Lifting_Exercises,
                },
            },
            "Nutrition": {
                "Total": {
                    "Macros": total_macros,
                    "Micros": self.total.micros,
                }
            },
            "Sleep & Weight": {
                "Weight": [self.weight.weight, "KG"],
                "Sleep End": self.sleep_end.end.isoformat(),
                "Sleep Start": self.sleep_start.start.isoformat(),
                "Sleep Quality": self.sleep_quality.quality,
            },
        }

    def add_together(self, other: "EntryData") -> "EntryData":
        """Add the data of another EntryData object to the current one. Instance that is using this method is the one that takes priority in case of conflicts."""
        combined_data = self.to_dict()  # Convert the current object to dict
        other_data = other.to_dict()
        combined_data["Exercise"]["Steps"] = (
            self.steps.steps if self.steps.steps > 0 else other.steps.steps
        )
        combined_data["Exercise"][
            "absolute Rating"
        ] = (
            other.exerciseRating.absolute_rating  # Always use the relative rating of the other object, because computed in backend
        )
        combined_data["Exercise"][
            "relative Rating"
        ] = (
            other.exerciseRating.relative_rating  # Always use the relative rating of the other object, because computed in backend
        )
        combined_data["Sleep & Weight"]["Sleep Quality"] = (
            self.sleep_quality.quality
            if self.sleep_quality.quality > 0
            else other.sleep_quality.quality
        )
        default_sleep_hour = (
            self.default_sleep_start.hour if self.default_sleep_start else None
        )
        default_sleep_minute = (
            self.default_sleep_start.minute if self.default_sleep_start else None
        )
        combined_data["Sleep & Weight"][
            "Sleep Start"
        ] = (  # NOTE if it is  the default, it means that it hasnt been set which means it can be overwrriten
            self.sleep_start.start.isoformat()
            if (
                self.default_sleep_start
                and (
                    self.sleep_start.start.hour != default_sleep_hour
                    or self.sleep_start.start.minute != default_sleep_minute
                )
            )
            else other.sleep_start.start.isoformat()
        )
        default_sleep_end_hour = (
            self.default_sleep_end.hour if self.default_sleep_end else None
        )
        default_sleep_end_minute = (
            self.default_sleep_end.minute if self.default_sleep_end else None
        )
        combined_data["Sleep & Weight"][
            "Sleep End"
        ] = (  # NOTE if it is  the default, it means that it hasnt been set which means it can be overwrriten
            self.sleep_end.end.isoformat()
            if (
                self.default_sleep_end
                and (
                    self.sleep_end.end.hour != default_sleep_end_hour
                    or self.sleep_end.end.minute != default_sleep_end_minute
                )
            )
            else other.sleep_end.end.isoformat()
        )
        combined_data["Sleep & Weight"]["Weight"] = (
            [self.weight.weight, "KG"]
            if self.weight.weight > 30
            and (not self.default_weight or self.default_weight != self.weight.weight)
            else [other.weight.weight, "KG"]
        )
        for exercise_type in other_data["Exercise"]["Exercises"]:
            for exercise in other_data["Exercise"]["Exercises"][exercise_type]:
                if (
                    exercise
                    not in combined_data["Exercise"]["Exercises"][exercise_type]
                ):
                    combined_data["Exercise"]["Exercises"][exercise_type][exercise] = (
                        other_data["Exercise"]["Exercises"][exercise_type][exercise]
                    )
                else:
                    for exercise_attr, value in other_data["Exercise"]["Exercises"][
                        exercise_type
                    ][exercise].items():
                        if (
                            value
                            > combined_data["Exercise"]["Exercises"][exercise_type][
                                exercise
                            ][exercise_attr]
                        ):
                            combined_data["Exercise"]["Exercises"][exercise_type][
                                exercise
                            ][exercise_attr] = value

        for food_name, nutrients in other_data["Food"]["FoodList"].items():
            if food_name not in combined_data["Food"]["FoodList"]:
                combined_data["Food"]["FoodList"][food_name] = nutrients

        for food_name, nutrients in other_data["Food"]["Not found foods"].items():  #
            if (
                food_name not in combined_data["Food"]["Not found foods"]
                and food_name not in combined_data["Food"]["FoodList"]
            ):
                combined_data["Food"]["Not found foods"][food_name] = nutrients

        macros = ["protein", "fat", "carbs", "sugar", "calories", "fluid"]
        default_units = {
            "protein": "G",
            "fat": "G",
            "carbs": "G",
            "sugar": "G",
            "calories": "KCAL",
            "fluid": "ML",
        }

        for macro in macros:
            combined_macro_value = (
                combined_data.get("Nutrition", {})
                .get("Total", {})
                .get("Macros", {})
                .get(macro, [0, default_units[macro]])
            )
            other_macro_value = (
                other_data.get("Nutrition", {})
                .get("Total", {})
                .get("Macros", {})
                .get(macro, [0, default_units[macro]])
            )

            if combined_macro_value[0] != 0:
                final_value = combined_macro_value
            else:
                final_value = other_macro_value
            combined_data["Nutrition"]["Total"]["Macros"][macro] = final_value
            combined_data["Food"]["List of Supplements"] = list(
                set(
                    combined_data["Food"]["List of Supplements"]
                    + other_data["Food"]["List of Supplements"]
                )
            )
        combined_data["Note"]["Note"] = (
            self.note if self.note != "" else other_data["Note"]["Note"]
        )
        return EntryData.from_dict(combined_data)

    def get_differences(self, other: "EntryData") -> Union["EntryDataDiff", None]:
        """COMPARE SELF -- "NEW"  to OTHER -- "OLD" """
        current_data = self.to_dict()
        other_data = other.to_dict()
        diff_data = {}

        # Helper function to find differences recursively
        def find_differences(curr, oth, diff):
            for key in curr:
                if isinstance(curr[key], dict):
                    if key not in oth or not isinstance(oth[key], dict):
                        diff[key] = curr[key]
                    else:
                        sub_diff = {}
                        find_differences(curr[key], oth[key], sub_diff)
                        if sub_diff:
                            diff[key] = sub_diff
                elif curr[key] != oth.get(key, None):
                    diff[key] = curr[key]
            # Find keys that are in oth but not in curr
            for key in oth:
                if key not in curr:
                    diff[key] = None

        find_differences(current_data, other_data, diff_data)
        return EntryDataDiff(diff=diff_data) if diff_data else None


class MessageRequest(BaseModel):
    message: str
    specific_date: date


class CreateSysMessageRequest(BaseModel):
    message: str
    specific_date: date
    has_confirmed: Optional[bool] = None
    display: Optional[str] = None

    @pydantic.validator("display")
    def check_display(cls, value):
        valid_options = ["sleep_survey", "wellbeing", "checklist", "habits", None]
        if value not in valid_options:
            raise ValueError(f"display must be one of {valid_options}")
        return value


class MessageResponse(BaseModel):
    id: int
    user_id: int
    message: str
    recorded_at: datetime
    typeof_message: str
    phaero_note_dict: Optional[dict]
    phaero_note_dict_diff_json: Optional[dict]
    display: Optional[str]
    has_confirmed: Optional[bool]
    used_note_ids: Optional[List[int]]

    @pydantic.validator("display")
    def check_display(cls, value):
        valid_options = ["sleep_survey", "wellbeing", "checklist", "habits", None]
        if value not in valid_options:
            raise ValueError(f"display must be one of {valid_options}")
        return value
