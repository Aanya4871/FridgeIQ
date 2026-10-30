import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.models.domain import FoodItem, Recipe, Inventory, ShoppingList, Notification, Analytics
from app.models.user import User
from app.core.security import get_password_hash
from datetime import datetime, timedelta

FOOD_ITEMS_SEED = [
    {"name": "Whole Milk", "category": "Dairy", "default_shelf_life_days": 7},
    {"name": "Greek Yogurt", "category": "Dairy", "default_shelf_life_days": 14},
    {"name": "Cheddar Cheese", "category": "Dairy", "default_shelf_life_days": 21},
    {"name": "Butter", "category": "Dairy", "default_shelf_life_days": 30},
    {"name": "Eggs", "category": "Dairy", "default_shelf_life_days": 21},
    {"name": "Heavy Cream", "category": "Dairy", "default_shelf_life_days": 10},
    {"name": "Parmesan Cheese", "category": "Dairy", "default_shelf_life_days": 45},
    {"name": "Mozzarella", "category": "Dairy", "default_shelf_life_days": 10},
    
    {"name": "Fresh Spinach", "category": "Produce", "default_shelf_life_days": 5},
    {"name": "Tomatoes", "category": "Produce", "default_shelf_life_days": 7},
    {"name": "Bananas", "category": "Produce", "default_shelf_life_days": 6},
    {"name": "Apples", "category": "Produce", "default_shelf_life_days": 21},
    {"name": "Carrots", "category": "Produce", "default_shelf_life_days": 14},
    {"name": "Broccoli", "category": "Produce", "default_shelf_life_days": 7},
    {"name": "Onions", "category": "Produce", "default_shelf_life_days": 30},
    {"name": "Garlic", "category": "Produce", "default_shelf_life_days": 60},
    {"name": "Bell Peppers", "category": "Produce", "default_shelf_life_days": 10},
    {"name": "Avocados", "category": "Produce", "default_shelf_life_days": 5},
    {"name": "Lemons", "category": "Produce", "default_shelf_life_days": 21},
    {"name": "Potatoes", "category": "Produce", "default_shelf_life_days": 30},
    {"name": "Strawberries", "category": "Produce", "default_shelf_life_days": 4},
    {"name": "Blueberries", "category": "Produce", "default_shelf_life_days": 7},
    {"name": "Cucumbers", "category": "Produce", "default_shelf_life_days": 7},
    {"name": "Lettuce", "category": "Produce", "default_shelf_life_days": 5},

    {"name": "Chicken Breast", "category": "Meat", "default_shelf_life_days": 3},
    {"name": "Ground Beef", "category": "Meat", "default_shelf_life_days": 2},
    {"name": "Salmon Fillet", "category": "Meat", "default_shelf_life_days": 2},
    {"name": "Bacon", "category": "Meat", "default_shelf_life_days": 14},
    {"name": "Pork Chops", "category": "Meat", "default_shelf_life_days": 3},
    {"name": "Shrimp", "category": "Meat", "default_shelf_life_days": 2},
    {"name": "Turkey Breast", "category": "Meat", "default_shelf_life_days": 4},

    {"name": "White Bread", "category": "Bakery", "default_shelf_life_days": 7},
    {"name": "Whole Wheat Bread", "category": "Bakery", "default_shelf_life_days": 7},
    {"name": "Tortillas", "category": "Bakery", "default_shelf_life_days": 21},
    {"name": "Bagels", "category": "Bakery", "default_shelf_life_days": 5},

    {"name": "Basmati Rice", "category": "Pantry", "default_shelf_life_days": 365},
    {"name": "Pasta Spaghetti", "category": "Pantry", "default_shelf_life_days": 365},
    {"name": "Olive Oil", "category": "Pantry", "default_shelf_life_days": 180},
    {"name": "Tomato Sauce", "category": "Pantry", "default_shelf_life_days": 14},
    {"name": "Peanut Butter", "category": "Pantry", "default_shelf_life_days": 180},
    {"name": "Canned Black Beans", "category": "Pantry", "default_shelf_life_days": 365},
    {"name": "Oats", "category": "Pantry", "default_shelf_life_days": 180},
    {"name": "Soy Sauce", "category": "Pantry", "default_shelf_life_days": 365},
    {"name": "Flour", "category": "Pantry", "default_shelf_life_days": 180},
    {"name": "Sugar", "category": "Pantry", "default_shelf_life_days": 365},
    {"name": "Honey", "category": "Pantry", "default_shelf_life_days": 730},
    {"name": "Chicken Broth", "category": "Pantry", "default_shelf_life_days": 14},
]

