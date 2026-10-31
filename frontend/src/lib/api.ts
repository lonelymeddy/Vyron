const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://vyron-1uaj.onrender.com";
export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "");

export type GenerationMode = "CHARACTER_REPLACEMENT" | "FULL_CGI_RECREATION" | "ORIGINAL_CGI_CREATION";

export type JobStatus = "DRAFT" | "UPLOADING" | "ANALYZING" | "QUEUED" | "PROCESSING" | "POST_PROCESSING" | "COMPLETED" | "FAILED";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Character {
  id: string;
  name: string;
  description?: string;
  image_url: string;
  created_at: string;
}

export interface SourceVideo {
  id: string;
  project_id: string;
  file_name: string;
  video_url: string;
  duration_seconds?: number;
  resolution?: string;
  fps?: number;
  file_size?: number;
  created_at: string;
}

export interface GeneratedVideo {
  id: string;
  generation_id: string;
  video_url: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  resolution?: string;
  created_at: string;
}

export interface Generation {
  id: string;
  project_id: string;
  provider_name: string;
  status: JobStatus;
  progress_percentage: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  jobs?: any[];
  generated_videos?: GeneratedVideo[];
}

export interface ProjectSettings {
  environment?: string;
  outfit?: string;
  vehicle?: string;
  lighting?: string;
  weather?: string;
  camera_motion?: string;
  animation_style?: string;
  aspect_ratio?: string;
  resolution?: string;
  [key: string]: any;
}

export interface Project {
  id: string;
  user_id: string;
  character_id?: string;
  title: string;
  description?: string;
  generation_mode: GenerationMode;
  status: JobStatus;
  prompt_instructions?: string;
  settings?: ProjectSettings;
  created_at: string;
  updated_at: string;
  character?: Character;
  source_videos?: SourceVideo[];
  generations?: Generation[];
}

export interface CreditBalance {
  balance: number;
  updated_at: string;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  description: string;
  created_at: string;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vyron_token");
}

export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("vyron_token", token);
  }
}

export function clearToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("vyron_token");
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
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
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    throw new Error(
      netErr?.message
        ? `Network request failed: ${netErr.message}`
        : "Failed to connect to the VYRON AI server. Please check your network connection."
    );
  }

  if (response.status === 401) {
    clearToken();
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      (typeof errorData.detail === "string" && errorData.detail) ||
      (Array.isArray(errorData.detail) &&
        errorData.detail.map((d: any) => d.msg || JSON.stringify(d)).join(", ")) ||
      errorData.message ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json();
}

export const apiClient = {
  auth: {
    login: async (email: string, password: string) => {
      return request<Token>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
    },

    register: async (email: string, password: string, fullName?: string) => {
      return request<Token>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, full_name: fullName }),
      });
    },

    getMe: async () => {
      return request<User>("/api/auth/me");
    },

    logout: () => {
      clearToken();
    },
  },

  characters: {
    list: async () => {
      return request<Character[]>("/api/characters");
    },

    get: async (id: string) => {
      return request<Character>(`/api/characters/${id}`);
    },

    uploadImage: async (file: File, name: string, description?: string) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      if (description) {
        formData.append("description", description);
      }

      return request<Character>("/api/characters/upload", {
        method: "POST",
        body: formData,
      });
    },

    update: async (id: string, data: { name?: string; description?: string }) => {
      return request<Character>(`/api/characters/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    delete: async (id: string) => {
      return request<{ message: string }>(`/api/characters/${id}`, {
        method: "DELETE",
      });
    },
  },

  projects: {
    list: async (params?: { search?: string; status?: string; mode?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.append("search", params.search);
      if (params?.status) searchParams.append("status", params.status);
      if (params?.mode) searchParams.append("mode", params.mode);

      const queryString = searchParams.toString();
      const endpoint = `/api/projects${queryString ? `?${queryString}` : ""}`;
      return request<Project[]>(endpoint);
    },

    get: async (id: string) => {
      return request<Project>(`/api/projects/${id}`);
    },

    create: async (data: {
      title: string;
      description?: string;
      character_id?: string | null;
      generation_mode?: GenerationMode;
      prompt_instructions?: string;
      settings?: Record<string, any>;
    }) => {
      return request<Project>("/api/projects", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    uploadSourceVideo: async (projectId: string, file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      return request<SourceVideo>(`/api/projects/${projectId}/source-video/upload`, {
        method: "POST",
        body: formData,
      });
    },

    delete: async (id: string) => {
      return request<{ message: string }>(`/api/projects/${id}`, {
        method: "DELETE",
      });
    },
  },

  generations: {
    list: async () => {
      return request<Generation[]>("/api/generations");
    },

    get: async (id: string) => {
      return request<Generation>(`/api/generations/${id}`);
    },

    start: async (projectId: string, aiProvider?: string) => {
      return request<Generation>("/api/generations", {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          provider_name: aiProvider || "mock_engine",
        }),
      });
    },
  },

  credits: {
    getBalance: async () => {
      return request<CreditBalance>("/api/credits/balance");
    },

    getHistory: async () => {
      return request<CreditTransaction[]>("/api/credits/history");
    },
  },
};
