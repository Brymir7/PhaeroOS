import re
from core.config import create_settings
from db import exerciseDB
from db.crud import (
    get_exercise_diagram_data,
    get_exercise_name_from_id,
    get_exercise_specific_data,
    get_exercise_specific_data_from_name,
)
from phaeroAI import utils

from sqlmodel import Session

settings = create_settings()


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


def convert_exercises_to_robust_regex(exercises: list[str]) -> str:
    exercises = sorted(exercises, key=len, reverse=True)
    pattern = "(?i)" + "|".join(
        [
            r"(?:\b(?:machine|assisted|seated|cable)\s+)?"
            + re.escape(exercise)
            + r"(?:s|es|ing|machine|assisted|seated|cable)?\b"
            for exercise in exercises
        ]
    )
    return pattern


class ExerciseAI:

    def __init__(
        self,
        phaeroNote: str,
        cardioExercises: list[str],
        weightLiftingExercises: list[str],
        bodyweightExercises: list[str],
        userMetrics: dict = {},  # for calories burned
    ):
        self.phaeroNote = phaeroNote
        self.cardioExercises = cardioExercises
        self.weightLiftingExercise = weightLiftingExercises
        self.bodyweightExercises = bodyweightExercises
        self.userMetrics = userMetrics

    def get_exercises(self, line: str, exercises: list[str]) -> list[str]:
        """
        Gets a list of exercises from a text.

        Args:
        text (str): The text to get the list of exercises from.

        Returns:
        list[str]: A list of exercises.
        """
        foundExercises = []
        regex = convert_exercises_to_robust_regex(exercises)
        foundExercises.extend(
            [
                exercise
                for exercise in regex_split_text_into_list(
                    line, regex, flags=re.IGNORECASE
                )
                if exercise
            ]
        )
        found = set(foundExercises)
        foundExercises.extend(
            [
                exercise
                for exercise in regex_split_text_into_list(
                    line, regex.replace(" ", "-")
                )
                if exercise and exercise not in found
            ]
        )
        return list(foundExercises)

    def get_sets(
        self,
        line: str,
        exercise: str,
    ) -> list[int]:
        """
        Convert text to exercise sets.

        Args:
            text (str): The input text.

        Returns:
            tuple[int, int]: A tuple containing the number of exercise sets.

        """
        regex = r"(\d+)\s*sets?"
        sets = regex_split_text_into_list(line, regex, flags=re.IGNORECASE)
        if sets:
            sets = sorted(
                sets,
                key=lambda x: abs(line.find(exercise) - line.find(str(x))),
            )
            return [int(x) for x in sets]
        regex = r"sets?\s*(\d+)"
        sets = regex_split_text_into_list(line, regex, flags=re.IGNORECASE)
        if sets:
            sets = sorted(
                sets,
                key=lambda x: abs(line.find(exercise) - line.find(str(x))),
            )
            return [int(x) for x in sets]
        regex = r"(\d+)\s*(?:\w+\s)*sets?"
        sets = regex_split_text_into_list(line, regex, flags=re.IGNORECASE)
        if sets:
            sets = sorted(
                sets,
                key=lambda x: abs(line.find(exercise) - line.find(str(x))),
            )
            return [int(x) for x in sets]
        regex = r"sets?\s*:\s*(?:\w+\s)*(\d+)"
        sets = regex_split_text_into_list(line, regex, flags=re.IGNORECASE)
        if sets:
            sets = sorted(
                sets,
                key=lambda x: abs(line.find(exercise) - line.find(str(x))),
            )
            return [int(x) for x in sets]
        return [0]

    def get_reps(
        self,
        line: str,
        exercise: str,
    ) -> list[int]:
        """
        Convert text to exercise reps.

        Args:
            text (str): The input text.

        Returns:
            tuple[int, int]: A tuple containing the number of exercise reps.

        """
        regex = r"(\d+).\s*:?(?:reps?|repetitions?)"
        reps = regex_split_text_into_list(line, regex, flags=re.IGNORECASE)
        if reps:
            reps = sorted(
                reps,
                key=lambda x: abs(line.find(exercise) - line.find(str(x))),
            )
            return [int(x) for x in reps]
        regex = r"(?:reps?|repetitions?|x).\s*:?(\d+)"

        reps = regex_split_text_into_list(line, regex, flags=re.IGNORECASE)
        if reps:
            reps = sorted(
                reps,
                key=lambda x: abs(line.find(exercise) - line.find(str(x))),
            )
            return [int(x) for x in reps]

        regex = r"(\d+).\s*(?!kg)\b.(?:\w+\s*)*:?(?:reps?|repetitions?)"

        reps = regex_split_text_into_list(line, regex, flags=re.IGNORECASE)
        if reps:
            reps = sorted(
                reps,
                key=lambda x: abs(line.find(exercise) - line.find(str(x))),
            )
            return [int(x) for x in reps]
        regex = r"(?:reps?|repetitions?|x).\s*:\s*(?:\w+\s*)*(\d+)"

        reps = regex_split_text_into_list(line, regex, flags=re.IGNORECASE)
        if reps:
            reps = sorted(
                reps,
                key=lambda x: abs(line.find(exercise) - line.find(str(x))),
            )
            return [int(x) for x in reps]
        regex = r"repetitions?.\s*:\s*(\d+)"
        reps = regex_split_text_into_list(line, regex, flags=re.IGNORECASE)
        if reps:
            reps = sorted(
                reps,
                key=lambda x: abs(line.find(exercise) - line.find(str(x))),
            )
            return [int(x) for x in reps]
        regex = r"(\d+).\s*:.\s*repetition?s"
        reps = regex_split_text_into_list(line, regex, flags=re.IGNORECASE)
        if reps:
            reps = sorted(
                reps,
                key=lambda x: abs(line.find(exercise) - line.find(str(x))),
            )
            return [int(x) for x in reps]

        return [0]

    def get_weights(self, line: str, exercise: str) -> list[int]:
        """
        Convert text to exercise weights, converting pounds to kilograms if needed.

        Args:
            line (str): The input text.
            exercise (str): The name of the exercise.

        Returns:
            list[int]: A list containing the number of exercise weights in kilograms.
        """
        regex = r"(\d+(?:\.\d+)?)\s*(kg|kilograms|pounds|lbs|weight)"
        matches = re.findall(regex, line, re.IGNORECASE)
        if not matches:
            regex = r"weight\s*:\s*(\d+(?:\.\d+)?)\s*(kg|lbs)?"
            matches = re.findall(regex, line, re.IGNORECASE)
        if not matches:
            regex = r"weights\s*:\s*(\d+(?:\.\d+)?)\s*(kg|lbs)?"
            matches = re.findall(regex, line, re.IGNORECASE)

        weights = []
        for weight, unit in matches:
            weight = float(weight)
            if unit.lower() in ["pounds", "lbs"]:
                weight = round(
                    weight * 0.453592, 2
                )  # Convert pounds to kilograms and round to 2 decimal places
            weights.append(weight)

        # Sort the weights based on their proximity to the mention of the exercise in the text
        weights = sorted(
            weights,
            key=lambda x: abs(line.find(exercise) - line.find(str(x))),
        )
        return weights if weights else [0]

    def get_durations(
        self,
        line: str,
        exercise_name: str,
    ) -> list[int]:
        """
        Convert text to exercise durations.

        Args:
            text (str): The input text.

        Returns:
            list[int]: A list containing the number of exercise durations in seconds.

        """
        regex = r"(\d+)\s*(seconds|secs|sec|s|minutes|mins|min|m|hours|hrs|hr|h)"
        durations = regex_split_text_into_list(line, regex, flags=re.IGNORECASE)
        if durations:
            converted_durations = []
            for duration in durations:
                value, unit = duration
                if unit.lower() in ["seconds", "secs", "sec", "s"]:
                    converted_durations.append(int(value) / 60)
                elif unit.lower() in ["minutes", "mins", "min", "m"]:
                    converted_durations.append(int(value))
                elif unit.lower() in ["hours", "hrs", "hr", "h"]:
                    converted_durations.append(int(value) * 60)

            converted_durations = sorted(
                converted_durations,
                key=lambda x: abs(line.find(exercise_name) - line.find(str(x))),
            )
            return converted_durations
        return []

    def get_calories(
        self,
        line: str,
        exercise_name: str,
    ) -> list[int]:
        """
        Convert text to exercise calories.

        Args:
            text (str): The input text.

        Returns:
            tuple[int, int]: A tuple containing the number of exercise calories.

        """
        regex = r"(\d+)\s*(calories|cal|kcal)"
        calories = regex_split_text_into_list(line, regex, flags=re.IGNORECASE)
        if calories:
            calories = [calories for calories, unit in calories]
            calories = sorted(
                calories,
                key=lambda x: abs(line.find(exercise_name) - line.find(str(x))),
            )
            return [int(x) for x in calories]
        return [0]

    def get_distance(
        self,
        line: str,
        exercise_name: str,
    ) -> list[int]:
        """
        Convert text to exercise distance.

        Args:
            text (str): The input text.

        Returns:
            list[int]: A list containing the exercise distances in meters.

        """
        regex_km = r"(\d+)\s*(kilometers|km)\s"
        regex_miles = r"(\d+)\s*(miles|mi)\s"
        regex_meters = r"(\d+)\s*(meters|m)\s"

        distance_km = regex_split_text_into_list(
            line + " ", regex_km
        )  # add space to prevent regex from not matching due to \s
        distance_miles = regex_split_text_into_list(line + " ", regex_miles)
        distance_meters = regex_split_text_into_list(line + " ", regex_meters)

        converted_distances = []
        if distance_km:
            for km in distance_km:
                converted_distances.append(int(km[0]) * 1000)

        if distance_miles:
            for miles in distance_miles:
                converted_distances.append(int(miles[0]) * 1609)

        if distance_meters:
            for meters in distance_meters:
                converted_distances.append(int(meters[0]))
        converted_distances = sorted(
            converted_distances,
            key=lambda x: abs(line.find(exercise_name) - line.find(str(x))),
        )
        return converted_distances

    def get_cardio_exercises_durations_sets_reps_calories_distances(self) -> dict:
        """
        Converts a text into a dictionary of cardio exercises, durations, sets, reps, calories, and distances.
        """
        text_lines = self.phaeroNote.split("\n")
        res = {}
        text_lines = [line.replace("-", " ") for line in text_lines]
        visited: dict[str, int] = {}

        def add_to_res(
            exercise: str,
            duration: list[int],
            calories: list[int],
            durations: list[int],
        ):
            exercise_count = visited.get(exercise, 0) + 1
            visited[exercise] = exercise_count
            key = f"{exercise} {exercise_count}" if exercise_count > 1 else exercise
            res[key] = {
                "duration": self.unwrap_first_value_from_possibly_empty_list(
                    duration, 1
                ),
                "calories": self.unwrap_first_value_from_possibly_empty_list(
                    calories, 0
                ),
                "distance": self.unwrap_first_value_from_possibly_empty_list(
                    durations, 0
                ),
            }

        for line in text_lines:
            foundExercises = self.get_exercises(line, self.cardioExercises)
            foundExercises = exerciseDB.convert_exercise_names_to_db_exercise_names(
                foundExercises, "cardio"
            )
            foundExercises = sorted(
                foundExercises,
                key=lambda x: len(x),
                reverse=True,
            )
            if not foundExercises:
                continue
            foundExercise = foundExercises.pop(0)  ## take the largest one
            durations = self.get_durations(line, foundExercise)
            calories = self.get_calories(line, foundExercise)
            distances = self.get_distance(line, foundExercise)
            if calories and calories[0] == 0 and self.userMetrics:
                weight = self.userMetrics["weight"]
                calories = [
                    int(
                        ExerciseAI.calculate_calories_burned(
                            foundExercise,
                            duration=durations[0] if durations else 0,
                            distance=distances[0] if distances else 0,
                            weight_kg=weight,
                        )
                        * 0.8  # underestimating calories burned
                    )
                ]
            if durations == [0] and distances == [0]:
                currLineIdx = text_lines.index(line) + 1
                if currLineIdx < len(text_lines) - 1:
                    while self.no_exercise_name_in_line(
                        line=text_lines[currLineIdx]
                    ) and (
                        self.get_durations(text_lines[currLineIdx], foundExercise)
                        == [0]
                        and self.get_distance(text_lines[currLineIdx], foundExercise)
                        == [0]
                    ):
                        durations = self.get_durations(
                            text_lines[currLineIdx], foundExercise
                        )
                        calories = self.get_calories(
                            text_lines[currLineIdx], foundExercise
                        )
                        distances = self.get_distance(
                            text_lines[currLineIdx], foundExercise
                        )
                        if calories and calories[0] == 0 and self.userMetrics:
                            weight = self.userMetrics["weight"]
                            calories = [
                                int(
                                    ExerciseAI.calculate_calories_burned(
                                        foundExercise,
                                        duration=durations[0] if durations else 0,
                                        distance=distances[0] if distances else 0,
                                        weight_kg=weight,
                                    )
                                    * 0.8  # underestimating calories burned
                                )
                            ]
                        add_to_res(foundExercise, durations, calories, distances)
                        text_lines[currLineIdx] = (
                            ""  # NOTE because we are still doing for line in text_lines
                        )
                        currLineIdx += 1
                        if currLineIdx < len(text_lines):
                            continue
                        else:
                            break
                else:
                    add_to_res(foundExercise, durations, calories, distances)
        return res

    def no_exercise_name_in_line(self, line: str) -> bool:
        if any(
            exercise in line
            for exercise in self.get_exercises(line, self.weightLiftingExercise)
        ):
            return False
        if any(
            exercise in line
            for exercise in self.get_exercises(line, self.bodyweightExercises)
        ):
            return False
        if any(
            exercise in line
            for exercise in self.get_exercises(line, self.cardioExercises)
        ):
            return False
        return True

    @staticmethod
    def unwrap_first_value_from_possibly_empty_list(
        lst: list, ifEmptyValue: int
    ) -> int:
        if lst:
            if lst[0] == 0:
                return ifEmptyValue
            return lst[0]
        return ifEmptyValue

    def get_weightlifting_exercise_sets_reps_weights(
        self,
    ) -> dict:
        """
        Converts a text into a dictionary of weightlifting exercises, sets, reps, and weights.
        """
        text_lines = self.phaeroNote.split("\n")
        res = {}
        text_lines = [line.replace("-", " ") for line in text_lines]
        visited: dict[str, int] = {}

        def add_to_res(
            exercise: str, sets: list[int], reps: list[int], weights: list[int]
        ):
            if exercise in visited:
                visited[exercise] += 1
            else:
                visited[exercise] = 1
            if visited[exercise] == 1:
                res[exercise] = {
                    "sets": self.unwrap_first_value_from_possibly_empty_list(sets, 1),
                    "reps": self.unwrap_first_value_from_possibly_empty_list(reps, 1),
                    "weight": self.unwrap_first_value_from_possibly_empty_list(
                        weights, 1
                    ),
                }
            else:
                res[f"{exercise} {visited[exercise]}"] = {
                    "sets": self.unwrap_first_value_from_possibly_empty_list(sets, 1),
                    "reps": self.unwrap_first_value_from_possibly_empty_list(reps, 1),
                    "weight": self.unwrap_first_value_from_possibly_empty_list(
                        weights, 1
                    ),
                }

        def reps_or_sets_or_weight_in_line(line: str) -> bool:
            sets = self.get_sets(line, "")
            reps = self.get_reps(line, "")
            weights = self.get_weights(line, "")
            return sets != [0] or reps != [0] or weights != [0]

        for line in text_lines:
            foundExercises = self.get_exercises(line, self.weightLiftingExercise)
            foundExercises = exerciseDB.convert_exercise_names_to_db_exercise_names(
                foundExercises, "weight"
            )
            foundExercises = sorted(
                foundExercises,
                key=lambda x: len(x),
                reverse=True,
            )
            if not foundExercises:
                continue
            exercise = foundExercises.pop(0)

            sets = self.get_sets(line, exercise)
            reps = self.get_reps(line, exercise)
            weights = self.get_weights(line, exercise)
            if sets == [0] and reps == [0] and weights == [0]:
                currLineIdx = text_lines.index(line) + 1
                if currLineIdx < len(text_lines) - 1:
                    while (
                        self.no_exercise_name_in_line(line=text_lines[currLineIdx])
                    ) and reps_or_sets_or_weight_in_line(text_lines[currLineIdx]):
                        sets = self.get_sets(text_lines[currLineIdx], exercise)
                        reps = self.get_reps(text_lines[currLineIdx], exercise)
                        weights = self.get_weights(text_lines[currLineIdx], exercise)
                        print(exercise, sets, reps, weights)
                        add_to_res(exercise, sets, reps, weights)
                        text_lines[currLineIdx] = (
                            ""  # NOTE because we are still doing for line in text_lines
                        )
                        currLineIdx += 1
                        if currLineIdx < len(text_lines):
                            continue
                        else:
                            break
            else:
                add_to_res(exercise, sets, reps, weights)
        return res

    def get_bodyweight_exercise_sets_reps_durations(self) -> dict:
        """
        Converts a text into a dictionary of bodyweight exercises, sets, reps, and durations.
        Parses through the given text and extracts relevant data for each exercise,
        handling multiple occurrences of the same exercise.
        """
        text_lines = self.phaeroNote.split("\n")
        res = {}
        visited = {}
        text_lines = [line.replace("-", " ") for line in text_lines]

        def add_to_res(
            exercise: str, sets: list[int], reps: list[int], durations: list[int]
        ):
            exercise_count = visited.get(exercise, 0) + 1
            visited[exercise] = exercise_count
            key = f"{exercise} {exercise_count}" if exercise_count > 1 else exercise
            res[key] = {
                "sets": self.unwrap_first_value_from_possibly_empty_list(sets, 1),
                "reps": self.unwrap_first_value_from_possibly_empty_list(reps, 1),
                "duration": self.unwrap_first_value_from_possibly_empty_list(
                    durations, 0
                ),
            }

        def reps_sets_or_duration_in_line(line: str) -> bool:
            sets = self.get_sets(line, "")
            reps = self.get_reps(line, "")
            durations = self.get_durations(line, "")
            return sets != [0] or reps != [0] or durations != [0]

        for line in text_lines:
            foundExercises = self.get_exercises(line, self.bodyweightExercises)
            foundExercises = exerciseDB.convert_exercise_names_to_db_exercise_names(
                foundExercises, "bodyweight"
            )
            foundExercises = sorted(
                foundExercises,
                key=lambda x: len(x),
                reverse=True,
            )
            if not foundExercises:
                continue
            exercise = foundExercises.pop(0)
            if self.get_weights(line, exercise) != [0]:
                continue
            sets = self.get_sets(line, exercise)
            reps = self.get_reps(line, exercise)
            durations = self.get_durations(line, exercise)
            if sets == [0] and reps == [0] and durations == [0]:
                currLineIdx = text_lines.index(line) + 1
                if currLineIdx < len(text_lines) - 1:
                    while (
                        self.no_exercise_name_in_line(line=text_lines[currLineIdx])
                    ) and reps_sets_or_duration_in_line(text_lines[currLineIdx]):
                        sets = self.get_sets(text_lines[currLineIdx], exercise)
                        reps = self.get_reps(text_lines[currLineIdx], exercise)
                        durations = self.get_durations(
                            text_lines[currLineIdx], exercise
                        )
                        print(exercise, sets, reps, durations)
                        add_to_res(exercise, sets, reps, durations)
                        text_lines[currLineIdx] = (
                            ""  # NOTE because we are still doing for line in text_lines
                        )
                        currLineIdx += 1
                        if currLineIdx < len(text_lines):
                            continue
                        else:
                            break
            else:
                add_to_res(exercise, sets, reps, durations)
        return res

    @staticmethod
    def calculate_calories_burned(
        activity: str,
        duration: int = 0,
        distance: int = 0,
        weight_kg: float = 0.0,
    ) -> float:
        # Define average MET values for different activities
        # These are approximate and can vary based on intensity and individual factors
        activity = activity.lower().strip()
        MET_values = {
            "cycling": 8.0,  # Moderate effort
            "running": 11.5,  # 6 mph (10 min/mile)
            "swimming": 8.3,  # Moderate effort
            "rowing": 7.0,  # Moderate effort
            "jumping Rope": 12.0,
            "walking": 3.8,  # 4 mph
            "treadmill Walking": 3.8,  # 4 mph, assuming similar to walking
            "treadmill Running": 9.0,  # Moderate effort
            "treadmill": 6.0,  # Average for walking + running
            "high intensity interval training (hiit)": 12.0,  # High intensity
        }

        # Activity speeds (in mph) for estimating duration from distance if needed
        activity_speeds = {
            "cycling": 14.0,  # Average cycling speed
            "running": 6.0,  # 6 mph
            "swimming": 2.0,  # Roughly 2 mph swimming speed
            "rowing": 4.0,  # Estimated rowing speed
            "walking": 4.06,  # 4 mph
            "treadmill walking": 4.0,
            "treadmill running": 6.0,
            "treadmill": 5.0,  # Average of walking and running
            # No default speeds for Jumping Rope, HIIT
        }

        MET = MET_values.get(activity)
        if not MET or (duration == 0 and distance == 0):
            return 0.0

        if distance is not None and duration == 0:
            # Estimate duration using distance and average speed for the activity
            speed = activity_speeds.get(activity)
            if speed:
                # Convert speed from mph to km/h (1 mph = 1.60934 km/h), then calculate duration
                speed_kmh = speed * 1.60934
                duration = int((distance / speed_kmh))  # Duration in minutes
            else:
                # If no speed is available for the activity, cannot use distance
                return 0.0

        if distance > 0 and duration > 0:
            distance_km = distance / 1000  # Convert distance from meters to kilometers
            duration_h = duration / 60  # Convert duration from minutes to hours
            expected_speed_kmh = (
                activity_speeds.get(activity, 0) * 1.60934
            )  # Convert to km/h
            actual_speed_kmh = distance_km / duration_h
            if expected_speed_kmh > 0:
                intensity_factor = actual_speed_kmh / expected_speed_kmh
                MET *= intensity_factor  # Adjust MET value based on actual performance intensity

        calories_burned_per_minute = (
            MET * weight_kg * 3.5 / 200
        )  # Converting to calories per minute
        return calories_burned_per_minute * duration

    @staticmethod
    def calculate_calories_burned_steps(
        steps: int, weight_kg: float, height_m: int
    ) -> float:
        """
        Calculate the calories burned based on the number of steps, weight, and height.

        Args:
            steps (int): The number of steps.
            weight_kg (float): The weight in kilograms.
            height_m (int): The height in meters.

        Returns:
            float: The calories burned.
        """
        # Calculate the distance covered in km based on the number of steps and the average step length
        # The average step length is estimated based on the user's height
        step_length_m = height_m * 0.415
        distance_m = (
            steps * step_length_m
        ) / 100  # divide by 100 because above is in centimeters
        speed_m_per_h = 4300  # Average walking speed
        # Calculate time spent walking in hours
        time_h = distance_m / speed_m_per_h

        # Assume a moderate MET value for walking
        MET = 3.5
        # Calculate calories burned per minute
        calories_per_minute = MET * weight_kg / 200
        # Convert time from hours to minutes
        time_minutes = time_h * 60
        # Calculate total calories burned
        calories_burned = calories_per_minute * time_minutes

        return calories_burned

    @staticmethod
    def convert_exercise_stats_to_activity_level(
        exercises: dict,
        steps: int,
        db: Session,
        user_id: int,
        minimum_data_points: int,
    ) -> tuple[float, float]:
        """
        Convert text to activity level.

        Args:
            exercises (dict): The exercises dict from exercise_names to exercise_values.
            steps (int): The number of steps.
            db (Session): The database session.
            user_id (int): The user ID.

        Returns:
            float: The activity level relative in total volume.
            float: The activity level absolute in total volume.

        """
        todayExerciseSpecificData = (
            ExerciseAI.convert_phaero_exercise_dict_to_exercise_specific_data(
                exercises, db
            )
        )
        previous_exercise_data = utils.get_data_from_iterator(
            get_exercise_diagram_data(
                db, user_id, newest_first=True, limited_amount=7, last_x_days=14
            )
        )
        previous_exercise_specific_data = utils.get_data_from_iterator(
            get_exercise_specific_data(
                db, user_id, newest_first=True, limited_amount_days=7, last_x_days=14
            )
        )
        historic_steps = []
        mean = lambda x: sum(x) / len(x) if len(x) > 0 else 0
        for exerciseData in previous_exercise_data:
            historic_steps.append(exerciseData.steps)

        def calc_activity_based_on_absolute_volume() -> float:
            predictionBasedOnSpecificExercise = 0
            for exercise in todayExerciseSpecificData.keys():
                if exercise == "totalExercises":
                    continue
                for exercise_specific_data_type in todayExerciseSpecificData[exercise]:
                    predictionBasedOnSpecificExercise += mean(
                        todayExerciseSpecificData[exercise][exercise_specific_data_type]
                    )

            absolute_activity_level = (
                todayExerciseSpecificData["totalExercises"]
                + steps / 1000  # make it scale to the others
                + predictionBasedOnSpecificExercise
            )
            return absolute_activity_level

        if len(historic_steps) < minimum_data_points:
            return 0, calc_activity_based_on_absolute_volume()

        historic_avg_steps = mean(historic_steps)
        historicExerciseSpecificData = ExerciseAI.convert_historic_exercise_specific_data_to_historicExerciseSpecificData_dict(
            previous_exercise_specific_data, db
        )

        def calc_activity_level_based_on_relative_volume() -> float:
            relativeActivityBasedOnSpecificExercise = 0
            for exercise in todayExerciseSpecificData.keys():
                if exercise in historicExerciseSpecificData:
                    if exercise == "totalExercises":
                        continue
                    for exercise_specific_data_type in todayExerciseSpecificData[
                        exercise
                    ]:  #  NOTE exercise_specific_data_type is reps, sets, etc.
                        # NOTE i think mean is not needed cause its 1 element
                        historic_mean = mean(
                            historicExerciseSpecificData[exercise][
                                exercise_specific_data_type
                            ]
                        )
                        curr_mean = mean(
                            todayExerciseSpecificData[exercise][
                                exercise_specific_data_type
                            ]
                        )
                        if historic_mean > 0:
                            relativeActivityBasedOnSpecificExercise += (
                                curr_mean / historic_mean
                            )

            relative_steps = 0
            if historic_avg_steps != 0:
                relative_steps = steps / historic_avg_steps
            relativeExercisesAmount = 0
            if todayExerciseSpecificData["totalExercises"] != 0:
                if historicExerciseSpecificData["totalExercises"] == 0:
                    historicExerciseSpecificData["totalExercises"] = 1
                relativeExercisesAmount = (
                    todayExerciseSpecificData["totalExercises"]
                    / historicExerciseSpecificData["totalExercises"]
                )
            relative_activity_level = (
                relativeExercisesAmount
                + relative_steps
                + relativeActivityBasedOnSpecificExercise
            )
            return relative_activity_level

        return (
            calc_activity_level_based_on_relative_volume(),
            calc_activity_based_on_absolute_volume(),
        )

    def get_steps(self) -> int:
        """
        Convert text to activity level.

        Args:
            text (str): The input text.

        Returns:
            int: The activity level.

        """

        regex = r"(\d{1,3}(?:,\d{3})*|\d+)\s*step(s?)"  # TODO
        steps = regex_split_text_into_list(self.phaeroNote, regex)
        if steps:
            steps = steps[0][0]
            if "," in steps:
                steps = steps.replace(",", "")

            if steps.isdigit():
                return int(steps)
        regex = r"step(s?)\s*(\d{1,3}(?:,\d{3})*|\d+)"
        steps = regex_split_text_into_list(self.phaeroNote, regex)
        if steps:
            steps = steps[0][1]

            if "," in steps:
                steps = steps.replace(",", "")
            if steps.isdigit():
                return int(steps)
        return 0

    @staticmethod
    def convert_phaero_exercise_dict_to_exercise_specific_data(
        phaero_exercise_dict: dict, db: Session
    ) -> dict:
        """
        Convert a phaero exercise dict to exercise specific data.

        Args:
            phaero_exercise_dict (dict): The phaero exercise dict.
            db (Session): The database session.
            user_id (int): The user ID.

        Returns:
            dict: The exercise specific data.
        """
        exerciseSpecificData = {}
        totalExercises = 0
        for exercise_type in phaero_exercise_dict:
            for exercise in phaero_exercise_dict[exercise_type]:
                exerciseSpecificData[exercise] = {
                    "duration": [],
                    "distance": [],
                    "reps": [],
                    "sets": [],
                }

                exerciseInterface = get_exercise_specific_data_from_name(db, exercise)
                if not exerciseInterface:
                    raise Exception(
                        f"Exercise not found in database, please add it. {exercise}"
                    )
                if (
                    exerciseInterface.duration
                ):  # TODO handle multiple sets when we ahve multiple sets for an exercise with different reps
                    exerciseSpecificData[exercise]["duration"].append(
                        phaero_exercise_dict[exercise_type][exercise]["duration"]
                    )
                if exerciseInterface.distance:
                    exerciseSpecificData[exercise]["distance"].append(
                        phaero_exercise_dict[exercise_type][exercise]["distance"]
                    )
                if exerciseInterface.reps:
                    exerciseSpecificData[exercise]["reps"].append(
                        phaero_exercise_dict[exercise_type][exercise]["reps"]
                    )
                if exerciseInterface.sets:
                    exerciseSpecificData[exercise]["sets"].append(
                        phaero_exercise_dict[exercise_type][exercise]["sets"]
                    )
                totalExercises += 1
        exerciseSpecificData["totalExercises"] = totalExercises
        return exerciseSpecificData

    @staticmethod
    def convert_historic_exercise_specific_data_to_historicExerciseSpecificData_dict(
        historic_exercise_specific_data: list, db: Session
    ) -> dict:
        """
        Convert a historic exercise specific data dict to a phaero exercise dict.

        Args:
            historic_exercise_specific_data (dict): The historic exercise specific data dict.

        Returns:
            dict: The phaero exercise dict.
        """
        prevData = None
        historicExerciseSpecificData = {}
        totalExercises = 0
        for exerciseSpecificData in historic_exercise_specific_data:
            exercise_name = get_exercise_name_from_id(
                db, exerciseSpecificData.exercise_id
            )
            if exercise_name not in historicExerciseSpecificData:
                historicExerciseSpecificData[exercise_name] = {
                    "duration": [],
                    "distance": [],
                    "reps": [],
                    "sets": [],
                }

            if prevData:
                if prevData.recorded_at == exerciseSpecificData.recorded_at:  # same day
                    totalExercises += 1
            if exerciseSpecificData.duration:
                historicExerciseSpecificData[exercise_name]["duration"].append(
                    exerciseSpecificData.duration
                )
            if exerciseSpecificData.distance:
                historicExerciseSpecificData[exercise_name]["distance"].append(
                    exerciseSpecificData.distance
                )
            if exerciseSpecificData.reps:
                historicExerciseSpecificData[exercise_name]["reps"].append(
                    exerciseSpecificData.reps
                )
            if exerciseSpecificData.sets:
                historicExerciseSpecificData[exercise_name]["sets"].append(
                    exerciseSpecificData.sets
                )
            prevData = exerciseSpecificData
        historicExerciseSpecificData["totalExercises"] = totalExercises
        return historicExerciseSpecificData
