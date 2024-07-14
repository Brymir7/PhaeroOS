import json
from fastapi import APIRouter, Depends, Request, HTTPException, status
import httpx
from typing import List, Literal, Optional, Union
import pytz
from sqlmodel import Session
from datetime import datetime, date
from core.config import create_settings
from db.database import get_db
from db import crud
from schemas.types import CreateSysMessageRequest, MessageRequest, MessageResponse
from groq import Groq

router = APIRouter()

settings = create_settings()
OPENAI_API_URL = settings.OPENAI_API_URL
OPENAI_API_KEY = settings.OPENAI_KEY
USE_LOCAL_MODEL = settings.USE_LOCAL_MODEL
LOCAL_MODEL_URL = settings.LOCAL_MODEL_URL
GROQ_API_KEY = settings.GROQ_API_KEY

client = Groq(
    api_key=GROQ_API_KEY,
)

from ragatouille import RAGPretrainedModel


def get_rag_result_faq(
    rag: RAGPretrainedModel,
    query,
    k=2,
    score_threshold_multiplier=1.1,
    overWriteScoreThreshholdIfScoreAbove: Optional[float] = None,
    score_difference_threshold=1.1,
) -> Union[str, Literal["I'm sorry, I don't know that."]]:

    def search_and_filter(query, k):
        results = rag.search(query, k=k)
        print(results)
        scores = [result["score"] for result in results]
        avgScore = sum(scores) / len(scores)
        if overWriteScoreThreshholdIfScoreAbove is not None:
            return [
                result
                for result in results
                if result["score"] >= overWriteScoreThreshholdIfScoreAbove
                or result["score"] >= avgScore * score_threshold_multiplier
            ]

        return [
            result
            for result in results
            if result["score"] >= avgScore * score_threshold_multiplier
        ]

    def select_final_result(filtered_results):
        if len(filtered_results) == 0:
            return None
        if len(filtered_results) == 1:
            return filtered_results[0]
        if len(filtered_results) > 1:
            if overWriteScoreThreshholdIfScoreAbove:
                return filtered_results[0]
            if (
                filtered_results[0]["score"] - filtered_results[1]["score"]
                >= score_difference_threshold
            ):
                return filtered_results[0]
        else:
            return None

    filtered_results = search_and_filter(query, k=k)
    final_result = select_final_result(filtered_results)
    return (
        final_result["document_metadata"]["answer"]
        if final_result
        else "I'm sorry, I don't know that."
    )


def get_user_rag_result(
    rag: Union[RAGPretrainedModel, None],
    query,
    note_ids: list[str],
    user_id: int,
    k=2,
    score_threshold_multiplier=1.1,
    overWriteScoreThreshholdIfScoreAbove: Optional[float] = None,
) -> list[tuple[int, str]]:
    if not rag or not note_ids:
        print("RAG or note_ids not found", rag, len(note_ids))
        return []

    def search_and_filter(query):
        # Perform the search
        results = rag.search(query, k=k, doc_ids=note_ids)
        print("RAG RESULT USER:", results[:k])
        # Calculate average score for thresholding
        if results is None or results == []:
            return []
        scores = [result["score"] for result in results]
        if not scores:
            return []
        avgScore = sum(scores) / len(scores)

        # Conditionally apply score thresholds
        if "document_metadata" not in results[0]:
            return []
        if overWriteScoreThreshholdIfScoreAbove is not None:
            return [
                result
                for result in results
                if (
                    result["score"] >= overWriteScoreThreshholdIfScoreAbove
                    or result["score"] >= avgScore * score_threshold_multiplier
                )
                and result["document_metadata"]["user_id"] == user_id
            ]

        return [
            result
            for result in results
            if result["score"] >= avgScore * score_threshold_multiplier
            and result["document_metadata"]["user_id"]
            == user_id  # NOTE just making sure
        ]

    # Filter results to match the specified user ID and apply scoring thresholds
    filtered_results = search_and_filter(query)

    # Extract and return the required note_id and content from the filtered results
    return [
        (result["document_metadata"]["note_id"], result["content"])
        for result in filtered_results
    ][:k]


