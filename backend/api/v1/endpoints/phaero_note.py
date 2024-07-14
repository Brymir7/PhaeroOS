import tempfile
import time
from typing import Optional

import httpx
import pytz
from yaml import serialize
from api.v1.endpoints.chat import groq_Prompt
from api.v1.endpoints.openAIUtils import createOpenAIClient
from api.v1.endpoints.utils import serialize_datetime
from fastapi import (
    APIRouter,
    Depends,
    Request,
    HTTPException,
    status,
    UploadFile,
    File,
)
from schemas.types import (
    EntryData,
    ImageIndices,
    OptionalDate,
    Note,
    ScoresPlusSurveys,
    SleepSurvey,
    Survey,
    UpdatedPhaeroNote,
)
from db.database import get_db
from db import crud
from db import foodDB
from sqlmodel import Session
from datetime import date, datetime, timedelta
from .utils import (
    create_phaero_default_note,
    beautify_phaero_note_json_for_frontend,
    create_user_settings_dict,
    crud_save_final_note,
    get_image_base64_by_image_url,
)
from core.config import create_settings
from .phaero_note_decoder import PhaeroNoteDecoder
import traceback
from groq import Groq

settings = create_settings()
timeTravelAmount = settings.timeTravelAmount
router = APIRouter()


OPENAI_CLIENT = createOpenAIClient()
GROQ_API_KEY = settings.GROQ_API_KEY

GROQ_CLIENT = Groq(
    api_key=GROQ_API_KEY,
)

MINIMUM_WORD_COUNT = 20
MAXIMUM_WORD_COUNT_DEFAULT = 250
MAXIMUM_WORD_COUNT_PREMIUM = 500
MAXIMUM_CHARACTERS_COUNT_PREMIUM = 3500
MAXIMUM_CHARACTERS_COUNT_DEFAULT = 1750
IMAGE_DIR = "images"
user_to_previous_diff: dict[int, dict] = {}


def entryDataDiffIsWorthShowing(entryDataDiff: dict) -> bool:
    diff_keys = list(entryDataDiff.keys())
    invalid_keys = ["Note"]
    sleep_key = "Sleep & Weight"
    sleep_invalid_conditions = [[], ["Sleep Quality"]]
    if not entryDataDiff:
        return False
    if entryDataDiff == {}:
        return False
    invalid_key_count = 0
    for diff_key in diff_keys:
        if diff_key in invalid_keys:
            invalid_key_count += 1
        elif diff_key == sleep_key:
            conditions = entryDataDiff[diff_key]
            if list(conditions.keys()) in sleep_invalid_conditions:
                invalid_key_count += 1
    if invalid_key_count == len(diff_keys):
        return False
    return True


def recursivelyRemoveCommonKeyValue(dict1: dict, dict2: dict) -> dict:
    keys_to_remove = []
    for key in dict1.keys():
        if key in dict2.keys():
            if dict1[key] == dict2[key]:
                keys_to_remove.append(key)
            elif isinstance(dict1[key], dict):
                dict1[key] = recursivelyRemoveCommonKeyValue(dict1[key], dict2[key])

    for key in keys_to_remove:
        dict1.pop(key)
    return dict1


@router.get("/phaero_note/note_length_restriction/")
def get_note_length_restriction(request: Request, db: Session = Depends(get_db)):
    subscription = crud.get_subscription(
        db, crud.get_user_by_name(db, request.state.username).id
    )
    max_note_length = (
        MAXIMUM_WORD_COUNT_PREMIUM
        if subscription.subscription_tier == "Phaero Premium"
        else MAXIMUM_WORD_COUNT_DEFAULT
    )
    return {
        "min_note_length": MINIMUM_WORD_COUNT,
        "max_note_length": max_note_length,
    }


@router.get("/phaero_note/tags/")
def get_list_of_tags(request: Request, db: Session = Depends(get_db)):
    tags = crud.get_all_tags(db)
    return {"tags": tags}


