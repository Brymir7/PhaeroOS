import math


def get_data_from_iterator(iterator):
    data = []
    for tupleObject in iterator:
        data.append(tupleObject[0])
    return data


def calc_standard_deviation(numbers: list[int]) -> float:
    n = len(numbers)
    mean = sum(numbers) / n
    variance = sum((x - mean) ** 2 for x in numbers) / n
    standard_deviation = math.sqrt(variance)
    return standard_deviation


def replace_more_than_2spaces_with_1space(query: str, self) -> str:
    while "  " in query:
        query = query.replace("  ", " ")
    return query


def prepare_query(query: str, self, language: str = "english") -> str:
    query = query.replace("\n", " ")
    query = self.replace_more_than_2spaces_with_1space(query)
    return query


def longest_common_substring(query: str, other: str) -> str:
    """Returns the longest common substring of two strings"""
    if len(query) > len(other):
        query, other = other, query
    len1 = len(query)
    len2 = len(other)
    longest = ""
    for i in range(len1):
        for j in range(i, len1):
            if query[i : j + 1] in other and len(query[i : j + 1]) > len(longest):
                longest = query[i : j + 1]
    return longest


def longest_common_subword_similarity(query: str, other: str) -> float:
    """Returns a similarity based on the longest substring in all words of the other string to the query string"""
    words2 = other.split()
    highestSim = 0
    for word2 in words2:
        common = longest_common_substring(query, word2)
        sim = len(common) / len(word2)
        if sim > highestSim:
            highestSim = sim
    return highestSim


def sort_by_similarity(query: str, list_of_strings: list[str]) -> list[str]:
    """Sort a list of strings by similarity to a query"""
    return sorted(
        list_of_strings,
        key=lambda x: longest_common_subword_similarity(query, x),
        reverse=True,
    )


def calculate_variance(arr: list[float]):
    if len(arr) == 0:
        return 0
    mean = sum(arr) / len(arr)
    return sum((x - mean) ** 2 for x in arr) / len(arr)


from collections import Counter
from typing import List


def trigram_frequencies(s: str) -> Counter:
    """Generates a Counter of trigram frequencies for the given string."""
    n = 3
    return Counter([s[i : i + n] for i in range(len(s) - n + 1)])


def word_similarity(word_trigrams: Counter, text_trigrams: Counter) -> float:
    """Calculates the similarity score between word trigrams and text trigrams."""
    if not word_trigrams or not text_trigrams:
        return 0.0
    common_trigrams = word_trigrams & text_trigrams  # Intersection of two Counters.
    total_common = sum(common_trigrams.values())
    total_word_trigrams = max(sum(text_trigrams.values()), sum(word_trigrams.values()))
    # Similarity is the ratio of matching trigrams to total trigrams in the word.
    return total_common / total_word_trigrams if total_word_trigrams else 0.0


def trigram_search_similarity(userFood: str, text: str) -> float:
    """
    Calculates the average similarity score between userFood and text using trigram search.
    """
    userFood = userFood.lower().replace(" ", "")
    text = text.lower().replace(" ", "")
    text_trigrams = trigram_frequencies(text)

    words = (
        userFood.split()
    )  # Assuming words were meant to be split after normalization
    word_similarities = []
    for word in words:
        word_trigrams = trigram_frequencies(word)
        similarity = word_similarity(word_trigrams, text_trigrams)
        word_similarities.append(similarity)

    if not word_similarities:
        return 0.0
    return sum(word_similarities) / len(word_similarities)
