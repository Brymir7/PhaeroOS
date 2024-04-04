import psycopg2
from contextlib import contextmanager
from api.v1.endpoints import exercise
from core.config import create_settings
from typing import Any, Optional
from datetime import date, datetime, timedelta
from sqlmodel import Session
from db.crud import add_or_update_diagram_data_point

settings = create_settings()

timeTravelAmount = settings.timeTravelAmount
exercise_list_to_db_exercise_dict = {}
german_to_english_exercise_dict = {
    "bankdrücken": "bench press",
    "kniebeugen": "squat",
    "kreuzheben": "deadlift",
    "schulterdrücken": "shoulder press",
    "klimmzüge": "pull ups",
    "hantelcurl": "dumbbell curl",
    "langhantelcurl": "barbell curl",
    "schlittenbeinpresse": "sled leg press",
    "rudernvorgebeugt": "bent over row",
    "schrägbankdrücken": "incline bench press",
    "schrägbankdrückenmitkurzhanteln": "incline dumbbell bench press",
    "dips": "dips",
    "kinnziehen": "chin ups",
    "seithebenmitkurzhanteln": "dumbbell lateral raise",
    "hammercurl": "hammer curl",
    "predigerbizepscurl": "preacher curl",
    "trizepsstrecken": "tricep extension",
    "trizepsstreckenüberkopf": "overhead tricep extension",
    "laufen": "running",
    "radfahren": "cycling",
    "schwimmen": "swimming",
    "rudern": "rowing",
    "seilspringen": "jumping rope",
    "gehen": "walking",
    "laufbandgehen": "treadmill walking",
    "laufbandlaufen": "treadmill running",
    "laufband": "treadmill",
    "hochintensivesintervalltraining": "high intensity interval training (hiit)",
}

one_rm_percent_table = {
    1: 100,
    2: 97,
    3: 94,
    4: 92,
    5: 89,
    6: 86,
    7: 83,
    8: 81,
    9: 78,
    10: 75,
    11: 73,
    12: 71,
    13: 70,
    14: 68,
    15: 67,
    16: 65,
    17: 64,
    18: 63,
    19: 61,
    20: 60,
    21: 59,
    22: 58,
    23: 57,
    24: 56,
    25: 55,
    26: 54,
    27: 53,
    28: 52,
    29: 51,
    30: 50,
}


def estimate_one_rep_max(weight: float, reps: float):
    """
    Estimate the one-rep max (1RM) in powerlifting using the Epley formula.

    Parameters:
    weight (float): The weight lifted (in kg).
    reps (int): The number of repetitions performed.

    Returns:
    float: The estimated one-rep max (1RM).
    """
    if reps < 1:
        raise ValueError("Reps must be at least 1")
    if reps not in one_rm_percent_table:
        return int(weight)
    estimate_one_rep_max = weight / one_rm_percent_table[int(reps)] * 100
    return int(estimate_one_rep_max)


def standardize_exercise_name(exercise_name: str) -> str:
    return exercise_name.replace(" ", "").lower().strip()


def translate_exercise_name(exercise_name: str, translation_dict: dict) -> str:
    exercise_name = standardize_exercise_name(exercise_name)
    exercise_name = translation_dict.get(exercise_name, "Cannot translate")
    return exercise_name


def convert_list_of_exercises_to_english_only(exercise_list: list[str]) -> list[str]:
    res = []
    for exercise in exercise_list:
        translated_exercise = translate_exercise_name(
            exercise, german_to_english_exercise_dict
        )
        if translated_exercise != "Cannot translate":
            res.append(translated_exercise)
        else:
            res.append(exercise)
    return res


EXERCISE_NAME_TO_ID = {}
EXERCISE_ID_TO_NAME = {}


def booleans_to_list_according_to_exercises_table(list_bools: list[bool]) -> list[str]:
    table_columns = [  # NOTE this is the order of the columns in the exercises table
        "duration",
        "weight",
        "sets",
        "reps",
        "rest",
        "distance",
        "calories",
        "elevation",
        "reps_in_reserve",
    ]
    for i, bool_val in enumerate(list_bools):
        if not bool_val:
            table_columns[i] = None
    return list(table_columns)


