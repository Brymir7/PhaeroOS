from inspect import unwrap
import psycopg2
from contextlib import contextmanager
from core.config import create_settings
from db.database import get_db
from db.lru import LRUCache

settings = create_settings()
USDA_MAINDB_FOOD_ID_MAX = 2671424  # needed to decide between our db and user db

LRUCacheObject = LRUCache(3000)

allowed_languages = ["english", "german"]
# possible_language = [
#     "arabic",
#     "armenian",
#     "basque",
#     "catalan",
#     "danish",
#     "dutch",
#     "english",
#     "finnish",
#     "french",
#     "german",
#     "greek",
#     "hindi",
#     "hungarian",
#     "indonesian",
#     "irish",
#     "italian",
#     "lithuanian",
#     "nepali",
#     "norwegian",
#     "portuguese",
#     "romanian",
#     "russian",
#     "serbian",
#     "spanish",
#     "swedish",
#     "tamil",
#     "turkish",
#     "yiddish",
# ]


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
    cursor.execute("SET search_path TO public")
    return conn, cursor


def crud_delete_food_description(food_description: str, user_id: int):
    with get_db_cursor() as cursor:
        food_description = food_description.upper().strip()
        print(food_description, user_id)
        cursor.execute(
            """SELECT food.fdc_id 
                    FROM phaero_food.food 
                    JOIN phaero_food.userFoods ON food.fdc_id = userFoods.fdc_id
                    WHERE food.description = %s AND userFoods.user_id = %s;""",
            (food_description, user_id),
        )
        fdc_id = cursor.fetchone()
        if not fdc_id:
            print("Didnt find food to delete")
            return
        fdc_id = fdc_id[0]
        print(fdc_id, USDA_MAINDB_FOOD_ID_MAX)
        if fdc_id <= USDA_MAINDB_FOOD_ID_MAX:
            print("WARNING Trying to delete a food that is not in the user db")
            return
        cursor.execute(
            """DELETE FROM phaero_food.userfoods WHERE user_id = %s AND fdc_id = %s;""",
            (user_id, fdc_id),
        )
        cursor.execute(
            """SELECT COUNT(*) FROM phaero_food.userfoods WHERE fdc_id = %s;""",
            (fdc_id,),
        )
        count = cursor.fetchone()
        count = count[0] if count else None
        if count == 0:
            cursor.execute(
                """DELETE FROM phaero_food.food WHERE fdc_id = %s;""",
                (fdc_id,),
            )
            cursor.execute(
                """DELETE FROM phaero_food.food_nutrient WHERE fdc_id = %s;""",
                (fdc_id,),
            )


