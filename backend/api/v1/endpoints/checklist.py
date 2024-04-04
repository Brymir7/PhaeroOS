from tabnanny import check
from db.tables.models import ChecklistItem
from schemas.types import ChecklistItemFromFrontend, ChecklistItems, ChecklistItemId
from fastapi import APIRouter, Request, Depends
from db import crud
from db.database import get_db
from sqlmodel import Session

router = APIRouter()
USER_CHECKLIST_DEFAULT = 5
USER_CHECKLIST_PREMIUM = 10


@router.post("/checklist/add/")
def add_checklist_item(
    request: Request,
    checklist_item: ChecklistItemFromFrontend,
    db: Session = Depends(get_db),
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    checklistitem = crud.create_checklist_item(
        db,
        title=checklist_item.title,
        priority=checklist_item.priority,
        expiration_date=checklist_item.expiration_date,
        repeat_every=checklist_item.repeat_every,
        user_id=user_id,
    )
    return {"item": checklistitem}


@router.post("/checklist/add-subtask/")
def add_checklist_subtask(
    request: Request,
    checklist_item: ChecklistItemFromFrontend,
    db: Session = Depends(get_db),
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    if not checklist_item.parent_id:
        return {"error": "No parent_id provided"}
    checklistitem = crud.create_checklist_subtask(
        db,
        title=checklist_item.title,
        priority=checklist_item.priority,
        expiration_date=checklist_item.expiration_date,
        repeat_every=checklist_item.repeat_every,
        user_id=user_id,
        parent_id=checklist_item.parent_id,
    )
    return {"item": checklistitem}


@router.post("/checklist/delete/")
def delete_checklist_item(
    request: Request, checklist_item: ChecklistItemId, db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    crud.delete_checklist_item(db, checklist_item.checklist_item_id, user_id)
    return {"status": "success"}


def is_id_in_checklist_items(
    checklist_items: list[ChecklistItemFromFrontend], id_: int
) -> bool:
    for item in checklist_items:
        if item.id == id_:
            return True
        if item.subtasks:
            id_in_subtasks = is_id_in_checklist_items(item.subtasks, id_)
            if id_in_subtasks:
                return True
    return False


@router.post("/checklist/update/")
def update_checklist_item(
    request: Request, checklist_items: ChecklistItems, db: Session = Depends(get_db)
):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    currChecklist = crud.get_checklist_user(db, user_id)
    currChecklistItems = set((item.id, item.parent_id) for item in currChecklist)
    newChecklistItems = set(
        (item.id, item.parent_id) for item in checklist_items.checklist_items
    )
    # Iterate over the difference, accessing both id and parent_id
    for item_id, parent_id in currChecklistItems - newChecklistItems:
        if parent_id is None:
            crud.delete_checklist_item(db, item_id, user_id)  # type: ignore
        else:
            if not is_id_in_checklist_items(checklist_items.checklist_items, item_id):  # type: ignore
                crud.delete_checklist_item(db, item_id, user_id)  # type: ignore

    for item in checklist_items.checklist_items:
        crud.save_checklist_item(
            db,
            title=item.title,
            priority=item.priority,
            expiration_date=item.expiration_date,
            checked=item.checked,
            subtasks=item.subtasks,
            user_id=user_id,
            id_=item.id,
            repeat_every=item.repeat_every,
        )
    return {"status": "success"}


def build_item_hierarchy(
    item: ChecklistItem, item_map: dict[int, ChecklistItem], maxdepth: int, depth=0
) -> dict:
    """Recursively build the item hierarchy."""
    if depth >= maxdepth:
        return {}
    item_dict = {
        "id": item.id,
        "title": item.title,
        "priority": item.priority,
        "expiration_date": item.expiration_date,
        "checked": item.checked,
        "repeat_every": item.repeat_every,
        "subtasks": (
            [
                build_item_hierarchy(
                    item_map[subtask_id], item_map, maxdepth, depth + 1
                )
                for subtask_id in item.subtasks
                if subtask_id in item_map
            ]
            if item.subtasks
            else []
        ),
    }
    return item_dict


@router.get("/checklist/")
def get_checklist(request: Request, db: Session = Depends(get_db)):
    username = request.state.username
    user_id = crud.get_user_by_name(db, username).id
    checklist = crud.get_checklist_user(db, user_id)
    item_dict_list = []
    item_map = {item.id: item for item in checklist}
    for item in checklist:
        if item.parent_id is not None:
            continue
        item_dict_list.append(build_item_hierarchy(item, item_map, 10))  # type: ignore
    return {"items": item_dict_list}
