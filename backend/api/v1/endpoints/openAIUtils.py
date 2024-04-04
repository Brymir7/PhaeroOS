from core.config import create_settings
from db import crud
from openai import OpenAI
from sqlmodel import Session

settings = create_settings()


def createOpenAIClient():
    settings = create_settings()
    client = OpenAI(
        api_key=settings.OPENAI_KEY,
    )
    return client


def ask_gpt(query: str, model: str = "gpt-4-turbo", temperature: float = 0.0) -> str:
    client = createOpenAIClient()
    chat_completion = client.chat.completions.create(
        model=model,
        temperature=temperature,
        messages=[{"role": "user", "content": query}],
    )
    result = chat_completion.choices[0].message.content
    return result


from functools import lru_cache


@lru_cache(maxsize=10000)
def get_embedding_from_text(text: str) -> list[float]:
    client = createOpenAIClient()
    print("NOT USING CACHE")
    text_emb_response = client.embeddings.create(
        input=[text], model="text-embedding-3-small"
    )

    return text_emb_response.data[0].embedding


def get_embedding_for_query(db: Session, user_id: int, text: str) -> list[float]:
    db_emb = crud.get_embedding_for_query(db, user_id, text)
    if db_emb is not None:
        return db_emb
    openAI_emb = get_embedding_from_text(text)
    crud.save_query_embedding(db, user_id, text, openAI_emb)
    return openAI_emb
