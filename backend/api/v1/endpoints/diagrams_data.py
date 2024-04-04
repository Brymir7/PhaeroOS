from api.v1.endpoints.openAIUtils import (
    get_embedding_for_query,
)
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlmodel import Session
from db.database import get_db
from db.tables.models import SleepData
from schemas.types import (
    DiagramDataPoint,
    NoteQuery,
    NoteTextQuery,
    NotesData,
    Timeframe,
)
from db import crud

router = APIRouter()


@router.get("/")
def get_diagram_data(request: Request, db: Session = Depends(get_db)):
    username = request.state.username  # from middleware
    user_id = crud.get_user_by_name(db, username).id
    DiagramDataList = crud.get_user_diagram_data(db, user_id)
    return {"data": DiagramDataList}


@router.get("/list/")
def get_diagram_data_list(request: Request, db: Session = Depends(get_db)):
    username = request.state.username  # from middleware
    user_id = crud.get_user_by_name(db, username).id
    diagramdata = crud.get_user_diagram_data(db, user_id)
    result = []
    for data in diagramdata:
        result.append(
            {
                "id": data.id,
                "name": data.title,
                "values": [
                    float(value)
                    for subdata in data.data
                    for key, value in subdata.items()
                    if key != "date"
                ],
            }
        )
    return result


@router.post("/add/")
def add_diagram_data(
    request: Request, data: DiagramDataPoint, db: Session = Depends(get_db)
):
    username = request.state.username  # from middleware
    user_id = crud.get_user_by_name(db, username).id
    try:
        crud.add_or_update_diagram_data_point(
            db, user_id=user_id, data=data.data, title=data.title
        )

        return {"message": "Data added succesfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sleep/")
def get_sleep_diagram_data(
    request: Request, last_x_days: int = 90, db: Session = Depends(get_db)
):
    username = request.state.username  # from middleware
    user_id = crud.get_user_by_name(db, username).id
    sleepDiagramData = {}
    sleep_data = crud.get_sleep_diagram_data(db, user_id, last_x_days=last_x_days)
    for idx, data in enumerate(sleep_data):
        sleepObject = data[0]
        weekday = sleepObject.recorded_at
        durationH = (
            sleepObject.sleep_end - sleepObject.sleep_start
        ).total_seconds() / 3600
        sleepDiagramData[idx] = {
            "date": weekday,
            "sleep_start": sleepObject.sleep_start,
            "sleep_end": sleepObject.sleep_end,
            "durationH": durationH,
            "sleep_quality": sleepObject.sleep_quality,
        }
    return sleepDiagramData


@router.get("/nutrition/")
def get_nutrition_diagram_data(
    request: Request, last_x_days: int = 90, db: Session = Depends(get_db)
):
    username = request.state.username  # from middleware
    user_id = crud.get_user_by_name(db, username).id
    nutritionDiagramData = {}
    nutrition_data = crud.get_nutrition_diagram_data(
        db, user_id, last_x_days=last_x_days
    )
    for data in nutrition_data:
        nutritionObject = data[0]
        weekday = nutritionObject.recorded_at.strftime("%A")
        nutritionDiagramData[weekday] = {
            "calories": nutritionObject.calories,
            "protein": nutritionObject.protein,
            "carbs": nutritionObject.carbs,
            "fat": nutritionObject.fat,
        }
    return nutritionDiagramData


@router.get("/weight/")
def get_weight_diagram_data(
    request: Request, last_x_days: int = 90, db: Session = Depends(get_db)
):
    username = request.state.username  # from middleware
    user_id = crud.get_user_by_name(db, username).id
    weightDiagramData = {}
    weight_data = crud.get_weight_diagram_data(db, user_id, last_x_days=last_x_days)
    count = 0
    for data in weight_data:
        weightObject = data[0]
        weightDiagramData[count] = {
            "date": weightObject.recorded_at.isoformat(),
            "Weight": weightObject.amount,
        }
        count += 1
    return weightDiagramData


