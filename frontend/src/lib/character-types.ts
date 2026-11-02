export interface CharacterReferenceImage {
  id: string;
  character_id: string;
  original_file_path: string;
  processed_file_path?: string;
  mask_file_path?: string;
  view_type: string;
  confidence: number;
  dimensions?: string;
  quality_metadata?: Record<string, any>;
  created_at: string;
}

export interface PipelineExecution {
  id: string;
  generation_id: string;
  pipeline_number: number;
  stage_number: number;
  stage_name: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "SKIPPED";
  input_metadata?: Record<string, any>;
  output_metadata?: Record<string, any>;
  started_at?: string;
  completed_at?: string;
  error_details?: string;
}

export interface CharacterAsset {
  id: string;
  character_id: string;
  generation_id?: string;
  asset_type: string;
  file_path: string;
  file_format: string;
  file_size?: number;
  metadata_json?: Record<string, any>;
  created_at: string;
}

export interface CharacterRig {
  id: string;
  character_id: string;
  asset_id: string;
  skeleton_type: string;
  bone_count: number;
  rig_status: string;
  has_deformation_tested: boolean;
  validation_results?: Record<string, any>;
  created_at: string;
}

export interface CharacterQualityReport {
  id: string;
  generation_id: string;
  geometry_results?: {
    vertex_count?: number;
    polygon_count?: number;
    is_valid_3d?: boolean;
    watertight?: boolean;
  };
  texture_results?: {
    pbr_materials_linked?: boolean;
    uv_mapping_valid?: boolean;
    diffuse_resolution?: string;
  };
  rigging_results?: {
    skeleton_type?: string;
    bone_count?: number;
    skinning_method?: string;
    deformation_test?: string;
  };
  export_results?: {
    formats_exported?: string[];
    delivery_glb?: string;
    file_integrity_verified?: boolean;
  };
  overall_status: "PASS" | "WARNING" | "FAIL";
  created_at: string;
}

export interface CharacterGeneration {
  id: string;
  character_id: string;
  generation_version: number;
  generation_mode: "SINGLE_IMAGE" | "MULTI_IMAGE" | "ADVANCED";
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  current_pipeline: number;
  current_stage: number;
  stage_name: string;
  progress_percentage: number;
  configuration?: Record<string, any>;
  error_details?: string;
  created_at: string;
  completed_at?: string;
  pipeline_executions?: PipelineExecution[];
  assets?: CharacterAsset[];
  quality_report?: CharacterQualityReport;
}

export interface CharacterEngineStatus {
  system: {
    device_type: string;
    has_cuda: boolean;
    gpu_name?: string;
    vram_mb: number;
    blender_installed: boolean;
    blender_version?: string;
    ffmpeg_installed: boolean;
    mediapipe_installed: boolean;
    trimesh_installed: boolean;
    supports_fast_gpu_inference: boolean;
    supports_blender_rigging: boolean;
    reconstruction_engine: string;
  };
  models: Array<{
    id: string;
    name: string;
    license: string;
    installed: boolean;
    local_path?: string;
    category: string;
    description: string;
  }>;
  offline_mode_capable: boolean;
}
