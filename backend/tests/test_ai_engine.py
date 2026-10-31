import pytest
import os
from unittest.mock import patch, MagicMock
from app.ai_engine.capabilities import (
    ProviderCapability, MOCK_CAPABILITIES, RUNWAY_CAPABILITIES, KLING_CAPABILITIES
)
from app.ai_engine.registry import ai_registry
from app.ai_engine.schemas import (
    ShotPlan, GenerationJobRequest, ProductionSettings
)
from app.ai_engine.kling import KlingAIProvider
from app.ai_engine.runway import RunwayAIProvider
from app.ai_engine.mock import MockEngineProvider
from app.ai_engine.exceptions import (
    ProviderNotConfiguredError, ProviderAuthenticationError
)
from app.db.models import GenerationMode, JobStatus
from app.services.character_service import character_service
from app.services.customization import customization_parser
from app.services.video_analysis import video_analysis_service
from app.services.video_assembly import video_assembly_service

def test_capabilities_definitions():
    assert MOCK_CAPABILITIES.supports(ProviderCapability.IMAGE_TO_VIDEO)
    assert RUNWAY_CAPABILITIES.supports(ProviderCapability.VIDEO_TO_VIDEO)
    assert KLING_CAPABILITIES.supports(ProviderCapability.CAMERA_CONTROL)
    assert not KLING_CAPABILITIES.supports(ProviderCapability.VIDEO_TO_VIDEO)

def test_ai_provider_registry_discovery():
    providers = ai_registry.list_available_providers()
    assert len(providers) >= 3
    names = [p["name"] for p in providers]
    assert "mock_engine" in names
    assert "runway" in names
    assert "kling" in names

    mock_p = ai_registry.get_provider("mock_engine")
    assert mock_p is not None
    assert mock_p.is_configured()

    # When unconfigured, selects mock fallback
    selected = ai_registry.select_best_provider(GenerationMode.ORIGINAL_CGI_CREATION)
    assert selected is not None

@pytest.mark.asyncio
async def test_kling_provider_unconfigured_error():
    kling = KlingAIProvider(api_key=None)
    assert not kling.is_configured()

    shot = ShotPlan(
        shot_id="s1", scene_number=1, prompt_text="A", character_action="A",
        camera_direction="cinematic_orbit", environment_desc="A"
    )
    req = GenerationJobRequest(
        job_id="j1", project_id="p1", mode=GenerationMode.ORIGINAL_CGI_CREATION,
        character_image_url="https://example.com/c.png"
    )
    with pytest.raises(ProviderNotConfiguredError):
        await kling.submit_shot(shot, req)

@pytest.mark.asyncio
async def test_runway_provider_unconfigured_error():
    runway = RunwayAIProvider(api_key="")
    assert not runway.is_configured()

    shot = ShotPlan(
        shot_id="s1", scene_number=1, prompt_text="A", character_action="A",
        camera_direction="cinematic_orbit", environment_desc="A"
    )
    req = GenerationJobRequest(
        job_id="j1", project_id="p1", mode=GenerationMode.ORIGINAL_CGI_CREATION,
        character_image_url="https://example.com/c.png"
    )
    with pytest.raises(ProviderNotConfiguredError):
        await runway.submit_shot(shot, req)

@pytest.mark.asyncio
async def test_mock_engine_shot_lifecycle():
    mock_p = MockEngineProvider()
    shot = ShotPlan(
        shot_id="shot_lifecycle_1", scene_number=1, prompt_text="Tactical operative",
        character_action="Approaching vehicle", camera_direction="cinematic_orbit",
        environment_desc="erangel_pubg"
    )
    req = GenerationJobRequest(
        job_id="j1", project_id="p1", mode=GenerationMode.ORIGINAL_CGI_CREATION,
        character_image_url="https://example.com/c.png"
    )
    sub = await mock_p.submit_shot(shot, req)
    assert sub.task_id.startswith("mock_task_")

    st = await mock_p.get_task_status(sub.task_id)
    assert st.status == JobStatus.COMPLETED
    assert st.video_url is not None

def test_character_service_analysis():
    prof = character_service.analyze_character_image("test_operative.png", character_id="char_123")
    assert prof.face_detected is True
    assert len(prof.distinguishing_tokens) > 0
    enhancement = character_service.format_character_prompt_enhancement(prof)
    assert "Preserve character identity" in enhancement

def test_customization_prompt_parser():
    prompt = "A character walks through a deserted PUBG military compound at sunset, approaches a sports car"
    settings = customization_parser.parse_prompt(prompt)
    assert settings.environment.location == "erangel_pubg"
    assert settings.environment.lighting == "sunset_dramatic"
    assert settings.vehicle == "sports_car_gt"

def test_video_analysis_and_storyboard():
    plan = video_analysis_service.analyze_source_video("/nonexistent.mp4", project_id="proj_1")
    assert plan.total_scenes >= 1
    assert len(plan.scenes) == plan.total_scenes
    assert plan.scenes[0].scene_number == 1
    assert "Shot 1:" in plan.scenes[0].generation_instructions

def test_video_assembly_fallback():
    urls = ["https://example.com/shot1.mp4", "https://example.com/shot2.mp4"]
    result = video_assembly_service.assemble_shots(urls, output_filename="test_out")
    assert result == "https://example.com/shot1.mp4"
