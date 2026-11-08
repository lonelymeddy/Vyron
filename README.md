# VYRON AI LABS — YOUR CREATIVE AI LABORATORY

VYRON AI LABS is a unified multimodal artificial intelligence platform providing access to open-source foundation models for generating and editing images, videos, voices, and music.

---

## 🔬 The Four Creative AI Studios

### 1. Image Lab
- **Text-to-Image Generation**: Driven by `FLUX.1 Schnell` (Apache 2.0) and `Qwen-Image` (Apache 2.0) with custom aspect ratio, step, and seed controls.
- **Instruction-based Image Editing**: Powered by `Qwen-Image-Edit` for subject and composition preservation.
- **Background Removal**: Neural foreground extraction with `rembg` (U2-Net / ONNX runtime).
- **Image Enhancement & Upscaling**: `Real-ESRGAN` upscaling and restoration pipelines.

### 2. Video Lab
- **Text-to-Video & Image-to-Video**: Integrates `Wan 2.1` (Apache 2.0), `Wan 2.2`, and `LTX-Video` for cinematic sequence generation.
- **Video Utilities**: FFmpeg-powered video trimming, resolution resizing, audio extraction, thumbnail generation, and MP4 compression.

### 3. Voice Lab
- **High-Fidelity Text-to-Speech**: Neural speech synthesis via `Kokoro-82M` (Apache 2.0) with multilingual voice presets (`af_heart`, `am_adam`, `bf_emma`, `bm_george`, etc.).
- **Authorized Voice Cloning**: Powered by `OpenVoice V2` (MIT) with mandatory consent checks, reference audio uploads, and voice profile management.
- **Speech-to-Text Transcription**: Powered by `OpenAI Whisper` (MIT) for transcript extraction and subtitle generation.

### 4. Music Lab
- **Text-to-Music & Song Generation**: Primary engine `ACE-Step 1.5` (MIT) supporting vocal and instrumental tracks, genre presets (Electronic, Cyberpunk, Ambient, Lo-Fi, Cinematic Orchestral), tempo/BPM, and lyric timing.
- **Audio Editing & Player**: Polished playback controls, seek bar, time display, and direct MP3/WAV download.

---

## 🛠️ Additional AI Creative Tools

- **AI Prompt Studio**: Expansion, rewriting, and template management for image and video diffusion prompts.
- **AI Creative Assistant**: Scriptwriting, lyrics composition, and dialogue ideation powered by local LLM text reasoning.
- **Unified Creation History**: Persistent storage of generated images, videos, speech files, and music compositions with user isolation.

---

## 🏗️ Architecture & Deployment

VYRON AI LABS is built with:
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS, Lucide icons.
- **Backend API**: FastAPI (Python 3.12), SQLAlchemy 2.0 (Async/Sync SQLite / PostgreSQL).
- **Background Inference**: Asynchronous task workers with hardware-aware scheduling.

### Model Hardware Compatibility
- **CPU Ready (Local & Lightweight)**:
  - Kokoro-82M (ONNX Runtime, <200MB RAM)
  - OpenAI Whisper (CPU tiny/base models)
  - rembg (ONNX Runtime U2-Net, <150MB RAM)
  - Real-ESRGAN (Bicubic/Lanczos + unsharp filter fallback on CPU, TensorRT on GPU)
  - ACE-Step 1.5 (Procedural harmonics engine on CPU; PyTorch weights on GPU)
- **GPU Recommended**:
  - `FLUX.1 Schnell` (requires >=16GB VRAM)
  - `Wan 2.1` / `Wan 2.2` (requires >=24GB VRAM)
  - `LTX-Video` (requires >=16GB VRAM)

*Note: On systems without dedicated GPUs, the central `AIModelManager` correctly reports GPU-bound models as `HARDWARE_INCOMPATIBLE` rather than returning mock results.*

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- FFmpeg (`apt-get install -y ffmpeg`)

### Environment Variables
```env
PORT=3000
BACKEND_HOST=127.0.0.1
BACKEND_PORT=8000
DATABASE_URL=sqlite:///./vyron.db
JWT_SECRET=your-secret-key
STORAGE_PATH=./static/uploads
```

### Running Locally
```bash
# Start both Backend and Frontend via the orchestrator
python3 start.py
```
Or separately:
```bash
# Backend
cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend
cd frontend && npm run dev
```

---

## 📜 Licenses
All integrated model foundations are distributed under permissive open-source licenses:
- **Kokoro-82M**: Apache 2.0
- **FLUX.1 Schnell**: Apache 2.0
- **Wan 2.1 / Wan 2.2**: Apache 2.0
- **OpenVoice V2**: MIT
- **ACE-Step 1.5**: MIT
- **OpenAI Whisper**: MIT
- **rembg**: MIT / U2-Net Apache 2.0
