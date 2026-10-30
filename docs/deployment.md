# Deployment Guide

This guide documents how to deploy the AI Refrigerator Manager application to production platforms.

## Production Architecture
- **Frontend:** Deployed to [Vercel](https://vercel.com) as a static React single-page application.
- **Backend:** Deployed to [Render](https://render.com) or [Railway](https://railway.app) as a Docker web service.
- **Database:** Serverless PostgreSQL on [Neon.tech](https://neon.tech).

---

## 1. Database Setup (Neon PostgreSQL)
1. Create a PostgreSQL project on Neon.tech.
2. Copy the Connection String URI:
   `postgres://user:password@ep-sample-12345.neon.tech/refrigerator_db?sslmode=require`

---

## 2. Backend Deployment (Render / Docker)
1. Push your repository to GitHub.
2. Create a new **Web Service** on Render connected to `ai-refrigerator-manager/backend`.
3. Set environment variables:
   - `DATABASE_URL`: Your Neon PostgreSQL URI
   - `JWT_SECRET`: Generate a 64-char random secret
   - `JWT_ALGORITHM`: `HS256`
   - `GEMINI_API_KEY`: Google Gemini API key
   - `LLM_PROVIDER`: `gemini`
4. Run migrations & seed against production DB:
   ```bash
   alembic upgrade head
   python scripts/seed.py
   ```

---

## 3. Frontend Deployment (Vercel)
1. Import your GitHub project on Vercel.
2. Root Directory: `frontend`
3. Environment Variables:
   - `VITE_API_BASE_URL`: `https://your-backend-render-api.onrender.com/api/v1`
4. Click **Deploy**.
