import os
import sys
import logging

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from app.db.session import engine, Base, SessionLocal
from app.db.models import (
    User, Character, Project, SourceVideo, Generation,
    GenerationJob, GeneratedVideo, Credit, CreditTransaction,
    AIProvider, UsageLog, ShotAdjustment, ShotRenderVersion,
    QualityControlReport, ExportJob, CharacterReferenceImage,
    CharacterGeneration, PipelineExecution, CharacterAsset,
    CharacterRig, CharacterVariant, CharacterQualityReport,
    Environment, EnvironmentAsset, VideoAnalysisResult,
    ReconstructionBlueprintModel, ModelRecord, ModelVersion,
    WorkerRecord, WorkerTask, SystemSetting
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def seed_defaults(db):
    default_settings = [
        {"key": "DEFAULT_AI_PROVIDER", "value": "vyron_reconstruction_engine", "description": "Primary internal AI generation engine"},
        {"key": "OFFLINE_MODE", "value": "true", "description": "Execute AI pipelines entirely on local compute"},
        {"key": "MAX_CONCURRENT_JOBS", "value": "4", "description": "Maximum parallel generation jobs allowed"},
        {"key": "STORAGE_PERSISTENCE_MODE", "value": "local_filesystem", "description": "Storage backend type"},
        {"key": "BLENDER_ENGINE_DEFAULT", "value": "BLENDER_EEVEE_NEXT", "description": "Rendering engine used for 3D passes"},
    ]
    for s in default_settings:
        existing = db.query(SystemSetting).filter(SystemSetting.key == s["key"]).first()
        if not existing:
            db.add(SystemSetting(**s))

    presets = [
        {
            "id": "env_erangel_city",
            "name": "Erangel City Ruins",
            "slug": "erangel_city",
            "description": "Gritty urban environment with abandoned tactical structures, realistic building ruins, and dramatic sunset backlighting.",
            "theme": "tactical_pubg",
            "map_location": "Pochinki Urban Sector",
            "weather": "sunset",
            "time_of_day": "golden_hour",
            "preview_url": "/static/presets/erangel_city.jpg",
            "scene_config": {
                "ground_type": "cracked_asphalt",
                "ambient_fog_density": 0.015,
                "sky_color": [0.75, 0.45, 0.25],
                "sun_intensity": 2.8,
                "structures_count": 8
            },
            "is_preset": True,
            "is_active": True
        },
        {
            "id": "env_sosnovka_airbase",
            "name": "Sosnovka Military Airbase",
            "slug": "military_airfield",
            "description": "Cold war coastal military installation with aircraft hangars, tactical tarmac, watchtowers, and low-altitude atmospheric fog.",
            "theme": "military_base",
            "map_location": "Sosnovka Island",
            "weather": "fog",
            "time_of_day": "morning_haze",
            "preview_url": "/static/presets/sosnovka_airbase.jpg",
            "scene_config": {
                "ground_type": "concrete_runway",
                "ambient_fog_density": 0.045,
                "sky_color": [0.4, 0.45, 0.55],
                "sun_intensity": 1.4,
                "structures_count": 12
            },
            "is_preset": True,
            "is_active": True
        },
        {
            "id": "env_vikendi_snow",
            "name": "Vikendi Snow Peak",
            "slug": "vikendi_snow",
            "description": "Alpine snowscape with pine forest clusters, sub-zero lighting, frozen lakes, and high-altitude mountain vistas.",
            "theme": "snow_peak",
            "map_location": "Mount Kreznic",
            "weather": "snow",
            "time_of_day": "overcast_noon",
            "preview_url": "/static/presets/vikendi_snow.jpg",
            "scene_config": {
                "ground_type": "packed_snow",
                "ambient_fog_density": 0.025,
                "sky_color": [0.8, 0.85, 0.95],
                "sun_intensity": 2.0,
                "structures_count": 4
            },
            "is_preset": True,
            "is_active": True
        }
    ]
    for p in presets:
        existing = db.query(Environment).filter(Environment.slug == p["slug"]).first()
        if not existing:
            db.add(Environment(**p))

    models_catalog = [
        {
            "id": "triposr",
            "name": "TripoSR",
            "category": "image_to_3d",
            "version": "1.0.0",
            "source_repo": "https://github.com/VAST-AI-Research/TripoSR",
            "license": "MIT",
            "license_url": "https://opensource.org/licenses/MIT",
            "is_installed": True,
            "is_active": True,
            "default_weight_file": "model.ckpt",
            "local_weight_path": "storage/models/image_to_3d/model.ckpt",
            "vram_recommended_mb": 6000,
            "requires_gpu": False,
            "supports_cpu_fallback": True,
            "supported_inputs": ["single_image", "multi_image_projection"],
            "output_format": "obj/glb",
            "description": "Fast feed-forward 3D reconstruction generating textured meshes from single or multi-angle image inputs."
        },
        {
            "id": "u2net_human_seg",
            "name": "U2-Net Silhouette Segmenter",
            "category": "segmentation",
            "version": "2.0.0",
            "source_repo": "https://github.com/danielgatis/rembg",
            "license": "MIT",
            "license_url": "https://opensource.org/licenses/MIT",
            "is_installed": True,
            "is_active": True,
            "default_weight_file": "u2net.onnx",
            "local_weight_path": "storage/models/segmentation/u2net.onnx",
            "vram_recommended_mb": 2000,
            "requires_gpu": False,
            "supports_cpu_fallback": True,
            "supported_inputs": ["rgb_image"],
            "output_format": "alpha_mask",
            "description": "High-accuracy background isolation and human subject matting for reference preprocessing."
        },
        {
            "id": "mediapipe_pose_landmarker",
            "name": "MediaPipe Pose Landmarker Lite",
            "category": "pose_and_rigging",
            "version": "0.10.14",
            "source_repo": "https://developers.google.com/mediapipe/solutions/vision/pose_landmarker",
            "license": "Apache-2.0",
            "license_url": "https://www.apache.org/licenses/LICENSE-2.0",
            "is_installed": True,
            "is_active": True,
            "default_weight_file": "pose_landmarker_lite.task",
            "local_weight_path": "models/pose_landmarker_lite.task",
            "vram_recommended_mb": 0,
            "requires_gpu": False,
            "supports_cpu_fallback": True,
            "supported_inputs": ["rgb_image", "video_frame"],
            "output_format": "33_3d_landmarks",
            "description": "Extracts 33 humanoid landmark points for view angle classification, proportions, and bone alignment."
        },
        {
            "id": "blender_humanoid_rigify",
            "name": "Blender Humanoid Rigging Engine",
            "category": "rigging",
            "version": "4.0.2",
            "source_repo": "https://www.blender.org",
            "license": "GPL-3.0",
            "license_url": "https://www.gnu.org/licenses/gpl-3.0.html",
            "is_installed": True,
            "is_active": True,
            "default_weight_file": "bpy_rigify",
            "local_weight_path": "/usr/bin/blender",
            "vram_recommended_mb": 0,
            "requires_gpu": False,
            "supports_cpu_fallback": True,
            "supported_inputs": ["mesh_geometry"],
            "output_format": "skinned_humanoid_armature",
            "description": "Generates a complete humanoid deformation skeleton with automatic skin heat weighting."
        }
    ]
    for m in models_catalog:
        existing = db.query(ModelRecord).filter(ModelRecord.id == m["id"]).first()
        if not existing:
            db.add(ModelRecord(**m))

    local_worker = db.query(WorkerRecord).filter(WorkerRecord.worker_name == "vyron_local_core").first()
    if not local_worker:
        db.add(WorkerRecord(
            worker_name="vyron_local_core",
            worker_type="cpu",
            status="ONLINE",
            capabilities=["reconstruction", "rendering", "video_analysis", "rigging"],
            cpu_cores=8,
            ram_total_mb=16384,
            ram_used_mb=4096
        ))

    db.commit()

def init_db():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            if engine.url.get_backend_name() == "sqlite":
                res = conn.execute(text("PRAGMA table_info(characters)"))
                existing_cols = [row[1] for row in res.fetchall()]
                if "active_generation_id" not in existing_cols:
                    conn.execute(text("ALTER TABLE characters ADD COLUMN active_generation_id VARCHAR"))
                if "model_asset_url" not in existing_cols:
                    conn.execute(text("ALTER TABLE characters ADD COLUMN model_asset_url VARCHAR"))
                if "rig_status" not in existing_cols:
                    conn.execute(text("ALTER TABLE characters ADD COLUMN rig_status VARCHAR DEFAULT 'UNRIGGED'"))
                if "animation_ready" not in existing_cols:
                    conn.execute(text("ALTER TABLE characters ADD COLUMN animation_ready BOOLEAN DEFAULT 0"))
                conn.commit()
    except Exception as e:
        logger.warning(f"Column migration check note: {e}")

    db = SessionLocal()
    try:
        seed_defaults(db)
    except Exception as seed_err:
        logger.warning(f"Error seeding database records: {seed_err}")
    finally:
        db.close()

    logger.info("Database tables initialized successfully!")

if __name__ == "__main__":
    init_db()