@router.post("/phaero_note/process/")
async def decode_phaero_note(
    request: Request,
    user_scores: ScoresPlusSurveys,
    specific_date: date,
    db: Session = Depends(get_db),
):
    username = request.state.username  # from middleware
    user_id = crud.get_user_by_name(db, username).id
    subscription = crud.get_subscription(db, user_id)
    userSettings = crud.get_settings(db, user_id)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="No subscription active",
        )
    maximumWordCount = (
        MAXIMUM_WORD_COUNT_PREMIUM
        if subscription.subscription_tier == "Phaero Premium"
        else MAXIMUM_WORD_COUNT_DEFAULT
    )
    currAllowance, canProcess = crud.get_daily_allowance_processing(db, user_id)
    prevPhaeroNote = crud.get_phaero_note(
        db=db,
        user_id=user_id,
        specific_date=specific_date,
        default=serialize_datetime(create_phaero_default_note(db=db, user_id=user_id)),
    )
    if not canProcess:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have reached your daily processing allowance.",
        )
    phaero_note = crud.get_daily_note(db, user_id=user_id)
    if phaero_note.note == "":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Note is empty.",
        )
    words = phaero_note.note.split()
    wordCount = len(words) if words else 0
    maxCharacterCount = (
        MAXIMUM_CHARACTERS_COUNT_PREMIUM
        if subscription.subscription_tier == "Phaero Premium"
        else MAXIMUM_CHARACTERS_COUNT_DEFAULT
    )
    if len(phaero_note.note) > maxCharacterCount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your note is too long.",
        )
    if wordCount > maximumWordCount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your note is too long.",
        )
    if wordCount < MINIMUM_WORD_COUNT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your note is too short.",
        )
    crud.reduce_daily_allowance_processing(db, user_id)
    phaero_note_for_models = phaero_note.note

    async with httpx.AsyncClient() as client:
        decoder = PhaeroNoteDecoder(
            phaeroNote=phaero_note_for_models,
            user_id=user_id,
            user_settings=create_user_settings_dict(db, user_id),
            client=client,
            db=db,
            phaero_note_default_dict=create_phaero_default_note(db=db, user_id=user_id),
            user_portion_sizes=foodDB.crud_get_custom_foods_name_to_portion_size_dict(
                user_id
            ),
        )
        try:
            start = time.time()
            result = await decoder.process()
            end = time.time()
            print("TOTAL TIME: ", end - start)
        except Exception as exception:
            print(exception)
            traceback.print_exc()
            crud.set_daily_allowance_processing(db, user_id, currAllowance)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Something went wrong with the AI Model, please tell support.",
            )
    result["Note"]["Rating"] = user_scores.wellbeing_score
    result["Sleep & Weight"]["Sleep Quality"] = 10 - sum(
        [
            2 * int(boolAndStrTuple[0])
            for boolAndStrTuple in user_scores.sleep_survey.values()
        ]
    )
    crud.create_or_get_survey_data_user(
        db,
        user_id,
        survey_type="sleep",
        survey_dict=user_scores.sleep_survey,
        specific_date=specific_date,
    )
    phaero_default_dict = create_phaero_default_note(db=db, user_id=user_id)
    get_user_changed_dict = crud.get_user_changed_phaero_note(
        db,
        user_id,
        default=serialize_datetime(phaero_default_dict),
        recorded_at=specific_date,
    )
    get_user_changed_dict.data_json["Note"][
        "Note"
    ] = phaero_note.note  # NOTE user always changes this, no AI changes here
    if result["Sleep & Weight"][
        "Sleep Start"
    ] == datetime.fromisoformat(  # If the sleep start is the same as the default, use the previous note
        str(phaero_default_dict["Sleep & Weight"]["Sleep Start"])
    ) and prevPhaeroNote.data_json[
        "Sleep & Weight"
    ][
        "Sleep Start"
    ] != datetime.fromisoformat(
        str(phaero_default_dict["Sleep & Weight"]["Sleep Start"])
    ):
        result["Sleep & Weight"]["Sleep Start"] = prevPhaeroNote.data_json[
            "Sleep & Weight"
        ]["Sleep Start"]
    if result["Sleep & Weight"][
        "Sleep End"
    ] == datetime.fromisoformat(  # NOTE avoid overwriting if model finds nothing for some reason
        str(phaero_default_dict["Sleep & Weight"]["Sleep End"])
    ) and prevPhaeroNote.data_json[
        "Sleep & Weight"
    ][
        "Sleep End"
    ] != datetime.fromisoformat(
        str(phaero_default_dict["Sleep & Weight"]["Sleep End"])
    ):
        result["Sleep & Weight"]["Sleep End"] = prevPhaeroNote.data_json[
            "Sleep & Weight"
        ]["Sleep End"]
    mergedPhaeroNotes = (
        EntryData.from_dict(
            get_user_changed_dict.data_json,
            default_sleep_end=datetime.fromisoformat(
                str(phaero_default_dict["Sleep & Weight"]["Sleep End"])
            ),
            default_sleep_start=datetime.fromisoformat(
                str(phaero_default_dict["Sleep & Weight"]["Sleep Start"])
            ),
            default_weight=phaero_default_dict["Sleep & Weight"]["Weight"][0],
        )  # NOTE user_changed_phaero_note has priority over result
        .add_together(EntryData.from_dict(result))
        .to_dict()
    )

    entryDataDiff = EntryData.from_dict(mergedPhaeroNotes).get_differences(
        EntryData.from_dict(prevPhaeroNote.data_json)
    )
    if user_id not in user_to_previous_diff:
        user_to_previous_diff[user_id] = {}
    if entryDataDiff:
        entryDataDiffNew = recursivelyRemoveCommonKeyValue(
            entryDataDiff.to_dict(), user_to_previous_diff[user_id]
        )
        user_to_previous_diff[user_id] = entryDataDiffNew
        if entryDataDiffNew and entryDataDiffIsWorthShowing(entryDataDiffNew):
            crud.add_system_message_for_day(
                db,
                user_id,
                specific_date=specific_date,
                message=(
                    "Phaero: I have detected changes in your note. Please review them. You can lock them with the Lock-Icon if you don't want them to get changed again for the day!"
                    if userSettings.language == "english"
                    else "Phaero: Ich habe Änderungen in deiner Notiz festgestellt. Bitte überprüfe sie. Du kannst sie über das Schloss-Symbol sperren, wenn du nicht möchtest, dass sie für den Tag erneut geändert werden!"
                ),
                phaero_note_dict=serialize_datetime(mergedPhaeroNotes),
                phaero_note_dict_diff=serialize_datetime(entryDataDiffNew),
            )

    crud.update_phaero_note(
        db,
        user_id,
        data_json=serialize_datetime(
            mergedPhaeroNotes
        ),  # make datime objects work with json
        recorded_at=specific_date,
    )
    crud.create_or_update_note_entry(
        db=db,
        note=mergedPhaeroNotes["Note"]["Note"],
        tags=user_scores.attached_tags,
        wellbeing_score=mergedPhaeroNotes["Note"]["Rating"],
        user_id=user_id,
        recorded_at=specific_date,
        add_to_statistics=False,
        attached_images=phaero_note.attached_images,
    )
    try:
        phaeroNoteJson = beautify_phaero_note_json_for_frontend(mergedPhaeroNotes)
    except TypeError:  # if the json is corrupted
        crud.set_daily_allowance_processing(db, user_id, currAllowance)
        crud.update_phaero_note(
            db,
            user_id,
            data_json=serialize_datetime(phaero_default_dict),
            recorded_at=specific_date,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI Model error. We are sorry for the inconvenience. If this happens again, please tell support.",
        )

    crud_save_final_note(
        db,
        user_id,
        phaero_note=phaeroNoteJson,
        specific_date=specific_date,
    )
    return {"result": phaeroNoteJson}