@contextmanager
def get_db_cursor():
    conn, cursor = create_db_connection()
    try:
        yield cursor
    finally:
        cursor.close()
        conn.commit()
        conn.close()


def create_db_connection():
    conn = psycopg2.connect(
        host=settings.POSTGRES_CONTAINER,
        database=settings.POSTGRES_DB,
        user=settings.POSTGRES_USER,
        password=settings.POSTGRES_PASSWORD,
    )
    cursor = conn.cursor()
    return conn, cursor


def crud_get_exercise_id_from_name(
    exercise_name: str, type_of_exercise: str
) -> Optional[int]:
    if exercise_name in EXERCISE_NAME_TO_ID:
        return EXERCISE_NAME_TO_ID[exercise_name]
    with get_db_cursor() as cursor:
        cursor.execute(
            """SELECT id FROM exercises WHERE name %% %s AND exercise_type = %s ORDER BY similarity(name, %s) DESC LIMIT 1;""",
            (
                exercise_name,
                type_of_exercise,
                exercise_name,
            ),
        )
        exercise_id = cursor.fetchone()
        if exercise_id:
            exercise_id = exercise_id[0]
            EXERCISE_NAME_TO_ID[exercise_name] = exercise_id
            return exercise_id
        # If no exercise is found, try to find it with the full text search
        subqueries = exercise_name.split(
            " "
        )  # NOTE Split the query into subqueries (Squats with barbell -> ["Squats", "with", "barbell"]), doesn't find it otherwise
        for subquery in subqueries:
            cursor.execute(
                """
                    SELECT id,
                    similarity(name, %s) as sim_score
                    FROM exercises
                    WHERE to_tsvector('english', name) @@ plainto_tsquery('english', %s)
                    ORDER BY sim_score DESC LIMIT 1;
                """,
                (
                    subquery,
                    subquery,
                ),
            )
            exercise_id = cursor.fetchone()
            if exercise_id:
                exercise_id = exercise_id[0]
                EXERCISE_NAME_TO_ID[exercise_name] = exercise_id
                return exercise_id
        return None


def crud_get_exercise_name_from_id(exercise_id: int) -> Optional[str]:
    if exercise_id in EXERCISE_ID_TO_NAME:
        return EXERCISE_ID_TO_NAME[exercise_id]
    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT name FROM exercises WHERE id = %s;",
            (exercise_id,),
        )
        exercise_name = cursor.fetchone()
        if exercise_name:
            exercise_name = exercise_name[0]
            EXERCISE_ID_TO_NAME[exercise_id] = exercise_name
            return exercise_name
        return None


