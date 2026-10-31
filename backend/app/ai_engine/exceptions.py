class AIProviderError(Exception):
    def __init__(self, message: str, provider_name: str = "unknown", status_code: int = 500):
        super().__init__(message)
        self.message = message
        self.provider_name = provider_name
        self.status_code = status_code

class ProviderNotConfiguredError(AIProviderError):
    def __init__(self, provider_name: str):
        super().__init__(
            f"AI Provider '{provider_name}' is not configured on this server. "
            "Please configure the corresponding API key in environment variables or choose an available provider.",
            provider_name=provider_name,
            status_code=400
        )

class UnsupportedCapabilityError(AIProviderError):
    def __init__(self, provider_name: str, capability: str):
        super().__init__(
            f"Provider '{provider_name}' does not support requested capability '{capability}'.",
            provider_name=provider_name,
            status_code=400
        )

class ProviderAuthenticationError(AIProviderError):
    def __init__(self, provider_name: str, detail: str = ""):
        super().__init__(
            f"Authentication failed for provider '{provider_name}': {detail}",
            provider_name=provider_name,
            status_code=401
        )

class ProviderRateLimitError(AIProviderError):
    def __init__(self, provider_name: str, retry_after: int = 60):
        super().__init__(
            f"Provider '{provider_name}' rate limit exceeded. Retry after {retry_after} seconds.",
            provider_name=provider_name,
            status_code=429
        )
        self.retry_after = retry_after

class ShotGenerationError(AIProviderError):
    def __init__(self, shot_index: int, reason: str, provider_name: str = "unknown"):
        super().__init__(
            f"Shot #{shot_index} generation failed via {provider_name}: {reason}",
            provider_name=provider_name,
            status_code=502
        )
        self.shot_index = shot_index
