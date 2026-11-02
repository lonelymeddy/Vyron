"""
VYRON AI — Internal 3D Character Model Loader
Handles loading and initializations for local reconstruction models.
"""

import os
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from app.character_engine.models.model_capabilities import get_system_capabilities
from app.character_engine.models.model_registry import model_registry

logger = logging.getLogger(__name__)

class ModelLoader:
    def __init__(self):
        self._loaded_models = {}

    def is_model_available(self, model_id: str) -> bool:
        status = model_registry.get_installed_status()
        for m in status.get("models", []):
            if m["id"] == model_id and m.get("installed"):
                return True
        return False

    def get_preferred_reconstruction_method(self) -> str:
        """
        Determines the optimal local reconstruction strategy based on real hardware:
        - 'triposr_cuda': if TripoSR weights and CUDA GPU are present
        - 'vyron_volumetric_hull': CPU-optimized native voxel-to-mesh reconstruction
        """
        caps = get_system_capabilities()
        if caps["has_cuda"] and self.is_model_available("triposr"):
            return "triposr_cuda"
        return "vyron_volumetric_hull"

model_loader = ModelLoader()
