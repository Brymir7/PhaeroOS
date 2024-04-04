from api.v1.endpoints import utils
from fastapi import APIRouter, File, UploadFile, Depends, Request, status, HTTPException
from api.v1.endpoints.phaero_note import ask_gpt_3_5_turbo
from db.database import get_db
from sqlmodel import Session
import requests
from core.config import create_settings
import db.crud as crud
import asyncio

settings = create_settings()

router = APIRouter()

FILE_MAX_LENGTH_PREMIUM = 240
FILE_MAX_LENGTH_DEFAULT = 120

RETRY_DELAY_IN_SECONDS = 8

LANGUAGE_MAPPING = {
    "english": "en",
    "german": "de",
}
import assemblyai as aai
import tempfile

aai.settings.api_key = settings.ASSEMBLYAI_API_KEY


def parse_and_merge_notes(
    current_note: str, new_content: str, previously_used_headlines: list
) -> str:
    """
    Parses the existing note and new content, and merges them based on specified headlines.
    Only includes headlines from new_content that are also in previously_used_headlines.
    """
    current_lines = current_note.split("\n")
    new_lines = new_content.split("\n")
    lines_not_attached_to_headline = []
    current_headlines_map = {}
    new_headlines_map = {}
    if not previously_used_headlines:
        return current_note + "\n" + new_content
    for line in current_lines:
        if line.strip() in previously_used_headlines:
            current_headlines_map[line.strip()] = []
        elif line.strip() != "":
            if len(list(current_headlines_map.keys())) == 0:
                lines_not_attached_to_headline.append(line)
                continue
            current_headlines_map[list(current_headlines_map.keys())[-1]].append(line)

    for line in new_lines:
        if line.strip() in previously_used_headlines:
            new_headlines_map[line.strip()] = []
        elif line.strip() != "":
            if len(list(new_headlines_map.keys())) == 0:
                continue
            new_headlines_map[list(new_headlines_map.keys())[-1]].append(line)
    if not new_headlines_map or not current_headlines_map:
        return current_note + "\n" + new_content
    combined_note = ""
    make_line_bullet_point = lambda line: (
        f"* {line}" if ("-" not in line and "*" not in line) else line
    )
    for line in current_lines:
        is_headline = line.strip() in current_headlines_map
        if is_headline:
            headline = line.strip()
            if headline in current_headlines_map:
                combined_note += f"\n{headline}\n"
                for line in current_headlines_map[headline]:
                    combined_note += make_line_bullet_point(line) + "\n"
            if headline in new_headlines_map and headline in current_headlines_map:
                for line in new_headlines_map[headline]:
                    combined_note += make_line_bullet_point(line) + "\n"
            else:
                if headline in new_headlines_map:
                    combined_note += f"{headline}\n"
                    for line in new_headlines_map[headline]:
                        combined_note += make_line_bullet_point(line) + "\n"
        elif line in lines_not_attached_to_headline:
            combined_note += f"{line}\n"
    for headline in new_headlines_map.keys():
        if headline not in current_headlines_map:
            combined_note += f"\n{headline}\n"
            for line in new_headlines_map[headline]:
                combined_note += make_line_bullet_point(line) + "\n"
    print(current_note, new_content)
    return combined_note


@router.post("/upload-audio/")
async def upload_audio(
    request: Request, file: UploadFile = File(...), db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    subscription = crud.get_subscription(db, user_id)
    userSettings = crud.get_settings(db, user_id)
    language = userSettings.language
    language = language.lower()
    languageForPipeline = LANGUAGE_MAPPING[language]
    currAllowance, canTranscribe = crud.get_daily_allowance_transcription(db, user_id)
    if not canTranscribe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have reached your daily transcription allowance.",
        )
    file_content = await file.read()
    maxFileLength = (
        FILE_MAX_LENGTH_PREMIUM
        if subscription.subscription_tier == "Phaero Premium"
        else FILE_MAX_LENGTH_DEFAULT
    )
    if not utils.file_duration_valid(
        file_content, max_length=maxFileLength + 5
    ):  # NOTE some buffer added
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File duration is too long or too short. Minimum duration is 3 seconds and maximum duration is 4 minutes.",
        )

    transcript = ""
    config = aai.TranscriptionConfig(language_code=languageForPipeline)
    transcriber = aai.Transcriber(config=config)
    crud.reduce_daily_allowance_transcription(db, user_id)
    # Create a temporary file
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        # Write the contents of the uploaded file to the temporary file
        temp_file.write(file_content)
        temp_file_path = temp_file.name
        temp_file.close()
        future = transcriber.transcribe_async(temp_file_path)
    transcript = await asyncio.wrap_future(future)
    previously_used_headlines = crud.get_previously_used_headlines(db, user_id, 7)
    if not previously_used_headlines:
        crud.add_to_daily_note(
            db=db,
            user_id=user_id,
            note="\n" + transcript.text if transcript.text else "",
        )
        return {"transcription": transcript.text}
    if transcript.text:
        prompt = f"""Please convert the provided text into Markdown format in the specified language LANGUAGE = {language}, but do not translate anything, using the following instructions:
    You will receive a list of Markdown headlines previously used by the user. These headlines are used to structure the content appropriately.
    If none are given, return the original text.
    You can break up the text such that it better fits the headlines!.
    Previously used headlines = {previously_used_headlines if previously_used_headlines else "None"}
    Heres the text: 
     {transcript.text}."""
        response = await ask_gpt_3_5_turbo(prompt)
        smart_transcript: str = response["choices"][0]["message"]["content"]
        current_note = crud.get_daily_note(db, user_id)
        updated_note = parse_and_merge_notes(
            current_note.note, smart_transcript, previously_used_headlines
        )
        crud.update_daily_note(db=db, user_id=user_id, note=updated_note)
        return {"transcription": smart_transcript}
    else:
        crud.set_daily_allowance_transcription(db, user_id, amount=currAllowance)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="""Voice Message was too short or the Transcription server didn't respond.
            We are sorry for the inconvenience.
            Tell us about this issue at the left bottom corner of the page.
            We made sure that your daily allowance is not reduced.""",
        )


