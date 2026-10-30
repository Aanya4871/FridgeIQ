import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.domain import BarcodeScanRequest, BarcodeScanResponse

router = APIRouter(prefix="/scan-barcode", tags=["Barcode"])

MOCK_BARCODES = {
    "0041331024523": {
        "product_name": "Organic Whole Milk",
        "category": "Dairy",
        "suggested_shelf_life_days": 7,
        "brand": "Horizon Organic",
    },
    "0708470000020": {
        "product_name": "Greek Yogurt Vanilla",
        "category": "Dairy",
        "suggested_shelf_life_days": 14,
        "brand": "Chobani",
    },
    "0011110086208": {
        "product_name": "Spinach Salad Greens",
        "category": "Produce",
        "suggested_shelf_life_days": 5,
        "brand": "Fresh Express",
    },
}


@router.post("", response_model=BarcodeScanResponse)
def scan_barcode(
    data: BarcodeScanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    barcode = data.barcode.strip()
    
    if barcode in MOCK_BARCODES:
        info = MOCK_BARCODES[barcode]
        return BarcodeScanResponse(
            found=True,
            barcode=barcode,
            product_name=info["product_name"],
            category=info["category"],
            suggested_shelf_life_days=info["suggested_shelf_life_days"],
            brand=info.get("brand"),
        )

    try:
        url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            res_data = res.json()
            if res_data.get("status") == 1:
                product = res_data.get("product", {})
                p_name = product.get("product_name") or product.get("generic_name") or "Scanned Product"
                brand = product.get("brands") or ""
                categories = product.get("categories_hierarchy", [])
                
                category = "Pantry"
                if any("dairy" in c for c in categories):
                    category = "Dairy"
                elif any("fruit" in c or "vegetable" in c for c in categories):
                    category = "Produce"
                elif any("meat" in c or "poultry" in c for c in categories):
                    category = "Meat"
                elif any("beverage" in c or "drink" in c for c in categories):
                    category = "Beverages"

                shelf_life_map = {"Dairy": 10, "Produce": 7, "Meat": 4, "Beverages": 14, "Pantry": 180}
                shelf_life = shelf_life_map.get(category, 14)

                return BarcodeScanResponse(
                    found=True,
                    barcode=barcode,
                    product_name=f"{brand} {p_name}".strip(),
                    category=category,
                    suggested_shelf_life_days=shelf_life,
                    brand=brand,
                    image_url=product.get("image_front_url"),
                )
    except Exception as e:
        print(f"Open Food Facts API error: {e}")

    return BarcodeScanResponse(
        found=False,
        barcode=barcode,
        product_name=f"Unknown Item ({barcode[-4:]})",
        category="General",
        suggested_shelf_life_days=7,
    )