def crud_insert_into_exercise_specific_data(
    db: Session,
    user_id: int,
    exercise_name: str,
    exercise_id: int,
    exercise_specific_data: dict,
    specific_date: date,
):
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * from exercises WHERE id = %s;", (exercise_id,))
        exercise_res: Optional[tuple[Any, ...]] = cursor.fetchone()
        if not exercise_res:
            raise ValueError(f"Exercise ID {exercise_id} does not exist.")
        all_columns_table = [col for col in exercise_res if col is not None]
        remove_non_boolean_columns = lambda list_bools: [
            i for i in list_bools if isinstance(i, bool)
        ]
        boolean_columns = remove_non_boolean_columns(all_columns_table)
        print(boolean_columns)
        list_of_exercise_data_columns_required = (
            booleans_to_list_according_to_exercises_table(boolean_columns)
        )
        exercise_id = exercise_res[0]
        exercise_specific_data = {
            key: value
            for key, value in exercise_specific_data.items()
            if key in list_of_exercise_data_columns_required
        }
        if not exercise_specific_data:
            print(
                "No exercise specific data to insert. This means that the data to be inserted doesn't match the exercise required data."
            )
            return

        cursor.execute(
            "SELECT * FROM exercisespecificdata WHERE user_id = %s AND exercise_id = %s AND recorded_at = %s;",
            (user_id, exercise_id, datetime.utcnow().date()),
        )
        existing_record = cursor.fetchone()
        if not existing_record:
            cursor.execute(
                "INSERT INTO exercisespecificdata (user_id, exercise_id, recorded_at) VALUES (%s, %s, NOW());",
                (user_id, exercise_id),
            )
        print(exercise_specific_data.keys())
        for key, value in exercise_specific_data.items():
            if value is None:
                raise ValueError(f"{key} cannot be None.")

            query = f"""UPDATE exercisespecificdata SET {key} = %s
                        WHERE user_id = %s AND exercise_id = %s AND recorded_at = %s;"""
            cursor.execute(
                query,
                (value, user_id, exercise_id, datetime.utcnow().date()),
            )
        if "weight" in exercise_specific_data:
            dataJSON = {
                "Weight": exercise_specific_data["weight"],
                "date": specific_date.isoformat(),
            }
            add_or_update_diagram_data_point(
                db,
                user_id,
                dataJSON,
                title=exercise_name + " Weight",
                unit="kg",
                specific_date=specific_date,
            )
        if "reps" in exercise_specific_data and "sets" in exercise_specific_data:
            dataJSON = {
                "Total Reps": exercise_specific_data["reps"]
                * exercise_specific_data["sets"],
                "Sets": exercise_specific_data["sets"],
                "Reps": exercise_specific_data["reps"],
                "date": specific_date.isoformat(),
            }
            add_or_update_diagram_data_point(
                db,
                user_id,
                dataJSON,
                title=exercise_name + " Reps/Sets",
                specific_date=specific_date,
            )
        if "calories" in exercise_specific_data:
            dataJSON = {
                "Calories": exercise_specific_data["calories"],
                "date": specific_date.isoformat(),
            }
            add_or_update_diagram_data_point(
                db,
                user_id,
                dataJSON,
                title=exercise_name + " Calories",
                unit="KCAL",
                specific_date=specific_date,
            )
        if "duration" in exercise_specific_data:
            dataJSON = {
                "Duration": exercise_specific_data["duration"],
                "date": specific_date.isoformat(),
            }
            add_or_update_diagram_data_point(
                db,
                user_id,
                dataJSON,
                title=exercise_name + " Duration",
                unit="min",
                specific_date=specific_date,
            )
        if "distance" in exercise_specific_data:
            dataJSON = {
                "Distance": exercise_specific_data["distance"],
                "date": specific_date.isoformat(),
            }
            add_or_update_diagram_data_point(
                db,
                user_id,
                dataJSON,
                title=exercise_name + " Distance",
                unit="m",
                specific_date=specific_date,
            )
        if (
            "reps" in exercise_specific_data
            and "sets" in exercise_specific_data
            and "weight" in exercise_specific_data
        ):
            dataJSON = {
                "Volume": exercise_specific_data["reps"]
                * exercise_specific_data["sets"]
                * exercise_specific_data["weight"],
                "date": specific_date.isoformat(),
            }
            add_or_update_diagram_data_point(
                db,
                user_id,
                dataJSON,
                title=exercise_name + " Volume",
                specific_date=specific_date,
            )
        if "reps" in exercise_specific_data and "weight" in exercise_specific_data:
            dataJSON = {
                "1RM": estimate_one_rep_max(
                    exercise_specific_data["weight"], exercise_specific_data["reps"]
                ),
                "date": specific_date.isoformat(),
            }
            add_or_update_diagram_data_point(
                db,
                user_id,
                dataJSON,
                title=exercise_name + " 1RM",
                specific_date=specific_date,
            )
        if "elevation" in exercise_specific_data:
            dataJSON = {
                "Elevation": exercise_specific_data["elevation"],
                "date": specific_date.isoformat(),
            }
            add_or_update_diagram_data_point(
                db,
                user_id,
                dataJSON,
                title=exercise_name + " Elevation",
                unit="m",
                specific_date=specific_date,
            )
        if "reps_in_reserve" in exercise_specific_data:
            dataJSON = {
                "RIR": exercise_specific_data["reps_in_reserve"],
                "date": specific_date.isoformat(),
            }
            add_or_update_diagram_data_point(
                db,
                user_id,
                dataJSON,
                title=exercise_name + " RIR",
                specific_date=specific_date,
            )


