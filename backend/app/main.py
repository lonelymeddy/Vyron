from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, characters, projects, generations, credits, world_3d

app = FastAPI(
    title="VYRON AI - Core API Engine",
    description="Backend API powering VYRON AI: Cinematic 3D video & virtual-world creation platform.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}
