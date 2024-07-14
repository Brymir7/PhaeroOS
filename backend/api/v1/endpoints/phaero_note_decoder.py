import asyncio
from datetime import timedelta
import json
import time
import httpx
from api.v1.endpoints.openAIUtils import get_embedding_from_text
from core.config import create_settings
from phaeroAI import exerciseAI, weightAI
import phaeroAI.foodAI as foodAI
import phaeroAI.sleepAI as sleepAI
import db.crud as crud
import phaeroAI.noteAI as noteAI
from phaeroAI.utils import trigram_search_similarity
from . import utils
from sqlmodel import Session
import re

# import dspy

settings = create_settings()
OPENAI_API_KEY = settings.OPENAI_KEY
OPENAI_API_URL = settings.OPENAI_API_URL
USE_LOCAL_MODEL = settings.USE_LOCAL_MODEL
LOCAL_MODEL_URL = settings.LOCAL_MODEL_URL


def has_digit(s: str) -> bool:
    return any(char.isdigit() for char in s)


async def async_AIPrompt(
    client: httpx.AsyncClient,
    sys_message: str,
    query: str,
    injection: str = "",
    model: str = "gpt-3.5-turbo-0125",
    temperature: float = 0.0,
) -> str:
    if USE_LOCAL_MODEL:
        url = LOCAL_MODEL_URL
        data = {
            "model": settings.LOCAL_MODEL_NAME,
            "messages": [
                {"role": "system", "content": sys_message},
                {"role": "user", "content": injection + query},
            ],
            "temperature": temperature,
        }
        response = await client.post(url, json=data, timeout=30)
        json_results = response.content.split(b"\n")
        result = [json.loads(j) for j in json_results if j]
        return "".join(
            obj["message"]["content"]
            for obj in result
            if "message" in obj and "content" in obj["message"]
        )
    else:
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }
        data = {
            "model": model,
            "messages": [
                {"role": "system", "content": sys_message},
                {"role": "user", "content": injection + query},
            ],
            "temperature": temperature,
        }
        response = await client.post(
            OPENAI_API_URL, headers=headers, json=data, timeout=30
        )

    result = response.json()
    if "choices" not in result or not result["choices"]:
        return ""
    return result["choices"][0]["message"]["content"]


supplementList = [
    "coffee",
    "creatine",
    "caffeine",
    "caffeine pills",
    "caffeine powder",
    "preworkout",
    "postworkout",
    "pre workout",
    "post workout",
    "stims",
    "stimulants",
    "stim free",
    "protein powder",
    "protein shake",
    "whey",
    "whey protein",
    "whey protein powder",
    "whey protein shake",
    "whey protein powder shake",
    "whey protein shake powder",
    "vitamin d",
    "vitamin d+k2",
    "vitamin d3",
    "vitamin d3+k2",
    "vitamin d3 k2",
    "vitamin d k2",
    "vitamin d3k2",
    "vitamin d k2",
    "magnesium",
    "zinc",
    "zinc gluconate",
    "zinc glycinate",
    "zinc picolinate",
    "zinc citrate",
    "zinc orotate",
    "zinc acetate",
    "zinc sulfate",
    "zinc oxide",
    "zinc carbonate",
]


