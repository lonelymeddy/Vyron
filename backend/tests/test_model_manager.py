import os
import pytest
from PIL import Image, ImageDraw
from app.services.ai_model_manager import ai_model_manager, ModelStatus

def test_model_registry_integrity():
    models = ai_model_manager.get_models()
    assert len(models) >= 12
    modalities = {m["modality"] for m in models}
    assert "image" in modalities
    assert "video" in modalities
    assert "voice" in modalities
    assert "music" in modalities

    flux = ai_model_manager.get_model("FLUX.1 Schnell")
    assert flux is not None
    assert flux["license"] == "Apache 2.0"
    assert flux["requires_gpu"] is True

    kokoro = ai_model_manager.get_model("Kokoro-82M")
    assert kokoro is not None
    assert kokoro["status"] == ModelStatus.READY

    whisper = ai_model_manager.get_model("Whisper")
    assert whisper is not None
    assert whisper["status"] == ModelStatus.READY

    ace_step = ai_model_manager.get_model("ACE-Step 1.5")
    assert ace_step is not None
    assert ace_step["status"] == ModelStatus.READY

def test_rembg_inference(tmp_path):
    img_path = str(tmp_path / "input.png")
    out_path = str(tmp_path / "output.png")

    img = Image.new("RGB", (100, 100), color="blue")
    draw = ImageDraw.Draw(img)
    draw.rectangle((25, 25, 75, 75), fill="yellow")
    img.save(img_path)

    res = ai_model_manager.remove_background(img_path, out_path)
    assert os.path.exists(res)
    with Image.open(res) as out_img:
        assert out_img.mode == "RGBA"
        assert out_img.size == (100, 100)

def test_kokoro_tts_and_whisper_stt(tmp_path):
    wav_path = str(tmp_path / "speech.wav")
    text = "Hello VYRON AI LABS"
    res = ai_model_manager.generate_speech(text, wav_path, voice="af_sarah")
    assert os.path.exists(res)
    assert os.path.getsize(res) > 1000

    transcription = ai_model_manager.transcribe_audio(wav_path)
    assert "text" in transcription
    assert len(transcription["text"]) > 0

def test_music_synthesis(tmp_path):
    music_path = str(tmp_path / "music.wav")
    res = ai_model_manager.generate_music_track(
        prompt="Cyberpunk beat",
        output_path=music_path,
        duration=3,
        bpm=128
    )
    assert os.path.exists(res)
    assert os.path.getsize(res) > 50000

def test_image_upscaling(tmp_path):
    img_path = str(tmp_path / "small.png")
    out_path = str(tmp_path / "upscaled.png")

    img = Image.new("RGB", (50, 50), color="red")
    img.save(img_path)

    res = ai_model_manager.upscale_and_enhance_image(img_path, out_path, scale_factor=2)
    assert os.path.exists(res)
    with Image.open(res) as out_img:
        assert out_img.size == (100, 100)