@router.get("/phaero_note/process_state/")
def has_been_processed(request: Request, db: Session = Depends(get_db)):
    username = request.state.username  # from middleware
    user_id = crud.get_user_by_name(db, username).id
    return {"allowance": crud.get_daily_allowance_processing(db, user_id)[0]}


import os


@router.get("/daily_note/")
def get_daily_note(
    request: Request, specific_date: date, db: Session = Depends(get_db)
):
    username = request.state.username  # from middleware
    user_id = crud.get_user_by_name(db, username).id
    daily_note = crud.get_daily_note(db, user_id=user_id)
    userSettings = crud.get_settings(db, user_id)
    attached_images_base64: list[str] = []
    if daily_note.attached_images:
        for image_url in daily_note.attached_images:
            attached_images_base64.append(
                get_image_base64_by_image_url(user_id, image_url)
            )
    if not daily_note.has_been_formatted:
        prompt = f"note: {daily_note.note}. Do it in {userSettings.language}. Please create a structured journal entry out of my note. Transform questions into thoughts or ideas. Main headline is one #. Format it in an aesthetic, hierarchical manner. Return only the markdown now:"
        response = groq_Prompt(
            prompt,
            client=GROQ_CLIENT,
            sys_language="german" if userSettings.language == "german" else "english",
        )
        print("Response", response)
        if response:
            formattedNoteWithoutEmptyHeadlines = "\n".join(
                [
                    line
                    for line in response.split("\n")
                    if line.strip() != ""
                    and line.strip() != "####"
                    and line.strip() != "##"
                    and line.strip() != "#"
                    and line.strip() != "###"
                ]
            )
            daily_note = crud.update_daily_note(
                db, user_id, formattedNoteWithoutEmptyHeadlines, has_been_formatted=True
            )
            phaero_note_dict = crud.get_phaero_note(
                db,
                user_id=user_id,
                specific_date=specific_date,
                default=serialize_datetime(
                    create_phaero_default_note(db=db, user_id=user_id)
                ),
            ).data_json
            phaero_note_dict["Note"]["Note"] = formattedNoteWithoutEmptyHeadlines
            crud.update_phaero_note(
                db,
                user_id,
                data_json=serialize_datetime(phaero_note_dict),
                recorded_at=specific_date,
            )
    return {
        "note": daily_note.note,
        "images": attached_images_base64,
        "formatted": daily_note.has_been_formatted,
    }


