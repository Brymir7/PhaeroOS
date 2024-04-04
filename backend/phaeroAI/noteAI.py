from db.tables.models import NoteData
from core.config import create_settings
import db.crud as crud
from sqlmodel import Session
from . import utils
from openai import OpenAI

settings = create_settings()


def gptPrompt(
    client,
    query: str,
    injection: str = "",
    model: str = "gpt-3.5-turbo-0125",
    temperature: float = 0,
) -> str:
    def replace_more_than_2spaces_with_1space(query: str) -> str:
        while "  " in query:
            query = query.replace("  ", " ")
        return query

    def prepare_query(query) -> str:
        query = query.replace("\n", " ")
        query = replace_more_than_2spaces_with_1space(query)
        return query

    query = prepare_query(query)
    injection = prepare_query(injection)
    chat_completion = client.chat.completions.create(
        model=model,
        temperature=temperature,
        messages=[{"role": "user", "content": injection + query}],
    )
    result = chat_completion.choices[0].message.content
    return result


def get_wellbeing_classification(phaeroNote: str) -> str:
    """Returns a string that describes the wellbeing of the user, including interests."""

    def createOpenAIClient():
        settings = create_settings()
        client = OpenAI(
            api_key=settings.OPENAI_KEY,
        )
        return client

    OPENAI_CLIENT = createOpenAIClient()

    prompt = f"""PROVIDED PERSONAL NOTE: {phaeroNote}\n\n 
    Analyze the provided personal note,
    focusing on the individual's emotional and mental states as they change throughout the narrative.
    Identify these states and connect them to specific actions, surroundings, habits, or events mentioned in the note when the link is clear and significant.
    Summarize the key points of the note in a concise, bullet-point format,
    highlighting the emotional journey and its ties to pivotal moments or situations in the narrative.
    Avoid excessive interpretation or boilerplate text.
    """
    res = gptPrompt(
        client=OPENAI_CLIENT,
        query=prompt,
        injection="",
        model="gpt-3.5-turbo-0125",
        temperature=0.4,
    )
    return res


def retrieve_wellbeing_patterns(
    db: Session, user_id: int, note_entry_amount: int = 7
) -> tuple[list[str], list[NoteData]]:
    """Returns a tuple of two lists. The first list contains the summarizing description of note entries that are classified as extraordinary.
    The second list contains the NoteData objects that are classified as extraordinary.
    Extraordinary notes are notes that have a wellbeing score that is higher than the average wellbeing score + the standard deviation.
    """
    notes = utils.get_data_from_iterator(
        crud.get_note_entries(db, user_id, limited_amount=7)
    )
    wellbeingRatings = []
    extraordinaryNotesSummarizingStrings = []
    extraordinaryNotes = []
    for note in notes:
        wellbeingRatings.append(note.wellbeing_score)
    standard_deviation = utils.calc_standard_deviation(wellbeingRatings)
    for note in notes:
        if note.wellbeing_score > note.wellbeing_score + standard_deviation:
            extraordinaryNotesSummarizingStrings.append(note.summarizing_description)
            extraordinaryNotes.append(note)
    if len(extraordinaryNotes) == 0:
        idx = find_largest_value_index(wellbeingRatings)
        if wellbeingRatings[idx] > 5:
            return [notes[idx].note], [notes[idx]]
        else:
            return [], []
    return extraordinaryNotesSummarizingStrings, extraordinaryNotes


def find_largest_value_index(lst: list[int]) -> int:
    max_value = max(lst)
    max_index = lst.index(max_value)
    return max_index
