import ast
import asyncio
import errno
from typing import Any, Optional

import httpx
from api.v1.endpoints import exercise

from db.tables.models import ExerciseData, Feedback, NoteData, SurveyData
from schemas.types import NutritionData, SleepData, WeightData
from sqlmodel import Session
from datetime import date, datetime
from db.crud import (
    get_exercise_diagram_data,
    get_last_sleep_entry,
    get_last_weight_entry,
    get_note_entries,
    get_nutrition_diagram_data,
    get_sleep_diagram_data,
    get_survey_data_user,
    get_weight_diagram_data,
)
import db.crud as crud
from datetime import timedelta
import wave
import contextlib
import io
from db import exerciseDB
import re
from core.config import create_settings
from collections import Counter

settings = create_settings()
timeTravelAmount = settings.timeTravelAmount

MINIMUM_WORD_COUNT = 25


def get_data_from_iterator(iterator):
    data = []
    for tupleObject in iterator:
        data.append(tupleObject[0])
    return data


def convert_timedelta_to_hours_minutes(timedelta):
    hours, remainder = divmod(timedelta.total_seconds(), 3600)
    minutes, _ = divmod(remainder, 60)
    return int(hours), int(minutes)


def remove_duplicates_str_list(list1: list[str]) -> list[str]:
    seen = set()
    result_no_duplicates = []
    for item in list1:
        if item not in seen:
            seen.add(item)
            result_no_duplicates.append(item)
    return result_no_duplicates


