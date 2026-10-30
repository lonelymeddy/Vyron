from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db.init_db import init_db
from app.routers import auth, characters, projects, generations, credits, world_3d


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-initialize database tables on server startup
    try:
        init_db()
    except Exception as err:
        print(f"Warning initializing database schema on startup: {err}")
    yield


app = FastAPI(
    title="VYRON AI - Core API Engine",
    description="Backend API powering VYRON AI: Cinematic 3D video & virtual-world creation platform.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Parse origins dynamically for CORS
raw_origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
if settings.ALLOWED_ORIGINS:
    raw_origins.extend([o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()])

# Filter out empty strings and wildcards when credentials are allowed
origins = list(set([o for o in raw_origins if o and o != "*"]))

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app" if not settings.ALLOWED_ORIGINS else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(characters.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(generations.router, prefix="/api")
app.include_router(credits.router, prefix="/api")
app.include_router(world_3d.router, prefix="/api")


@app.get("/")
def root():
    return {
        "app_name": settings.APP_NAME,
        "tagline": "CREATE BEYOND REALITY",
        "status": "operational",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}