def crud_insert_multiple_exercise_of_same_id(
    db: Session,
    user_id: int,
    exercise_name: str,
    exercise_id: int,
    exercise_specific_data_list: list[dict],
    specific_date: date,
):
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * from exercises WHERE id = %s;", (exercise_id,))
        exercise_res: Optional[tuple[Any, ...]] = cursor.fetchone()
        if not exercise_res:
            raise ValueError(f"Exercise ID {exercise_id} does not exist.")
        all_columns_table = [col for col in exercise_res if col is not None]
        remove_non_boolean_columns = lambda list_bools: [
            i for i in list_bools if i is isinstance(i, bool)
        ]
        boolean_columns = remove_non_boolean_columns(all_columns_table)
        list_of_exercise_data_columns_required = (
            booleans_to_list_according_to_exercises_table(boolean_columns)
        )
        exercise_id = exercise_res[0]
        exercise_specific_data_list = [
            {
                key: value
                for key, value in exercise_specific_data_item.items()
                if key in list_of_exercise_data_columns_required
            }
            for exercise_specific_data_item in exercise_specific_data_list
        ]
        if not exercise_specific_data_list:
            print(
                "No exercise specific data to insert. This means that the data to be inserted doesn't match the exercise required data."
            )
            return
        cursor.execute(
            "SELECT * FROM exercisespecificdata WHERE user_id = %s AND exercise_id = %s AND recorded_at = %s;",
            (user_id, exercise_id, datetime.utcnow().date()),
        )
        existing_record = cursor.fetchall()
        if not existing_record:
            for exercise_specific_data in exercise_specific_data_list:
                cursor.execute(
                    "INSERT INTO exercisespecificdata (user_id, exercise_id, recorded_at) VALUES (%s, %s, NOW());",
                    (user_id, exercise_id),
                )
        cursor.execute(
            "SELECT id FROM exercisespecificdata WHERE user_id = %s AND exercise_id = %s AND recorded_at = %s;",
            (user_id, exercise_id, datetime.utcnow().date()),
        )
        exercise_ids = cursor.fetchall()
        for exercise_specific_data, respective_id_db in zip(
            exercise_specific_data_list, exercise_ids
        ):
            for key, value in exercise_specific_data.items():
                if value is None:
                    raise ValueError(f"{key} cannot be None.")
                query = f"""UPDATE exercisespecificdata SET {key} = %s
                            WHERE user_id = %s AND exercise_id = %s AND recorded_at = %s AND id = %s;"""
                cursor.execute(
                    query,
                    (
                        value,
                        user_id,
                        exercise_id,
                        datetime.utcnow().date(),
                        respective_id_db[0],
                    ),
                )
        takeMaxOfKey = lambda key: max(
            exercise_specific_data_list, key=lambda x: x[key]
        )
        if "weight" in exercise_specific_data_list[0]:
            dataJSON = {
                "Weight": takeMaxOfKey("weight")["weight"],
                "date": specific_date.isoformat(),
            }
            add_or_update_diagram_data_point(
                db,
                user_id,
                dataJSON,
                title=exercise_name + " Weight",
                unit="kg",
                specific_date=specific_date,
            )
        sumOverKey = lambda key: sum([x[key] for x in exercise_specific_data_list])
        if (
            "reps" in exercise_specific_data_list[0]
            and "sets" in exercise_specific_data_list[0]
        ):
            totalReps = sum(
                [x["reps"] * x["sets"] for x in exercise_specific_data_list]
            )
            dataJSON = {
                "Total Reps": totalReps,
                "Sets": sumOverKey("sets"),
                "Reps": takeMaxOfKey("reps")["reps"],
                "date": specific_date.isoformat(),
            }
            add_or_update_diagram_data_point(
                db,
                user_id,
                dataJSON,
                title=exercise_name + " Reps/Sets",
                specific_date=specific_date,
            )
        if "calories" in exercise_specific_data_list[0]:
            dataJSON = {
                "Calories": takeMaxOfKey("calories")["calories"],
                "date": specific_date.isoformat(),
            }
            add_or_update_diagram_data_point(
                db,
                user_id,
                dataJSON,
                title=exercise_name + " Calories",
                unit="KCAL",
                specific_date=specific_date,
            )
        if "duration" in exercise_specific_data_list[0]:
            dataJSON = {
                "Duration": takeMaxOfKey("duration")["duration"],
                "date": specific_date.isoformat(),
            }
            add_or_update_diagram_data_point(
                db,
                user_id,
                dataJSON,
                title=exercise_name + " Duration",
                unit="min",
                specific_date=specific_date,
            )
        if "distance" in exercise_specific_data_list[0]:
            dataJSON = {
                "Distance": takeMaxOfKey("distance")["distance"],
                "date": specific_date.isoformat(),
            }
            add_or_update_diagram_data_point(
                db,
                user_id,
                dataJSON,
                title=exercise_name + " Distance",
                unit="m",
                specific_date=specific_date,
            )

        if (
            "reps" in exercise_specific_data_list[0]
            and "sets" in exercise_specific_data_list[0]
            and "weight" in exercise_specific_data_list[0]
        ):
            totalVolume = sum(
                [
                    x["reps"] * x["sets"] * x["weight"]
                    for x in exercise_specific_data_list
                ]
            )
            dataJSON = {"Volume": totalVolume, "date": specific_date.isoformat()}
            add_or_update_diagram_data_point(
                db,
                user_id,
                dataJSON,
                title=exercise_name + " Volume",
                specific_date=specific_date,
            )
        if (
            "reps" in exercise_specific_data_list[0]
            and "weight" in exercise_specific_data_list[0]
        ):
            estimated_1RM_each_set = [
                estimate_one_rep_max(x["weight"], x["reps"])
                for x in exercise_specific_data_list
            ]
            dataJSON = {
                "1RM": max(estimated_1RM_each_set),
                "date": specific_date.isoformat(),
            }
            add_or_update_diagram_data_point(
                db,
                user_id,
                dataJSON,
                title=exercise_name + " 1RM",
                specific_date=specific_date,
            )
        if "elevation" in exercise_specific_data_list[0]:
            dataJSON = {
                "Elevation": takeMaxOfKey("elevation")["elevation"],
                "date": specific_date.isoformat(),
            }
            add_or_update_diagram_data_point(
                db,
                user_id,
                dataJSON,
                title=exercise_name + " Elevation",
                unit="m",
                specific_date=specific_date,
            )
        if "reps_in_reserve" in exercise_specific_data_list[0]:
            dataJSON = {
                "RIR": takeMaxOfKey("reps_in_reserve")["reps_in_reserve"],
                "date": specific_date.isoformat(),
            }
            add_or_update_diagram_data_point(
                db,
                user_id,
                dataJSON,
                title=exercise_name + " RIR",
                specific_date=specific_date,
            )