RECIPES_SEED = [
    {
        "name": "Creamy Spinach & Chicken Pasta",
        "cuisine": "Italian",
        "cooking_time": 25,
        "ingredients": [
            {"name": "Chicken Breast", "quantity": "300g"},
            {"name": "Fresh Spinach", "quantity": "100g"},
            {"name": "Pasta Spaghetti", "quantity": "200g"},
            {"name": "Heavy Cream", "quantity": "100ml"},
            {"name": "Garlic", "quantity": "2 cloves"},
            {"name": "Parmesan Cheese", "quantity": "30g"},
        ],
        "instructions": "1. Cook spaghetti according to package instructions.\n2. Sauté diced chicken breast with garlic in olive oil until golden.\n3. Add spinach and heavy cream; simmer until spinach wilts.\n4. Toss pasta with cream sauce and top with parmesan cheese.",
        "dietary_tags": ["High-Protein"],
    },
    {
        "name": "Classic Tomato Omelette",
        "cuisine": "American",
        "cooking_time": 10,
        "ingredients": [
            {"name": "Eggs", "quantity": "3 pcs"},
            {"name": "Tomatoes", "quantity": "1 pc"},
            {"name": "Cheddar Cheese", "quantity": "50g"},
            {"name": "Butter", "quantity": "10g"},
            {"name": "Onions", "quantity": "0.5 pc"},
        ],
        "instructions": "1. Whisk eggs with salt and pepper.\n2. Melt butter in a pan over medium heat.\n3. Sauté diced onions and tomatoes for 2 mins.\n4. Pour in eggs, sprinkle cheese, and fold once set.",
        "dietary_tags": ["Keto", "Vegetarian", "Quick"],
    },
    {
        "name": "Garlic Butter Salmon & Broccoli",
        "cuisine": "Continental",
        "cooking_time": 20,
        "ingredients": [
            {"name": "Salmon Fillet", "quantity": "2 fillets"},
            {"name": "Broccoli", "quantity": "1 head"},
            {"name": "Butter", "quantity": "20g"},
            {"name": "Garlic", "quantity": "3 cloves"},
            {"name": "Lemons", "quantity": "1 pc"},
        ],
        "instructions": "1. Season salmon with salt, pepper, and lemon juice.\n2. Steam broccoli for 5 minutes.\n3. Pan-sear salmon in garlic butter for 4 minutes each side until flaky.\n4. Serve salmon with steamed broccoli drizzled with pan sauce.",
        "dietary_tags": ["Keto", "Gluten-Free", "High-Protein"],
    },
    {
        "name": "Chicken Fried Rice",
        "cuisine": "Asian",
        "cooking_time": 15,
        "ingredients": [
            {"name": "Chicken Breast", "quantity": "200g"},
            {"name": "Basmati Rice", "quantity": "2 cups cooked"},
            {"name": "Eggs", "quantity": "2 pcs"},
            {"name": "Carrots", "quantity": "1 pc"},
            {"name": "Soy Sauce", "quantity": "2 tbsp"},
            {"name": "Onions", "quantity": "1 pc"},
        ],
        "instructions": "1. Stir fry chicken and diced carrots in a wok.\n2. Push to side, scramble eggs.\n3. Add cooked rice and soy sauce, stir fry on high heat for 3 mins.",
        "dietary_tags": ["Quick", "High-Protein"],
    },
    {
        "name": "Avocado & Egg Toast",
        "cuisine": "Breakfast",
        "cooking_time": 8,
        "ingredients": [
            {"name": "Avocados", "quantity": "1 pc"},
            {"name": "Eggs", "quantity": "2 pcs"},
            {"name": "Whole Wheat Bread", "quantity": "2 slices"},
            {"name": "Lemons", "quantity": "0.5 pc"},
        ],
        "instructions": "1. Toast bread slices.\n2. Mash avocado with lemon juice, salt, and pepper.\n3. Fry or poach eggs.\n4. Spread avocado on toast and top with eggs.",
        "dietary_tags": ["Vegetarian", "Quick"],
    },
    {
        "name": "Loaded Beef Tacos",
        "cuisine": "Mexican",
        "cooking_time": 20,
        "ingredients": [
            {"name": "Ground Beef", "quantity": "300g"},
            {"name": "Tortillas", "quantity": "4 pcs"},
            {"name": "Tomatoes", "quantity": "1 pc"},
            {"name": "Cheddar Cheese", "quantity": "50g"},
            {"name": "Lettuce", "quantity": "50g"},
        ],
        "instructions": "1. Brown ground beef with taco seasonings in a skillet.\n2. Warm tortillas.\n3. Fill tortillas with beef, chopped tomatoes, shredded lettuce, and cheddar.",
        "dietary_tags": ["High-Protein"],
    },
    {
        "name": "Greek Yogurt Berry Bowl",
        "cuisine": "Breakfast",
        "cooking_time": 5,
        "ingredients": [
            {"name": "Greek Yogurt", "quantity": "200g"},
            {"name": "Strawberries", "quantity": "50g"},
            {"name": "Blueberries", "quantity": "50g"},
            {"name": "Honey", "quantity": "1 tbsp"},
            {"name": "Oats", "quantity": "30g"},
        ],
        "instructions": "1. Scoop Greek yogurt into a bowl.\n2. Top with fresh berries and oats.\n3. Drizzle with honey.",
        "dietary_tags": ["Vegetarian", "Quick", "Low-Fat"],
    },
]