@router.get("/daily_note/length/")
def get_daily_note_length(
    request: Request, specific_date: date, db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    daily_note = crud.get_daily_note(db, user_id=user_id)
    return {"note_length": len(daily_note.note.split())}


@router.post("/daily_note/delete_images/")
def delete_image(
    request: Request, image_indices: ImageIndices, db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    daily_note = crud.get_daily_note(db, user_id=user_id)
    attached_images = daily_note.attached_images
    for index in image_indices.image_indices:
        image_url = attached_images[index]
        if image_url in os.listdir(IMAGE_DIR):
            os.remove(IMAGE_DIR + "/" + image_url)
        attached_images.remove(image_url)
    crud.update_daily_note(
        db,
        user_id=user_id,
        note=daily_note.note,
        image_urls=attached_images,
    )


@router.get("/phaero_note/get/")
def get_phaero_note(
    request: Request, specific_date: date, db: Session = Depends(get_db)
):
    username = request.state.username  # from middleware
    user_id = crud.get_user_by_name(db, username).id
    phaero_note = crud.get_phaero_note(
        db,
        user_id=user_id,
        specific_date=specific_date,
        default=serialize_datetime(create_phaero_default_note(db=db, user_id=user_id)),
    )
    try:
        phaeroNoteJson = beautify_phaero_note_json_for_frontend(phaero_note.data_json)
    except TypeError:
        default_phaero_note = create_phaero_default_note(db=db, user_id=user_id)
        crud.update_phaero_note(
            db,
            user_id,
            data_json=serialize_datetime(default_phaero_note),
            recorded_at=specific_date,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="""Your daily note data got corrupted, therefore we set it back to the default. We are sorry for the inconvenience.
            If this happens again, please tell support.""",
        )
    images = []

    note_entry = crud.get_specific_date_note_entry(db, user_id, specific_date)
    if note_entry:
        images = note_entry.attached_images
    base64_images = []
    user_changed_dict = crud.get_user_changed_phaero_note(
        db,
        user_id,
        recorded_at=specific_date,
        default=serialize_datetime(create_phaero_default_note(db, user_id)),
    )
    if images:
        for image_url in images:
            base64_images.append(get_image_base64_by_image_url(user_id, image_url))
            print("Image added to base64_images", image_url)
    return {
        "result": {"result": phaeroNoteJson},
        "images": base64_images,
        "user_changed_result": {"result": user_changed_dict.data_json},
    }


@router.post("/phaero_note/update/")
def get_updated_phaero_note(
    request: Request,
    processed_note: UpdatedPhaeroNote,
    specific_date: date,
    db: Session = Depends(get_db),
):
    """Updates the phaero note with the new data from the frontend."""
    username = request.state.username  # from middleware
    user_id = crud.get_user_by_name(db, username).id
    userSettings = crud.get_settings(db, user_id)
    timezone = userSettings.timezone
    user_timezone = pytz.timezone(timezone)
    current_date = datetime.now(user_timezone).date()
    curr_phaero_note = crud.get_phaero_note(
        db,
        specific_date=specific_date,
        user_id=user_id,
        default=serialize_datetime(create_phaero_default_note(db=db, user_id=user_id)),
    )
    if specific_date == current_date or (
        datetime.now(user_timezone).hour <= 3
        and specific_date == current_date - timedelta(days=1)
    ):
        entryDataDiff = EntryData.from_dict(processed_note.note_dict).get_differences(
            EntryData.from_dict(curr_phaero_note.data_json)
        )
        if entryDataDiff:
            userDict = crud.get_user_changed_phaero_note(
                db,
                user_id,
                recorded_at=specific_date,
                default=serialize_datetime(create_phaero_default_note(db, user_id)),
            )
            newUserChangedPhaeroNote = entryDataDiff.apply_diff(
                EntryData.from_dict(userDict.data_json)
            )
            crud.update_user_changed_phaero_note(  # Update the user changed note, to make sure it stays across processings
                db,
                user_id,
                recorded_at=specific_date,
                data_json=serialize_datetime(newUserChangedPhaeroNote.to_dict()),
            )

    crud.update_phaero_note(
        db,
        user_id,
        data_json=processed_note.note_dict,
        recorded_at=specific_date,
    )

    crud.update_daily_note(
        db,
        user_id=user_id,
        note=processed_note.note_dict["Note"]["Note"],
    )

    phaero_note = crud.get_phaero_note(
        db,
        specific_date=specific_date,
        user_id=user_id,
    )
    phaeroNoteJson = beautify_phaero_note_json_for_frontend(phaero_note.data_json)
    crud_save_final_note(
        db,
        user_id,
        phaero_note=phaeroNoteJson,
        specific_date=specific_date,
    )
    return {"result": phaeroNoteJson}


@router.post("/daily_note/update/")
async def post_note_data(
    request: Request,
    notes_data: Note,
    specific_date: date,
    db: Session = Depends(get_db),
):
    username = request.state.username  # from middleware
    user_id = crud.get_user_by_name(db, username).id

    currProcessedNote = crud.get_phaero_note(
        db,
        user_id=user_id,
        specific_date=specific_date,
        default=serialize_datetime(create_phaero_default_note(db=db, user_id=user_id)),
    ).data_json
    if currProcessedNote and len(notes_data.note.split(" ")) > 25:
        currProcessedNote["Note"]["Note"] = notes_data.note
        crud.update_phaero_note(
            db,
            user_id,
            data_json=serialize_datetime(currProcessedNote),
            recorded_at=specific_date,
        )
        crud_save_final_note(
            db,
            user_id,
            phaero_note=currProcessedNote,
            specific_date=specific_date,  # NOTE save the note to the database
        )

    crud.update_daily_note(
        db,
        user_id=user_id,
        note=notes_data.note,
    )
    return {"message": "notes"}


@router.post("/survey/")
def get_today_survey(
    request: Request,
    sleepSurvey: SleepSurvey,
    specific_date: date,
    db: Session = Depends(get_db),
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id

    survey = crud.create_or_get_survey_data_user(
        db,
        user_id,
        survey_type="sleep",
        survey_dict=sleepSurvey.sleep_survey,
        specific_date=specific_date,
    )

    return {
        "answers": [
            survey.answer1,
            survey.answer2,
            survey.answer3,
            survey.answer4,
            survey.answer5,
        ]
    }


@router.post("/survey/update/")
def update_today_survey(
    request: Request,
    survey: Survey,
    specific_date: date,
    db: Session = Depends(get_db),
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    crud.update_today_survey(
        db,
        user_id,
        survey_type=survey.type,
        answers=survey.answers["answers"],
        specific_date=specific_date,
    )
    sleep_quality = 10 - sum(
        [2 * int(boolVal) for boolVal in survey.answers["answers"]]
    )
    phaero_default_note = create_phaero_default_note(db=db, user_id=user_id)
    phaero_note_json = crud.get_phaero_note(
        db,
        user_id=user_id,
        specific_date=specific_date,
        default=serialize_datetime(phaero_default_note),
    ).data_json
    phaero_note_json["Sleep & Weight"]["Sleep Quality"] = sleep_quality

    changed_user_note_json = crud.get_user_changed_phaero_note(
        db,
        user_id,
        recorded_at=specific_date,
        default=serialize_datetime(create_phaero_default_note(db, user_id)),
    ).data_json
    changed_user_note_json["Sleep & Weight"]["Sleep Quality"] = sleep_quality
    crud.update_phaero_note(
        db,
        user_id,
        data_json=serialize_datetime(phaero_note_json),
        recorded_at=specific_date,
    )
    crud.update_user_changed_phaero_note(
        db,
        user_id,
        recorded_at=specific_date,
        data_json=serialize_datetime(changed_user_note_json),
    )
    return {"message": "Survey updated"}


import base64
import aiohttp


def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


async def ask_gpt_4_vision(query: str, base64_image: str) -> dict:
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.OPENAI_KEY}",
    }
    payload = {
        "model": "gpt-4o",
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": query},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"},
                    },
                ],
            }
        ],
        "max_tokens": 450,
    }
    timeout = aiohttp.ClientTimeout(total=60)
    async with aiohttp.ClientSession(
        timeout=timeout
    ) as session:  # Use aiohttp's ClientSession
        async with session.post(
            "https://api.openai.com/v1/chat/completions", headers=headers, json=payload
        ) as response:
            return await response.json()


