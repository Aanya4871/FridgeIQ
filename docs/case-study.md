# Case Study: AI Refrigerator Manager

## Executive Summary
Food waste accounts for substantial monetary loss and carbon footprint globally. The **AI Refrigerator Manager** tackles household food waste by combining deterministic shelf-life tracking, barcode scanning, receipt OCR, dynamic ingredient-overlap recipe recommendations, automated near-expiry notifications, and a grounded AI cooking assistant.

---

## Technical Design & Architecture Tradeoffs

### 1. Optical Input vs. Raw Fridge Computer Vision
- **Problem:** Many smart fridge concepts attempt to use internal cameras to recognize visual food items.
- **Tradeoff:** In real-world refrigerators, stacked containers, opaque packaging, and occluded shelves produce low computer-vision accuracy (<40%).
- **Solution:** We adopted deterministic, high-accuracy input vectors:
  - **Barcode Scanning:** Querying Open Food Facts API provides verified product metadata.
  - **Receipt OCR:** Parsing grocery receipts with regex line-item heuristics and rapidfuzz string matching.
  - **Human-in-the-Loop Review:** Receipt OCR results present an interactive review table before committing to the database, ensuring zero garbage entries.

### 2. Grounded RAG AI Assistant
- **Problem:** Standard LLMs tend to generate recipes with hallucinated ingredients not currently available in the user's kitchen.
- **Solution:** The `/api/v1/chat` endpoint constructs an active Retrieval-Augmented Generation (RAG) context payload containing the exact inventory items, quantities, and expiring items before querying Gemini / OpenAI.

### 3. Expiry Status Color Rules
- **Fresh (>7 days):** Green badge.
- **Near Expiry (2–7 days):** Yellow warning badge.
- **Critical Expiry (<2 days):** Red flashing alert badge.
- **Expired (<0 days):** Dark red badge.
