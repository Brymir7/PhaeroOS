from networkx import rescale_layout
from db import foodDB
from fastapi import APIRouter, Depends, Request, HTTPException
from db.foodDB import (
    crud_create_custom_food,
    crud_search_for_food_name,
    crud_get_food_description_by_name,
    crud_get_recommended_stats_default,
    crud_update_existing_food_description,
    crud_delete_food_description,
    crud_get_custom_foods_names,
)  # , get_food_stats_from_description
from schemas.types import Food, FoodName
from .utils import remove_duplicates_str_list, scale_key_value_by_x, calculate_bmr
from db.database import get_db
from db import crud
from sqlmodel import Session
from datetime import datetime
import phaeroAI.foodAI as foodAI

router = APIRouter()


@router.post("/food/delete/")
def delete_food_from_db(
    request: Request, food: FoodName, db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    crud_delete_food_description(food.name, user_id)
    return {"status": "success"}


@router.post("/food/search/")
def search_food(
    request: Request, food_name_json: FoodName, db: Session = Depends(get_db)
):
    username = request.state.username  # from middleware
    user_id = crud.get_user_by_name(db, username).id
    userSettings = crud.get_settings(db, user_id)
    if not userSettings:
        raise HTTPException(
            status_code=500, detail="Could not get user settings from database"
        )
    language = userSettings.language
    userResult, otherUserResults, mainDbResult, foundationFoods, srFoods = (
        crud_search_for_food_name(
            food_name=food_name_json.name,
            user_id=user_id,
            userSettings={
                "language": language,
            },
        )
    )
    mainDBResult = remove_duplicates_str_list(mainDbResult)
    mainDBResult = sorted(mainDBResult, key=lambda x: len(x))
    return (
        userResult,
        remove_duplicates_str_list(foundationFoods + srFoods + mainDbResult),
        otherUserResults,
    )


@router.post("/food/search/stats/")
def get_food_stats(
    request: Request, food_name_json: FoodName, db: Session = Depends(get_db)
):
    normalizedName = food_name_json.name.strip().upper()
    username = request.state.username  # from middleware
    user_id = crud.get_user_by_name(db, username).id
    queryResult = crud_get_food_description_by_name(normalizedName, user_id=user_id)
    foodPortionDictUser = foodDB.crud_get_custom_foods_name_to_portion_size_dict(
        user_id
    )
    res = {"Nutrition": {normalizedName: {"Macros": {}, "Micros": {}}}}
    portionSize = 100
    if normalizedName.lower() in foodPortionDictUser:
        portionSize = foodPortionDictUser[normalizedName.lower()]
    macros = foodAI.FoodAI.convert_food_stats_to_macros(
        queryResult,
        relativeFoodAmountTo100Grams=1.0,  # NOTE nutrient values per 100g are shown, but we stil lneed amount
    )  # default is 100g
    micros = foodAI.FoodAI.convert_food_stats_to_micros(queryResult)
    res["Nutrition"][normalizedName]["Macros"] = macros
    res["Nutrition"][normalizedName]["Micros"] = micros
    res["Nutrition"][normalizedName]["Macros"]["amount"] = [portionSize, "G"]
    return res


@router.get("/food/recommendations/")
def get_food_recommendations(request: Request, db: Session = Depends(get_db)):
    username = request.state.username  # from middleware
    user_id = crud.get_user_by_name(
        db, username
    ).id  # use thsi to customize later < maybe let it get modified by AI after feedback?
    recommended_stats_default = crud_get_recommended_stats_default()
    if not recommended_stats_default:
        raise HTTPException(
            status_code=500,
            detail="Could not get recommended stats from database",
        )
    additional_user_data = crud.get_additional_user_data(db, user_id)
    if not additional_user_data:
        return recommended_stats_default

    gender = additional_user_data["gender"]
    birthday = additional_user_data["birthday"]
    height = additional_user_data["height"]
    weight = additional_user_data["weight"]

    def calculate_age(birthday) -> int:
        current_date = datetime.now().date()
        age = current_date.year - birthday.year
        if current_date.month < birthday.month or (
            current_date.month == birthday.month and current_date.day < birthday.day
        ):
            age -= 1
        return age

    age = calculate_age(birthday=birthday)
    user_specific_bmr = calculate_bmr(
        gender=gender, age=age, height=height, weight=weight
    )

    ratio_between_user_bmr_and_default_bmr = (
        user_specific_bmr / recommended_stats_default["calories"][0]
    )

    recommended_stats_user = scale_key_value_by_x(
        x=ratio_between_user_bmr_and_default_bmr,
        dict=recommended_stats_default,
    )
    return recommended_stats_user


@router.get("/food/custom_foods/")
def get_custom_foods(request: Request, db: Session = Depends(get_db)):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    custom_foods = crud_get_custom_foods_names(user_id)
    return custom_foods


@router.post("/food/custom_foods/")
def update_custom_food(request: Request, food: Food, db: Session = Depends(get_db)):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    macros_dict = {
        "Protein": float(food.protein),
        "Total lipid (fat)": float(food.fat),
        "Carbohydrate, by difference": float(food.carbs),
        "Sugars, total including NLEA": float(food.sugar),
        "Energy": float(food.calories),
    }
    crud_update_existing_food_description(
        food.name,
        macros_dict,
        portion_size=int(food.portion_size),
        user_id=user_id,
    )
    return {"status": "success"}


@router.post("/food/custom_foods/create/")
def create_custom_food(request: Request, food: Food, db: Session = Depends(get_db)):

    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    macros_dict = {
        "Protein": float(food.protein),
        "Total lipid (fat)": float(food.fat),
        "Carbohydrate, by difference": float(food.carbs),
        "Sugars, total including NLEA": float(food.sugar),
        "Energy": float(food.calories),
    }
    crud_create_custom_food(
        user_id=user_id,
        food_description=food.name,
        macros=macros_dict,
        portion_size=int(food.portion_size),
    )
    return {"status": "success"}
