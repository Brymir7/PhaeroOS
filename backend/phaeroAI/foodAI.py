from typing import List, Optional, Tuple
from api.v1.endpoints import food
from db.foodDB import (
    crud_get_food_description_by_name,
)
from db import foodDB
from core.config import create_settings
import re

from phaeroAI import utils

settings = create_settings()
SORTING_MACROS_ORDER = {
    "amount": 1,
    "protein": 2,
    "fat": 3,
    "carbs": 4,
    "sugar": 5,
    "calories": 7,
}


def regex_split_text_into_list(text: str, regex: str, flags=0) -> list[str]:
    """
    Splits the given text into a list of items based on the provided regex pattern.
    Args:
    text (str): The text to split.
    regex (str): The regex pattern to use for splitting the text.
    Returns:
    list[str]: A list of items extracted from the text.
    """
    try:
        pattern = re.compile(regex, flags)
        return pattern.findall(text)
    except re.error:
        return []


def replace_more_than_2spaces_with_1space(query: str) -> str:
    while "  " in query:
        query = query.replace("  ", " ")
    return query


class FoodAI:
    def __init__(
        self,
        user_id: int,
        userSettings: dict,
        phaeroNote: str,
        list_of_supplements: list[str] = [],
        userfoods_with_portions: dict[str, int] = {},
    ):
        # if not list_of_supplements:
        #     if not userfoods_with_portions:
        #         raise ValueError(
        #             "Please use either userfoods with portions or foundation foods with portions"
        #         )
        if userfoods_with_portions:
            self.list_of_foods = list(userfoods_with_portions.keys())
        self.user_id = user_id
        self.userSettings = userSettings
        self.phaeroNote = phaeroNote
        self.userfoods_with_portions = userfoods_with_portions
        self.list_of_supplements = list_of_supplements

    def smart_get_grams_from_line(self, detected_food: str, line: str) -> float:
        grams = []
        regex_comma_decimal = r"(\d+[,.]\d+)\s*(l|liter|litre)"  # "1,3l of almond milk"
        grams.extend(
            [
                int(
                    float(amount.replace(",", ".")) * 1000
                    if unit in ["l", "litre", "liter"]
                    else float(amount)
                )  # Convert to float and multiply by 1000 to get ml
                for amount, unit in regex_split_text_into_list(
                    line, regex_comma_decimal
                )
            ]
        )
        if grams:
            return grams[0]
        regex_decimal_number = r"\b(\d+[,.]\d+)\b(?!\s*(reps|sets|kg|pounds|distance|calories|kilograms|lbs|minutes|seconds|hours|kilometers|km|cal|ml|milliters|milliliters|millilitres|litres|liter))"
        grams.extend(
            [
                float(amount[0].replace(",", "."))
                for amount in re.findall(regex_decimal_number, line)
            ]
        )
        if grams:
            portion_size = self.userfoods_with_portions[detected_food]
            print(
                f"Detected food by decimal number: {detected_food}, grams: {grams[0]}"
            )
            if (
                grams[0] > 10
            ):  # if the number is too big, it is likely a unit size, that had no unit (black cat 500)
                return grams[0]
            return grams[0] * portion_size
        regex = (
            r"(\d+)\s*(g|gram|gramm|grams|(?<!m)l|litre|liter)"  # 500ml of almond milk
        )
        grams.extend(
            [
                int(amount) * 1000 if unit in ["l", "litre", "liter"] else int(amount)
                for amount, unit in regex_split_text_into_list(line, regex)
            ]
        )

        if grams:
            print(
                f"Detected food by grams or liter: {detected_food}, grams: {grams[0]}"
            )
            return grams[0]
        regex = r"(\d+)\s*(ml|milliliters|millilitres)"
        grams.extend(
            [
                int(gram[0])
                for gram in regex_split_text_into_list(line, regex)
                if gram[0].strip()
            ]
        )

        if grams:
            print(f"Detected food by milliliters: {detected_food}, grams: {grams[0]}")
            return grams[0]
        # NOTE numbers but not a number followed by a unit, no grams
        regex = r"\b(\d+(?:\.\d+)?)\b(?!\s*(reps|sets|kg|pounds|distance|calories|kilograms|lbs|minutes|seconds|hours|kilometers|km|cal|ml|milliters|millilitres|litres|liter))"
        grams.extend(
            [
                float(match.group(1))
                for match in re.finditer(regex, line)
                if match.group(1).strip()
            ]
        )
        if grams:
            portion_size = self.userfoods_with_portions[detected_food]
            print(f"Detected food by number: {detected_food}, grams: {grams[0]}")
            if (
                grams[0] > 10
            ):  # if the number is too big, it is likely a unit size, that had no unit (black cat 500)
                return grams[0]
            if portion_size:
                return grams[0] * portion_size
        regex = r"(?<=\D)\d+(?=x)"
        grams.extend(
            [
                int(amount)
                for amount in re.findall(regex, line, re.IGNORECASE)
                if amount.strip()
            ]
        )
        if grams:
            portion_size = self.userfoods_with_portions[detected_food]
            print(f"Detected food by number: {detected_food}, grams: {grams[0]}")
            if (
                grams[0] > 10
            ):  # if the number is too big, it is likely a unit size, that had no unit (black cat 500)
                return grams[0]
            if portion_size:
                return grams[0] * portion_size
        print("line", line)
        print(f"Detected food by default: {detected_food}, grams: 100")
        return self.userfoods_with_portions[detected_food]

    def get_foods_with_relative_grams(
        self,
    ) -> list[tuple]:
        foodNameGramsTupleList = self.get_tuples_of_food_and_grams()
        if len(foodNameGramsTupleList) == 0:
            return []
        listOfFoodWithRelativeSize = []
        for foodName, foodGram in foodNameGramsTupleList:
            listOfFoodWithRelativeSize.append((foodName, foodGram / 100))
        return listOfFoodWithRelativeSize

    def convert_food_grams_tuples_to_stats(
        self,
        listOfFoodWithRelativeSize: list[Tuple[str, float]],
    ) -> tuple[list[tuple[dict, dict]], list[str]]:
        """
        Convert a list of foods with relative sizes to a list of food statistics.
        Args:
            listOfFoodWithRelativeSize (list[tuple]): A list of tuples containing food names and their relative sizes.
            user_id (int): The user ID.
            userSettings (dict): The user settings.
        Raises:
            Exception: If a food is not found in the database.
        Returns:
            tuple[list[tuple[dict, dict]], list[str]]: A tuple containing a list of food statistics and a list of food names.
        """
        listOfFoodStats = []
        foodStats = None
        listOfFoods = []
        zero_kcal_fluids = ["WATER", "TEA", "COFFEE"]
        for foodName, relativeFoodGram in listOfFoodWithRelativeSize:
            if not foodName:
                continue
            foodName = foodName.upper()
            if foodName in zero_kcal_fluids:
                continue
            foodStats = crud_get_food_description_by_name(
                food_name=foodName, user_id=self.user_id
            )
            if not foodStats:
                # raise Exception(f"Food {foodName} not found in DB")
                print(f"Food {foodName} not found in DB")
            macros = self.convert_food_stats_to_macros(foodStats, relativeFoodGram)
            micros = self.convert_food_stats_to_micros(foodStats)
            macros = {
                k: (value, unit) if unit == "G" and k != "amount" else (value, unit)
                for k, (value, unit) in macros.items()
            }
            micros = {
                k: (value, unit) if unit == "G" else (value, unit)
                for k, (value, unit) in micros.items()
            }
            listOfFoods.append(foodName)
            listOfFoodStats.append((macros, micros))
        return listOfFoodStats, listOfFoods

    @staticmethod
    def db_search_food(
        user_id,
        userSettings: dict,
        foodName: str,
    ) -> str:
        userResults, otherUserResults, dbQueryResult, foundationFoods, srResult = (
            foodDB.crud_search_for_food_name(
                foodName,
                user_id=user_id,
                userSettings=userSettings,
            )
        )
        totalResults = userResults + foundationFoods + otherUserResults + dbQueryResult
        totalResults = utils.sort_by_similarity(foodName, totalResults)
        if not totalResults:
            return ""
        finalName = totalResults[0]
        return finalName

    @staticmethod
    def get_nutrition_from_db_results(
        foodName: str,
        user_id: int,
    ) -> tuple:
        foodStats = crud_get_food_description_by_name(
            food_name=foodName.upper(), user_id=user_id
        )
        if not foodStats:
            return None, None
        macros = FoodAI.convert_food_stats_to_macros(foodStats, 1)
        micros = FoodAI.convert_food_stats_to_micros(foodStats)
        return macros, micros

    def convert_supplement_to_robust_regex(self, supplements: list[str]) -> str:
        pattern = "(?i)"
        supplements = sorted(supplements, key=len, reverse=True)
        for supplement in supplements:
            pattern += r"\b" + supplement.lower() + r"s?\b|"
        return pattern.rstrip("|")

    @staticmethod
    def get_grams_amount_from_line(line: str) -> Optional[float]:
        """
        Extracts the grams amount from a line of text.
        """
        if line == "":
            return None
        line = (
            line.replace("x", "").replace("X", "").replace(":", "").strip()
        )  # remove regex annoying characters -> chocolate x 2 -> chocolate 2
        grams = []
        regex_comma_decimal = r"(\d+[,.]\d+)\s*(l|liter|litre)"  # "1,3l of almond milk"
        grams.extend(
            [
                int(
                    float(amount.replace(",", ".")) * 1000
                    if unit in ["l", "litre", "liter"]
                    and float(amount.replace(",", ".")) < 10
                    else int(amount)
                )  # Convert to float and multiply by 1000 to get ml
                for amount, unit in regex_split_text_into_list(
                    line, regex_comma_decimal
                )
            ]
        )
        if grams:
            return grams[0]
        regex = (
            r"(\d+)\s*(g|gram|gramm|grams|(?<!m)l|litre|liter)"  # 500ml of almond milk
        )
        grams = [
            int(amount) * 1000 if unit in ["l", "litre", "liter"] and int(amount) < 10 else int(amount)
            for amount, unit in regex_split_text_into_list(line, regex)
        ]
        if grams:
            return grams[0]
        regex = r"(\d+)\s*(ml|milliliters|milliliter)"
        grams = [
            int(gram[0])
            for gram in regex_split_text_into_list(line, regex)
            if gram[0].strip()
        ]
        if grams:
            return grams[0]
        # NOTE numbers but not a number followed by a unit, no grams
        regex = r"\b(\d+(?:\.\d+)?)\b(?!\s*(reps|sets|kg|pounds|distance|calories|kilograms|lbs|minutes|seconds|hours|kilometers|km|cal|ml|milliters|millilitres|litres|milliliter|liter))"
        grams = [
            float(match.group(1))
            for match in re.finditer(regex, line)
            if match.group(1).strip()
        ]
        if grams:
            return grams[0]
        regex = r"(?<=\D)\d+(?=x)"
        grams = [
            int(amount)
            for amount in re.findall(regex, line, re.IGNORECASE)
            if amount.strip()
        ]

        if grams:
            return grams[0]
        return None

    @staticmethod
    def trigram_search_similarity(userFood: str, text: str) -> float:
        """
        Calculates the average similarity score between userFood and text using trigram search.
        """
        userFood = userFood.lower().replace(" ", "")
        text = text.lower().replace(" ", "")
        text_trigrams = utils.trigram_frequencies(text)

        words = (
            userFood.split()
        )  # Assuming words were meant to be split after normalization
        word_similarities = []
        for word in words:
            word_trigrams = utils.trigram_frequencies(word)
            similarity = utils.word_similarity(word_trigrams, text_trigrams)
            word_similarities.append(similarity)

        if not word_similarities:
            return 0.0
        return sum(word_similarities) / len(word_similarities)

    def get_tuples_of_food_and_grams(
        self,
    ) -> list[tuple[str, int]]:
        """
        Converts a text into a list of food items and grams.

        Args:
        text (str): The text to convert.
        list_of_foods (list[str]): A list of food items to use for conversion.
        Returns:
        list[tuple[str, int]]: A list of food items and grams extracted from the text.
        """
        textAsLines = self.phaeroNote.replace(":", "").split(
            "\n"
        )  # normalize so foods can get found
        food_grams_tuples = []
        splitAtFirstNumber = lambda x: re.split(r"(\d+)", x, 1)
        for line in textAsLines:
            userFoodLikelihoodTuple = []
            originalLine = line
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
                line = line.split(" ")[0].strip()

            foodName = line
            for userFood in self.userfoods_with_portions.keys():
                likelihood = self.trigram_search_similarity(userFood, foodName)
                if likelihood > 0.55:
                    userFoodLikelihoodTuple.append((userFood, likelihood))
            print(userFoodLikelihoodTuple)
            if userFoodLikelihoodTuple:
                detected_food = max(
                    userFoodLikelihoodTuple, key=lambda x: (x[1], len(x[0]))
                )[0]
                grams = self.smart_get_grams_from_line(detected_food, line=originalLine)
                food_grams_tuples.append((detected_food, grams))
                print(f"Detected food: {detected_food}, grams: {grams}")
        return food_grams_tuples

    def get_list_of_supplements(self) -> list[str]:
        """
        Converts a text into a list of supplement items.

        Args:
        text (str): The text to convert.
        list_of_supplements (list[str]): A list of supplement items to use for conversion.

        Returns:
        list[str]: A list of supplement items extracted from the text.
        """
        supplements = []

        regex = self.convert_supplement_to_robust_regex(self.list_of_supplements)
        supplements.extend(
            [
                supplement
                for supplement in regex_split_text_into_list(self.phaeroNote, regex)
                if supplement.strip()
            ]
        )
        return supplements

    def get_hydration_amount(self) -> int:
        """
        Converts a text into a hydration amount.

        Args:
        text (str): The text to convert.

        Returns:
        int: A hydration amount extracted from the text.
        """
        hydration_amount = 0
        regex = r"(\d+(?:[\.,]\d+)?\s*)(ml|milliliter|milliliters|l|liter|liters)"
        hydration_amounts = [
            (
                float(hydration_amount.strip().replace(",", ".")) * 1000
                if unit in ["l", "liter", "liters"]
                else float(hydration_amount.strip().replace(",", "."))
            )
            for hydration_amount, unit in regex_split_text_into_list(
                self.phaeroNote, regex
            )
        ]
        if hydration_amounts:
            max_hydration_amount = max(hydration_amounts)
            if max_hydration_amount <= 2500:
                hydration_amount = sum(hydration_amounts)
            else:
                hydration_amount = max_hydration_amount
        return int(hydration_amount)

    def convert_current_total_nutrition_values_to_list_of_nutrition_value(
        self,
        currentTotalNutritionValues: dict,
    ) -> list[tuple[dict, dict]]:
        """
        Converts list of "Total", "Food1", "Food2": {Macros: {}, Micros: {}} to list of (Macros, Micros)
        """
        return [
            (
                currentTotalNutritionValues[key]["Macros"],
                currentTotalNutritionValues[key]["Micros"],
            )
            for key in currentTotalNutritionValues.keys()
            if key != "Total"
        ]

    def create_updated_total_nutrition_values(
        self,
        currentTotalNutritionValues: dict,
        foodDictionary: dict,
    ) -> tuple[list[tuple[dict, dict]], dict, list[str]]:
        """Returns a tuple of total macros and total micros for the note
        Params: foodDictionary - the dictionary of food stats to be processed
                'foodName': {'fat': [amount, unit], 'carbs': [], 'protein': [], 'sugar': [], 'calories': [], 'amount': []}
        """
        listOfInvalidKeys = []
        for key in currentTotalNutritionValues.keys():
            if key != "Total" and key not in foodDictionary["FoodList"]:
                listOfInvalidKeys.append(key)
        for key in listOfInvalidKeys:
            del currentTotalNutritionValues[key]
        ListOfFoodsWithRelativeGrams: List[Tuple[str, float]] = []
        listOfFoods = []
        listOfNutritionValues = (
            self.convert_current_total_nutrition_values_to_list_of_nutrition_value(
                currentTotalNutritionValues
            )
        )

        for key, value in foodDictionary["FoodList"].items():
            if key in currentTotalNutritionValues:
                if (
                    value["calories"][0]
                    != currentTotalNutritionValues[key]["Macros"]["calories"][0]
                    or value["carbs"][0]
                    != currentTotalNutritionValues[key]["Macros"]["carbs"][0]
                    or value["fat"][0]
                    != currentTotalNutritionValues[key]["Macros"]["fat"][0]
                    or value["protein"][0]
                    != currentTotalNutritionValues[key]["Macros"]["protein"][0]
                    or value["sugar"][0]
                    != currentTotalNutritionValues[key]["Macros"]["sugar"][0]
                    # if the user changed the amount in any way, compared to previous save
                ):
                    ListOfFoodsWithRelativeGrams.append((key, value["amount"][0] / 100))
            if key not in currentTotalNutritionValues:

                ListOfFoodsWithRelativeGrams.append((key, value["amount"][0] / 100))
            listOfFoods.append(key)

        listOfNutritionValues.extend(
            self.convert_food_grams_tuples_to_stats(
                ListOfFoodsWithRelativeGrams,
            )[0]
        )

        hydrationAmount = currentTotalNutritionValues["Total"]["Macros"]["fluid"][0]
        totalNutritionValues = {
            "Macros": {"fluid": (hydrationAmount, "ML")},
            "Micros": {},
        }

        for tupleMacroMicro in listOfNutritionValues:
            macros, micros = tupleMacroMicro
            totalNutritionValues["Macros"] = FoodAI.add_dicts(
                totalNutritionValues["Macros"], macros
            )
            totalNutritionValues["Micros"] = FoodAI.add_dicts(
                totalNutritionValues["Micros"], micros
            )

        return listOfNutritionValues, totalNutritionValues, listOfFoods

    def get_food_stats_of_db_foods(
        self,
    ) -> tuple[
        list[tuple[dict, dict]],
        dict[str, tuple[float, str]],
        list[str],
    ]:  # tuple[list[tuple[macros, micros]], tuple[totalMacros, totalMicros], listOfFoods]
        """Returns a tuple of 3 things:
        1. A list of tuples of macros and micros for each food in the note
        2. A tuple of total macros and total micros for the note
        3. A list of all the foods in the note
        """
        foodsWithRelativeGrams = self.get_foods_with_relative_grams()
        print(foodsWithRelativeGrams)
        if not foodsWithRelativeGrams:
            return [], {}, []
        (
            listOfNutritionValues,
            listOfFoods,
        ) = self.convert_food_grams_tuples_to_stats(
            foodsWithRelativeGrams,
        )
        for i in range(
            len(listOfNutritionValues)
        ):  # get macronutrient keys in certain order
            macros, micros = listOfNutritionValues[i]
            macros = {
                key: macros[key] for key in sorted(macros, key=SORTING_MACROS_ORDER.get)
            }
            listOfNutritionValues[i] = (macros, micros)
        hydrationAmount = self.get_hydration_amount()
        totalNutritionValues = {
            "Macros": {"fluid": (hydrationAmount, "ML")},
            "Micros": {},
        }
        for tupleMacroMicro in listOfNutritionValues:
            macros, micros = tupleMacroMicro
            totalNutritionValues["Macros"] = FoodAI.add_dicts(
                totalNutritionValues["Macros"], macros
            )
            totalNutritionValues["Micros"] = FoodAI.add_dicts(
                totalNutritionValues["Micros"], micros
            )
        return listOfNutritionValues, totalNutritionValues, listOfFoods

    @staticmethod
    def add_amount_unit_tuples(tuple1, tuple2) -> tuple:
        amount = tuple1[0] + tuple2[0]
        return (amount, tuple1[1])  # only need one unit

    @staticmethod
    def add_dicts(dict1: dict, dict2: dict) -> dict:
        result = dict1.copy()
        for key, value in dict2.items():
            if key == "FOOD_NOT_FOUND":
                continue
            if key in result:
                result[key] = FoodAI.add_amount_unit_tuples(result[key], value)
            else:
                result[key] = value
        return result

    @staticmethod
    def convert_food_stats_to_macros(
        food_stats: list[tuple], relativeFoodAmountTo100Grams: float
    ) -> dict:
        """Returns a dictionary of macros
        Params: food_stats - a list of tuples of the form (nutrient_name, amount, unit)
                relativeFoodAmountTo100Grams - the relative amount of the food to 100 grams, to add to macros the food amount.
                                               it is not used for calculating a relative value of each macro.
        """
        result = {}
        result["amount"] = (relativeFoodAmountTo100Grams * 100, "G")
        for nutrient_name, amount, unit in food_stats:
            if "Energy" in nutrient_name:
                if unit != "KCAL":
                    continue
                if "calories" in result:  # avoid uisng KJ
                    result["calories"] = (
                        min(result["calories"][0], amount),
                        unit,
                    )  # take the minimum because that is the most accurate in db
                else:
                    result["calories"] = (amount * relativeFoodAmountTo100Grams, unit)
            if "Protein" in nutrient_name:
                if "protein" in result:
                    result["protein"] = (max(result["protein"][0], amount), unit)
                else:
                    result["protein"] = (amount * relativeFoodAmountTo100Grams, unit)
            elif "fat" in nutrient_name:
                if "fat" in result:
                    result["fat"] = (max(result["fat"][0], amount), unit)
                else:
                    result["fat"] = (amount * relativeFoodAmountTo100Grams, unit)
            elif (
                "Carbohydrate, by difference" in nutrient_name
                or "Carbohydrate, by summation" in nutrient_name
            ):
                if "carbs" in result:
                    result["carbs"] = (max(result["carbs"][0], amount), unit)
                else:
                    result["carbs"] = (amount * relativeFoodAmountTo100Grams, unit)
            elif "Sugars, total including NLEA" in nutrient_name:
                result["sugar"] = (amount * relativeFoodAmountTo100Grams, unit)
        if "carbs" not in result:
            result["carbs"] = (0, "G")
        if "fat" not in result:
            result["fat"] = (0, "G")
        if "protein" not in result:
            result["protein"] = (0, "G")
        if "sugar" not in result:
            result["sugar"] = (0, "G")
        result["protein"] = (abs(result["protein"][0]), "G")
        result["fat"] = (abs(result["fat"][0]), "G")
        result["carbs"] = (abs(result["carbs"][0]), "G")
        result["sugar"] = (abs(result["sugar"][0]), "G")
        calculated_calories = (
            result["protein"][0] * 4.0
            + result["fat"][0] * 9.0
            + result["carbs"][0] * 4.0,
            "KCAL",
        )
        if calculated_calories[0] > 0:  # if == 0 then the food is calories only
            result["calories"] = calculated_calories
        return result

    @staticmethod
    def convert_food_stats_to_micros(food_stats: list[tuple]) -> dict:
        result = {}
        for nutrient, amount, unit in food_stats:
            if "Fiber" in nutrient:
                if "fiber" in result:
                    result["fiber"] = (max(result["fiber"][0], amount), unit)
                else:
                    result["fiber"] = (amount, unit)
            elif "Cholesterol" in nutrient:
                if "cholesterol" in result:
                    result["cholesterol"] = (
                        max(result["cholesterol"][0], amount),
                        unit,
                    )
                else:
                    result["cholesterol"] = (amount, unit)
            elif "Vitamin A" in nutrient:
                if "vitaminA" in result:
                    result["vitaminA"] = (max(result["vitaminA"][0], amount), unit)
                else:
                    result["vitaminA"] = (amount, unit)
            elif "Vitamin C" in nutrient:
                if "vitaminC" in result:
                    result["vitaminC"] = (max(result["vitaminC"][0], amount), unit)
                else:
                    result["vitaminC"] = (amount, unit)
            elif "Vitamin D" in nutrient:
                if "vitaminD" in result:
                    result["vitaminD"] = (max(result["vitaminD"][0], amount), unit)
                else:
                    result["vitaminD"] = (amount, unit)

            elif "Vitamin E" in nutrient:
                if "vitaminE" in result:
                    result["vitaminE"] = (max(result["vitaminE"][0], amount), unit)
                else:
                    result["vitaminE"] = (amount, unit)
            elif "Vitamin K" in nutrient:
                if "vitaminK" in result:
                    result["vitaminK"] = (max(result["vitaminK"][0], amount), unit)
                else:
                    result["vitaminK"] = (amount, unit)
            elif "Thiamin" in nutrient:
                if "thiamin" in result:
                    result["thiamin"] = (max(result["thiamin"][0], amount), unit)
                else:
                    result["thiamin"] = (amount, unit)
            elif "Riboflavin" in nutrient:
                if "riboflavin" in result:
                    result["riboflavin"] = (max(result["riboflavin"][0], amount), unit)
                else:
                    result["riboflavin"] = (amount, unit)
            elif "Niacin" in nutrient:
                if "niacin" in result:
                    result["niacin"] = (max(result["niacin"][0], amount), unit)
                else:
                    result["niacin"] = (amount, unit)
            elif "Vitamin B-6" in nutrient:
                if "Vitamin B-6" in result:
                    result["Vitamin B-6"] = (
                        max(result["Vitamin B-6"][0], amount),
                        unit,
                    )
                else:
                    result["Vitamin B-6"] = (amount, unit)
            elif "Folate" in nutrient:
                if "Folate" in result:
                    result["Folate"] = (max(result["Folate"][0], amount), unit)
                else:
                    result["Folate"] = (amount, unit)
            elif "Vitamin B-12" in nutrient:
                if "Vitamin B-12" in result:
                    result["Vitamin B-12"] = (
                        max(result["Vitamin B-12"][0], amount),
                        unit,
                    )
                else:
                    result["iron"] = (amount, unit)
            elif "Pantothenic acid" in nutrient:
                if "Pantothenic" in result:
                    result["Pantothenic"] = (
                        max(result["Pantothenic"][0], amount),
                        unit,
                    )
                else:
                    result["iron"] = (amount, unit)
            elif "Choline" in nutrient:
                if "Choline" in result:
                    result["Choline"] = (max(result["Choline"][0], amount), unit)
                else:
                    result["Choline"] = (amount, unit)
            elif "Betaine" in nutrient:
                if "Betaine" in result:
                    result["Betaine"] = (max(result["Betaine"][0], amount), unit)
                else:
                    result["iron"] = (amount, unit)
            elif "Calcium" in nutrient:
                if "Calcium" in result:
                    result["Calcium"] = (max(result["Calcium"][0], amount), unit)
                else:
                    result["Calcium"] = (amount, unit)
            elif "Iron" in nutrient:
                if "iron" in result:
                    result["iron"] = (max(result["iron"][0], amount), unit)
                else:
                    result["iron"] = (amount, unit)
            elif "Magnesium" in nutrient:
                if "magnesium" in result:
                    result["magnesium"] = (max(result["magnesium"][0], amount), unit)
                else:
                    result["magnesium"] = (amount, unit)
            elif "Phosphorus" in nutrient:
                if "phosphorus" in result:
                    result["phosphorus"] = (max(result["phosphorus"][0], amount), unit)
                else:
                    result["phosphorus"] = (amount, unit)
            elif "Potassium" in nutrient:
                if "potassium" in result:
                    result["potassium"] = (max(result["potassium"][0], amount), unit)
                else:
                    result["potassium"] = (amount, unit)
            elif "Sodium" in nutrient:
                if "sodium" in result:
                    result["sodium"] = (max(result["sodium"][0], amount), unit)
                else:
                    result["sodium"] = (amount, unit)
            elif "Zinc" in nutrient:
                if "zinc" in result:
                    result["zinc"] = (max(result["zinc"][0], amount), unit)
                else:
                    result["zinc"] = (amount, unit)
            elif "Copper" in nutrient:
                if "copper" in result:
                    result["copper"] = (max(result["copper"][0], amount), unit)
                else:
                    result["copper"] = (amount, unit)
            elif "Manganese" in nutrient:
                if "manganese" in result:
                    result["manganese"] = (max(result["manganese"][0], amount), unit)
                else:
                    result["manganese"] = (amount, unit)
            elif "Selenium" in nutrient:
                if "selenium" in result:
                    result["selenium"] = (max(result["selenium"][0], amount), unit)
                else:
                    result["selenium"] = (amount, unit)
        return result
