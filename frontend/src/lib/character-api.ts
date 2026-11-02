import { getToken, API_BASE_URL } from "./api";
import {
  CharacterReferenceImage,
  CharacterGeneration,
  CharacterAsset,
  CharacterRig,
  CharacterQualityReport,
  CharacterEngineStatus,
} from "./character-types";

async function charRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      (typeof errorData.detail === "string" && errorData.detail) ||
      errorData.message ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

export const characterStudioApi = {
  getSystemStatus: async () => {
    return charRequest<CharacterEngineStatus>("/api/system/character-engine/status");
  },

  getModelsManifest: async () => {
    return charRequest<Record<string, any>>("/api/system/character-engine/models");
  },

  listReferences: async (characterId: string) => {
    return charRequest<CharacterReferenceImage[]>(`/api/characters/${characterId}/references`);
  },

  uploadReference: async (characterId: string, file: File, viewType?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (viewType) {
      formData.append("view_type", viewType);
    }
    return charRequest<CharacterReferenceImage>(`/api/characters/${characterId}/references`, {
      method: "POST",
      body: formData,
    });
  },

  startGeneration: async (
    characterId: string,
    config?: {
      generation_mode?: "SINGLE_IMAGE" | "MULTI_IMAGE" | "ADVANCED";
      target_polycount?: number;
      generate_rig?: boolean;
      texture_resolution?: number;
    }
  ) => {
    return charRequest<CharacterGeneration>(`/api/characters/${characterId}/generate`, {
      method: "POST",
      body: JSON.stringify(config || {}),
    });
  },

  getGenerationStatus: async (generationId: string) => {
    return charRequest<CharacterGeneration>(`/api/character-generations/${generationId}`);
  },

  retryGeneration: async (generationId: string) => {
    return charRequest<CharacterGeneration>(`/api/character-generations/${generationId}/retry`, {
      method: "POST",
    });
  },

  getAssets: async (characterId: string) => {
    return charRequest<CharacterAsset[]>(`/api/characters/${characterId}/assets`);
  },

  getQualityReport: async (characterId: string) => {
    return charRequest<CharacterQualityReport | null>(`/api/characters/${characterId}/quality-report`);
  },

  getRig: async (characterId: string) => {
    return charRequest<CharacterRig | null>(`/api/characters/${characterId}/rig`);
  },

  getExportDownloadUrl: (characterId: string, format: "glb" | "obj" | "fbx" = "glb") => {
    return `${API_BASE_URL}/api/characters/${characterId}/export?format=${format}`;
  },
};
