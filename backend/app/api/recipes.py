from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.domain import Recipe, Inventory, FoodItem
from app.schemas.domain import RecipeResponse

router = APIRouter(prefix="/recipes", tags=["Recipes"])


@router.get("", response_model=List[RecipeResponse])
def get_recipe_recommendations(
    based_on: Optional[str] = Query("inventory"),
    cuisine: Optional[str] = Query(None),
    max_time: Optional[int] = Query(None),
    dietary_tag: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Recipe)
    if cuisine:
        query = query.filter(Recipe.cuisine.ilike(f"%{cuisine}%"))
    if max_time:
        query = query.filter(Recipe.cooking_time <= max_time)
    
    recipes = query.all()

    user_inventory_items = (
        db.query(FoodItem.name)
        .join(Inventory)
        .filter(Inventory.user_id == current_user.id)
        .all()
    )
    user_ingredients = {item[0].lower() for item in user_inventory_items}

    results = []
    for r in recipes:
        if dietary_tag and dietary_tag not in (r.dietary_tags or []):
            continue

        recipe_ingredients = r.ingredients or []
        total_count = len(recipe_ingredients)
        matched_count = 0
        missing = []

        for ing in recipe_ingredients:
            ing_name = ing.get("name", "").lower()
            if any(u_ing in ing_name or ing_name in u_ing for u_ing in user_ingredients):
                matched_count += 1
            else:
                missing.append(ing.get("name"))

        match_pct = round((matched_count / total_count * 100.0), 1) if total_count > 0 else 0.0

        results.append(
            RecipeResponse(
                id=r.id,
                name=r.name,
                cuisine=r.cuisine,
                cooking_time=r.cooking_time,
                ingredients=r.ingredients,
                instructions=r.instructions,
                dietary_tags=r.dietary_tags or [],
                match_percentage=match_pct,
                missing_ingredients=missing,
            )
        )

    if based_on == "inventory":
        results.sort(key=lambda x: x.match_percentage, reverse=True)

    return results
