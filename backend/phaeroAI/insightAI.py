from datetime import date

from api.v1.endpoints.openAIUtils import ask_gpt
from api.v1.endpoints.utils import split_text_into_halves
from db import crud

from schemas.types import InsightBackend
from sqlmodel import Session

DEFAULT_PROMPTS_TO_FETCH_DATA = {
    "What were my insights on a specific date?": [],
    "Analyze my sleep quality": [],
    "Analyze my eating patterns": [],
    "Analyze my exercise patterns": [],
    "Analyze my mood": [],
    "Analyze my productivity": [],
    "Analyze my social interactions": [],
    "What are my most felt emotions?": [],
    "What are my most common thoughts?": [],
    "Tell me something interesting": [],
    "What are things I wanted to remember?": [],
    "What would you recommend me to do?": [],
    "Give me summary of those days": [],
    "What are my most common activities?": [],
    "Do you think the supplements I took made a difference?": [],
    "What are common pitfalls in my behavior?": [],
    "What are the coolest things I did?": [],
    "What should I be doing again based on what I said about it?": [],
    "What should I be doing less of based on how it affected me?": [],
}


def create_insight(
    db: Session, user_id: int, prompt: str, time_start: date, time_end: date
) -> str:
    inputInformation = ""
    relevantNotes = crud.get_note_entries_timeframe(db, user_id, time_start, time_end)
    for noteData in relevantNotes:
        inputInformation += noteData.note + " "
        # NOTE modify here to add statistic data, if prompt is in default prompts
        # nonDefaultBoilerplate = f"""
    userLanguage = crud.get_settings(db, user_id)
    if not userLanguage:
        userLanguage = "english"
    else:
        userLanguage = userLanguage.language
    defaultBoilerplate = f"""
        You are an AI assistant named Insightful.
        Your purpose is to provide thoughtful and personalized responses to the user's prompts based on the information provided in their personal journal notes.
        When the user provides a prompt, carefully analyze their journal notes to gain context and insights into their life.
        Use this information to generate a response that directly addresses their prompt in a way that is both relevant and meaningful to them.
        It should focus on providing actionable advice, recommendations, or insights that can help the user improve their life in some way, and not just regurgitate the information they've already provided.
        Your response should be empathetic, understanding, and provide valuable insights or recommendations based on the patterns and themes you identify in their journal.
        Remember, the user should feel as though you truly understand them and their unique situation.

        User's Journal Notes:
        {inputInformation}

        User's Prompt:
        {prompt}

        Response in language: {userLanguage}
        Response: 
    """
    result: str = ask_gpt(
        query=defaultBoilerplate, model="gpt-3.5-turbo-0125", temperature=0.3
    )
    crud.create_insight(
        db,
        user_id,
        prompt,
        result=result,
        used_note_ids=[noteData.id for noteData in relevantNotes],
        recorded_at=date.today(),
    )
    return "result"


def get_insight_token_cost(
    db: Session, user_id: int, prompt: str, time_start: date, time_end: date
) -> int:
    cost = 0
    relevantNotes = crud.get_note_entries_timeframe(db, user_id, time_start, time_end)
    for noteData in relevantNotes:
        cost += max(len(noteData.note.split(" ")), len(noteData.note) // 5)
    cost += max(len(prompt.split(" ")), len(prompt) // 5)
    return cost