@router.get("/exercise/")
def get_exercise_diagram_data(
    request: Request, last_x_days: int = 90, db: Session = Depends(get_db)
):
    username = request.state.username  # from middleware
    user_id = crud.get_user_by_name(db, username).id
    exerciseDiagramData = {}
    exercise_data = crud.get_exercise_diagram_data(db, user_id, last_x_days=last_x_days)
    for data in exercise_data:
        exerciseObject = data[0]
        weekday = exerciseObject.recorded_at.strftime("%A")
        exerciseDiagramData[weekday] = {
            "duration": exerciseObject.duration,
            "calories": exerciseObject.calories,
        }
    return exerciseDiagramData


@router.post("/notes/get/")
def get_notes_diagram_data(
    request: Request, timeframe: Timeframe, db: Session = Depends(get_db)
):
    username = request.state.username  # from middleware
    user_id = crud.get_user_by_name(db, username).id
    notesDiagramData = {}
    notes_data = crud.get_note_entries(
        db, user_id, last_x_days=timeframe.last_x_days, newest_first=True
    )
    for i, data in enumerate(notes_data):
        noteObject = data[0]
        date_str = noteObject.recorded_at.strftime("%Y-%m-%d")
        tagList = [crud.get_tag_name_from_id(db, tag) for tag in noteObject.tags]
        notesDiagramData[i] = {
            "id": noteObject.id,
            "date": date_str,
            "note": noteObject.note,
            "wellbeingScore": noteObject.wellbeing_score,
            "tags": tagList,
            "sleepQuality": 0,
            "embedding": (
                [float(x) for x in noteObject.embedding]
                if noteObject.embedding is not None
                else []
            ),
        }
    sleep_data = sleep_data = crud.get_sleep_diagram_data(
        db, user_id, last_x_days=timeframe.last_x_days, newest_first=True
    )
    sleepDiagramData = {}
    for idx, data in enumerate(sleep_data):
        sleepObject: SleepData = data[0]
        weekday = sleepObject.recorded_at
        durationH = (
            sleepObject.sleep_end - sleepObject.sleep_start
        ).total_seconds() / 3600
        sleepDiagramData[idx] = {
            "date": weekday,
            "sleep_start": sleepObject.sleep_start,
            "sleep_end": sleepObject.sleep_end,
            "durationH": durationH,
            "sleep_quality": sleepObject.sleep_quality,
        }
    for i, data in sleepDiagramData.items():
        if i in notesDiagramData:
            notesDiagramData[i]["sleepQuality"] = data["sleep_quality"]
    used_headlines = crud.get_previously_used_headlines(
        db, user_id, timeframe.last_x_days
    )
    return {"notes": notesDiagramData, "headlines": used_headlines}