async def ask_gpt_3_5_turbo(query: str) -> dict:
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {settings.OPENAI_KEY}",
    }
    payload = {
        "model": "gpt-3.5-turbo",
        "messages": [
            {
                "role": "user",
                "content": query,
            }
        ],
        "max_tokens": 450,
    }
    timeout = aiohttp.ClientTimeout(total=60)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.post(
            "https://api.openai.com/v1/chat/completions", headers=headers, json=payload
        ) as response:
            if response.status != 200:
                raise HTTPException(
                    status_code=response.status, detail="Error calling OpenAI API"
                )
            return await response.json()


@router.post("/phaero_note/format/")
def format_phaero_note(
    request: Request, notes_data: Note, db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    previously_used_headlines: list[str] = crud.get_previously_used_headlines(
        db, user_id, 31
    )

    print("Filtered headlines", previously_used_headlines)
    formatAllowance, canFormat = crud.get_daily_allowance_formatting(db, user_id)
    if not canFormat:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have reached your daily formatting allowance.",
        )
    userLanguage = crud.get_settings(db, user_id)
    if not userLanguage:
        userLanguage = "english"
    else:
        userLanguage = userLanguage.language
    query = f"""
    Please convert the provided text into Markdown format in the specified language LANGUAGE = {userLanguage}, but do not translate anything, using the following instructions:
    You will receive a list of Markdown headlines previously used by the user. These headlines are used to structure the content appropriately.
    If none are given, create them based on the language of the text and it's content, here use ## as the markdown headline base version.
    Do not change the structure except with headlines and bullet points. Fix all typo's. Do not change the wording.
    Adjust the formatting and organization based on the specific language of the text provided, ensuring that all headings and content are appropriate for that language context.
    Previously used headlines = {previously_used_headlines if previously_used_headlines else "None"}
    Heres the text: 
    {notes_data.note}
    """
    client = createOpenAIClient()
    crud.set_daily_allowance_formatting(db, user_id, formatAllowance - 1)
    try:
        chat_completion = client.chat.completions.create(
            model="gpt-3.5-turbo",
            temperature=0.0,
            messages=[{"role": "user", "content": query}],
        )
    except Exception as e:
        print(e)
        crud.set_daily_allowance_formatting(db, user_id, formatAllowance)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong with the AI Model, please tell support.",
        )
    crud.update_daily_note(db, user_id, chat_completion.choices[0].message.content)
    return {"formatted_note": chat_completion.choices[0].message.content}


