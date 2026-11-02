# Character Studio API Endpoints Reference

### 1. System Discovery & Model Manifest
- `GET /api/system/character-engine/status`
  - Returns hardware discovery, Blender installation, and offline operational status.
- `GET /api/system/character-engine/models`
  - Returns verified internal model catalog, licenses, and local weights status.

### 2. Reference Image Management
- `POST /api/characters/{id}/references`
  - Multipart upload of secondary portrait/angle photos with optional `view_type`.
- `GET /api/characters/{id}/references`
  - Lists all uploaded reference photos with calculated angle classifications and quality metrics.

### 3. Generation Jobs & Pipeline Progression
- `POST /api/characters/{id}/generate`
  - Schedules background 3D reconstruction execution across Pipelines 1-4.
  - Body: `{"generation_mode": "SINGLE_IMAGE", "target_polycount": 30000, "generate_rig": true}`
- `GET /api/character-generations/{generation_id}`
  - Returns current pipeline (1-4), active stage (1-20), progress percentage, and pipeline execution logs.
- `POST /api/character-generations/{generation_id}/retry`
  - Retries an eligible failed generation job.

### 4. Assets, Rigging & Export Delivery
- `GET /api/characters/{id}/assets`
  - Lists generated 3D assets (initial mesh, cleaned mesh, textured mesh, rigged GLB).
- `GET /api/characters/{id}/quality-report`
  - Returns technical validation results for geometry, texturing, and humanoid bone weighting.
- `GET /api/characters/{id}/rig`
  - Returns skeletal rig details and deformation test results.
- `POST /api/characters/{id}/export?format={glb|obj|fbx}`
  - Downloads the verified production asset file.
