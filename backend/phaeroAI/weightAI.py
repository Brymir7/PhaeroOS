import re
from typing import Union


def convert_text_to_bodyweight(text: str) -> Union[float, None]:
    """
    Convert a string to a float representing a bodyweight in kg, making the search case-insensitive.
    """
    # Regex to match the number followed optionally by space and then "kg" or "lbs", case-insensitive
    kg_pattern = re.compile(r"(\d+(?:[.,]\d+)?)\s*kg", re.IGNORECASE)
    lbs_pattern = re.compile(r"(\d+(?:[.,]\d+)?)\s*lbs", re.IGNORECASE)
    text_lines = text.split("\n")
    for text_line in text_lines[:2]:  # Only check the first 2 lines
        kg_match = kg_pattern.search(text_line)
        lbs_match = lbs_pattern.search(text_line)
        print(text_line, kg_match)
        if kg_match:
            # If "kg" is found, convert the matched number part to float directly
            if kg_match.group(1) == "0":
                return None
            if float(kg_match.group(1).replace(",", ".")) < 30:
                return None
            return float(kg_match.group(1).replace(",", "."))
        elif lbs_match:
            if lbs_match.group(1) == "0":
                return None
            if float(lbs_match.group(1).replace(",", ".")) < (1 / 0.453592):
                return None
            return float(lbs_match.group(1).replace(",", ".")) * 0.453592

    return None
