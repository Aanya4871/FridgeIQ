# Architectural Decision Log

## Decision 1: Input Methods vs. Computer Vision
- **Decision:** Use manual input, barcode lookup (Open Food Facts), and receipt OCR (EasyOCR / Tesseract) instead of raw computer vision photo recognition inside the fridge.
- **Rationale:** Camera vision inside complex refrigerators has high inaccuracy rates due to occlusion, lighting, and hidden containers. Receipt OCR and barcode scanning provide deterministic, high-accuracy item data.

## Decision 2: Receipt OCR Review-by-Design
- **Decision:** Receipt OCR provides an interactive review table for users before bulk-adding to inventory.
- **Rationale:** Store receipts vary widely in abbreviation styles, font formatting, and store branding. Presenting parsed line-items with confidence scores for human verification prevents garbage data entry into the inventory database.

## Decision 3: Expiry Estimation Logic
- **Decision:** Hybrid rule-based default shelf life per category (e.g., Dairy: 7 days, Fresh Produce: 5 days) + user-overridable exact dates.
- **Rationale:** Deterministic expiry rules offer immediate utility without relying on uncalibrated ML models.

## Decision 4: AI Assistant Context Injection (RAG)
- **Decision:** Dynamically inject current user active inventory state and top recipe matches directly into LLM prompts (Gemini / OpenAI).
- **Rationale:** Ensures AI responses are directly grounded in what the user actually has available, avoiding hallucinated ingredients.
