import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.db.init_db import init_db
from app.routers import auth, projects, generations, credits, models, workers, labs

os.makedirs("static/uploads/creations", exist_ok=True)
os.makedirs("static/uploads/audio", exist_ok=True)
os.makedirs("static/uploads/video", exist_ok=True)
os.makedirs("static/uploads/image", exist_ok=True)
os.makedirs("static/uploads/voice_samples", exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db()
    except Exception as err:
        print(f"Warning initializing database schema on startup: {err}")
    yield


app = FastAPI(
    title="VYRON AI LABS - Creative AI Studio Engine",
    description="Backend API powering VYRON AI LABS: Your Creative AI Laboratory for Image, Video, Voice & Music.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.mount("/static", StaticFiles(directory="static"), name="static")

raw_origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
if settings.ALLOWED_ORIGINS:
    raw_origins.extend([o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()])

origins = sorted(list(set([o for o in raw_origins if o and o != "*"])))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.onrender\.com|https://.*\.railway\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(credits.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(generations.router, prefix="/api")
app.include_router(models.router, prefix="/api")
app.include_router(workers.router, prefix="/api")
app.include_router(labs.router, prefix="/api")

@app.get("/")
def root():
    return {
        "app_name": "VYRON AI LABS",
        "tagline": "YOUR CREATIVE AI LABORATORY",
        "status": "operational",
        "version": "2.0.0",
        "docs": "/docs",
        "labs": ["image", "video", "voice", "music"],
    }


@app.get("/health")
def health_check():
    return {"status": "ok", "platform": "VYRON AI LABS"}
