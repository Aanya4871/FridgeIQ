# AI Refrigerator Manager

An intelligent full-stack web application for tracking refrigerator inventory, reducing food waste, auto-scanning items via barcode & receipt OCR, providing recipe recommendations based on available ingredients, sending expiry notifications, and featuring a RAG-grounded AI cooking assistant.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, React Router, Axios, Lucide Icons
- **Backend:** Python 3.11, FastAPI, SQLAlchemy, Alembic, Pydantic, pytest
- **Database:** PostgreSQL (local Docker / Neon DB in production)
- **OCR & Barcode:** EasyOCR / Tesseract, `pyzbar`, Open Food Facts API
- **ML & Recommendation:** Scikit-learn cosine similarity matching
- **AI Assistant:** Gemini API / OpenAI API with RAG context injection
- **Containerization:** Docker & docker-compose

## Repository Structure

```
ai-refrigerator-manager/
├── frontend/                # React + TypeScript + Vite UI
├── backend/                 # FastAPI Python backend
│   ├── app/
│   │   ├── api/             # REST endpoints
│   │   ├── core/            # Config & Auth settings
│   │   ├── models/          # SQLAlchemy database models
│   │   ├── schemas/         # Pydantic validation schemas
│   │   ├── services/        # Core business logic
│   │   ├── ocr/             # Receipt OCR parser
│   │   ├── barcode/         # Barcode lookup service
│   │   ├── recommendation/  # Scikit-learn recipe match engine
│   │   └── chatbot/         # Gemini/OpenAI RAG AI handler
│   ├── tests/               # Pytest suite
│   ├── scripts/             # DB seeding scripts
│   └── requirements.txt
├── docker/                  # Production Docker deployment files
├── docs/                    # Architecture decisions & guides
├── docker-compose.yml       # Local PostgreSQL database setup
├── .env.example
└── README.md
```

## Quick Start (Local Development)

### 1. Database Setup
```bash
docker-compose up -d
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Backend API interactive documentation will be accessible at: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend development server will be accessible at: `http://localhost:5173`

## Features

1. **User Authentication:** Secure JWT register & login.
2. **Smart Inventory CRUD:** Tracks items with automatic expiry calculations based on shelf life.
3. **Barcode Scanning:** Instantly fetch product details via Open Food Facts.
4. **Receipt OCR:** Scan grocery receipts and bulk import items with editable review.
5. **Recipe Recommendation:** Smart matching engine ranking recipes based on fridge ingredients.
6. **Expiry Alerts:** Daily background notifications for expiring food.
7. **AI Cooking Assistant:** Chatbot with real-time knowledge of your fridge inventory.
8. **Dashboard & Analytics:** Track food waste reduction and money saved over time.
