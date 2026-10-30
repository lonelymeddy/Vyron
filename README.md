# VYRON AI — CREATE BEYOND REALITY

VYRON AI is an AI-powered cinematic 3D video and virtual-world creation platform. It allows creators to upload character reference photos, reference videos, or text prompts to generate realistic 3D videos featuring custom characters in PUBG-inspired virtual environments.

---

## 1. Product Identity & Core Features

- **Product Name:** VYRON AI
- **Tagline:** CREATE BEYOND REALITY
- **Product Category:** AI-powered cinematic 3D video & virtual-world creation platform.

### Core Generation Capabilities
1. **Mode 1 — Character Replacement:** Replace original video characters with custom uploaded character references while keeping original action, lighting, and motion physics intact.
2. **Mode 2 — Full CGI Recreation:** Recreate entire video scenes, environments, camera angles, and lighting in high-end 3D virtual environments (including PUBG-inspired Erangel City, Sosnovka Airbase, and Vikendi Snow Peak).
3. **Mode 3 — Original CGI Creation:** Generate brand-new cinematic CGI videos directly from text prompts, custom 3D asset selection (vehicles, weapons, tactical outfits), and natural language instructions.

---

## 2. Technology Stack

### Frontend
- **Framework:** Next.js 16 (App Router) & React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom VYRON AI dark cinematic theme
- **UI Components:** Reusable component library (`Button`, `Card`, `Badge`, `Skeleton`, `AppLayout`)
- **Icons:** Lucide React

### Backend
- **Framework:** Python FastAPI
- **Data Validation:** Pydantic V2 (with email validation)
- **Database ORM:** SQLAlchemy with PostgreSQL schema & SQLite local fallback
- **Authentication:** JWT (JSON Web Tokens) with passlib & bcrypt password encryption
- **Video Processing:** FFmpeg / FFprobe wrapper for video metadata parsing and thumbnail extraction
- **AI Orchestration:** Modular AI Provider System (`BaseAIProvider`, `AIProviderRegistry`, Kling AI, Runway Gen-3 Alpha, Mock Fallback Engine)

---

## 3. Repository Structure

```
.
├── backend/
│   ├── app/
│   │   ├── ai_engine/       # Modular AI provider system (Base, Kling, Runway, Mock)
│   │   ├── db/              # SQLAlchemy session, models, and init_db script
│   │   ├── routers/         # FastAPI REST routers (auth, characters, projects, generations, credits, world_3d)
│   │   ├── services/        # VideoProcessor FFmpeg service
│   │   ├── auth.py          # JWT authentication dependencies & password hashing
│   │   ├── config.py        # Environment settings (Pydantic BaseSettings)
│   │   ├── main.py          # FastAPI core entrypoint & CORS middleware
│   │   └── schemas.py       # Pydantic request/response schemas
│   ├── tests/
│   │   └── test_api.py      # Automated API integration test suite
│   └── requirements.txt     # Python backend dependencies
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router pages (/, /auth/*, /dashboard, /create, /characters, /projects, /generations, /settings)
│   │   ├── components/      # UI components & AppLayout sidebar
│   │   └── lib/             # Centralized API fetch client (`api.ts`)
│   ├── package.json
│   └── tsconfig.json
├── render.yaml              # Render Blueprint deployment configuration
├── vercel.json              # Vercel deployment configuration
├── .env.example             # Template environment variables
└── README.md
```

---

## 4. Getting Started & Local Setup

### Prerequisites
- Node.js >= v20
- Python >= 3.10
- FFmpeg (for video metadata parsing & thumbnail generation)

### 1. Backend Setup
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Initialize database tables
PYTHONPATH=backend python3 backend/app/db/init_db.py

# Start FastAPI development server
PYTHONPATH=backend python3 -m uvicorn app.main:app --port 8000 --reload
```
API Documentation will be available at `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
# Install Node dependencies
npm install --prefix frontend

# Start Next.js development server
npm run dev --prefix frontend
```
The application will be accessible at `http://localhost:3000`.

---

## 5. Deployment Guide (Render, Vercel & Hosting Platforms)

### Deploying on Render

#### Option A: Using Render Blueprint (`render.yaml`)
1. Push this repository to GitHub/GitLab.
2. In Render Dashboard, select **New +** -> **Blueprint**.
3. Connect your repository. Render will automatically detect `render.yaml` and configure both the backend FastAPI Web Service and frontend Next.js Web Service.

#### Option B: Manual Web Service Setup on Render

**1. Backend Web Service (`vyron-backend`)**
- **Environment:** Python 3
- **Root Directory:** `backend`
- **Build Command:**
  ```bash
  pip install -r requirements.txt
  ```
- **Start Command:**
  ```bash
  python app/db/init_db.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT
  ```
- **Environment Variables:**
  - `APP_ENV`: `production`
  - `SECRET_KEY`: `<your-random-32-character-secret>`
  - `FRONTEND_URL`: `https://<your-frontend-service-name>.onrender.com`
  - `ALLOWED_ORIGINS`: `https://<your-frontend-service-name>.onrender.com`
  - `DATABASE_URL`: Optional (PostgreSQL connection string; defaults to SQLite if omitted)

**2. Frontend Web Service (`vyron-frontend`)**
- **Environment:** Node
- **Root Directory:** `frontend`
- **Build Command:**
  ```bash
  npm install && npm run build
  ```
- **Start Command:**
  ```bash
  npm start
  ```
- **Environment Variables:**
  - `NEXT_PUBLIC_API_URL`: `https://<your-backend-service-name>.onrender.com`

---

### Deploying Frontend on Vercel

1. Import the repository in Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework Preset: **Next.js**.
4. Set Environment Variable:
   - `NEXT_PUBLIC_API_URL`: `https://<your-backend-url>` (e.g., your Render backend URL).
5. Click **Deploy**.

---

### Deploying on Railway / Other Platforms

- **Backend:**
  - Root Directory: `backend`
  - Build Command: `pip install -r requirements.txt`
  - Start Command: `python app/db/init_db.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
  - Set `FRONTEND_URL` and `ALLOWED_ORIGINS` to match your frontend domain.

- **Frontend:**
  - Root Directory: `frontend`
  - Build Command: `npm run build`
  - Start Command: `npm start`
  - Set `NEXT_PUBLIC_API_URL` to point to the backend service.

---

## 6. Running Automated Tests

To run the backend test suite covering Authentication, Character CRUD, Project Management, Credit Accounting, and AI Generation job submission:

```bash
PYTHONPATH=backend pytest backend/tests/
```

To build and type-check the Next.js frontend:

```bash
npm run build --prefix frontend
```

---

## 7. Future AI & 3D World Roadmap

- **External Provider Integrations:** Direct API connection to Kling AI, Runway Gen-3, and ComfyUI server clusters.
- **Blender & Unreal Engine Pipeline:** Server-side 3D render automation using Blender Python API (`bpy`) and Unreal Engine Blueprints for PUBG-inspired map environments, vehicle customizers, and lighting presets.
