# AI Models, Licenses & Hardware Requirements

| Model / System | Purpose | License | Dependencies | VRAM Recommended | Offline Capable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Vyron Volumetric Depth Sculptor** | Native Internal 3D Mesh Generation | Proprietary (VYRON AI Native) | Python 3.12, NumPy, OpenCV, Trimesh, SciPy | 0 MB (Runs on CPU/GPU) | Yes |
| **MediaPipe Pose Landmarker** | Silhouette Matting & Skeletal Triangulation | Apache 2.0 | mediapipe | 0 MB (CPU) | Yes |
| **Blender 4.0.2 Automation Engine** | Mesh Repair, UV Unwrapping & Rigify Skinned Armature | GPL v3 | blender, python3-numpy, python3-scipy | 0 MB (Headless CPU) | Yes |
| **TripoSR (Candidate Weight)** | Optional Feed-Forward Single-View 3D | MIT | PyTorch, CUDA, Einops, Transformers | >= 6,000 MB | Yes (when weights loaded) |
| **U2-Net / Rembg (Candidate Weight)** | Human Portrait Matting | MIT | ONNXRuntime | >= 2,000 MB | Yes (when weights loaded) |

### GPU / CPU Execution Modes
1. **CPU Default Mode (Production Verified):**
   - Headless Blender executes normal recalculations, UV unwrapping, bone heat skin weighting, and GLB exports.
   - MediaPipe handles skeletal landmark classification and silhouette extraction.
   - Trimesh and SciPy execute watertight 3D manifold polygon construction.
2. **GPU Acceleration Mode (Optional):**
   - Automatically detected by `get_system_capabilities()` in `backend/app/character_engine/models/model_capabilities.py`.
   - Activated when an NVIDIA CUDA GPU with >= 6GB VRAM is present.
