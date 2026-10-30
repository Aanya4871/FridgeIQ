from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, field_validator


class FoodItemBase(BaseModel):
    name: str
    category: str
    default_shelf_life_days: int = 7
    nutrition_id: Optional[str] = None


class FoodItemResponse(FoodItemBase):
    id: int

    class Config:
        from_attributes = True


class InventoryCreate(BaseModel):
    food_item_id: Optional[int] = None
    food_name: Optional[str] = None
    category: Optional[str] = "General"
    quantity: float = 1.0
    unit: str = "pcs"
    purchase_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    source: str = "manual"


class InventoryUpdate(BaseModel):
    quantity: Optional[float] = None
    unit: Optional[str] = None
    expiry_date: Optional[datetime] = None


class InventoryResponse(BaseModel):
    id: int
    user_id: int
    food_item_id: int
    food_name: str
    category: str
    quantity: float
    unit: str
    purchase_date: datetime
    expiry_date: datetime
    source: str
    days_to_expiry: int
    expiry_status: str

    class Config:
        from_attributes = True


class BarcodeScanRequest(BaseModel):
    barcode: str


class BarcodeScanResponse(BaseModel):
    found: bool
    barcode: str
    product_name: str
    category: str
    suggested_shelf_life_days: int
    brand: Optional[str] = None
    image_url: Optional[str] = None


class ReceiptLineItem(BaseModel):
    raw_text: str
    matched_food_name: str
    matched_food_id: Optional[int] = None
    category: str
    quantity: float
    unit: str
    price: float
    confidence: float


class ReceiptScanResponse(BaseModel):
    success: bool
    items: List[ReceiptLineItem]


class RecipeResponse(BaseModel):
    id: int
    name: str
    cuisine: str
    cooking_time: int
    ingredients: List[dict]
    instructions: str
    dietary_tags: List[str]
    match_percentage: float = 0.0
    missing_ingredients: List[str] = Field(default_factory=list)

    class Config:
        from_attributes = True


class ShoppingItemCreate(BaseModel):
    product: str
    quantity: str = "1 pack"


class ShoppingItemResponse(BaseModel):
    id: int
    user_id: int
    product: str
    quantity: str
    status: str

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: int
    message: str
    type: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    message: str = Field(..., max_length=2000, description="User question or prompt")
    conversation_id: Optional[int] = None
    history: Optional[List[dict]] = None

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Message cannot be empty or whitespace only")
        return stripped


class ChatResponse(BaseModel):
    reply: str
    conversation_id: Optional[int] = None
    suggested_actions: Optional[List[str]] = None


class DashboardResponse(BaseModel):
    total_inventory_items: int
    expiring_soon_count: int
    expired_count: int
    food_wasted_kg: float
    money_saved_dollars: float
    top_categories: List[dict]
    recent_activity: List[dict]
