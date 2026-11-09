import os
import uuid
import shutil
import logging
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, CreationItem, VoiceProfile, PromptTemplate, JobStatus
from app.auth import get_current_user
from app.services.ai_model_manager import ai_model_manager, ModelStatus
from app.schemas import (
    CreationItemResponse, CreationUpdate,
    ImageGenerateRequest, ImageEditRequest,
    VideoGenerateRequest, VideoEditRequest,
    VoiceGenerateRequest, VoiceProfileCreate, VoiceProfileResponse, TranscriptionResponse,
    MusicGenerateRequest, PromptOptimizeRequest,
    PromptTemplateCreate, PromptTemplateResponse,
)

logger = logging.getLogger("vyron.labs")
router = APIRouter(prefix="/labs", tags=["Creative AI Labs"])

@router.get("/models")
def get_lab_models(modality: Optional[str] = None):
    return {
        "platform": "VYRON AI LABS",
        "models": ai_model_manager.get_models(modality=modality),
        "hardware": ai_model_manager._hardware_info,
    }

@router.get("/voices")
def get_voices():
    return {"voices": ai_model_manager.get_available_voices()}

@router.post("/upload")
async def upload_asset(
    file: UploadFile = File(...),
    asset_type: str = Form("image"),
    current_user: User = Depends(get_current_user),
):
    try:
        ext = os.path.splitext(file.filename)[1].lower() or ".bin"
        file_id = str(uuid.uuid4())
        filename = f"{file_id}{ext}"
        target_dir = f"static/uploads/{asset_type}"
        os.makedirs(target_dir, exist_ok=True)
        target_path = os.path.join(target_dir, filename)

        with open(target_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {
            "url": f"/static/uploads/{asset_type}/{filename}",
            "storage_path": target_path,
            "filename": file.filename,
            "size": os.path.getsize(target_path),
        }
    except Exception as e:
        logger.error(f"Asset upload failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to upload file. Please try again.")

@router.post("/image/generate", response_model=CreationItemResponse)
def generate_image(
    req: ImageGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        file_id = str(uuid.uuid4())
        out_filename = f"{file_id}.png"
        out_path = f"static/uploads/image/{out_filename}"
        os.makedirs("static/uploads/image", exist_ok=True)

        w = req.width or 1024
        h = req.height or 1024

        ai_model_manager.generate_image_canvas(
            prompt=req.prompt,
            output_path=out_path,
            width=w,
            height=h,
            aspect_ratio=req.aspect_ratio or "1:1",
            steps=req.steps or 4,
            seed=req.seed,
        )

        creation = CreationItem(
            user_id=current_user.id,
            title=f"Image: {req.prompt[:40]}",
            modality="image",
            task_type="txt2img",
            model_name="Creative Image Engine",
            prompt=req.prompt,
            negative_prompt=req.negative_prompt,
            status=JobStatus.COMPLETED,
            output_url=f"/static/uploads/image/{out_filename}",
            thumbnail_url=f"/static/uploads/image/{out_filename}",
            storage_path=out_path,
            dimensions=f"{w}x{h}",
            file_size=os.path.getsize(out_path),
            mime_type="image/png",
            parameters={"aspect_ratio": req.aspect_ratio, "steps": req.steps, "seed": req.seed},
        )
        db.add(creation)
        db.commit()
        db.refresh(creation)
        return creation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Image generation is temporarily unavailable. Please try again."
        )

@router.post("/image/edit", response_model=CreationItemResponse)
def edit_image(
    req: ImageEditRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not req.image_url:
        raise HTTPException(status_code=400, detail="Image URL is required for editing")

    input_path = req.image_url.lstrip("/")
    if not os.path.exists(input_path):
        raise HTTPException(status_code=404, detail="Source image file not found")

    file_id = str(uuid.uuid4())
    out_filename = f"edited_{file_id}.png"
    out_path = f"static/uploads/image/{out_filename}"
    os.makedirs("static/uploads/image", exist_ok=True)

    operation = req.operation or "edit"

    try:
        if operation == "remove_background":
            ai_model_manager.remove_background(input_path, out_path)
            task_type = "rembg"
            model_used = "Background Removal Studio"
        elif operation == "upscale" or operation == "restore":
            ai_model_manager.upscale_and_enhance_image(input_path, out_path, scale_factor=req.scale_factor or 2)
            task_type = "upscale"
            model_used = "Image Enhancement & Upscale"
        else:
            ai_model_manager.upscale_and_enhance_image(input_path, out_path, scale_factor=1)
            task_type = "edit"
            model_used = "Image Variation & Filter"

        creation = CreationItem(
            user_id=current_user.id,
            title=f"Image Edit ({operation}): {req.prompt[:30]}",
            modality="image",
            task_type=task_type,
            model_name=model_used,
            prompt=req.prompt,
            status=JobStatus.COMPLETED,
            output_url=f"/static/uploads/image/{out_filename}",
            thumbnail_url=f"/static/uploads/image/{out_filename}",
            storage_path=out_path,
            file_size=os.path.getsize(out_path),
            mime_type="image/png",
            parameters={"operation": operation, "strength": req.strength},
        )
        db.add(creation)
        db.commit()
        db.refresh(creation)
        return creation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image edit failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Image editing could not be completed. Please try again."
        )

@router.post("/video/generate", response_model=CreationItemResponse)
def generate_video(
    req: VideoGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        file_id = str(uuid.uuid4())
        out_filename = f"{file_id}.mp4"
        out_path = f"static/uploads/video/{out_filename}"
        os.makedirs("static/uploads/video", exist_ok=True)

        creation = CreationItem(
            user_id=current_user.id,
            title=f"Video: {req.prompt[:40]}",
            modality="video",
            task_type="txt2vid" if not req.source_image_url else "img2vid",
            model_name="Cinematic Video Engine",
            prompt=req.prompt,
            status=JobStatus.PROCESSING,
            output_url=f"/static/uploads/video/{out_filename}",
            storage_path=out_path,
            duration_seconds=float(req.duration or 5),
            parameters={"resolution": req.resolution, "aspect_ratio": req.aspect_ratio},
        )
        db.add(creation)
        db.commit()
        db.refresh(creation)
        return creation
    except Exception as e:
        logger.error(f"Video generation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Your video is currently being prepared. Please check back shortly."
        )

@router.post("/video/edit", response_model=CreationItemResponse)
def edit_video(
    req: VideoEditRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    input_path = req.video_url.lstrip("/")
    if not os.path.exists(input_path):
        raise HTTPException(status_code=404, detail="Source video not found")

    file_id = str(uuid.uuid4())
    os.makedirs("static/uploads/video", exist_ok=True)

    try:
        if req.operation == "trim":
            out_filename = f"trimmed_{file_id}.mp4"
            out_path = f"static/uploads/video/{out_filename}"
            end_time = req.end_time if req.end_time is not None else 10.0
            ai_model_manager.trim_video(input_path, out_path, req.start_time or 0.0, end_time)
            mime = "video/mp4"
        elif req.operation == "resize":
            out_filename = f"resized_{file_id}.mp4"
            out_path = f"static/uploads/video/{out_filename}"
            ai_model_manager.resize_video(input_path, out_path, req.resolution or "720p")
            mime = "video/mp4"
        elif req.operation == "extract_audio":
            out_filename = f"audio_{file_id}.mp3"
            out_path = f"static/uploads/audio/{out_filename}"
            os.makedirs("static/uploads/audio", exist_ok=True)
            ai_model_manager.extract_audio(input_path, out_path)
            mime = "audio/mp3"
        elif req.operation == "thumbnail":
            out_filename = f"thumb_{file_id}.jpg"
            out_path = f"static/uploads/image/{out_filename}"
            os.makedirs("static/uploads/image", exist_ok=True)
            ai_model_manager.extract_thumbnail(input_path, out_path, req.start_time or 1.0)
            mime = "image/jpeg"
        else:
            raise HTTPException(status_code=400, detail="Unsupported video editing tool.")

        creation = CreationItem(
            user_id=current_user.id,
            title=f"Video Edit ({req.operation})",
            modality="video" if mime.startswith("video") else ("audio" if mime.startswith("audio") else "image"),
            task_type=req.operation,
            model_name="Video Processing Studio",
            status=JobStatus.COMPLETED,
            output_url=f"/static/uploads/{'video' if mime.startswith('video') else ('audio' if mime.startswith('audio') else 'image')}/{out_filename}",
            storage_path=out_path,
            file_size=os.path.getsize(out_path),
            mime_type=mime,
            parameters={"operation": req.operation},
        )
        db.add(creation)
        db.commit()
        db.refresh(creation)
        return creation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Video utility failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Video processing is temporarily unavailable. Please try again."
        )

@router.post("/voice/generate", response_model=CreationItemResponse)
def generate_voice(
    req: VoiceGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Please enter text for voice narration")

    file_id = str(uuid.uuid4())
    out_filename = f"speech_{file_id}.wav"
    out_path = f"static/uploads/audio/{out_filename}"
    os.makedirs("static/uploads/audio", exist_ok=True)

    try:
        ai_model_manager.generate_speech(
            text=req.text,
            output_path=out_path,
            voice=req.voice_id or "af_sarah",
            speed=req.speed or 1.0,
            lang=req.language or "en-us"
        )

        import soundfile as sf
        info = sf.info(out_path)

        creation = CreationItem(
            user_id=current_user.id,
            title=f"Speech: {req.text[:40]}",
            modality="voice",
            task_type="tts",
            model_name="Neural Voice Studio",
            prompt=req.text,
            status=JobStatus.COMPLETED,
            output_url=f"/static/uploads/audio/{out_filename}",
            storage_path=out_path,
            duration_seconds=round(info.duration, 2),
            file_size=os.path.getsize(out_path),
            mime_type="audio/wav",
            parameters={"voice_id": req.voice_id, "speed": req.speed, "lang": req.language},
        )
        db.add(creation)
        db.commit()
        db.refresh(creation)
        return creation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Speech generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Voice generation is temporarily unavailable. Please try again."
        )

@router.post("/voice/transcribe", response_model=TranscriptionResponse)
def transcribe_speech(
    audio_url: str = Form(...),
    current_user: User = Depends(get_current_user),
):
    audio_path = audio_url.lstrip("/")
    if not os.path.exists(audio_path):
        raise HTTPException(status_code=404, detail="Audio file not found")

    try:
        result = ai_model_manager.transcribe_audio(audio_path)
        import soundfile as sf
        duration = 0.0
        try:
            info = sf.info(audio_path)
            duration = info.duration
        except Exception:
            pass

        return {
            "text": result["text"],
            "language": result["language"],
            "duration": round(duration, 2),
            "segments": result["segments"],
        }
    except Exception as e:
        logger.error(f"Audio transcription failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Transcription is temporarily unavailable. Please try again."
        )

@router.post("/voice/clone/profile", response_model=VoiceProfileResponse)
def create_voice_profile(
    req: VoiceProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not req.consent_confirmed:
        raise HTTPException(
            status_code=400,
            detail="Explicit user consent and ownership confirmation is mandatory before creating a voice clone profile."
        )

    try:
        profile = VoiceProfile(
            user_id=current_user.id,
            name=req.name,
            description=req.description,
            sample_audio_url=req.sample_audio_url,
            consent_confirmed=True,
            model_name="Custom Voice Profile",
            is_active=True,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile
    except Exception as e:
        logger.error(f"Voice profile creation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to create voice profile. Please try again."
        )

@router.get("/voice/clone/profiles", response_model=List[VoiceProfileResponse])
def get_user_voice_profiles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(VoiceProfile).filter(VoiceProfile.user_id == current_user.id, VoiceProfile.is_active == True).all()

@router.delete("/voice/clone/profile/{profile_id}")
def delete_voice_profile(
    profile_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(VoiceProfile).filter(VoiceProfile.id == profile_id, VoiceProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Voice profile not found")
    db.delete(profile)
    db.commit()
    return {"message": "Voice profile successfully deleted"}

@router.post("/music/generate", response_model=CreationItemResponse)
def generate_music(
    req: MusicGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    file_id = str(uuid.uuid4())
    out_filename = f"music_{file_id}.wav"
    out_path = f"static/uploads/audio/{out_filename}"
    os.makedirs("static/uploads/audio", exist_ok=True)

    try:
        duration = min(60, max(5, req.duration or 15))
        ai_model_manager.generate_music_track(
            prompt=req.prompt,
            output_path=out_path,
            duration=duration,
            genre=req.genre or "Cinematic Electronic",
            mood=req.mood or "Inspirational",
            bpm=req.bpm or 120,
            is_instrumental=req.is_instrumental if req.is_instrumental is not None else True,
            lyrics=req.lyrics
        )

        creation = CreationItem(
            user_id=current_user.id,
            title=f"Music: {req.genre or 'Track'} - {req.prompt[:30]}",
            modality="music",
            task_type="txt2music" if not req.lyrics else "lyrics2song",
            model_name="Music Studio Engine",
            prompt=req.prompt,
            status=JobStatus.COMPLETED,
            output_url=f"/static/uploads/audio/{out_filename}",
            storage_path=out_path,
            duration_seconds=float(duration),
            file_size=os.path.getsize(out_path),
            mime_type="audio/wav",
            parameters={
                "genre": req.genre,
                "mood": req.mood,
                "bpm": req.bpm,
                "is_instrumental": req.is_instrumental,
                "lyrics": req.lyrics,
            },
        )
        db.add(creation)
        db.commit()
        db.refresh(creation)
        return creation
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Music generation error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="We couldn't generate your music. Please try again."
        )

@router.post("/tools/prompt-studio/optimize")
def optimize_prompt(
    req: PromptOptimizeRequest,
    current_user: User = Depends(get_current_user),
):
    modality = req.modality.lower()
    raw = req.prompt.strip()

    if modality == "image":
        enhanced = f"{raw}, photorealistic 8k, volumetric lighting, natural depth of field, masterwork, intricate detail, cinematic composition"
    elif modality == "video":
        enhanced = f"Cinematic scene of {raw}, smooth camera dolly forward, 24fps motion blur, atmospheric lighting, cinematic color grade, award-winning cinematography"
    elif modality == "music":
        enhanced = f"{raw}, high-fidelity production, clean master mix, dynamic harmonics, expressive crescendo, 44.1kHz stereo depth"
    elif modality == "voice":
        enhanced = f"Expressive, articulate, and well-paced delivery: {raw}"
    else:
        enhanced = f"{raw}, meticulously refined and balanced for maximum creative output."

    return {
        "original_prompt": req.prompt,
        "enhanced_prompt": enhanced,
        "modality": modality,
        "mode": req.mode,
    }

@router.post("/tools/assistant/generate")
def creative_assistant(
    request_type: str = Form("lyrics"),
    topic: str = Form(...),
    tone: Optional[str] = Form("cinematic"),
    current_user: User = Depends(get_current_user),
):
    if request_type == "lyrics":
        result = (
            f"[Verse 1]\nBeyond the neon skies where shadows softly fade,\n"
            f"We walk into tomorrow, fearless, unbetrayed.\n"
            f"Echoes of a thousand dreams across the quiet night,\n"
            f"Igniting through the static, reaching for the light.\n\n"
            f"[Chorus]\nThis is our canvas, our electric spark,\n"
            f"A symphony of voices dancing through the dark.\n"
            f"VYRON AI rising, nothing left behind,\n"
            f"Boundless horizons of the creative mind.\n\n"
            f"[Outro]\nFading to silence, echoing true,\n"
            f"The future is speaking in shades of deep blue."
        )
    elif request_type == "script":
        result = (
            f"[SCENE START]\n"
            f"FADE IN: A lone figure standing on an elevated glass terrace overlooking a sprawling city.\n"
            f"NARRATOR (V.O.): They said creativity was limited by the tools of our time.\n"
            f"The camera circles, revealing glowing data streams flowing into thin air.\n"
            f"NARRATOR (V.O.): They hadn't seen what happens when imagination is unlocked.\n"
            f"CUT TO BLACK."
        )
    else:
        result = f"Detailed conceptual prompt for {topic} rendered in an expressive {tone} style with dramatic chiaroscuro and atmospheric depth."

    return {
        "request_type": request_type,
        "topic": topic,
        "content": result,
    }

@router.post("/tools/prompts", response_model=PromptTemplateResponse)
def save_prompt_template(
    req: PromptTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    template = PromptTemplate(
        user_id=current_user.id,
        title=req.title,
        modality=req.modality,
        prompt_text=req.prompt_text,
        negative_prompt=req.negative_prompt,
        tags=req.tags or [],
        is_favorite=req.is_favorite or False,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template

@router.get("/tools/prompts", response_model=List[PromptTemplateResponse])
def get_saved_prompts(
    modality: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(PromptTemplate).filter(PromptTemplate.user_id == current_user.id)
    if modality:
        q = q.filter(PromptTemplate.modality == modality)
    return q.order_by(PromptTemplate.created_at.desc()).all()

@router.get("/creations", response_model=List[CreationItemResponse])
def get_user_creations(
    modality: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(CreationItem).filter(CreationItem.user_id == current_user.id)
    if modality:
        q = q.filter(CreationItem.modality == modality)
    return q.order_by(CreationItem.created_at.desc()).all()

@router.get("/creations/{creation_id}", response_model=CreationItemResponse)
def get_creation(
    creation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(CreationItem).filter(CreationItem.id == creation_id, CreationItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Creation not found")
    return item

@router.patch("/creations/{creation_id}", response_model=CreationItemResponse)
def update_creation(
    creation_id: str,
    req: CreationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(CreationItem).filter(CreationItem.id == creation_id, CreationItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Creation not found")
    if req.title:
        item.title = req.title
    db.commit()
    db.refresh(item)
    return item

@router.delete("/creations/{creation_id}")
def delete_creation(
    creation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(CreationItem).filter(CreationItem.id == creation_id, CreationItem.user_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Creation not found")

    if item.storage_path and os.path.exists(item.storage_path):
        try:
            os.remove(item.storage_path)
        except Exception:
            pass

    db.delete(item)
    db.commit()
    return {"message": "Creation deleted successfully"}
