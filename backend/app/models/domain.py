from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class FoodItem(Base):
    __tablename__ = "food_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    category = Column(String, index=True, nullable=False)
    default_shelf_life_days = Column(Integer, default=7)
    nutrition_id = Column(String, nullable=True)

    inventory_items = relationship("Inventory", back_populates="food_item")


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    food_item_id = Column(Integer, ForeignKey("food_items.id"), nullable=False)
    quantity = Column(Float, default=1.0)
    unit = Column(String, default="pcs")
    purchase_date = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(DateTime, nullable=False)
    source = Column(String, default="manual")

    user = relationship("User")
    food_item = relationship("FoodItem", back_populates="inventory_items")


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    cuisine = Column(String, index=True, default="General")
    cooking_time = Column(Integer, default=30)
    ingredients = Column(JSON, nullable=False)
    instructions = Column(Text, nullable=False)
    dietary_tags = Column(JSON, default=list)


class ShoppingList(Base):
    __tablename__ = "shopping_list"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    product = Column(String, nullable=False)
    quantity = Column(String, default="1 pack")
    status = Column(String, default="pending")

    user = relationship("User")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    message = Column(String, nullable=False)
    type = Column(String, default="expiry")
    status = Column(String, default="unread")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class MealPlan(Base):
    __tablename__ = "meal_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    day = Column(String, nullable=False)
    breakfast_recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=True)
    lunch_recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=True)
    dinner_recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=True)

    user = relationship("User")


class PurchaseHistory(Base):
    __tablename__ = "purchase_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    product = Column(String, nullable=False)
    quantity = Column(Float, default=1.0)
    price = Column(Float, default=0.0)
    purchased_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class Analytics(Base):
    __tablename__ = "analytics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    food_wasted = Column(Float, default=0.0)
    money_saved = Column(Float, default=0.0)
    period = Column(String, default="monthly")

    user = relationship("User")


class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="ChatMessage.created_at")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("chat_conversations.id"), nullable=False, index=True)
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("ChatConversation", back_populates="messages")