def crud_get_food_description_by_name(food_name: str, user_id: int):
    with get_db_cursor() as cursor:
        if not food_name:
            return []
        cursor.execute(
            """SELECT nt.name, CAST(fn.amount AS FLOAT) AS total_amount, nt.unit_name
                    FROM phaero_food.food_nutrient fn
                    INNER JOIN phaero_food.food ft ON fn.fdc_id = ft.fdc_id
                    JOIN phaero_food.userfoods uf ON ft.fdc_id = uf.fdc_id 
                    JOIN phaero_food.nutrient nt ON fn.nutrient_id = nt.id
                    WHERE ft.description = %s 
                    AND uf.user_id = %s; """,
            (food_name, user_id),
        )
        result = cursor.fetchall()
        if result:
            return result
        cursor.execute(
            """SELECT nt.name, CAST(fn.amount AS FLOAT) AS total_amount, nt.unit_name
                    FROM phaero_food.food_nutrient fn
                    INNER JOIN phaero_food.food ft ON fn.fdc_id = ft.fdc_id
                    JOIN phaero_food.userfoods uf ON ft.fdc_id = uf.fdc_id 
                    JOIN phaero_food.nutrient nt ON fn.nutrient_id = nt.id
                    WHERE ft.description = %s; """,
            (food_name,),
        )
        result = cursor.fetchall()
        if result:
            return result
        cursor.execute(
            """
            SELECT nt.name, fn_aggregated.total_amount, nt.unit_name
            FROM (
                SELECT fn.nutrient_id, AVG(CAST(fn.amount AS FLOAT)) AS total_amount
                FROM phaero_food.food_nutrient fn
                INNER JOIN phaero_food.foundation_food ff on fn.fdc_id = ff.fdc_id
                WHERE ff.description = %s
                GROUP BY fn.nutrient_id
            ) AS fn_aggregated 
            JOIN phaero_food.nutrient nt ON fn_aggregated.nutrient_id = nt.id;
            """,
            (food_name,),
        )
        result = cursor.fetchall()
        if not result:
            cursor.execute(
                """SELECT nt.name, fn_aggregated.total_amount, nt.unit_name
                    FROM (
                        SELECT fn.nutrient_id, AVG(CAST(fn.amount AS FLOAT)) AS total_amount
                        FROM phaero_food.food_nutrient fn
                        INNER JOIN phaero_food.german_foundation_food ft ON fn.fdc_id = ft.fdc_id
                        WHERE ft.description = %s
                        GROUP BY fn.nutrient_id
                    ) AS fn_aggregated
                    JOIN phaero_food.nutrient nt ON fn_aggregated.nutrient_id = nt.id;""",
                (food_name,),
            )
            result = cursor.fetchall()
        if not result:
            cursor.execute(
                """SELECT nt.name, fn_aggregated.total_amount, nt.unit_name
                    FROM (
                        SELECT fn.nutrient_id, AVG(CAST(fn.amount AS FLOAT)) AS total_amount
                        FROM phaero_food.food_nutrient fn
                        INNER JOIN phaero_food.food ft ON fn.fdc_id = ft.fdc_id AND fn.fdc_id < %s
                        WHERE ft.description = %s
                        GROUP BY fn.nutrient_id
                    ) AS fn_aggregated
                    JOIN phaero_food.nutrient nt ON fn_aggregated.nutrient_id = nt.id;""",
                (USDA_MAINDB_FOOD_ID_MAX, food_name),
            )
            result = cursor.fetchall()

        food_id = crud_get_food_id_by_name(food_name)
        if food_name.endswith("SS"):
            return crud_get_food_description_by_name(
                food_name.replace("SS", "ß"), user_id
            )
        if not food_id:
            return result
        if food_id < USDA_MAINDB_FOOD_ID_MAX:  # only cache non user specific data
            LRUCacheObject.put(food_name)
        return result


def crud_get_food_id_by_name(food_name: str):
    food_name = food_name.replace("'", "''")
    with get_db_cursor() as cursor:
        cursor.execute(
            """SELECT ft.fdc_id
                FROM phaero_food.food ft
                WHERE ft.description = %s;""",
            (food_name,),
        )
        result = cursor.fetchone()
        if result:
            return result[0]
        return None


def unwrap_db_result(query, result):
    if not result:
        return []
    return sort_by_order_first_appearance_in_string([item[0] for item in result], query)


import time