@router.get("/phaero_note/can-format/")
def get_formatting_allowance(request: Request, db: Session = Depends(get_db)):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    # if crud.has_created_note_today(db, user_id):
    #     return {"formatAllowance": 0}
    return {"formatAllowance": crud.get_daily_allowance_formatting(db, user_id)[0]}


@router.post("/phaero_note/convert_image_to_text/")
async def convert_image_to_text(
    request: Request, image: UploadFile = File(...), db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    # Read the image file
    currAllowance, canConvert = crud.get_daily_image_to_text(db=db, user_id=user_id)
    if not canConvert:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have reached your daily image to text allowance.",
        )
    image_contents = await image.read()
    crud.reduce_daily_image_to_text(db, user_id)
    extracted_text = None
    try:
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            # Write the contents of the uploaded file to the temporary file
            temp_file.write(image_contents)
            temp_file_path = temp_file.name
            temp_file.close()
            base64_image = encode_image(temp_file_path)
            extracted_text = await ask_gpt_4_vision(
                query="Return the text from this image. Return markdown to make it look as similar as to the physical one.",
                base64_image=base64_image,
            )
    except Exception as e:
        print(e)
        crud.set_daily_image_to_text(db=db, user_id=user_id, amount=currAllowance)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong with the AI Model, please tell support.",
        )
    extracted_text: str = extracted_text["choices"][0]["message"]["content"]
    if "```" in extracted_text:
        extracted_text = "```" + extracted_text.split("```", 1)[1]
    crud.add_to_daily_note(
        db=db,
        user_id=user_id,
        note=extracted_text,
    )
    return {"text": extracted_text}