def seed_db():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        print("Seeding Food Items...")
        food_map = {}
        for item in FOOD_ITEMS_SEED:
            existing = db.query(FoodItem).filter(FoodItem.name == item["name"]).first()
            if not existing:
                food_item = FoodItem(**item)
                db.add(food_item)
                db.commit()
                db.refresh(food_item)
                food_map[food_item.name] = food_item
            else:
                food_map[existing.name] = existing

        print("Seeding Recipes...")
        for recipe in RECIPES_SEED:
            existing = db.query(Recipe).filter(Recipe.name == recipe["name"]).first()
            if not existing:
                db.add(Recipe(**recipe))
        db.commit()

        demo_user = db.query(User).filter(User.email == "demo@example.com").first()
        if not demo_user:
            print("Creating Demo User (demo@example.com / demo1234)...")
            demo_user = User(
                name="Demo Manager",
                email="demo@example.com",
                password_hash=get_password_hash("demo1234"),
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)

            print("Seeding Demo User Inventory...")
            now = datetime.utcnow()
            demo_inventory = [
                ("Whole Milk", 1.0, "L", now - timedelta(days=2), now + timedelta(days=5)),
                ("Eggs", 12.0, "pcs", now - timedelta(days=5), now + timedelta(days=16)),
                ("Fresh Spinach", 1.0, "pack", now - timedelta(days=4), now + timedelta(days=1)),
                ("Chicken Breast", 500.0, "g", now - timedelta(days=1), now + timedelta(days=2)),
                ("Tomatoes", 4.0, "pcs", now - timedelta(days=3), now + timedelta(days=4)),
                ("Greek Yogurt", 1.0, "tub", now - timedelta(days=1), now + timedelta(days=13)),
                ("Cheddar Cheese", 200.0, "g", now - timedelta(days=7), now + timedelta(days=14)),
                ("Pasta Spaghetti", 1.0, "pack", now - timedelta(days=10), now + timedelta(days=350)),
                ("Avocados", 2.0, "pcs", now - timedelta(days=4), now + timedelta(days=1)),
            ]
            for name, qty, unit, p_date, e_date in demo_inventory:
                f_item = food_map.get(name)
                if f_item:
                    inv = Inventory(
                        user_id=demo_user.id,
                        food_item_id=f_item.id,
                        quantity=qty,
                        unit=unit,
                        purchase_date=p_date,
                        expiry_date=e_date,
                        source="seed",
                    )
                    db.add(inv)

            db.add(
                Notification(
                    user_id=demo_user.id,
                    message="Fresh Spinach expires tomorrow! Consider cooking Creamy Spinach & Chicken Pasta.",
                    type="expiry",
                )
            )

            db.add(
                Analytics(
                    user_id=demo_user.id,
                    food_wasted=0.5,
                    money_saved=42.50,
                    period="monthly",
                )
            )
            db.commit()

        print("Database Seeding Completed Successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_db()