def crud_search_for_food_name(
    food_name: str,
    user_id: int,
    userSettings: dict,
    use_cache: bool = True,
) -> tuple[list[str], list[str], list[str], list[str], list[str]]:
    food_name = food_name.replace("'", "''").replace("`", "").replace("´", "")
    food_name = food_name.upper()

    main_db_result = []
    cache_res = []
    if use_cache:
        cache_res = LRUCacheObject.search(
            query=food_name,
            threshold=0.6,
            size_threshold_overlap=8,
            threshold_overlap=3,
            limit=5,
        )

    # Start time for each function
    start_user = time.time()
    user_result = search_user_foods(food_name, user_id)
    end_user = time.time()

    start_other_users = time.time()
    other_users_result = search_user_foods(food_name, user_id, search_other_users=True)
    end_other_users = time.time()

    start_sr = time.time()
    sr_result = search_sr(food_name, userSettings)
    end_sr = time.time()

    start_foundation = time.time()
    foundation_result = search_foundation_foods(food_name, userSettings)
    end_foundation = time.time()

    start_main_db = time.time()
    main_db_result = search_main_db(food_name, userSettings)
    end_main_db = time.time()

    # Calculate durations
    user_duration = end_user - start_user
    other_users_duration = end_other_users - start_other_users
    sr_duration = end_sr - start_sr
    foundation_duration = end_foundation - start_foundation
    main_db_duration = end_main_db - start_main_db

    # Print durations
    print(f"user_result took {user_duration:.6f} seconds")
    print(f"other_users_result took {other_users_duration:.6f} seconds")
    print(f"sr_result took {sr_duration:.6f} seconds")
    print(f"foundation_result took {foundation_duration:.6f} seconds")
    print(f"main_db_result took {main_db_duration:.6f} seconds")
    if not main_db_result:
        main_db_result: list[str] = cache_res if cache_res else []
        return (
            user_result,
            other_users_result,
            main_db_result,
            foundation_result,
            sr_result,
        )
    if main_db_result:
        if cache_res:
            main_db_result = cache_res + main_db_result
    if not user_result:
        return (
            [],
            other_users_result,
            main_db_result,
            foundation_result,
            sr_result,
        )
    return (
        user_result,
        other_users_result,
        main_db_result,
        foundation_result,
        sr_result,
    )


def search_user_foods(
    food_name: str, user_id: int, search_other_users: bool = False
) -> list[str]:
    food_name = food_name.strip().lower()
    query = ""
    if search_other_users:
        query = """
            WITH filtered_foods AS (
                SELECT ft.description, ft.fdc_id
                FROM phaero_food.food ft
                JOIN phaero_food.userfoods uf ON ft.fdc_id = uf.fdc_id
                WHERE uf.user_id != %s
                AND ft.description ILIKE %s
            ),
            similarity_results AS (
                SELECT description,
                    similarity(description, %s) AS sim
                FROM filtered_foods
                WHERE similarity(description, %s) > 0.3
            )
            SELECT description
            FROM similarity_results
            ORDER BY sim DESC
            LIMIT 20 -- Add a limit to prevent returning too many results
        """
    else:
        query = """
            WITH filtered_foods AS (
                SELECT ft.description, ft.fdc_id
                FROM phaero_food.food ft
                JOIN phaero_food.userfoods uf ON ft.fdc_id = uf.fdc_id
                WHERE uf.user_id = %s
                AND ft.description ILIKE %s
            ),
            similarity_results AS (
                SELECT description,
                    similarity(description, %s) AS sim
                FROM filtered_foods
                WHERE similarity(description, %s) > 0.3
            )
            SELECT description
            FROM similarity_results
            ORDER BY sim DESC
            LIMIT 10  -- Add a limit to prevent returning too many results
        """
    query_params = (
        user_id,
        f"{food_name}%",
        food_name,
        food_name,
    )
    with get_db_cursor() as cursor:
        cursor.execute(query, query_params)
        results = cursor.fetchall()

    return unwrap_db_result(food_name, results)


def search_foundation_foods(food_name: str, userSettings: dict) -> list[str]:
    with get_db_cursor() as cursor:
        foundationQuery = ""
        if userSettings["language"] == "german":
            foundationQuery = """
            SET pg_trgm.similarity_threshold = 0.3; 
                    SELECT description
                    FROM phaero_food.german_foundation_food
                    WHERE description %% %s
                    LIMIT 10;
                    """
        else:
            foundationQuery = """
             SET pg_trgm.similarity_threshold = 0.3; 
                    SELECT description
                    FROM phaero_food.foundation_food
                    WHERE description %% %s
                    LIMIT 10;
                    """
        cursor.execute(
            foundationQuery,
            (food_name,),
        )
        foundation_result = cursor.fetchall()
        if not foundation_result:
            query = """
                SELECT description
                FROM phaero_food.foundation_food
                WHERE to_tsvector(%s, description) @@ plainto_tsquery(%s, %s) and fdc_id < 2666973
                LIMIT 50;
                """
            cursor.execute(
                query,
                (
                    userSettings["language"],
                    userSettings["language"],
                    food_name,
                ),
            )
            foundation_result = cursor.fetchall()

        return unwrap_db_result(food_name, foundation_result)