@router.post("/phaero_note/convert_food_to_text/")
async def convert_food_image_to_text(
    request: Request, image: UploadFile = File(...), db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    # Read the image file
    currAllowance, canConvert = crud.get_daily_image_to_text(db=db, user_id=user_id)
    image_contents = await image.read()
    userLanguage = crud.get_settings(db, user_id)
    if not userLanguage:
        userLanguage = "english"
    else:
        userLanguage = userLanguage.language
    if not canConvert:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have reached your daily image to text allowance.",
        )
    crud.reduce_daily_image_to_text(db, user_id)
    extracted_text = None
    try:
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            # Write the contents of the uploaded file to the temporary file
            temp_file.write(image_contents)
            temp_file_path = temp_file.name
            temp_file.close()
            base64_image = encode_image(temp_file_path)
            extracted_text = await ask_gpt_4_vision(
                query=f"""Write the following in {userLanguage} Return the foods / ingredients of the food from this image with their usual portion sizes in grams, given the meal in the picture.
                For each identified food, provide an estimated portion size in grams, drawing on standard portion sizes or known metrics.
                Present the information in a structured format,
                listing the food name followed by the estimated gram amount for each (e.g., 'FoodName: GramAmount').
                This task leverages your understanding of common food portion sizes rather than requiring precise measurements from the image.""",
                base64_image=base64_image,
            )
    except Exception as e:
        print(e)
        crud.set_daily_image_to_text(db=db, user_id=user_id, amount=currAllowance)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong with the AI Model, please tell support.",
        )
    extracted_text: str = extracted_text["choices"][0]["message"]["content"]
    extracted_text = format_food_text(extracted_text)
    crud.add_to_daily_note(
        db=db,
        user_id=user_id,
        note=extracted_text,
    )
    return {"text": extracted_text}


@router.get("/phaero_note/can-convert/")
def get_conversion_allowance(request: Request, db: Session = Depends(get_db)):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    # if crud.has_created_note_today(db, user_id):
    #     return {"conversionAllowance": 0}
    return {"conversionAllowance": crud.get_daily_image_to_text(db, user_id)[0]}


