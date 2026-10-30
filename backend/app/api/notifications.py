from typing import List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.domain import Notification, Inventory, FoodItem
from app.schemas.domain import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def run_daily_expiry_check(db: Session, user_id: int):
    """Check near-expiry items (1-2 days) and low stock staples, creating notifications if not created recently."""
    now = datetime.utcnow()
    two_days_later = now + timedelta(days=2)

    expiring_items = (
        db.query(Inventory)
        .join(FoodItem)
        .filter(
            Inventory.user_id == user_id,
            Inventory.expiry_date <= two_days_later,
        )
        .all()
    )

    for inv in expiring_items:
        food_name = inv.food_item.name if inv.food_item else "Item"
        msg = f"Alert: '{food_name}' is expiring soon ({inv.expiry_date.strftime('%Y-%m-%d')}). Use it in your cooking!"
        
        existing = (
            db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.message == msg,
            )
            .first()
        )
        if not existing:
            db.add(
                Notification(
                    user_id=user_id,
                    message=msg,
                    type="expiry",
                    status="unread",
                )
            )
    db.commit()


@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    run_daily_expiry_check(db, current_user.id)

    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(20)
        .all()
    )
    return [NotificationResponse.model_validate(n) for n in notifications]


@router.put("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notif = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user.id)
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.status = "read"
    db.commit()
    db.refresh(notif)
    return NotificationResponse.model_validate(notif)
