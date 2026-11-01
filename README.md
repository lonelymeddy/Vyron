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

## 3. Quick Start & Unified Deployment (Frontend + Backend Merged)

The application can run and deploy as a **single unified service** where Next.js serves the frontend and automatically proxies `/api/*`, `/static/uploads/*`, `/docs`, and `/openapi.json` to the internal FastAPI backend.

### Prerequisites
- Node.js >= v20
- Python >= 3.10
- FFmpeg (for video metadata parsing & thumbnail generation)

### Unified Build Command
Run this in the repository root to install dependencies and compile the Next.js frontend:

```bash
pip install -r backend/requirements.txt && npm --prefix frontend install && npm --prefix frontend run build
```

Or using root npm scripts:
```bash
npm run build
```

### Unified Startup Command
Run this to launch both the FastAPI backend and Next.js frontend concurrently under a single public port:

```bash
python3 start.py
```

Or using root npm scripts / shell script:
```bash
npm start
# or
bash scripts/start.sh
```

- Web Application: `http://localhost:3000` (or the `$PORT` assigned by host)
- API Endpoints: `http://localhost:3000/api/*`
- Interactive API Docs: `http://localhost:3000/docs`

---

## 4. Local Development (Separate Services)

If you prefer running frontend and backend in separate terminal windows:

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

## 5. Deployment Guide (Render, Railway, Vercel, Docker)

### Option 1: Unified Single-Service Deployment (Recommended)

Deploy everything as a single web service. Next.js serves the frontend UI and proxies `/api/*` and `/docs` to FastAPI running on an internal port.

#### Render
1. Create a **Web Service** in Render.
2. Select your repository.
3. Configure the settings:
   - **Environment:** `Python 3`
   - **Build Command:**
     ```bash
     pip install -r backend/requirements.txt && npm --prefix frontend install && npm --prefix frontend run build
     ```
   - **Start Command:**
     ```bash
     python3 start.py
     ```
   - **Environment Variables:**
     - `APP_NAME`: `VYRON AI`
     - `APP_ENV`: `production`
     - `SECRET_KEY`: `<generate-32-char-random-key>`
     - `DEFAULT_AI_PROVIDER`: `mock_engine`
     - `DATABASE_URL`: `sqlite:///./vyron.db` (or PostgreSQL connection string)
     - `NEXT_PUBLIC_API_URL`: *(Leave empty to use same-origin relative API proxying)*

#### Railway / VPS / Docker
- **Build Command:** `npm run build`
- **Start Command:** `npm start` (or `python3 start.py`)
- Sets `PORT` automatically and routes traffic to the unified server.

---

### Option 2: Split Architecture Deployment

#### 1. Backend Web Service (`vyron-backend`)
- **Environment:** Python 3
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `PYTHONPATH=. python app/db/init_db.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

#### 2. Frontend Web Service (`vyron-frontend`)
- **Environment:** Node
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Environment Variables:**
  - `NEXT_PUBLIC_API_URL`: `<deployed-backend-url>` (e.g., `https://vyron-backend.onrender.com`)

---

## 6. Running Automated Tests

To run the backend test suite:

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