import re


def format_food_text(text: str) -> str:
    text = re.sub(r"\(.*?\)", "", text)  # remove text in brackets
    if ":" in text:
        text = text.split(":", 1)[1]  # remove everything before the first colon
    if "grams" in text:
        text = text.rsplit("grams", 1)[0]
        text = text + "grams"
    if " g " in text:
        text = text.rsplit("g", 1)[0]
        text = text + "g"
    return text


@router.get("/phaero_note/previous_foods/")
def get_previous_foods(request: Request, db: Session = Depends(get_db)):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    previous_foods = crud.get_last_phaero_note(db, user_id).data_json["Food"][
        "FoodList"
    ]
    food_list_tuples = []
    for key in previous_foods.keys():
        food_list_tuples.append(
            {"name": key, "grams": previous_foods[key]["Macros"]["amount"][0]}
        )
    return {"previous_foods": food_list_tuples}


import hashlib


@router.get("/phaero_note/image_allowance/")
def get_image_allowance(request: Request, db: Session = Depends(get_db)):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    return {"imageAllowance": crud.get_daily_allowance_image(db, user_id)[0]}


@router.post("/phaero_note/attach_image/")
async def attach_picture_to_note(
    request: Request, image: UploadFile = File(...), db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    if not crud.get_daily_allowance_image(db, user_id)[1]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have reached your daily image allowance.",
        )
    crud.reduce_daily_allowance_image(db, user_id)
    image_contents = await image.read()
    hasher = hashlib.sha256()
    hasher.update(image_contents)
    image_hash = hasher.hexdigest()
    file_name = f"{image_hash}.jpg"
    try:

        with open(f"images/{file_name}", "wb") as file:
            file.write(image_contents)
        image_url = f"{file_name}"
    except Exception as e:
        print(e)
        crud.set_daily_allowance_image(db, user_id, 1)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Something went wrong with saving the image.",
        )
    daily_note = crud.get_daily_note(db, user_id=user_id)
    print(user_id)
    amountOfImagesInNote = len(
        daily_note.attached_images if daily_note.attached_images else []
    )
    imageText = f"\n#i{amountOfImagesInNote + 1}\n"
    crud.add_to_daily_note(
        db=db,
        user_id=user_id,
        image_url=image_url,
        note=imageText,
    )

    crud.add_image_to_note(
        db, user_id, image_url, imageText
    )  # cause we avoid processing if we only add an image, we have to manually add it here
    return {"message": "Image added to note."}


@router.post("/phaero_note/update_user_changed_note/")
def update_user_changed_dict(
    request: Request,
    updated_note: UpdatedPhaeroNote,
    specific_date: date,
    db: Session = Depends(get_db),
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    default_sleep = create_phaero_default_note(db=db, user_id=user_id)
    if "Sleep Start" not in updated_note.note_dict["Sleep & Weight"]:
        updated_note.note_dict["Sleep & Weight"]["Sleep Start"] = default_sleep[
            "Sleep & Weight"
        ]["Sleep Start"]
    if "Sleep End" not in updated_note.note_dict["Sleep & Weight"]:
        updated_note.note_dict["Sleep & Weight"]["Sleep End"] = default_sleep[
            "Sleep & Weight"
        ]["Sleep End"]
    if "Weight" not in updated_note.note_dict["Sleep & Weight"]:
        updated_note.note_dict["Sleep & Weight"]["Weight"] = default_sleep[
            "Sleep & Weight"
        ]["Weight"]
    crud.update_user_changed_phaero_note(
        db,
        user_id,
        recorded_at=specific_date,
        data_json=serialize_datetime(updated_note.note_dict),
    )
    return {"message": "User changed note updated."}


@router.get("/phaero_note/get_user_changed_note/")
def get_user_changed_dict(
    request: Request, specific_date: date, db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    phaero_default_dict = create_phaero_default_note(db=db, user_id=user_id)
    user_changed_note = crud.get_user_changed_phaero_note(
        db,
        user_id,
        recorded_at=specific_date,
        default=serialize_datetime(phaero_default_dict),
    )
    return {"result": user_changed_note.data_json}
