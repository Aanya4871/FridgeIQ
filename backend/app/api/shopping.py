from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.domain import ShoppingList, PurchaseHistory
from app.schemas.domain import ShoppingItemCreate, ShoppingItemResponse

router = APIRouter(prefix="/shopping-list", tags=["Shopping List"])


@router.get("", response_model=List[ShoppingItemResponse])
def get_shopping_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    items = (
        db.query(ShoppingList)
        .filter(ShoppingList.user_id == current_user.id)
        .order_by(ShoppingList.id.desc())
        .all()
    )
    return [ShoppingItemResponse.model_validate(i) for i in items]


@router.post("", response_model=ShoppingItemResponse, status_code=status.HTTP_201_CREATED)
def add_shopping_item(
    item_in: ShoppingItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = ShoppingList(
        user_id=current_user.id,
        product=item_in.product.strip(),
        quantity=item_in.quantity,
        status="pending",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return ShoppingItemResponse.model_validate(item)


@router.put("/{item_id}/purchased", response_model=ShoppingItemResponse)
def mark_item_purchased(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(ShoppingList)
        .filter(ShoppingList.id == item_id, ShoppingList.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Shopping item not found")

    item.status = "purchased"
    
    history = PurchaseHistory(
        user_id=current_user.id,
        product=item.product,
        quantity=1.0,
        price=3.99,
    )
    db.add(history)
    db.commit()
    db.refresh(item)

    return ShoppingItemResponse.model_validate(item)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shopping_item(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = (
        db.query(ShoppingList)
        .filter(ShoppingList.id == item_id, ShoppingList.user_id == current_user.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Shopping item not found")

    db.delete(item)
    db.commit()
    return None