def serialize_datetime(
    obj,
) -> dict:  # NOTE types here are bad, but in ther files its all red otherwise loool
    if isinstance(obj, dict):
        return {k: serialize_datetime(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [serialize_datetime(v) for v in obj]
    if isinstance(obj, datetime):
        return obj.isoformat()
    return obj


def create_phaero_default_note(db: Session, user_id: int) -> dict:
    now = datetime.utcnow().date()
    yesterday = now - timedelta(days=1)
    sleep_data = get_last_sleep_entry(db=db, user_id=user_id, recorded_at=yesterday)
    sleepDict = {}
    if sleep_data:
        sleepDict = {
            "Sleep Start": sleep_data.sleep_start + timedelta(days=1),
            "Sleep End": sleep_data.sleep_end + timedelta(days=1),
            "Sleep Quality": 0,
        }
    else:
        sleepDict = {
            "Sleep Start": datetime(now.year, now.month, now.day, 22, 0)
            - timedelta(days=1),
            "Sleep End": datetime(now.year, now.month, now.day, 6, 0),
            "Sleep Quality": 0,
        }
    weight_data = get_last_weight_entry(db=db, user_id=user_id)
    weightTuple = ()

    if not weight_data:
        weightTuple = (60, "KG")
    else:
        weightTuple = (weight_data.amount, "KG")
    default_phaero_note = {
        "Note": {"Note": "", "Rating": 0},
        "Sleep & Weight": {
            "Weight": (0, "KG"),
            "Sleep Start": "",
            "Sleep End": "",
            "Sleep Quality": 0,
        },
        "Exercise": {
            "Steps": 0,
            "absolute Rating": 0,
            "relative Rating": 0,
            "Exercises": {
                "Weight Lifting Exercises": {},
                "Cardio Exercises": {},
                "Bodyweight Exercises": {},
                "Other Exercises": {},
            },
        },
        "Nutrition": {
            "Total": {
                "Macros": {
                    "fluid": (0, "ML"),
                    "calories": (0, "KCAL"),
                    "carbs": (0, "G"),
                    "fat": (0, "G"),
                    "protein": (0, "G"),
                    "sugar": (0, "G"),
                },
                "Micros": {},
            }
        },
        "Food": {"FoodList": {}, "Not found foods": {}, "List of Supplements": []},
    }

    for key, value in sleepDict.items():
        default_phaero_note["Sleep & Weight"][key] = value

    default_phaero_note["Sleep & Weight"]["Weight"] = weightTuple
    return default_phaero_note


def create_phaero_default_note_user_changes() -> dict:
    default_phaero_note = {
        "Note": {"Note": "", "Rating": 0},
        "Sleep & Weight": {
            "Weight": (0, "KG"),
            "Sleep Start": datetime.utcnow()
            - timedelta(days=1000),  # 1000 days ago, so it gets updated
            "Sleep End": datetime.utcnow() - timedelta(days=1000),
            # 1000 days ago, so it gets updated
            "Sleep Quality": 0,
        },
        "Exercise": {
            "Steps": 0,
            "absolute Rating": 0,
            "relative Rating": 0,
            "Exercises": {
                "Weight Lifting Exercises": {},
                "Cardio Exercises": {},
                "Bodyweight Exercises": {},
                "Other Exercises": {},
            },
        },
        "Nutrition": {
            "Total": {
                "Macros": {
                    "fluid": (0, "ML"),
                    "calories": (0, "KCAL"),
                    "carbs": (0, "G"),
                    "fat": (0, "G"),
                    "protein": (0, "G"),
                    "sugar": (0, "G"),
                },
                "Micros": {},
            }
        },
        "Food": {"FoodList": {}, "Not found foods": {}, "List of Supplements": []},
    }
    return default_phaero_note


def has_been_beautified(phaeroNoteJson: dict) -> bool:
    return "Sleep Start" in phaeroNoteJson["sleep"]


def beautify_phaero_note_json_for_frontend(phaeroNoteJson: dict) -> dict:
    SORTING_ORDER_SLEEP_WEIGHT = [
        "Sleep Start",
        "Sleep End",
        "Sleep Quality",
        "Computed Sleep Quality",
        "Weight",
    ]
    SORTING_ORDER_EXERCISE = ["Exercises", "Rating", "Computed Rating" "Steps"]
    try:
        phaeroNoteJson["Sleep & Weight"] = {
            k: phaeroNoteJson["Sleep & Weight"][k] for k in SORTING_ORDER_SLEEP_WEIGHT
        }

        phaeroNoteJson["Exercise"] = {
            k: phaeroNoteJson["Exercise"][k] for k in SORTING_ORDER_EXERCISE
        }
    except KeyError:
        return phaeroNoteJson
        # SORTING_ORDER_EXERCISE = ["Exercise", "Rating", "Steps"]
        # phaeroNoteJson["Exercise"] = {
        #     k: phaeroNoteJson["Exercise"][k] for k in SORTING_ORDER_EXERCISE
        # }
    return phaeroNoteJson


def file_duration_valid(
    file_content: bytes, max_length: int = 180, min_length: int = 3
) -> bool:
    with contextlib.closing(wave.open(io.BytesIO(file_content), "rb")) as f:
        frames = f.getnframes()
        rate = f.getframerate()
        duration = frames / float(rate)

    return duration < max_length and duration > min_length


def merge_dictionaries(dict1: dict, dict2: dict):
    """Merge two dictionaries and return a new dictionary. If two keys overlap, the value from dict2 is used."""
    return {**dict1, **dict2}


def food_add_values_of_duplicate_keys_merge_dictionary(dict1: dict, dict2: dict):
    """Merge two dictionaries and return a new dictionary. If two keys overlap, the values are added together."""
    res = dict1.copy()
    for key, value in dict2.items():
        if key in res and key != "amount":
            res[key][0] += value[0]  # tuple of [amount, unit]
        else:
            res[key] = value
    return res


# def save_processed_note_data(db: Session, user_id: int, note: str):
#     pass


# def calculate_deviation_for_each(data: list[float]) -> list[float]:
#     mean = sum(data) / len(data)
#     return [abs(x - mean) for x in data]


def calculate_mean(data: list[float]) -> float:
    return sum(data) / len(data)


def calculate_weekly_difference(data: list[float]) -> list[float]:
    weekly_starts = [i for i in range(0, len(data), 7)]
    res = []
    for i in weekly_starts:
        weekly_start = data[i]
        weekly_average = sum(data[i : i + 7]) / 7
        res.append(abs(weekly_average - weekly_start))
    print(res)
    return res


def calculate_calorie_adjustment(
    current_weight: float,
    weekly_weight_change_kg: float,
    goal_weight_change: float,
    calories_per_kg_personalized: float = 7700,
) -> tuple[float, float]:
    calories_per_kg_fat = 7700

    current_caloric_change = weekly_weight_change_kg * calories_per_kg_fat
    desired_weekly_weight_change_kg = current_weight * goal_weight_change
    desired_caloric_change = desired_weekly_weight_change_kg * calories_per_kg_fat
    res_caloric_adjustment = desired_caloric_change - current_caloric_change

    current_caloric_change = weekly_weight_change_kg * calories_per_kg_fat
    desired_caloric_change = (
        desired_weekly_weight_change_kg * calories_per_kg_personalized
    )
    res_user_caloric_adjustment = desired_caloric_change - current_caloric_change

    return res_caloric_adjustment / 7, res_user_caloric_adjustment / 7


def calculate_caloric_values(weighings: list[float], calories: [int]) -> list[float]:
    if len(weighings) != len(calories):
        raise Exception("Length of weighings and calories must be equal")
    if len(weighings) < 2:
        raise Exception("Length of weighings must be at least 7")
    weightChanges = []
    for i in range(len(weighings) - 1):
        weightChange = abs(weighings[i + 1] - weighings[i])
        weightChanges.append(weightChange)
    res = [calories[i] / weightChange for i, weightChange in enumerate(weightChanges)]
    return res


def goal_feedback_string(
    goal: str,
    goal_feedback: str,
    caloricAdjustment: float,
    userCaloricAdjustment: float,
    meanWeeklyWeightChange: float,
) -> str:
    goal_feedback += "Keep in mind that the following is only a recommended adjustment if your weight change is related mainly to a loss in actual fat tissue."
    goal_feedback += "If you think your weight was mainly lost due to water weight or muscle mass, the following recommendations will not be accurate. In fact they will be quite overblown."

    if goal == "cutting":
        if caloricAdjustment > 0:
            goal_feedback += f"""Based on your data and the general estimate that 1kg of fat is 7700 calories,
                you could eat {caloricAdjustment} less calories per day
                to reach a recommended weight loss of 0.5-1% of your body weight per week."""
        else:
            goal_feedback += f"""Based on your data and the general estimate that 1kg of fat is 7700 calories,
                you could eat {caloricAdjustment*-1} more calories per day
                to reach a recommended weight loss of 0.5-1% of your body weight per week."""
        if userCaloricAdjustment > 0:
            goal_feedback += f"""Based on the changes in your weight (this gets more accurate the longer you use Phaero),
                you could eat {userCaloricAdjustment} less calories per day
                to reach a recommended weight loss of 0.5-1% of your body weight per week."""
        else:
            goal_feedback += f"""Based on the changes in your weight (this gets more accurate the longer you use Phaero),
                you could eat {caloricAdjustment*-1} more calories per day
                to reach a recommended weight loss of 0.5-1% of your body weight per week."""
    if goal == "bulking":
        if caloricAdjustment > 0:
            goal_feedback += f"""Based on your data and the general estimate that 1kg of fat is 7700 calories,
            you could eat {caloricAdjustment} more calories per day
            to reach a recommended weight gain of 0.5-1% of your body weight per week."""
        else:
            goal_feedback += f"""Based on your data and the general estimate that 1kg of fat is 7700 calories,
            you could eat {caloricAdjustment*-1} less calories per day
            to reach a recommended weight loss of 0.5-1% of your body weight per week."""
        if userCaloricAdjustment > 0:
            goal_feedback += f"""Based on the changes in your weight (this gets more accurate the longer you use Phaero),
            you could eat {userCaloricAdjustment} more calories per day
            to reach a recommended weight loss of 0.5-1% of your body weight per week."""
        else:
            goal_feedback += f"""Based on the changes in your weight (this gets more accurate the longer you use Phaero),
            you could eat {caloricAdjustment*-1} less calories per day
            to reach a recommended weight loss of 0.5-1% of your body weight per week."""
    if goal == "maintenance":
        if meanWeeklyWeightChange > 1:
            goal_feedback += "Your weight is changing, but your goal is to maintain your weight. Therefore look into your activity levels or calorie consumption."

    return goal_feedback


def scale_key_value_by_x(x: float, dict: dict) -> dict:
    """Scale the value of each key in a dictionary by a factor x. Where each value is a [amount, unit]"""
    for key, value in dict.items():
        dict[key] = (value[0] * x, value[1])
    return dict


def calculate_bmr(gender: str, height: float, weight: float, age: int):
    if gender.lower() == "male":
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
    elif gender.lower() == "female":
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
    else:
        raise ValueError("Gender must be 'male' or 'female'")
    return bmr


def crud_save_final_note(
    db: Session, user_id: int, phaero_note: dict, specific_date: date
):
    # dont need except block because default note is used
    food = phaero_note["Food"]["FoodList"]  # {"Food": {"Macros": {}, "Micros": {}}}
    note = phaero_note["Note"]["Note"]
    wellbeing_score = phaero_note["Note"]["Rating"]
    crud.create_or_update_note_entry(
        db=db,
        note=note,
        wellbeing_score=wellbeing_score,
        user_id=user_id,
        recorded_at=specific_date,
    )
    hydrationAmount = phaero_note["Nutrition"]["Total"]["Macros"]["fluid"][0]
    sleep = phaero_note["Sleep & Weight"]  # sleepstart / sleepend / sleep
    weight = phaero_note["Sleep & Weight"]["Weight"]  # [weight, unit]
    # {"Rating": 0, "Description": []}
    exercise = phaero_note["Exercise"]  # {"Steps": 0, "Rating": 0, "Description": []}
    nutrition = phaero_note[  # get list of foods by sampling from food keys IMPORTANT!!!!
        "Nutrition"  # [] = tuple here
    ]  # {"Total": {"Macros": {"fluid": [], "amount": [], "protein": [], "fat", [], "carbs": [], "calories": []}, "Micros": {'micros': {'calcium': [78.84, 'MG'], 'iron': [5.6, 'MG'], 'potassium': [285.34, 'MG'], 'sodium': [867.54, 'MG'], 'vitaminC': [2.76, 'MG'], 'thiamin': [0, 'MG'], 'riboflavin': [0.24, 'MG'], 'niacin': [7.46, 'MG'], 'folate': [266, 'UG']}},}
    supplements = phaero_note["Food"][
        "List of Supplements"
    ]  # {"List of supplements": []}
    listOfFoods = []
    for key in food:
        listOfFoods.append(key)
    foodList = phaero_note["Food"]["FoodList"]
    totalNutritionValues = {
        "Macros": {
            "fat": [0.0, "G"],
            "carbs": [0.0, "G"],
            "fluid": [hydrationAmount, "ML"],
            "sugar": [0.0, "G"],
            "protein": [0.0, "G"],
            "calories": [0.0, "KCAL"],
        },
        "Micros": {},
    }
    invalidKeys = []
    for key in phaero_note["Nutrition"].keys():
        if key != "Total" and key != "fluid" and key not in foodList:
            invalidKeys.append(key)
    for key in invalidKeys:
        del phaero_note["Nutrition"][key]
    for food_name, MacroMicro in foodList.items():
        if food_name not in phaero_note["Nutrition"]:
            phaero_note["Nutrition"][food_name] = {}
        phaero_note["Nutrition"][food_name]["Macros"] = MacroMicro["Macros"]
        totalNutritionValues["Macros"] = (
            food_add_values_of_duplicate_keys_merge_dictionary(
                totalNutritionValues["Macros"], MacroMicro["Macros"]
            )
        )
        totalNutritionValues["Micros"] = (
            food_add_values_of_duplicate_keys_merge_dictionary(
                totalNutritionValues["Micros"], MacroMicro["Micros"]
            )
        )

    phaero_note["Nutrition"]["Total"] = totalNutritionValues
    macros = nutrition["Total"]["Macros"]
    micros = nutrition["Total"]["Micros"]
    crud.update_daily_note(db, user_id=user_id, note=note)
    crud.create_or_update_sleep_entry(
        db=db,
        sleep_start=datetime.strptime(sleep["Sleep Start"], "%Y-%m-%dT%H:%M:%S"),
        sleep_end=datetime.strptime(sleep["Sleep End"], "%Y-%m-%dT%H:%M:%S"),
        sleep_quality=sleep["Sleep Quality"],
        user_id=user_id,
        recorded_at=specific_date,
    )
    crud.create_or_update_exercise_entry(
        db=db,
        exercise_information=str(exercise["Exercises"]),
        relative_activity_level=exercise["relative Rating"],
        absolute_activity_level=exercise["absolute Rating"],
        steps=exercise["Steps"],
        user_id=user_id,
        recorded_at=specific_date,
    )
    insert_exercise_dict_of_type(
        db,
        user_id,
        exercise["Exercises"]["Weight Lifting Exercises"],
        "weight",
        specific_date,
    )
    insert_exercise_dict_of_type(
        db, user_id, exercise["Exercises"]["Cardio Exercises"], "cardio", specific_date
    )
    insert_exercise_dict_of_type(
        db,
        user_id,
        exercise["Exercises"]["Bodyweight Exercises"],
        "bodyweight",
        specific_date,
    )

    crud.create_or_update_nutrition_entry(
        db=db,
        calories=macros["calories"][0],
        fluid=hydrationAmount,
        carbs=macros["carbs"][0],
        fat=macros["fat"][0],
        sugar=macros["sugar"][0],
        protein=macros["protein"][0],
        nonMacro=str(micros),
        listOfFoods="\n".join(listOfFoods),
        supplements="\n".join(supplements),
        user_id=user_id,
        recorded_at=specific_date,
    )
    crud.create_or_update_weight_entry(
        db=db,
        amount=weight[0],
        user_id=user_id,
        recorded_at=specific_date,
    )

    # crud.set_daily_allowance_transcription(db, user_id, 0)
    if (
        not crud.streak_has_been_modified_tday(db, user_id)
        and len(phaero_note["Note"]["Note"].split(" ")) >= MINIMUM_WORD_COUNT
    ):
        crud.increase_feedback_and_streak_state(db, user_id)


def insert_exercise_dict_of_type(
    db: Session,
    user_id: int,
    exercise_dict: dict,
    exercise_type: str,
    specific_date: date,
):
    allExerciseIds = [
        exerciseDB.crud_get_exercise_id_from_name(exercise_name, exercise_type)
        for exercise_name in exercise_dict.keys()
    ]
    exerciseIdsCounter = Counter(allExerciseIds)
    aggregateDataOfExerciseWithSameId: dict[int, list] = {}
    for exercise_id, exercise_name in zip(allExerciseIds, exercise_dict.keys()):
        if not exercise_id:
            print(f"Exercise not found in database.")
            continue
        exercise_name_db = exerciseDB.crud_get_exercise_name_from_id(exercise_id)
        if not exercise_name_db:
            print(f"Exercise {exercise_name} not found in database.")
            continue

        if exerciseIdsCounter[exercise_id] > 1:
            if not exercise_id in aggregateDataOfExerciseWithSameId:
                aggregateDataOfExerciseWithSameId[exercise_id] = []
            aggregateDataOfExerciseWithSameId[exercise_id].append(
                exercise_dict[exercise_name]
            )
        else:
            exerciseDB.crud_insert_into_exercise_specific_data(
                db=db,
                user_id=user_id,
                exercise_name=exercise_name_db,  # type: ignore
                exercise_id=exercise_id,
                exercise_specific_data=exercise_dict[exercise_name],
                specific_date=specific_date,
            )

    for (
        exercise_id,
        exercise_specific_data,
    ) in aggregateDataOfExerciseWithSameId.items():
        exerciseDB.crud_insert_multiple_exercise_of_same_id(
            db=db,
            user_id=user_id,
            exercise_name=exerciseDB.crud_get_exercise_name_from_id(exercise_id),  # type: ignore
            exercise_id=exercise_id,  # type: ignore
            exercise_specific_data_list=exercise_specific_data,
            specific_date=specific_date,
        )


def whole_word_substring_in(string: str, substring: str) -> bool:
    """Checks if a substring is in a string, but only if it is a whole word.
    Converts both string and substring to lower case for case-insensitive matching"""
    string = string.lower()
    substring = substring.lower()
    # Use regular expression to find whole word match
    return bool(re.search(r"\b" + re.escape(substring) + r"\b", string))


def check_llm_output_for_valid_findings(llm_output: list[str]) -> bool:
    """Checks if the output of the LLM contains any valid findings"""
    if not llm_output:
        return False
    invalid_indicators = ["no", "none", "nothing", "not"]
    number_of_invalids = 0
    for findings in llm_output:
        for invalid_indicator in invalid_indicators:
            if findings == "":
                number_of_invalids += 1
                break
            if whole_word_substring_in(
                string=findings.strip(), substring=invalid_indicator
            ):
                print("invalid")
                number_of_invalids += 1
                break
    if number_of_invalids >= len(llm_output):
        return False
    return True


def create_user_settings_dict(db: Session, user_id: int) -> dict:
    user_settings = crud.get_settings(db, user_id)

    language = user_settings.language
    userSettings = {
        "language": language,
    }

    return userSettings


def get_feedback_relevant_data(db: Session, user_id: int, amount: int = 28) -> tuple[
    list[ExerciseData],
    list[NoteData],
    list[SleepData],
    list[NutritionData],
    list[WeightData],
    list[SurveyData],
]:
    exerciseData = get_data_from_iterator(
        get_exercise_diagram_data(
            db, user_id, order=True, newest_first=True, limited_amount=amount
        )
    )
    noteData = get_data_from_iterator(
        get_note_entries(
            db, user_id, order=True, newest_first=True, limited_amount=amount
        )
    )
    sleepData = get_data_from_iterator(
        get_sleep_diagram_data(
            db, user_id, order=True, newest_first=True, limited_amount=amount
        )
    )
    nutritionData = get_data_from_iterator(
        get_nutrition_diagram_data(
            db, user_id, order=True, newest_first=True, limited_amount=amount
        )
    )
    weightData = get_data_from_iterator(
        get_weight_diagram_data(
            db, user_id, order=True, newest_first=True, limited_amount=amount
        )
    )
    surveyData = get_data_from_iterator(
        get_survey_data_user(
            db, user_id, order=True, newest_first=True, limited_amount=amount
        )
    )
    return (
        exerciseData,
        noteData,
        sleepData,
        nutritionData,
        weightData,
        surveyData,
    )


def convert_feedback_to_dict(feedback: Feedback) -> dict:
    if not feedback:
        return {}
    res = {}
    for attr in list(feedback.__dict__.keys()):
        if (
            attr == "_sa_instance_state"
            or attr == "id"
            or attr == "user_id"
            # or attr == "recorded_at"
            or attr == "user_judgement"
        ):
            continue
        if attr == "weekly_delta_diagram_data":
            res[attr] = ast.literal_eval(getattr(feedback, attr))
            continue
        res[attr] = getattr(feedback, attr)
    return res


def split_text_into_halves(text: str, thresholdSplitting: int) -> list[str]:
    parts = []
    while len(text.split(" ")) > thresholdSplitting:
        split_index = len(text.split(" ")) // 2
        next_dot = text.find(".", split_index - 25, split_index + 25)
        if next_dot != -1:
            parts.append(text[: next_dot + 1])
            text = text[next_dot + 1 :].lstrip()
        else:
            parts.append(text)
            text = ""
    if text:
        parts.append(text)
    return parts


import paramiko
from fastapi.responses import StreamingResponse

IMAGE_DIR = "images"

# def stream_image_from_storage_box(file_name):
#     """Stream an image file directly from Hetzner Storage Box."""
#     sftp = create_sftp_client(
#         "your-storage-box-hostname.com", 22, "your_username", "your_password"
#     )
#     if not sftp:
#         raise Exception("Failed to connect to the SFTP server.")
#     remote_path = f"/your/directory/path/{file_name}"
#     try:
#         # Open the remote file directly
#         file_stream = sftp.open(remote_path, "rb")
#         return StreamingResponse(file_stream, media_type="image/jpeg")
#     finally:
#         sftp.close()

import base64


def get_image_base64_by_image_url(user_id: int, image_url: str) -> str:
    if image_url not in os.listdir(IMAGE_DIR):
        image_url = download_image_to_server(image_url, user_id)  # type: ignore
        if not image_url:
            raise Exception("Image not found")
    if image_url.startswith("images/"):
        image_url = image_url[7:]
    with open(IMAGE_DIR + "/" + image_url, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")