@router.get("/upload-audio/can-transcribe/")
def can_transcribe(request: Request, db: Session = Depends(get_db)):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    # if crud.has_created_note_today(db, user_id):
    #     return {
    #         "transcriptionAllowance": 0,
    #         "canTranscribe": False,
    #     }

    dailyAllowance, canTranscribe = crud.get_daily_allowance_transcription(db, user_id)
    return {"transcriptionAllowance": dailyAllowance, "canTranscribe": canTranscribe}


@router.get("/upload-audio/max-duration/")
def get_max_duration(request: Request, db: Session = Depends(get_db)):
    username = request.state.username  # from middleware
    user_id = crud.get_user_by_name(db, username).id
    subscription = crud.get_subscription(db, user_id)
    fileMaxLength = (
        FILE_MAX_LENGTH_PREMIUM
        if subscription.subscription_tier == "Phaero Premium"
        else FILE_MAX_LENGTH_DEFAULT
    )
    print(fileMaxLength)
    return {"maxDuration": fileMaxLength * 1000}  # in miliseconds


transcribingUsers = {}


@router.post("/streaming/transcription/")
async def stream_transcription(
    request: Request, file: UploadFile = File(...), db: Session = Depends(get_db)
):
    # Read the file content
    username = request.state.username  # from middleware
    user_id = crud.get_user_by_name(db, username).id
    subscription = crud.get_subscription(db, user_id)
    userSettings = crud.get_settings(db, user_id)
    language = userSettings.language
    language = language.lower()  # make sure its lower
    languageForPipeline = LANGUAGE_MAPPING[language]
    currAllowance, canTranscribe = crud.get_daily_allowance_transcription(db, user_id)
    if not canTranscribe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have reached your daily transcription allowance.",
        )
    if crud.has_created_note_today(db, user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already created a note today.",
        )

    file_content = await file.read()
    # NOTE need to check something else here like duration
    #    crud.reduce_daily_allowance_transcription(db, user_id)
    files = {"file": ("recording.wav", file_content, "audio/wav")}
    transcribingUsers[user_id] = True
    own_api_url = settings.OWN_TRANSCRIPTION_SERVER_URL
    print(own_api_url)
    endpoint = "/transcribe"
    data = {"language": languageForPipeline}
    response = requests.post(own_api_url + endpoint, files=files, data=data)
    print(own_api_url + endpoint)
    try:
        transcription = response.json()
        crud.add_to_daily_note(db=db, user_id=user_id, note=transcription["output"])
        print(transcription["output"])
    except Exception as e:
        print(e)
        print("Transcription server didn't respond.")
        del transcribingUsers[user_id]
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="""Transcription server didn't respond.
            We are sorry for the inconvenience.
            Tell us about this issue at the left bottom corner of the page.
            We made sure that your daily allowance is not reduced.""",
        )
    del transcribingUsers[user_id]
    return {"transcription": transcription["output"]}


@router.get("/streaming/health_check/")
def health_check(request: Request, db: Session = Depends(get_db)):
    if (len(transcribingUsers)) > 10:
        print("TOO MANY USERS!!!")
        return {"frequency": 31000}
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    currTranscriptionAllowance = crud.get_daily_allowance_transcription(db, user_id)[0]
    crud.reduce_daily_allowance_transcription(db, user_id)
    print("health check")
    try:
        response = requests.get(
            settings.OWN_TRANSCRIPTION_SERVER_URL + "/health_check", timeout=2
        )
        print(response)
        response.raise_for_status()
    except Exception as e:
        print(e)
        crud.set_daily_allowance_transcription(
            db, user_id, amount=currTranscriptionAllowance
        )
        return {"frequency": 31000}
    return {"frequency": 5000 + (len(transcribingUsers)) * 2500}