def search_main_db(food_name: str, user_settings: dict) -> list[str]:
    with get_db_cursor() as cursor:
        query = """
            SELECT description
            FROM phaero_food.german_food
            WHERE to_tsvector(%s, description) @@ plainto_tsquery(%s, %s)
            LIMIT 25;
            """
        cursor.execute(
            query,
            (
                user_settings["language"],
                user_settings["language"],
                food_name,
            ),
        )
        germanResult = cursor.fetchall()
        germanRes = unwrap_db_result(food_name, germanResult)

        query = """
                SELECT description
                FROM phaero_food.food
                WHERE to_tsvector(%s, description) @@ plainto_tsquery(%s, %s) and fdc_id < 2666973
                LIMIT 25;
                """
        cursor.execute(
            query,
            (
                user_settings["language"],
                user_settings["language"],
                food_name,
            ),
        )
        result = cursor.fetchall()
        engl_res = unwrap_db_result(food_name, result)
        if user_settings["language"] == "german":
            return germanRes + engl_res
        else:
            return engl_res + germanRes


def search_sr(food_name: str, userSettings: dict) -> list[str]:
    with get_db_cursor() as cursor:
        srQuery = """
                    SELECT sr_description
                    FROM phaero_food.input_food
                    WHERE to_tsvector(%s, sr_description) @@ plainto_tsquery(%s, %s)
                    LIMIT 10;
                    """
        cursor.execute(
            srQuery,
            (
                userSettings["language"],
                userSettings["language"],
                food_name,
            ),
        )
        sr_result = cursor.fetchall()
        return unwrap_db_result(food_name, sr_result)


def sort_by_order_first_appearance_in_string(
    search_result: list[str], word: str
) -> list[str]:
    """Sorts the search result by the order of the first appearance of the word in the string.
    Sorts tuples by first element -> [0] or string in the list"""
    if not search_result:
        return []
    word = word.lower()

    def sort_key(item):
        # Determine whether the item is a tuple or a single string
        string_to_check = item[0] if isinstance(item, tuple) else item

        # Split and find the word in the string
        if " " in string_to_check:
            return string_to_check.split(" ", 1)[1].lower().find(word)
        else:
            return float("inf")

    res = sorted(search_result, key=sort_key)
    return res


def crud_get_all_food_descriptions():
    with get_db_cursor() as cursor:
        cursor.execute(
            """SELECT ft.description
                FROM phaero_food.food ft;"""
        )
        result = cursor.fetchall()
        return result


def crud_get_all_food_ids_descriptions():
    with get_db_cursor() as cursor:
        cursor.execute(
            """SELECT ft.fdc_id, ft.description
                FROM phaero_food.food ft LIMIT 10000;"""
        )
        result = cursor.fetchall()
        return result


def crud_add_recipe_to_db():
    pass


def crud_get_recommended_stats_default() -> dict:
    with get_db_cursor() as cursor:
        cursor.execute(
            """SELECT recAmount.name, recAmount.unit_name, recAmount.default_amount
                FROM phaero_food.UserRecommendations as recAmount;"""
        )
        result = cursor.fetchall()
        result_dict = {}
        for name, unit, amount in result:
            result_dict[name] = (amount, unit)
        return result_dict


def crud_get_custom_foods_names(user_id: int) -> list[str]:
    with get_db_cursor() as cursor:
        cursor.execute(
            """SELECT ft.description
                FROM phaero_food.food ft
                JOIN phaero_food.userfoods uf ON ft.fdc_id = uf.fdc_id
                WHERE uf.user_id = %s;""",
            (user_id,),
        )
        result = cursor.fetchall()
        result = [item[0] for item in result]
        return result


