from datetime import datetime, timedelta
from core.config import create_settings
import re

settings = create_settings()


class SleepAI:
    def __init__(self, phaeroNote: str):
        self.phaeroNote = phaeroNote

    @staticmethod
    def round_to_nearest_5_minutes(time: str) -> str:
        minutes = int(time.split(":")[1])
        if minutes % 5 == 0:
            return time
        if minutes % 5 < 3:
            return time.split(":")[0] + ":" + str(minutes - (minutes % 5)).zfill(2)
        return time.split(":")[0] + ":" + str(minutes + (5 - (minutes % 5))).zfill(2)

    def convert_to_datetime(self, time_str: str) -> datetime:
        # Current date to combine with the time
        now = datetime.now() + timedelta(days=settings.timeTravelAmount)

        # Define formats to try
        formats = ["%I:%M %p", "%H:%M", "%I.%M", "%I o'clock"]
        for fmt in formats:
            try:
                # Parse time_str according to the current format
                time_part = datetime.strptime(time_str, fmt)
                # Combine current date with parsed time
                return datetime(
                    now.year, now.month, now.day, time_part.hour, time_part.minute
                )
            except ValueError:
                continue
        if ":" in time_str and len(time_str) == 5:
            hour = int(time_str.split(":")[0])
            minute = int(time_str.split(":")[1])

            return datetime(now.year, now.month, now.day, hour, minute)
        else:
            raise ValueError(f"Time format not recognized: {time_str}")

    def get_sleep_time_strings(self) -> list[str]:
        # Regex pattern to match various time formats
        regex = r"""
            (\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)(?!\w))|         # Matches 12-hour format with AM/PM, e.g., 10:30 PM, not followed by alphabetic characters
            (\d{1,2}\.\d{2}\s*(?:AM|PM|am|pm)(?!\w))|
            (\d{1,2}:\d{2}(?!\.\d|\w))|                     # Matches 24-hour format, e.g., 22:30, not followed by a dot and digits or alphabetic characters
            (\d{1,2}\.\d{2}(?!\w))|                          # Matches dot-separated format, e.g., 22.30, not followed by alphabetic characters
            (\d{1,2}\s*(?:o'clock|o' clock)\s*(?:AM|PM|am|pm)?(?!\w)) # Matches o'clock format with optional AM/PM, e.g., 9 o'clock PM, not followed by alphabetic characters
        """

        # Search for the pattern in the input string
        pattern = re.compile(regex, re.IGNORECASE | re.VERBOSE)

        # Search for the pattern in the input string
        matches = pattern.findall(self.phaeroNote)

        # Initialize a list to store results
        res = []
        # Process matches to extract and store non-empty matches
        for match in matches:
            # Each match is a tuple, so iterate through it to find the non-empty string
            for submatch in match:
                if submatch:
                    # Append the non-empty string (the time match) to the results list
                    res.append(submatch.strip())
        res = [x.replace(".", ":") for x in res]
        return res  # Return -1 or any other indicator for no match
