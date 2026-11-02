# VYRON AI — Internal 3D Character Generation Engine Architecture

## 1. Overview
The **VYRON AI Internal 3D Character Generation Engine** provides native image-to-3D reconstruction, automated humanoid rigging, PBR texturing, and technical quality audit without mandatory reliance on external AI generation APIs (such as Kling, Runway, Tripo, or Meshy).

The entire system operates using locally hosted Python services, Blender 4 automation, MediaPipe landmark tracking, Trimesh, and Three.js interactive WebGL viewers.

---

## 2. Core Architectural Principles
- **No Mandatory External AI APIs:** All reconstruction, segmentation, UV mapping, skinning, and format conversions occur on-premise / on-instance.
- **Backend-First State Synchronization:** The database (`SQLite` in dev, `PostgreSQL` in production) is the absolute single source of truth.
- **Four Independent Pipelines, 20 Granular Stages:** Defined schemas for inputs and outputs at each stage with transactional logging.
- **Preservation of Existing Video Reconstruction Engine:** Reconstructed 3D character assets are fully registered with VYRON's video production pipeline.

---

## 3. High-Level Pipeline Flow
```
[User Photographs]
        │
        ▼
Pipeline 1: Ingestion & Silhouette Analysis
  ├─ Stage 1: Validation & Secure Hashing
  ├─ Stage 2: EXIF Transpose & Standardization (1024x1024)
  ├─ Stage 3: Silhouette Segmentation (MediaPipe / GrabCut)
  ├─ Stage 4: View Angle Classification (Front, Back, 3/4, Profile)
  └─ Stage 5: Structured Anatomical Profile Synthesis
        │
        ▼
Pipeline 2: AI-Based 3D Reconstruction
  ├─ Stage 6: Strategy Routing (Single-View / Multi-View)
  ├─ Stage 7: Local Model Inference / Volumetric Depth Sculpting
  ├─ Stage 8: 3D Point-Cloud Reconstruction
  ├─ Stage 9: Bilateral Symmetry & Multi-View Refinement
  └─ Stage 10: Initial Surface Mesh Construction (Trimesh)
        │
        ▼
Pipeline 3: Model Refinement & Texture Generation
  ├─ Stage 11: Normal Repair, Double Welding, Degenerate Face Deletion
  ├─ Stage 12: Smart UV Projection with Island Margins
  ├─ Stage 13: PBR Texture Synthesis (Diffuse, Sobel Normal, Roughness)
  ├─ Stage 14: LOD Decimation Analysis
  └─ Stage 15: Master Blender Scene (.blend) Assembly
        │
        ▼
Pipeline 4: Rigging, Validation & Delivery
  ├─ Stage 16: Humanoid Armature Generation (16 Bones)
  ├─ Stage 17: Automated Bone Heat Skin Weighting
  ├─ Stage 18: Deformation Strain Testing (T-Pose, A-Pose, Leg Stride)
  ├─ Stage 19: Comprehensive Technical Quality Report
  └─ Stage 20: GLB/OBJ Export & Video Engine Integration
        │
        ▼
[Interactive 3D WebGL Viewer & Video Creator]
```
