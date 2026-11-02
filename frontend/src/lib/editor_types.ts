import type { JobStatus } from "./api";

export interface ShotAdjustment {
  id?: string;
  project_id: string;
  shot_id: number;
  pos_x: number;
  pos_y: number;
  pos_z: number;
  scale: number;
  rotation_y: number;
  ground_offset: number;
  speed: number;
  offset_sec: number;
  root_movement: boolean;
  camera_pos_x: number;
  camera_pos_y: number;
  camera_pos_z: number;
  camera_fov: number;
  camera_movement: string;
  light_intensity: number;
  light_color_temp: number;
  light_direction: string;
  environment_alignment: number;
  custom_params?: Record<string, any>;
}

export interface ShotRenderVersion {
  id: string;
  project_id: string;
  shot_id: number;
  version_number: number;
  video_url: string;
  duration?: number;
  resolution?: string;
  fps?: number;
  is_selected: boolean;
  status: JobStatus;
  adjustments_snapshot?: Record<string, any>;
  created_at: string;
}

export interface QualityControlReport {
  id: string;
  project_id: string;
  shot_id?: number;
  target_type: string;
  video_path: string;
  total_frames: number;
  missing_frames: number;
  black_frames: number;
  fps_measured?: number;
  has_audio: boolean;
  character_detected: boolean;
  continuity_status: string;
  issues: Array<{
    category: string;
    severity: string;
    description: string;
    timestamp?: number;
    frame_number?: number;
  }>;
  manual_review_required: boolean;
  review_flags: string[];
  created_at: string;
}

export interface ExportJob {
  id: string;
  project_id: string;
  status: JobStatus;
  progress_percentage: number;
  resolution: string;
  fps: number;
  format: string;
  output_url?: string;
  duration?: number;
  file_size?: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface EditorShotData {
  shot_id: number;
  start_time: number;
  end_time: number;
  duration: number;
  start_frame: number;
  end_frame: number;
  camera_type: string;
  has_character: boolean;
  action_description: string;
  reconstruction_approach: string;
  adjustments: ShotAdjustment;
  versions: ShotRenderVersion[];
  active_version?: ShotRenderVersion;
  qc_report?: QualityControlReport;
}

export interface EditorProjectData {
  project_id: string;
  title: string;
  generation_mode: string;
  status: JobStatus;
  reference_video_url?: string;
  reference_metadata?: {
    duration: number;
    width: number;
    height: number;
    fps: number;
    total_frames: number;
    has_audio: boolean;
    audio_codec?: string;
  };
  reconstructed_video_url?: string;
  total_duration: number;
  shots: EditorShotData[];
  overall_qc?: QualityControlReport;
  active_export?: ExportJob;
}
