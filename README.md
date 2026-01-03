# SkyFly Flight Booking System

Refactored full-stack application with separate backend and frontend for independent deployment.

## 🌐 Live Demo

- **Frontend (UI)**: [https://flysmart-dynamic-flight-booking.vercel.app](https://flysmart-dynamic-flight-booking.vercel.app)
- **Backend (API)**: [https://flysmart-dynamic-flight-booking.onrender.com/docs](https://flysmart-dynamic-flight-booking.onrender.com/docs)


## 📂 Project Structure

- **`backend/`**: FastAPI-based backend application.
- **`frontend/`**: Next.js-based frontend application (formerly `flysmart-ui`).

## 🚀 Deployment Instructions

### Backend (Render)

1. **New Web Service**: Connect your GitHub repo to Render.
2. **Settings**:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. **Environment Variables**:
   - Add any required env vars (e.g., database configs).

### Frontend (Vercel)

1. **New Project**: Connect your GitHub repo to Vercel.
2. **Settings**:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js (Auto-detected).
3. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: The URL of your deployed backend (e.g., `https://flysmart-backend.onrender.com`).

## 🛠 Local Development

### Backend
```bash
cd backend
# Activate venv if needed
pip install -r requirements.txt
uvicorn main:app --reload
```
Server runs at `http://127.0.0.1:8000`.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
App runs at `http://localhost:3000`.

## 🔄 API Configuration
The frontend uses `NEXT_PUBLIC_API_URL` to connect to the backend.
- **Local**: Defaults to `http://127.0.0.1:8000` (set in `.env.local`).
- **Production**: Set this in Vercel project settings.