class PhaeroNoteDecoder:
    """Class that takes a phaero note and converts it into a dictionary of nutrition, sleep, exercise, note, checklist, and supplemental data."""

    def __init__(
        self,
        phaeroNote: str,
        user_settings: dict,
        user_id: int,
        client: httpx.AsyncClient,
        db: Session,
        phaero_note_default_dict: dict = {},
        user_portion_sizes: dict = {},
    ):
        if not phaero_note_default_dict:
            self.phaeroNoteDict = {
                "Note": {"Note": "", "Rating": 0},
                "Sleep & Weight": {},
                "Exercise": {
                    "Steps": 0,
                    "absolute Rating": 0,
                    "relative Rating": 0,
                    "Exercises": {
                        "Weight Lifting Exercises": {},
                        "Cardio Exercises": {},
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
                "Food": {
                    "FoodList": {},
                    "Not found foods": [],
                    "List of Supplements": [],
                },
            }
        else:
            self.phaeroNoteDict = phaero_note_default_dict
        self.preprocessingPhaeroNote = phaeroNote
        self.phaeroNote = phaeroNote  # the note to be processed
        self.userSettings = (
            user_settings  # Dictionary of key user settings to user choice
        )
        self.user_id = user_id  # user_id of the user who wrote the note
        self.client: httpx.AsyncClient = client  # httpx client
        self.db = db  # database
        self.userFoodsWithPortions = (
            user_portion_sizes  # key: user foods with values: portions
        )

    def convert_phaero_note_to_nutrition_entry(
        self,
    ) -> dict:
        """
        Adds to the dictionary self.phaeroNoteDict the nutrition data of the note self.phaeroNote
        Params:
        self.user_id - the self.user_id of the user who wrote the note \n
        self.phaeroNote - the note to be processed\n
        self.phaeroNoteDict - the dictionary to add the nutrition data to\n
        highQuality - whether to use AI to judge what queryResult is most fitting or not\n
        """
        listOfNutritionValues: list[tuple[dict, dict]]
        totalNutritionValues: dict[str, tuple[float, str]]
        listOfFoods: list[str]

        if not self.userFoodsWithPortions:
            return self.phaeroNoteDict
        (
            listOfNutritionValues,
            totalNutritionValues,
            listOfFoods,
        ) = foodAI.FoodAI(
            user_id=self.user_id,
            userSettings=self.userSettings,
            phaeroNote=self.food_list_str,
            userfoods_with_portions=self.userFoodsWithPortions,
        ).get_food_stats_of_db_foods()
        if not totalNutritionValues or not listOfFoods or not listOfNutritionValues:
            return self.phaeroNoteDict

        newFoodDict = {}
        newFoodDict["Food"] = {"FoodList": {}}
        upperListOfFoods = [food.upper() for food in listOfFoods]
        for idx, food in enumerate(upperListOfFoods):
            macros = listOfNutritionValues[idx][0]
            micros = listOfNutritionValues[idx][1]
            macros.setdefault("protein", [0, "g"])
            macros.setdefault("carbs", [0, "g"])
            macros.setdefault("fat", [0, "g"])
            macros.setdefault("sugar", [0, "g"])
            macros.setdefault("calories", [0, "KCAL"])
            macros.setdefault("amount", [0, "g"])
            if (
                food not in newFoodDict["Food"]["FoodList"]
            ):  # first time seeing this food
                newFoodDict["Food"]["FoodList"][food] = {"Macros": {}, "Micros": {}}
                newFoodDict["Food"]["FoodList"][food]["Macros"] = macros
                newFoodDict["Food"]["FoodList"][food]["Micros"] = micros

            else:  # already seen this food, add them together to get total
                newFoodDict["Food"]["FoodList"][food]["Macros"] = (
                    foodAI.FoodAI.add_dicts(
                        newFoodDict["Food"]["FoodList"][food]["Macros"], macros
                    )
                )
                newFoodDict["Food"]["FoodList"][food]["Micros"] = (
                    foodAI.FoodAI.add_dicts(
                        newFoodDict["Food"]["FoodList"][food]["Micros"], micros
                    )
                )
                if food in self.userFoodsWithPortions:  # overwrite the portion size
                    newFoodDict["Food"]["FoodList"][food]["Macros"] = macros
                    newFoodDict["Food"]["FoodList"][food]["Micros"] = micros

            newFoodDict["Food"]["Not found foods"] = []  # type: ignore # TODO

        self.phaeroNoteDict["Nutrition"]["Total"] = totalNutritionValues
        self.phaeroNoteDict["Food"]["FoodList"] = utils.merge_dictionaries(
            self.phaeroNoteDict["Food"]["FoodList"], newFoodDict["Food"]["FoodList"]
        )
        if "Not found foods" in newFoodDict["Food"]:
            self.phaeroNoteDict["Food"]["Not found foods"] = newFoodDict["Food"][
                "Not found foods"
            ]
        hydrationAmount = foodAI.FoodAI(
            user_id=self.user_id,
            userSettings=self.userSettings,
            userfoods_with_portions=self.userFoodsWithPortions,
            phaeroNote=self.preprocessingPhaeroNote,
        ).get_hydration_amount()
        self.phaeroNoteDict["Nutrition"]["Total"]["Macros"]["fluid"] = (
            hydrationAmount,
            "ML",
        )
        return self.phaeroNoteDict

    def convert_phaero_note_to_new_foods(self):
        """Converts the phaero note into custom foods"""
        foodLines: list[str] = self.food_list_str.split("\n")
        filteredFoodLines: list[str] = []
        foodGrams = []
        for line in foodLines:
            grams = foodAI.FoodAI.get_grams_amount_from_line(line=line)
            if grams:
                if grams < 10000:  # avoid bench press as food (exercises in general)
                    foodGrams.append(grams)
                    filteredFoodLines.append(line)
        filteredFoodGrams = [
            100 if (not grams or grams <= 5) else grams for grams in foodGrams
        ]  # if its smaller than 5g, assume its 100g also because of floating point like 0.5
        splitAtFirstNumber = lambda x: re.split(r"(\d+)", x, 1)
        listOfFoods: list[str] = []
        for line in filteredFoodLines:
            line = (
                line.replace("'ml'", "")
                .replace(" ml ", "")
                .replace("'l'", "")
                .replace(" l ", "")
                .replace("'g'", "")
                .replace(" g ", "")
                .strip()
            )
            if not line:
                continue
            if line[0].isdigit():
                line = (
                    splitAtFirstNumber(line)[2]
                    .replace("'", "")
                    .replace('"', "")
                    .strip()
                )
                if line.startswith("g "):
                    line = line[2:]
                if line.startswith("ml "):
                    line = line[3:]
                if line.startswith("l "):
                    line = line[2:]
            elif line[0] == "'":
                line = line.split(" ")[0].replace("'", "").replace('"', "").strip()
            else:
                line = line.strip()
            listOfFoods.append(line)
        actuallyNewFoods: list[tuple[str, float]] = []

        def smart_bool_lookup(key: str, lst: list[str]) -> bool:
            keyLower = key.lower()
            lstLower = [item.lower() for item in lst]
            if keyLower == "":
                return True
            if keyLower in lstLower:
                return True
            if keyLower.rstrip("s") in lstLower:
                return True
            if keyLower.rstrip("es") in lstLower:
                return True
            if keyLower.rstrip("ies") in lstLower:
                return True
            if keyLower.replace("  ", "").replace(" ", "") in lstLower:
                return True
            if (
                len(keyLower) > 5 and keyLower[:-1] in lstLower
            ):  # remove last letter, more generalized
                return True
            key_length = len(key)
            for item in lstLower:
                item_length = len(item)
                if keyLower in item and key_length >= item_length / 2:
                    return True
                if item in keyLower and item_length >= key_length / 1.5:
                    return True
                if (
                    len(keyLower.split(" ")) > 1
                    and trigram_search_similarity(keyLower, item) > 0.66
                ):
                    return True
                words1 = keyLower.split(" ")
                words2 = item.split(" ")
                count = 0
                for word in words1:
                    if word in words2:
                        count += 1
                    if count >= len(words1) / 1.5:
                        return True
                count = 0
                for word in words2:
                    if word in words1:
                        count += 1
                    if count >= len(words2) / 1.5:
                        return True
            return False

        visited = {}
        for idx, food in enumerate(listOfFoods):
            foodToAppend = food.strip().upper()
            if not smart_bool_lookup(
                foodToAppend,
                [key for key in self.phaeroNoteDict["Food"]["FoodList"].keys()],
            ):
                if foodToAppend not in visited:
                    visited[foodToAppend] = True
                    actuallyNewFoods.append((foodToAppend, filteredFoodGrams[idx]))
        self.phaeroNoteDict["Food"]["Not found foods"] = {}
        for userFood, grams in actuallyNewFoods:
            dbResult = foodAI.FoodAI.db_search_food(
                self.user_id, self.userSettings, userFood
            )
            self.phaeroNoteDict["Food"]["Not found foods"][userFood] = {
                "Macros": {},
                "Micros": {},
                "StatsFrom": dbResult,
            }
            defaultMacros = {}
            defaultMicros = {}
            if dbResult:
                macros, micros = foodAI.FoodAI.get_nutrition_from_db_results(
                    dbResult, self.user_id
                )
                if macros:
                    defaultMacros = macros
                if micros:
                    defaultMicros = micros
            defaultMacros.setdefault("protein", [0, "g"])
            defaultMacros.setdefault("carbs", [0, "g"])
            defaultMacros.setdefault("fat", [0, "g"])
            defaultMacros.setdefault("sugar", [0, "g"])
            defaultMacros.setdefault("calories", [0, "KCAL"])
            defaultMacros.setdefault("amount", [0, "g"])
            self.phaeroNoteDict["Food"]["Not found foods"][userFood]["Macros"] = (
                foodAI.FoodAI.add_dicts(
                    self.phaeroNoteDict["Food"]["Not found foods"][userFood]["Macros"],
                    defaultMacros,
                )
            )
            self.phaeroNoteDict["Food"]["Not found foods"][userFood]["Macros"][
                "amount"
            ] = [
                grams,
                "g",
            ]
            self.phaeroNoteDict["Food"]["Not found foods"][userFood]["Micros"] = (
                foodAI.FoodAI.add_dicts(
                    self.phaeroNoteDict["Food"]["Not found foods"][userFood]["Micros"],
                    defaultMicros,
                )
            )
            self.phaeroNoteDict["Food"]["Not found foods"][userFood]["Micros"][
                "amount"
            ] = [
                grams,
                "g",
            ]
        return self.phaeroNoteDict

    def convert_phaero_note_to_sleep_entry(self):
        # NOTE defualt values are always set so if we don'Ät set them here they are set already
        sleepTimes = sleepAI.SleepAI(self.phaeroNote).get_sleep_time_strings()
        if not sleepTimes:
            return self.phaeroNoteDict
        if len(sleepTimes) == 1:
            idxSleepTime = self.phaeroNote.find(sleepTimes[0])
            if idxSleepTime == -1:
                return self.phaeroNoteDict
            textTillNewLine = self.phaeroNote[:idxSleepTime].split("\n")[-1]
            if "Wake" in textTillNewLine:  # wake time is when sleep ends
                try:
                    self.phaeroNoteDict["Sleep & Weight"]["Sleep End"] = (
                        sleepAI.SleepAI(self.phaeroNote).convert_to_datetime(
                            sleepTimes[0]
                        )
                    )
                except ValueError:
                    return self.phaeroNoteDict
            else:
                try:
                    sleepStart = sleepAI.SleepAI(self.phaeroNote).convert_to_datetime(
                        sleepTimes[0]
                    )
                    if (
                        sleepStart.hour > 12
                    ):  # NOTE sleep is in the evening, otherwise it's after 00:00
                        sleepStart = sleepStart - timedelta(days=1)
                    self.phaeroNoteDict["Sleep & Weight"]["Sleep Start"] = sleepStart
                except ValueError:
                    return self.phaeroNoteDict
            return self.phaeroNoteDict

        try:
            sleepStart = sleepAI.SleepAI(self.phaeroNote).convert_to_datetime(
                sleepTimes[0]
            )
            sleepEnd = sleepAI.SleepAI(self.phaeroNote).convert_to_datetime(
                sleepTimes[1]
            )
        except ValueError:
            return self.phaeroNoteDict
        if sleepStart.hour > 12:
            sleepStart = sleepStart - timedelta(
                days=1
            )  # NOTE sleep is in the evening, otherwise it's after 00:00
        self.phaeroNoteDict["Sleep & Weight"]["Sleep Start"] = sleepStart
        self.phaeroNoteDict["Sleep & Weight"]["Sleep End"] = sleepEnd
        return self.phaeroNoteDict

    def convert_phaero_note_to_exercise_entry(self) -> dict:
        userMetrics: dict[str, any] = crud.get_additional_user_data(self.db, self.user_id)  # type: ignore
        exerciseClass = exerciseAI.ExerciseAI(
            phaeroNote=self.phaeroNote,
            cardioExercises=crud.get_cardio_exercises(self.db),
            weightLiftingExercises=crud.get_weightlifting_exercises(self.db),
            bodyweightExercises=crud.get_bodyweight_exercises(self.db),
            userMetrics=userMetrics,
        )
        self.phaeroNoteDict["Exercise"]["Exercises"] = {
            "Weight Lifting Exercises": {},
            "Cardio Exercises": {},
            "Bodyweight Exercises": {},
            "Other Exercises": {},
        }
        if self.phaeroNoteDict["Exercise"]["Steps"] == 0:
            steps = exerciseClass.get_steps()
            self.phaeroNoteDict["Exercise"]["Steps"] = steps
        cardioExercises = (
            exerciseClass.get_cardio_exercises_durations_sets_reps_calories_distances()
        )  # TODO add user exercises)
        cardioExercises = {key.lower(): value for key, value in cardioExercises.items()}
        for exercise_name in cardioExercises:
            for key, value in cardioExercises[exercise_name].items():
                if (
                    exercise_name
                    not in self.phaeroNoteDict["Exercise"]["Exercises"][
                        "Cardio Exercises"
                    ]
                ):
                    self.phaeroNoteDict["Exercise"]["Exercises"]["Cardio Exercises"][
                        exercise_name
                    ] = {}
                self.phaeroNoteDict["Exercise"]["Exercises"]["Cardio Exercises"][
                    exercise_name
                ][key] = (value if value else 0)
        weightLiftingExercises = (
            exerciseClass.get_weightlifting_exercise_sets_reps_weights()
        )  # TODO add user exercises
        weightLiftingExercises = {
            key.lower(): value for key, value in weightLiftingExercises.items()
        }
        for exercise_name in weightLiftingExercises:
            for key, value in weightLiftingExercises[exercise_name].items():
                if (
                    exercise_name
                    not in self.phaeroNoteDict["Exercise"]["Exercises"][
                        "Weight Lifting Exercises"
                    ]
                ):
                    self.phaeroNoteDict["Exercise"]["Exercises"][
                        "Weight Lifting Exercises"
                    ][exercise_name] = {}
                self.phaeroNoteDict["Exercise"]["Exercises"][
                    "Weight Lifting Exercises"
                ][exercise_name][key] = (value if value else 0)
        bodyweightExercises = (
            exerciseClass.get_bodyweight_exercise_sets_reps_durations()
        )  # TODO add user exercises
        bodyweightExercises = {
            key.lower(): value for key, value in bodyweightExercises.items()
        }
        for exercise_name in bodyweightExercises:
            for key, value in bodyweightExercises[exercise_name].items():
                if (
                    exercise_name
                    not in self.phaeroNoteDict["Exercise"]["Exercises"][
                        "Bodyweight Exercises"
                    ]
                ):
                    self.phaeroNoteDict["Exercise"]["Exercises"][
                        "Bodyweight Exercises"
                    ][exercise_name] = {}
                self.phaeroNoteDict["Exercise"]["Exercises"]["Bodyweight Exercises"][
                    exercise_name
                ][key] = (value if value else 0)

        (
            relativeRating,
            absoluteRating,
        ) = exerciseClass.convert_exercise_stats_to_activity_level(
            self.phaeroNoteDict["Exercise"]["Exercises"],
            self.phaeroNoteDict["Exercise"]["Steps"],
            db=self.db,
            user_id=self.user_id,
            minimum_data_points=2,
        )

        self.phaeroNoteDict["Exercise"]["absolute Rating"] = absoluteRating
        self.phaeroNoteDict["Exercise"]["relative Rating"] = relativeRating
        # print("steps calories burned")
        # print(
        #     exerciseAI.ExerciseAI.calculate_calories_burned_steps(
        #         self.phaeroNoteDict["Exercise"]["Steps"],
        #         userMetrics["weight"],
        #         userMetrics["height"],
        #     )
        # )
        return self.phaeroNoteDict

    def convert_phaero_note_to_note_entry(self) -> dict:
        self.phaeroNoteDict["Note"] = {}
        self.phaeroNoteDict["Note"] = {"Note": self.preprocessingPhaeroNote}
        return self.phaeroNoteDict

    def convert_phaero_note_to_checklist_entry(self) -> None:
        """Using AI, check whether specific checklist goals have been reached."""
        pass

    def convert_phaero_note_to_supplemental_entry(self) -> dict:
        supplements = foodAI.FoodAI(
            user_id=self.user_id,
            userSettings=self.userSettings,
            phaeroNote=self.phaeroNote,
            list_of_supplements=supplementList,
        ).get_list_of_supplements()
        self.phaeroNoteDict["Food"]["List of Supplements"].extend(supplements)
        return self.phaeroNoteDict

    def convert_phaero_note_to_weight_entry(self) -> dict:
        weightAmount = weightAI.convert_text_to_bodyweight(self.phaeroNote)
        print("WEIGHT AMOUNT", weightAmount)
        if weightAmount:
            self.phaeroNoteDict["Sleep & Weight"]["Weight"] = (weightAmount, "KG")
        print(self.phaeroNoteDict["Sleep & Weight"]["Weight"])
        return self.phaeroNoteDict

    def background_add_wellbeing_description_to_note(self):
        """Using AI judgement of the note, create a wellbeing description for the note."""

        def expandInformationPhaeroNote(phaero_note: str) -> str:
            return phaero_note.replace("#h", "Habit: ").replace(
                "#c", "Checked checklist item: "
            )

        try:
            summarizingDescriptionString = noteAI.get_wellbeing_classification(
                expandInformationPhaeroNote(
                    self.preprocessingPhaeroNote
                )  # investigate if phaeroNote or self.preprocessingPhaeroNote
            )
        except Exception as exc:
            print(exc)
            raise TimeoutError("Timeout error")
        crud.add_wellbeing_description_to_note(
            self.db, self.user_id, summarizingDescriptionString
        )

    def background_add_embedding_to_note(self):
        """Using AI judgement of the note, create an embedding for the note."""
        try:
            embedding = get_embedding_from_text(self.preprocessingPhaeroNote)
        except Exception as exc:
            print(exc)
            raise TimeoutError("Timeout error")
        crud.add_embedding_to_note(self.db, self.user_id, embedding)

    async def translate_into_food_list(self) -> str:
        if self.client is None:
            raise Exception("OpenAI client not initialized")
        system_prompt = """You are a precise food intake analyzer. Your task is to extract a list of foods and beverages consumed from given text. You must never translate any food or beverage names. Follow these rules strictly:
1. Return 'No Foods Found' if no food items are identified.
2. For each food item, format as: [amount] [unit] [food name]
3. Use a new line for each food item.
4. Use food names directly from the text.
5. Include all foods and beverages mentioned as consumed.
6. Use given quantities or count mentions for amounts.
7. Prefer gram amounts if provided; otherwise, use '1' as default.
8. Do not include any explanations or additional text in your response.
"""

        user_prompt = f"""Extract the food list from the following text according to the given rules:

{self.preprocessingPhaeroNote}

Return only the list or 'No Foods Found'.
"""
        translatedResult = await async_AIPrompt(
            self.client,
            sys_message=system_prompt,
            query=user_prompt,
            model="gpt-3.5-turbo-0125",
            temperature=0.0,
        )
        if ":" in translatedResult:
            translatedResult = translatedResult.split(":")[-1]
        if (
            "No foods found" in translatedResult
            and len(translatedResult.splitlines()) <= 2
            or ("No " in translatedResult and translatedResult.split(" ")[0] == "No")
            or "No " in translatedResult
            and len(translatedResult.splitlines()) == 1
        ):
            self.food_list_str = ""
            print("No foods found")
            return ""
        translatedResult = translatedResult.replace("(", "")
        translatedResult = translatedResult.replace(")", "")
        translatedResult = translatedResult.replace("```", "")
        translatedResult = translatedResult.replace("#", "")
        translatedResult = translatedResult.replace("- ", "")
        translatedResult = translatedResult.replace("~", "")
        translatedResult = translatedResult.replace("*", "")
        translatedResult = translatedResult.replace(">", "")
        translatedResult = translatedResult.replace("=", "")
        translatedResult = translatedResult.replace("<", "")
        translatedResult = translatedResult.replace(",", "")
        translatedResult = (
            translatedResult.replace("Food", "")
            .replace("Foods", "")
            .replace("Portion", "")
            .replace("portion", "")
            .replace("portions", "")
        )
        translatedResult = translatedResult.replace("Beverage", "").replace(
            "Beverages", ""
        )
        translatedResult = translatedResult.replace("\n\n", "\n")
        translatedResult = re.sub(r"\d+\.\s", "", translatedResult)
        crud.create_model_data(
            self.db,
            self.userSettings["language"],
            self.preprocessingPhaeroNote,
            translatedResult,
            type_of_data="food",
        )
        self.food_list_str = translatedResult
        return translatedResult

    async def translate_into_regex_usable_format(self) -> str:
        if self.client is None:
            raise Exception("OpenAI client not initialized")
        system_prompt = """You are a precise health and fitness data analyzer. Your task is to extract and structure specific information from given text. Follow these rules strictly:
1. Use metric units for all measurements.
2. Format sleep times as 'HH:MM'.
3. If information for a specific field is not provided, use '[Not provided]' as a placeholder.
4. Standardize exercise terminology (e.g., "run" becomes "running").
5. Clarify exercise notation (e.g., "100 x 5 x 3" becomes "100kg for 5 reps and 3 sets").
5. List each set of an exercise on a separate line, indented under the exercise name.
7. Provide only the requested information without additional explanations.

Structure your response in the following format:
Bodyweight: [weight in kg]
Bedtime (previous day): [HH:MM]
Wake-up time: [HH:MM]
Exercises: [List exercises with standardized terminology and clarified notation]
Total steps: [number] steps
"""
        user_prompt = f"""Extract and structure the following information from the text:

{self.phaeroNote}

Provide the structured information as per the system instructions.
"""
        translatedResult = await async_AIPrompt(
            self.client,
            sys_message=system_prompt,
            query=user_prompt,
            model="gpt-3.5-turbo-0125",
            temperature=0.0,
        )
        translatedResult = translatedResult.replace(
            """**Diary**
========""",
            "",
        )
        translatedResult = translatedResult.replace(
            """Here is the extracted and structured information:
""",
            "",
        )
        translatedResult = translatedResult.replace("(", "")
        translatedResult = translatedResult.replace(")", "")
        translatedResult = translatedResult.replace("```", "")
        translatedResult = translatedResult.replace("#h", "")
        translatedResult = translatedResult.replace("#c", "")
        translatedResult = translatedResult.replace("#", "")

        return translatedResult.strip()

    async def preprocessing(self):
        self.phaeroNote = await self.translate_into_regex_usable_format()
        crud.create_model_data(
            self.db,
            self.userSettings["language"],
            self.preprocessingPhaeroNote,
            output_text=self.phaeroNote,
            type_of_data="regex",
        )
        return self.phaeroNote

    async def process(self) -> dict:
        start = time.time()
        food_list_task = self.translate_into_food_list()
        regex_format_task = self.preprocessing()
        self.food_list_str, self.phaeroNote = await asyncio.gather(
            food_list_task, regex_format_task
        )
        self.convert_phaero_note_to_nutrition_entry()
        self.convert_phaero_note_to_new_foods()
        self.convert_phaero_note_to_sleep_entry()
        self.convert_phaero_note_to_exercise_entry()
        self.convert_phaero_note_to_note_entry()
        self.convert_phaero_note_to_checklist_entry()
        self.convert_phaero_note_to_supplemental_entry()
        self.convert_phaero_note_to_weight_entry()
        end = time.time()
        print("Total time taken to process note:", end - start, "seconds")
        return self.phaeroNoteDict
