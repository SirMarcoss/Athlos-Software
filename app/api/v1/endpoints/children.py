from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.models.user import User
from app.api.deps import get_current_user
from app.core.database import get_db
from app.schemas.child import ChildCreate, ChildResponse
from app.services.child_service import ChildService
from app.services.parent_service import ParentService

router = APIRouter()


@router.post("/", response_model=ChildResponse, status_code=status.HTTP_201_CREATED)
async def add_child(
        payload: ChildCreate,
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):

    parent_service = ParentService(db)
    child_service = ChildService(db)

    # 1. Chiediamo al ParentService di darci il genitore
    parent = await parent_service.get_parent_by_user_id(current_user.id)
    if not parent:
        raise HTTPException(status_code=400, detail="Devi prima creare il tuo profilo genitore")

    # 2. Se esiste, passiamo il SUO id al ChildService
    child = await child_service.create_child(payload, parent.id)
    return child


@router.get("/", response_model=List[ChildResponse])
async def list_my_children(
        db: AsyncSession = Depends(get_db),
        current_user: User = Depends(get_current_user)
):

    parent_service = ParentService(db)
    child_service = ChildService(db)
    parent = await parent_service.get_parent_by_user_id(current_user.id)
    if not parent:
        raise HTTPException(
            status_code=400,
            detail="Devi prima creare il tuo profilo genitore")

    child = await child_service.get_children_by_parent(parent.id)
    return child

