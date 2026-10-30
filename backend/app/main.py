from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from app.api.auth import router as auth_router
from app.api.inventory import router as inventory_router
from app.api.barcode import router as barcode_router
from app.api.receipt import router as receipt_router
from app.api.recipes import router as recipes_router
from app.api.notifications import router as notifications_router
from app.api.chat import router as chat_router
from app.api.shopping import router as shopping_router
from app.api.dashboard import router as dashboard_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for AI Refrigerator Manager",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_prefix)
app.include_router(inventory_router, prefix=api_prefix)
app.include_router(barcode_router, prefix=api_prefix)
app.include_router(receipt_router, prefix=api_prefix)
app.include_router(recipes_router, prefix=api_prefix)
app.include_router(notifications_router, prefix=api_prefix)
app.include_router(chat_router, prefix=api_prefix)
app.include_router(shopping_router, prefix=api_prefix)
app.include_router(dashboard_router, prefix=api_prefix)


@app.get("/")
def read_root():
    return {
        "status": "online",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
