from datetime import datetime, date
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.domain import Inventory, FoodItem, Recipe, ShoppingList


class ChatContextService:
    @staticmethod
    def build_user_context(db: Session, user_id: int, max_items: int = 50) -> Dict[str, Any]:
        """
        Builds a compact, trusted context dictionary for the authenticated user's inventory,
        expiring items, recipe matches, and shopping list.
        Never includes sensitive fields (passwords, tokens, emails).
        Strictly scopes all queries to user_id.
        """
        now = datetime.utcnow()
        today = now.date()

        inventory_records = (
            db.query(Inventory, FoodItem)
            .join(FoodItem, Inventory.food_item_id == FoodItem.id)
            .filter(Inventory.user_id == user_id)
            .limit(max_items)
            .all()
        )

        inventory_items: List[Dict[str, Any]] = []
        expiring_soon: List[Dict[str, Any]] = []
        expired_items: List[Dict[str, Any]] = []
        user_ingredient_names: set = set()

        for inv, food in inventory_records:
            expiry_dt = inv.expiry_date if inv.expiry_date else now
            days_left = (expiry_dt.date() - today).days
            item_name = food.name if food else "Unknown Item"
            user_ingredient_names.add(item_name.lower())

            item_data = {
                "name": item_name,
                "category": food.category if food else "General",
                "quantity": inv.quantity,
                "unit": inv.unit,
                "days_until_expiry": days_left,
                "expiry_date": expiry_dt.strftime("%Y-%m-%d"),
            }
            inventory_items.append(item_data)

            if days_left < 0:
                expired_items.append({"name": item_name, "days_expired": abs(days_left)})
            elif days_left <= 2:
                expiring_soon.append({"name": item_name, "days_remaining": days_left})

        recipes = db.query(Recipe).all()
        recipe_candidates: List[Dict[str, Any]] = []

        for r in recipes:
            r_ingredients = r.ingredients or []
            total_ing = len(r_ingredients)
            matched_count = 0
            missing: List[str] = []

            for ing in r_ingredients:
                ing_name = ing.get("name", "").lower()
                if any(u in ing_name or ing_name in u for u in user_ingredient_names):
                    matched_count += 1
                else:
                    missing.append(ing.get("name", ""))

            match_pct = round((matched_count / total_ing * 100.0), 1) if total_ing > 0 else 0.0

            recipe_candidates.append({
                "id": r.id,
                "name": r.name,
                "cuisine": r.cuisine,
                "cooking_time_minutes": r.cooking_time,
                "match_percentage": match_pct,
                "missing_ingredients": missing,
                "instructions_summary": (r.instructions[:150] + "...") if r.instructions and len(r.instructions) > 150 else r.instructions,
            })

        recipe_candidates.sort(key=lambda x: x["match_percentage"], reverse=True)
        top_recipe_candidates = recipe_candidates[:5]

        shopping_records = (
            db.query(ShoppingList)
            .filter(ShoppingList.user_id == user_id, ShoppingList.status == "pending")
            .limit(20)
            .all()
        )
        shopping_items = [f"{s.product} ({s.quantity})" for s in shopping_records]

        return {
            "current_date": today.strftime("%Y-%m-%d"),
            "total_inventory_items": len(inventory_items),
            "inventory": inventory_items,
            "expiring_soon": expiring_soon,
            "expired_items": expired_items,
            "recipe_candidates": top_recipe_candidates,
            "shopping_list": shopping_items,
        }


chat_context_service = ChatContextService()

