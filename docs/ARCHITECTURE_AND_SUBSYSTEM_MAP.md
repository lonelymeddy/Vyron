# VYRON AI — Subsystem Architecture & Implementation Map

**Brand:** VYRON AI
**Tagline:** CREATE BEYOND REALITY

---

## 1. Executive Summary & Repository Audit

This document provides a comprehensive subsystem audit and technical architecture map for the VYRON AI platform, delineating the boundaries, implemented components, pending functionality, and target state for each architectural layer.

### System Verification Baseline
- **Backend Tests:** 45 tests passing across 9 test suites (`test_ai_engine.py`, `test_api.py`, `test_character_pipeline.py`, `test_character_replacement.py`, `test_editor_api.py`, `test_model_ecosystem.py`, `test_shot_production.py`, `test_worker_infrastructure.py`, `test_world_engine.py`).
- **Frontend Build:** Next.js 16 (App Router) & React 19 compiling cleanly with zero TypeScript errors across 19 static and dynamic routes.
- **System Binaries Verified:** Headless Blender 4.0.2 with Python numpy integration, FFmpeg / FFprobe, and MediaPipe pose tracking.

---

## 2. Subsystem Mapping (Frontend to Backend)

| Subsystem Area | Frontend Page / Component | Backend Router & Endpoint | Backend Service / Engine | Current Implementation State |
| :--- | :--- | :--- | :--- | :--- |
| **Authentication & Users** | `/auth/signin`, `/auth/signup` | `app/routers/auth.py` (`/api/auth/*`) | `app/auth.py`, SQLAlchemy `User` | **Implemented** (JWT, bcrypt, credits balance initialization) |
| **Character Library** | `/characters` | `app/routers/characters.py` (`/api/characters`) | `Character` model, disk storage | **Implemented** (file upload, CRUD, MIME checks, persistent path) |
| **Character 3D Studio** | `/character-studio/[characterId]` | `app/routers/character_generation.py` | `character_engine/orchestrator.py` (20 stages across 4 pipelines) | **Implemented** (segmentation, geometry builder, UV unwrapping, Blender rigging, validation, GLB export) |
| **3D World & Presets** | `/create` (world selection) | `app/routers/world_3d.py` (`/api/world-3d/*`) | `world_engine.py`, persistent `Environment` models | **Implemented** (persistent DB environments, Erangel/Sosnovka/Vikendi, Blender GLB scene export) |
| **Cinematic Projects** | `/projects`, `/projects/[id]` | `app/routers/projects.py` (`/api/projects/*`) | `Project`, `SourceVideo` models | **Implemented** (video upload, metadata extraction, mode selection) |
| **Storyboard & Blueprint** | `/create`, `/projects/[id]` | `app/routers/generations.py` (`/api/generations/storyboard`, `/blueprint`) | `video_analysis.py`, `character_replacement_engine.py` | **Implemented** (PySceneDetect shot split, MediaPipe pose extraction, dynamic blueprint) |
| **Cinematic Editor** | `/projects/[id]/editor` | `app/routers/editor.py` (`/api/editor/*`) | `shot_production_service.py`, `quality_control_service.py`, `export_service.py` | **Implemented** (side-by-side & overlay player, shot adjustments, per-shot regeneration, QC, FFmpeg export) |
| **AI Model Ecosystem** | Internal / System endpoints | `app/routers/models.py` (`/api/models/*`) | `model_manager.py`, `ModelRecord`, `ModelVersion` | **Implemented** (catalog of TripoSR, U2-Net, MediaPipe, Blender Rigify, weight verification, hardware status) |
| **Worker Infrastructure**| Background task processing | `app/routers/workers.py` (`/api/workers/*`) | `worker_manager.py`, `WorkerRecord`, `WorkerTask` | **Implemented** (worker registration, telemetry heartbeats, priority queue dispatching, progress tracking) |

---

## 3. Subsystem Breakdown & Architecture Responsibilities

### Layer A: Application Layer
- **Auth & Accounts:** User sessions, credit allocations, role permissions.
- **Projects & Characters:** Asset references, metadata, multi-shot storyboard configuration.
- **Production Editor:** Timeline alignment, shot micro-adjustments, interactive side-by-side comparison.

### Layer B: AI Infrastructure
- **Model Registry & Manager:** Unified registry managing open-source model catalog (TripoSR, U2-Net, MediaPipe Pose Landmarker, Blender Rigify). Tracks model versions, weight integrity hashes, licensing, and hardware compatibility.
- **Inference Execution:** Support for CUDA GPU inference with automated CPU fallback where supported.
- **Resource Management:** Real-time system monitoring (RAM, VRAM, CPU utilization).

### Layer C: 3D Production Engine
- **Character Reconstruction:** 20-stage pipeline covering ingestion, silhouette matting, point cloud extraction, convex hull creation, normal repair, UV mapping, and PBR texturing.
- **Rigging & Animation Testing:** Blender headless automation for humanoid skeleton generation, bone weighting, and pose strain validation.
- **3D World Engine:** Persistent database models for environments (`Environment`, `EnvironmentAsset`), procedural terrain synthesis, atmospheric lighting, and scene export.

### Layer D: Cinematic Video Engine
- **Forensic Video Analysis:** PySceneDetect shot segmentation, frame extraction, character subject tracking.
- **Character Replacement Engine:** Compositing, color/lighting matching, and temporal motion retargeting.
- **Final Assembly:** FFmpeg-driven multi-track video assembly, original audio channel preservation, and resolution transcoding (720p, 1080p, original).

### Layer E: Infrastructure Layer
- **Persistent Storage:** Dedicated disk layout (`storage/characters/`, `storage/environments/`, `storage/models/`, `storage/exports/`).
- **Worker & Queue Infrastructure:** Persistent job records (`WorkerRecord`, `WorkerTask`), queue dispatching, heartbeats, and failure recovery policies.
- **Database Schema:** SQLAlchemy models with Alembic migrations and SQLite/PostgreSQL duality.
