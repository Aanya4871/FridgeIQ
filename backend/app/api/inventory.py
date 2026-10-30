from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.domain import Inventory, FoodItem
from app.schemas.domain import InventoryCreate, InventoryUpdate, InventoryResponse, FoodItemResponse

router = APIRouter(prefix="/inventory", tags=["Inventory"])


def helper_build_inventory_response(inv: Inventory) -> InventoryResponse:
    now = datetime.utcnow()
    days = (inv.expiry_date - now).days
    if days < 0:
        status_str = "expired"
    elif days <= 2:
        status_str = "critical"
    elif days <= 7:
        status_str = "warning"
    else:
        status_str = "fresh"

    return InventoryResponse(
        id=inv.id,
        user_id=inv.user_id,
        food_item_id=inv.food_item_id,
        food_name=inv.food_item.name if inv.food_item else "Unknown Item",
        category=inv.food_item.category if inv.food_item else "General",
        quantity=inv.quantity,
        unit=inv.unit,
        purchase_date=inv.purchase_date,
        expiry_date=inv.expiry_date,
        source=inv.source,
        days_to_expiry=days,
        expiry_status=status_str,
    )


@router.get("", response_model=List[InventoryResponse])
def get_inventory(
    category: Optional[str] = Query(None),
    expiry_status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Inventory).filter(Inventory.user_id == current_user.id)
    if category:
        query = query.join(FoodItem).filter(FoodItem.category.ilike(f"%{category}%"))

    items = query.all()
    results = [helper_build_inventory_response(inv) for inv in items]

    if expiry_status:
        results = [r for r in results if r.expiry_status == expiry_status]

    results.sort(key=lambda x: x.days_to_expiry)
    return results


@router.post("", response_model=InventoryResponse, status_code=status.HTTP_201_CREATED)
def add_inventory_item(
    item_in: InventoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    food_item = None
    if item_in.food_item_id:
        food_item = db.query(FoodItem).filter(FoodItem.id == item_in.food_item_id).first()
    
    if not food_item and item_in.food_name:
        food_item = db.query(FoodItem).filter(FoodItem.name.ilike(item_in.food_name.strip())).first()
        if not food_item:
            food_item = FoodItem(
                name=item_in.food_name.strip(),
                category=item_in.category or "General",
                default_shelf_life_days=7,
            )
            db.add(food_item)
            db.commit()
            db.refresh(food_item)

    if not food_item:
        raise HTTPException(status_code=400, detail="Must provide valid food_item_id or food_name")

    purchase_d = item_in.purchase_date or datetime.utcnow()
    if item_in.expiry_date:
        expiry_d = item_in.expiry_date
    else:
        expiry_d = purchase_d + timedelta(days=food_item.default_shelf_life_days)

    inventory = Inventory(
        user_id=current_user.id,
        food_item_id=food_item.id,
        quantity=item_in.quantity,
        unit=item_in.unit,
        purchase_date=purchase_d,
        expiry_date=expiry_d,
        source=item_in.source,
    )
    db.add(inventory)
    db.commit()
    db.refresh(inventory)

    return helper_build_inventory_response(inventory)


@router.put("/{inventory_id}", response_model=InventoryResponse)
def update_inventory_item(
    inventory_id: int,
    item_in: InventoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    inv = db.query(Inventory).filter(Inventory.id == inventory_id, Inventory.user_id == current_user.id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory item not found or access denied")

    if item_in.quantity is not None:
        inv.quantity = item_in.quantity
    if item_in.unit is not None:
        inv.unit = item_in.unit
    if item_in.expiry_date is not None:
        inv.expiry_date = item_in.expiry_date

    db.commit()
    db.refresh(inv)
    return helper_build_inventory_response(inv)


@router.delete("/{inventory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(
    inventory_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    inv = db.query(Inventory).filter(Inventory.id == inventory_id, Inventory.user_id == current_user.id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory item not found or access denied")

    db.delete(inv)
    db.commit()
    return None


@router.get("/food-items", response_model=List[FoodItemResponse])
def get_food_items_catalog(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(FoodItem)
    if search:
        query = query.filter(FoodItem.name.ilike(f"%{search}%"))
    return query.limit(50).all()