# async def async_AIPrompt(
#     client: httpx.AsyncClient,
#     query: str,
#     injection: str = "",
#     model: str = "gpt-3.5-turbo-0125",
#     history=[],
#     temperature: float = 0.7,
# ) -> str:
#     if USE_LOCAL_MODEL:
#         url = LOCAL_MODEL_URL
#         data = {
#             "model": settings.LOCAL_MODEL_NAME,
#             "messages": [{"role": "user", "content": injection + query}],
#             "temperature": temperature,
#         }
#     else:
#         url = OPENAI_API_URL
#         headers = {
#             "Authorization": f"Bearer {OPENAI_API_KEY}",
#             "Content-Type": "application/json",
#         }
#         data = {
#             "model": model,
#             "messages": [{"role": "user", "content": injection + query}],
#             "temperature": temperature,
#         }
#         response = await client.post(url, headers=headers, json=data, timeout=30)

#     response = await client.post(
#         url, headers=headers if not USE_LOCAL_MODEL else None, json=data, timeout=30
#     )
#     result = response.json()
#     return result["choices"][0]["message"]["content"]


async def async_ChatAIPrompt(
    client: httpx.AsyncClient,
    user_message: str,
    model: str = "gpt-3.5-turbo-0125",
    history=[],
    temperature: float = 0.7,
    top_p=1.0,
    freq_penalty=0.1,
    max_tokens=350,
) -> str:
    if USE_LOCAL_MODEL:
        url = LOCAL_MODEL_URL
        print("Using local model", url)
        data = {
            "model": settings.LOCAL_MODEL_NAME,
            "messages": history + [{"role": "user", "content": user_message}],
            "temperature": temperature,
            "top_p": top_p,
            "frequency_penalty": freq_penalty,
            "max_tokens": max_tokens,
        }
    else:
        url = OPENAI_API_URL
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }
        data = {
            "model": model,
            "messages": history + [{"role": "user", "content": user_message}],
            "temperature": temperature,
            "top_p": top_p,
            "frequency_penalty": freq_penalty,
            "max_tokens": max_tokens,
        }
    response = await client.post(
        url, headers=headers if not USE_LOCAL_MODEL else None, json=data, timeout=30
    )
    if USE_LOCAL_MODEL:
        json_results = response.content.split(b"\n")
        result = [json.loads(j) for j in json_results if j]
        return "".join(
            obj["message"]["content"]
            for obj in result
            if "message" in obj and "content" in obj["message"]
        )
    result = response.json()
    return result["choices"][0]["message"]["content"]


def groq_Prompt(
    query: str,
    client: Groq,
    injection: str = "",
    model="llama3-70b-8192",
    sys_language: str = "english",
    temperature: float = 0.6,
) -> Optional[str]:
    if USE_LOCAL_MODEL:
        url = LOCAL_MODEL_URL
        data = {
            "model": settings.LOCAL_MODEL_NAME,
            "messages": [
                {
                    "role": "system",
                    "content": f"You are a{'n english' if sys_language == 'english' else  ' '+ sys_language} journal entry assistant, but you do not translate. You understand english. You only return the markdown entry neatly formatted, nothing else. You do not make up information.",
                },
                {"role": "user", "content": injection + query},
            ],
            "temperature": temperature,
        }
        with httpx.Client() as client:
            response = client.post(url, json=data, timeout=30.0)
            json_results = response.content.split(b"\n")
            result = [json.loads(j) for j in json_results if j]
            return "".join(
                obj["message"]["content"]
                for obj in result
                if "message" in obj and "content" in obj["message"]
            )
    else:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": f"You are a{'n english' if sys_language == 'english' else  ' '+ sys_language} journal entry assistant, but you do not translate. You understand english. You only return the markdown entry neatly formatted, nothing else. You do not make up information.",
                },
                {
                    "role": "user",
                    "content": f"{injection}{query}",
                },
            ],
            temperature=temperature,
            model=model,
        )
        return (
            chat_completion.choices[0].message.content
            if chat_completion.choices[0].message.content
            else None
        )


