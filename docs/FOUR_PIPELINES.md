# Four Independent Character Generation Pipelines

### Pipeline 1: Image Ingestion and Character Analysis
- **Stage 1 (Image Upload):** Validates MIME types, byte headers, dimensions (min 128x128, max 8192x8192), file size limit (<15MB), and securely renames files to UUIDs.
- **Stage 2 (Image Preprocessing):** EXIF orientation correction, square letterbox padding, centering, and Laplacian contrast/sharpness scoring.
- **Stage 3 (Character Segmentation):** Foreground subject isolation using MediaPipe pose landmarker or OpenCV GrabCut saliency.
- **Stage 4 (Reference View Classification):** Anatomical landmark triangulation determining front, back, profile, three-quarter, full body, or upper body view framing.
- **Stage 5 (Character Profile Synthesis):** Generates structured reference package JSON containing missing viewing angles and uncertainty scores.

### Pipeline 2: AI-Based 3D Reconstruction
- **Stage 6 (Reconstruction Strategy Selection):** Dynamic routing based on single vs. multi-camera references and GPU availability.
- **Stage 7 (AI Model Inference):** Native volumetric depth contour evaluation and anatomical thickness calculation.
- **Stage 8 (Geometry Point Reconstruction):** Point-cloud generation across front and posterior surfaces.
- **Stage 9 (Multi-View Refinement):** Bilateral anatomical symmetry enforcement and lateral depth scaling.
- **Stage 10 (Initial Mesh Generation):** Watertight 3D manifold surface reconstruction with cylindrical UV mapping using Trimesh.

### Pipeline 3: Model Refinement and Texture Generation
- **Stage 11 (Mesh Cleanup):** Headless Blender subprocess for removing non-manifold edges, welding doubles, and orienting normals outward.
- **Stage 12 (UV Mapping):** Smart UV project unwrap with non-overlapping island spacing.
- **Stage 13 (Texture Generation):** PBR texture synthesis: Base Color (diffuse), Normal map (Sobel gradient filtering), Roughness, and Metallic maps.
- **Stage 14 (Model Optimization):** Polygon density analysis and decimation statistics.
- **Stage 15 (Blender Scene Preparation):** Assembles master `.blend` scene with Principled BSDF shaders and textured preview models.

### Pipeline 4: Rigging, Validation and Export
- **Stage 16 (Humanoid Rig Generation):** 16-bone hierarchical humanoid armature scaled to the character bounding box (Pelvis, Spine, Neck, Head, Shoulders, Arms, Hands, Legs, Feet).
- **Stage 17 (Skin Weighting):** Automatic bone heat weighting binding character mesh vertices to armature deformation groups.
- **Stage 18 (Animation Testing):** Pose deformation stress testing across A-Pose, T-Pose abduction, and leg stride motions to guarantee zero joint tearing.
- **Stage 19 (Quality Validation):** Comprehensive technical audit generating verified `CharacterQualityReport` records.
- **Stage 20 (Export & Integration):** Multi-format delivery (GLB, OBJ) and character library registration for reference-video replacement.