@router.post("/notes/vector-search/note/")
def get_notes_by_similarity_to_note(
    request: Request, note_query: NoteQuery, db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    note_text_emb = crud.get_note_entry_by_note(db, user_id, note_query.note).embedding
    notes_data = crud.get_note_entries_by_similarity_to_text(
        db, user_id, note_text_emb, 90
    )
    notesDiagramData = {}
    for i, data in enumerate(notes_data):
        noteObject = data[0]
        date_str = noteObject.recorded_at.strftime("%Y-%m-%d")
        tagList = [crud.get_tag_name_from_id(db, tag) for tag in noteObject.tags]
        notesDiagramData[i] = {
            "date": date_str,
            "note": noteObject.note,
            "wellbeingScore": noteObject.wellbeing_score,
            "tags": tagList,
            "sleepQuality": 0,
            "embedding": [float(x) for x in noteObject.embedding],
        }
    return {"notes": notesDiagramData}


@router.get("/notes/vector-search/query/")
def get_allowance_embedding(request: Request, db: Session = Depends(get_db)):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    _, canEmbed = crud.get_daily_allowance_embedding(db, user_id)
    return {"canEmbed": canEmbed}


@router.post("/notes/vector-search/query/")
def get_notes_by_similarity_to_query(
    request: Request, note_query: NoteTextQuery, db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    _, canEmbed = crud.get_daily_allowance_embedding(db, user_id)
    if not canEmbed:
        raise HTTPException(
            status_code=403,
            detail="You have reached the limit of daily embeddings. Please try again tomorrow.",
        )
    crud.reduce_daily_allowance_embedding(db, user_id)
    text_emb = get_embedding_for_query(db, user_id, note_query.text)
    notes_data = crud.get_note_entries_by_similarity_to_text(
        db, user_id, text_emb, 90, 10
    )
    notesDiagramData = {}
    for i, data in enumerate(notes_data):
        noteObject = data[0]
        date_str = noteObject.recorded_at.strftime("%Y-%m-%d")
        tagList = [crud.get_tag_name_from_id(db, tag) for tag in noteObject.tags]
        notesDiagramData[i] = {
            "date": date_str,
            "note": noteObject.note,
            "wellbeingScore": noteObject.wellbeing_score,
            "tags": tagList,
            "sleepQuality": 0,
            "embedding": [float(x) for x in noteObject.embedding],
        }
    return {"notes": notesDiagramData}


@router.get("/notes/vector-search/queries/")
def get_prev_queries(request: Request, db: Session = Depends(get_db)):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    queries = crud.get_all_note_queries(db, user_id)
    res: list[dict] = []
    for query in queries:
        res.append(
            {
                "query": query.query,
                "embedding": [float(emb) for emb in query.query_embedding],
            }
        )
    return {"queries": res}


@router.post("/notes/")
async def post_note_data(
    request: Request, notes_data: NotesData, db: Session = Depends(get_db)
):
    username = request.state.username  # from middleware
    user_id = crud.get_user_by_name(db, username).id
    # crud.increase_streak_user(db, user_id)
    crud.add_to_daily_note(
        db,
        user_id=user_id,
        note=notes_data.note,
    )

    return {"message": "notes"}

@router.post("/nutrition/")
def get_detailed_nutrition_information(
    request: Request, timeframe: Timeframe, db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    nutrition_data = crud.get_list_of_foods_every_day(
        db, user_id, last_x_days=timeframe.last_x_days
    )
    listOfFoodsEveryDay = []
    for data in nutrition_data:
        listOfFoodsEveryDay.append(data.split("\n"))
    based_on_percentage_of_daily_calories = (
        crud.get_percentage_of_macronutrient_per_food_for_every_day(
            db, user_id, timeframe.last_x_days
        )
    )
    based_on_percentage_of_daily_carbs = (
        crud.get_percentage_of_macronutrient_per_food_for_every_day(
            db, user_id, timeframe.last_x_days, macro_nutrient="carbs"
        )
    )
    based_on_percentage_of_daily_fat = (
        crud.get_percentage_of_macronutrient_per_food_for_every_day(
            db, user_id, timeframe.last_x_days, macro_nutrient="fat"
        )
    )
    based_on_percentage_of_daily_protein = (
        crud.get_percentage_of_macronutrient_per_food_for_every_day(
            db, user_id, timeframe.last_x_days, macro_nutrient="protein"
        )
    )
    based_on_percentage_of_daily_sugar = (
        crud.get_percentage_of_macronutrient_per_food_for_every_day(
            db, user_id, timeframe.last_x_days, macro_nutrient="sugar"
        )
    )
    return {
        "listOfFoodsEveryDay": listOfFoodsEveryDay,
        "basedOnPercentageOfDailyCalories": based_on_percentage_of_daily_calories,
        "basedOnPercentageOfDailyCarbs": based_on_percentage_of_daily_carbs,
        "basedOnPercentageOfDailyFat": based_on_percentage_of_daily_fat,
        "basedOnPercentageOfDailyProtein": based_on_percentage_of_daily_protein,
        "basedOnPercentageOfDailySugar": based_on_percentage_of_daily_sugar,
    }