import httpx


async def async_GroqPrompt(
    client: httpx.AsyncClient,
    query: str,
    injection: str = "",
    model: str = "llama3-70b-8192",
    sys_language: str = "english",
    temperature: float = 0.6,
) -> str:
    if USE_LOCAL_MODEL:
        url = LOCAL_MODEL_URL
        data = {
            "model": settings.LOCAL_MODEL_NAME,
            "messages": [
                {
                    "role": "system",
                    "content": f"You are a{'n english' if sys_language == 'english' else  ' '+ sys_language} journal entry assistant, but you do not translate. You only return the markdown entry neatly formatted, nothing else. You do not make up information. You can use emojis.",
                },
                {"role": "user", "content": injection + query},
            ],
            "temperature": temperature,
        }
    else:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        }
        data = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": f"You are a{'n english' if sys_language == 'english' else  ' '+ sys_language} journal entry assistant, but you do not translate. You only return the markdown entry neatly formatted, nothing else. You do not make up information. You can use emojis.",
                },
                {"role": "user", "content": injection + query},
            ],
            "temperature": temperature,
        }
    response = await client.post(
        url, headers=headers if not USE_LOCAL_MODEL else None, json=data, timeout=30
    )
    result = response.json()
    if USE_LOCAL_MODEL:
        json_results = response.content.split(b"\n")
        result = [json.loads(j) for j in json_results if j]
        return "".join(
            obj["message"]["content"]
            for obj in result
            if "message" in obj and "content" in obj["message"]
        )

    return (
        result["choices"][0]["message"]["content"]
        if "choices" in result and result["choices"]
        else "No response"
    )


def convert_message_type_to_history_type(message_type: str) -> str:
    message_type = message_type.lower().strip()
    if message_type == "system":
        return "assistant"  # its alrdy in the message
    return "user"


