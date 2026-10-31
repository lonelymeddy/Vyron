from typing import Dict, Optional, List, Any
from app.ai_engine.base import BaseAIProvider
from app.ai_engine.mock import MockEngineProvider
from app.ai_engine.kling import KlingAIProvider
from app.ai_engine.runway import RunwayAIProvider
from app.config import settings
from app.db.models import GenerationMode
from app.ai_engine.capabilities import ProviderCapability

class AIProviderRegistry:
    def __init__(self):
        self._providers: Dict[str, BaseAIProvider] = {}
        self._register_default_providers()

    def _register_default_providers(self):
        self.register_provider(MockEngineProvider())
        self.register_provider(KlingAIProvider(api_key=settings.KLING_API_KEY, base_url=settings.KLING_API_BASE_URL))
        self.register_provider(RunwayAIProvider(api_key=settings.RUNWAY_API_KEY, base_url=settings.RUNWAY_API_BASE_URL))

    def register_provider(self, provider: BaseAIProvider):
        self._providers[provider.provider_name] = provider

    def get_provider(self, provider_name: str) -> Optional[BaseAIProvider]:
        norm = provider_name.lower()
        if "runway" in norm:
            norm = "runway"
        elif "kling" in norm:
            norm = "kling"
        elif "mock" in norm:
            norm = "mock_engine"
        return self._providers.get(norm)

    def select_best_provider(self, mode: GenerationMode, preferred_provider: Optional[str] = None) -> BaseAIProvider:
        if preferred_provider:
            p = self.get_provider(preferred_provider)
            if p and p.supports_mode(mode) and p.is_configured():
                return p

        for name, p in self._providers.items():
            if name != "mock_engine" and p.supports_mode(mode) and p.is_configured():
                return p

        return self._providers["mock_engine"]

    def list_available_providers(self) -> List[Dict[str, Any]]:
        result = []
        for name, provider in self._providers.items():
            result.append({
                "name": provider.provider_name,
                "display_name": provider.display_name,
                "is_configured": provider.is_configured(),
                "capabilities": [c.value for c in provider.capabilities.capabilities],
                "supported_resolutions": provider.capabilities.supported_resolutions,
                "supported_durations": provider.capabilities.supported_durations,
                "supports_character_consistency": provider.capabilities.supports_character_consistency,
                "disclaimer": provider.capabilities.disclaimer
            })
        return result

ai_registry = AIProviderRegistry()