def crud_get_custom_foods_name_to_portion_size_dict(user_id: int) -> dict:
    with get_db_cursor() as cursor:
        cursor.execute(
            """SELECT ft.description, uf.portion_size
                FROM phaero_food.food ft
                JOIN phaero_food.userfoods uf ON ft.fdc_id = uf.fdc_id
                WHERE uf.user_id = %s;""",
            (user_id,),
        )
        result = cursor.fetchall()
        if not result:
            return {}
        result = {item[0].lower(): item[1] for item in result}
        return result


def crud_create_custom_food(
    user_id: int, food_description: str, macros: dict, portion_size: int
):
    with get_db_cursor() as cursor:
        food_description = food_description.upper().strip()
        cursor.execute(
            """
            SELECT COUNT(*)
            FROM phaero_food.userfoods uf
            INNER JOIN phaero_food.food f ON uf.fdc_id = f.fdc_id
            WHERE uf.user_id = %s AND f.description = %s;
            """,
            (user_id, food_description),
        )
        count = cursor.fetchone()[0]
        if count != 0:
            raise Exception(
                "Trying to create a food that already exists in the user db"
            )
        cursor.execute(
            """INSERT INTO phaero_food.food (description)
                VALUES (%s);""",
            (food_description,),
        )
        cursor.execute(
            """SELECT fdc_id FROM phaero_food.food WHERE description = %s;""",
            (food_description,),
        )
        fdc_id = cursor.fetchone()[0]

        for key, value in macros.items():
            cursor.execute(
                """SELECT id FROM phaero_food.nutrient WHERE name = %s;""",
                (key,),
            )
            nutrient_id = cursor.fetchone()[0]
            cursor.execute(
                """INSERT INTO phaero_food.food_nutrient (fdc_id, nutrient_id, amount) VALUES(%s, %s, %s);""",
                (fdc_id, nutrient_id, value),
            )

        cursor.execute(
            """INSERT INTO phaero_food.userfoods (user_id, fdc_id, portion_size) VALUES (%s, %s, %s);""",
            (user_id, fdc_id, portion_size),
        )


def crud_update_existing_food_description(
    food_name: str, macros_dict: dict, portion_size: int, user_id: int
):
    with get_db_cursor() as cursor:
        food_name = food_name.upper().strip()
        cursor.execute(
            """
                SELECT f.fdc_id FROM phaero_food.food f 
                INNER JOIN phaero_food.userfoods uf on f.fdc_id = uf.fdc_id
                WHERE description = %s;""",
            (food_name,),
        )
        fdc_id_res = cursor.fetchone()
        if not fdc_id_res:
            raise Exception("Trying to update a food that is not in the user db")
        fdc_id = fdc_id_res[0]
        if fdc_id <= USDA_MAINDB_FOOD_ID_MAX:
            raise Exception("Trying to update a food that is not in the user db")
        for key, value in macros_dict.items():  # value is tuple of (amount, unit)
            cursor.execute(
                """SELECT id FROM phaero_food.nutrient WHERE name = %s;""",
                (key,),
            )
            nutrient_result = cursor.fetchone()
            if nutrient_result is not None:
                nutrient_id = nutrient_result[0]
                cursor.execute(
                    """UPDATE phaero_food.food_nutrient SET amount = %s WHERE fdc_id = %s AND nutrient_id = %s;""",
                    (value, fdc_id, nutrient_id),
                )
        cursor.execute(
            """UPDATE phaero_food.userfoods SET portion_size = %s WHERE user_id = %s AND fdc_id = %s;""",
            (portion_size, user_id, fdc_id),
        )


def crud_get_foundation_foods_portion_dict():
    with get_db_cursor() as cursor:
        cursor.execute(
            """SELECT ff.description, ff.portion_size
                FROM phaero_food.foundation_food ff;"""
        )
        result = cursor.fetchall()
        result = {
            item[0].lower(): int(item[1]) if item[1] is not None else 0
            for item in result
        }
        return result