@router.post("/send_message/")
async def send_message(
    request: Request, message_data: MessageRequest, db: Session = Depends(get_db)
):
    username = request.state.username
    user = crud.get_user_by_name(db, username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    userSettings = crud.get_settings(db, user.id)
    if message_data.message.strip() == "":
        return {"status": "success"}
    if (
        len(message_data.message.strip().split(" ")) > 500
        or len(message_data.message) > 2500
    ):
        return {"status": "message too long"}
    crud.add_user_message_for_day(
        db,
        user.id,
        message=message_data.message,
        specific_date=message_data.specific_date,
    )

    all_messages_today = crud.get_messages_for_specific_day(
        db, user.id, message_data.specific_date
    )

    def convert_phaero_note_dict_into_chat_message(phaero_note_dict: dict) -> str:
        if not phaero_note_dict:
            return ""
        nutrition = phaero_note_dict.get("Nutrition", {}).get("Total", {})
        macros = nutrition.get("Macros", {})
        weight = phaero_note_dict.get("Sleep & Weight", {}).get("Weight", [None])[0]
        sleep_start = phaero_note_dict.get("Sleep & Weight", {}).get("Sleep Start", "")
        sleep_end = phaero_note_dict.get("Sleep & Weight", {}).get("Sleep End", "")
        calories = macros.get("calories", [None])[0]
        carbs = macros.get("carbs", [None])[0]
        protein = macros.get("protein", [None])[0]
        fat = macros.get("fat", [None])[0]

        message_parts = []

        if weight is not None:
            message_parts.append(f"Weight: {weight} KG")
        if sleep_start:
            message_parts.append(f"Sleep Start: {sleep_start}")
        if sleep_end:
            message_parts.append(f"Sleep End: {sleep_end}")
        if calories is not None:
            message_parts.append(f"Calories: {calories} KCAL")
        if carbs is not None:
            message_parts.append(f"Carbs: {carbs} G")
        if protein is not None:
            message_parts.append(f"Protein: {protein} G")
        if fat is not None:
            message_parts.append(f"Fat: {fat} G")

        res = "\n".join(message_parts)
        return res

    filtered_messages: list[tuple[str, str]] = []
    for one_message in all_messages_today:
        if (
            one_message.phaero_note_dict is None
            and one_message.phaero_note_dict_diff_json is None
        ):
            filtered_messages.append((one_message.message, one_message.typeof_message))
        elif one_message.phaero_note_dict is not None:
            updated_message = convert_phaero_note_dict_into_chat_message(
                one_message.phaero_note_dict
            )
            filtered_messages.append((updated_message, one_message.typeof_message))

    # user_timezone = pytz.timezone(userSettin
    # gs.timezone)
    # user_local_time = datetime.now(user_timezone)
    last_x_days = 7
    _, can_chat = crud.get_daily_allowance_chat(db, user.id)
    avgCalories = round(
        crud.get_avg_calories(
            db,
            user.id,
            last_x_days=last_x_days,
        ),
        None,
    )

    avgFluid = round(
        crud.get_avg_fluid_Intake(
            db,
            user.id,
            last_x_days=last_x_days,
        ),
        1,
    )

    avgBedtime, avgWaketime, avgSleepDuration = (
        crud.get_avg_bed_and_wake_up_time_and_duration(
            db,
            user.id,
            last_x_days=last_x_days,
        )
    )

    avgSteps = round(
        crud.get_avg_step_count(
            db,
            user.id,
            last_x_days=last_x_days,
        ),
        None,
    )

    avgWellbeing = round(
        crud.get_avg_wellbeing_score(
            db,
            user.id,
            last_x_days=last_x_days,
        ),
        1,
    )

    avgWeight = round(
        crud.get_avg_weight(
            db,
            user.id,
            last_x_days=last_x_days,
        ),
        1,
    )

    hasAverages = (
        avgCalories != 0
        and avgFluid != 0
        and avgWeight != 0
        and avgWellbeing != 0
        and avgSleepDuration != 0
    )

    user_personality = user.personality_summary
    sys_prompt = [
        {
            "role": "system",
            "content": (
                f"""You are Phaero, a personal companion with a distinctive, lion like personality that helps with journaling, general life and self improvement.
You are directly able to write the journal for the user, but this is done in the background by just chatting with the user. You speak {userSettings.language}, but also understand english words.
You write short messages in a casual manner. If the user asks for advice, ask clarifying questions first. You do not repeat questions if they are left unanswered. Guide the user through the day."""
                + (
                    user_personality
                    + "End of User Personality"
                    + "Use this to personalize the conversation."
                )
                if user_personality
                else ""
                + (
                    (
                        "User's Average Calories: "
                        + str(avgCalories)
                        + " "
                        + "User's Average Fluid Intake: "
                        + str(avgFluid)
                        + " "
                        + "User's Average Weight: "
                        + str(avgWeight)
                        + " "
                        + "User's Average Wellbeing: "
                        + str(avgWellbeing)
                        + " "
                        + "User's Average Sleep Duration: "
                        + str(avgSleepDuration)
                        + " "
                        + "User's Average Steps: "
                        + str(avgSteps)
                        + " "
                        + "User's Average Bedtime: "
                        + str(avgBedtime)
                        + " "
                        + "User's Average Waketime: "
                        + str(avgWaketime)
                        + " "
                        + "End of Averages"
                    )
                    if hasAverages
                    else ""
                )
            ),
        }
    ]
    last_5_messages = (
        filtered_messages[-5:] if len(filtered_messages) > 5 else filtered_messages
    )
    history = sys_prompt + [
        {
            "role": convert_message_type_to_history_type(message[1]),
            "content": message[0],
        }
        for message in last_5_messages
    ]
    if len(message_data.message.strip().split(" ")) < 10:
        rag_result = get_rag_result_faq(
            rag=request.app.state.RAG,
            query=message_data.message,
            overWriteScoreThreshholdIfScoreAbove=20.0,
        )
        print(rag_result)
        if rag_result != "I'm sorry, I don't know that.":
            crud.add_system_message_for_day(db, user.id, rag_result)
            return {"status": "success"}

    current_note = crud.get_daily_note(db, user.id)

    def get_word_count(t: str) -> int:
        return len(t.split())

    crud.add_to_daily_note(
        db,
        user.id,
        "\n\n" + message_data.message,
        has_been_formatted=(
            False
            if get_word_count(current_note.note + message_data.message) > 25
            else True
        ),
    )
    if not can_chat:
        crud.add_system_message_for_day(db, user.id, "Zzzz...")
        return {"status": "success"}
    async with httpx.AsyncClient() as client:
        response = await async_ChatAIPrompt(
            client,
            "USER_MESSAGE: " + message_data.message,
            history=history,
            temperature=0.8,
            model="gpt-3.5-turbo-0125",
        )
        crud.reduce_daily_allowance_chat(db, user.id)
        crud.add_system_message_for_day(
            db,
            user.id,
            response.replace("SYSTEM: ", "")
            .replace("USER: ", "")
            .replace("SYSTEM: ", "")
            .strip(),
            # note_ids=appropriate_note_ids if len(appropriate_note_ids) > 0 else None,
        )
    return {"status": "success"}


@router.get("/format_daily_note/")
async def format_daily_note(request: Request, db: Session = Depends(get_db)):
    username = request.state.username
    user = crud.get_user_by_name(db, username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    phaeroNote = crud.get_daily_note(db, user.id)
    userSettings = crud.get_settings(db, user.id)
    if not phaeroNote or phaeroNote.note.strip() == "":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No daily note found"
        )
    prompt = f"note: {phaeroNote.note}. Do it in {userSettings.language}. Please create a structured journal entry out of my note. Transform questions into thoughts or ideas. Main headline is one #. Format it in an aesthetic, hierarchical manner. Return only the markdown now:"
    async with httpx.AsyncClient() as client:
        formatted_note = await async_GroqPrompt(
            client,
            prompt,
            "",
            sys_language=("german" if userSettings.language == "german" else "english"),
        )
    formattedNoteWithoutEmptyHeadlines = "\n".join(
        [
            line
            for line in formatted_note.split("\n")
            if line.strip() != ""
            and line.strip() != "####"
            and line.strip() != "##"
            and line.strip() != "#"
            and line.strip() != "###"
        ]
    )
    crud.update_daily_note(
        db, user.id, formattedNoteWithoutEmptyHeadlines, has_been_formatted=True
    )
    return {"status": "success"}


@router.get("/get_messages/", response_model=List[MessageResponse])
def get_messages(request: Request, specific_date: date, db: Session = Depends(get_db)):
    username = request.state.username  # from middleware
    print("GETTING MESSAGES", specific_date)
    user = crud.get_user_by_name(db, username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    messages = crud.get_messages_for_specific_day(db, user.id, specific_date)
    return messages


@router.post("/create_initial_sys_message/")
def create_initial_sys_message(
    request: Request,
    message_data: CreateSysMessageRequest,
    db: Session = Depends(get_db),
):
    username = request.state.username  # from middleware
    user = crud.get_user_by_name(db, username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    existing_message = crud.add_initial_sys_message_for_day(
        db,
        user.id,
        message_data.message,
        message_data.specific_date,
        message_data.display,
        message_data.has_confirmed,
    )
    if existing_message:
        return {"status": "success", "message": existing_message.message}
    return {"status": "message already exists"}


@router.post("/create_sys_message/")
def create_sys_message(
    request: Request,
    message_data: CreateSysMessageRequest,
    db: Session = Depends(get_db),
):
    username = request.state.username
    user = crud.get_user_by_name(db, username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    if message_data.display and message_data.display == "habits":
        habits = crud.get_habits(db, user.id)
        if not habits:
            raise HTTPException(500, "No habits found")
            return {"status": "error", "message": "No habits found"}
    print("Creating sys message", message_data.message, message_data.display)
    crud.create_unique_for_day_sys_message(
        db,
        user.id,
        message=message_data.message,
        specific_date=message_data.specific_date,
        display=message_data.display,
        has_confirmed=message_data.has_confirmed,
    )
    return {"status": "success"}