def convert_exercise_names_to_db_exercise_names(
    exercise_list: list[str], type_of_exercise: str = "weight"
) -> list[str]:
    res = []
    for exercise_entry in exercise_list:
        if exercise_entry in exercise_list_to_db_exercise_dict:
            res.append(exercise_list_to_db_exercise_dict[exercise_entry])
            continue

        exercise_id = crud_get_exercise_id_from_name(exercise_entry, type_of_exercise)
        if not exercise_id:
            res.append(None)
            exercise_list_to_db_exercise_dict[exercise_entry] = None
            continue
        exercise = crud_get_exercise_name_from_id(exercise_id)

        if exercise:
            res.append(exercise)
            exercise_list_to_db_exercise_dict[exercise_entry] = exercise
        else:
            res.append(None)
            exercise_list_to_db_exercise_dict[exercise_entry] = None
    return res


def get_list_of_exercises() -> list[str]:
    exercises = []
    with get_db_cursor() as cursor:
        cursor.execute("""SELECT name FROM exercises;""")
        exercises = cursor.fetchall()
    if exercises:
        exercises = [exercise[0] for exercise in exercises]
        return exercises
    return []


def get_available_stats_for_exercises() -> list[list[bool]]:
    exercises = []
    with get_db_cursor() as cursor:
        cursor.execute("""SELECT * FROM exercises;""")
        exercises = cursor.fetchall()
    if exercises:
        exercises = [exercise[1:] for exercise in exercises]
        return exercises  # type: ignore
    return []
