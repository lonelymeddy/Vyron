"""
VYRON AI — Video Assembly & Export Engine
"""

import os
import subprocess
import json
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

class ExportService:
    @staticmethod
    def get_video_info(file_path: str) -> Dict[str, Any]:
        cmd = [
            "ffprobe", "-v", "error", "-show_entries",
            "format=duration,size:stream=width,height,r_frame_rate,codec_name",
            "-of", "json", file_path
        ]
        try:
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
            data = json.loads(res.stdout)
            streams = data.get("streams", [])
            format_info = data.get("format", {})
            video_stream = next((s for s in streams if "width" in s), {})
            fps = 30.0
            if "r_frame_rate" in video_stream and "/" in video_stream["r_frame_rate"]:
                num, den = video_stream["r_frame_rate"].split("/")
                fps = float(num) / float(den) if float(den) > 0 else 30.0

            return {
                "duration": float(format_info.get("duration", 0.0)),
                "size": int(format_info.get("size", 0)),
                "width": int(video_stream.get("width", 0)),
                "height": int(video_stream.get("height", 0)),
                "fps": round(fps, 2),
                "codec": video_stream.get("codec_name", "h264")
            }
        except Exception as e:
            logger.warning(f"Failed to probe video {file_path}: {e}")
            return {"duration": 0.0, "size": 0, "width": 0, "height": 0, "fps": 30.0, "codec": "unknown"}

    @classmethod
    def assemble_and_export(
        cls,
        shot_filepaths: List[str],
        output_filepath: str,
        resolution: str = "original",
        target_fps: int = 30,
        audio_mode: str = "original",
        reference_audio_path: Optional[str] = None,
        custom_audio_path: Optional[str] = None,
        audio_volume: float = 1.0,
        progress_callback: Optional[callable] = None
    ) -> Dict[str, Any]:
        if not shot_filepaths:
            raise ValueError("No shot files provided for assembly")

        valid_files = [f for f in shot_filepaths if os.path.exists(f)]
        if not valid_files:
            raise FileNotFoundError("None of the specified shot files exist on disk")

        out_dir = Path(output_filepath).parent
        out_dir.mkdir(parents=True, exist_ok=True)
        temp_dir = out_dir / f"assembly_temp_{os.path.basename(output_filepath)}"
        temp_dir.mkdir(parents=True, exist_ok=True)

        concat_list_path = str(temp_dir / "shots_list.txt")
        with open(concat_list_path, "w") as f:
            for sf in valid_files:
                f.write(f"file '{os.path.abspath(sf)}'\n")

        raw_assembled = str(temp_dir / "raw_assembled.mp4")

        concat_cmd = [
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", concat_list_path,
            "-c:v", "libx264", "-preset", "fast",
            "-pix_fmt", "yuv420p",
            raw_assembled
        ]
        subprocess.run(concat_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

        final_cmd = ["ffmpeg", "-y", "-i", raw_assembled]

        vf_filters = []
        if resolution == "720p":
            vf_filters.append("scale=-2:720")
        elif resolution == "1080p":
            vf_filters.append("scale=-2:1080")

        if target_fps:
            vf_filters.append(f"fps={target_fps}")

        if vf_filters:
            final_cmd.extend(["-vf", ",".join(vf_filters)])

        audio_input_idx = None
        if audio_mode == "custom" and custom_audio_path and os.path.exists(custom_audio_path):
            final_cmd.extend(["-i", custom_audio_path])
            audio_input_idx = 1
        elif audio_mode == "original" and reference_audio_path and os.path.exists(reference_audio_path):
            final_cmd.extend(["-i", reference_audio_path])
            audio_input_idx = 1

        if audio_input_idx is not None and audio_mode != "muted":
            vol = max(0.0, min(2.0, audio_volume))
            final_cmd.extend([
                "-map", "0:v:0",
                "-map", f"{audio_input_idx}:a:0?",
                "-c:v", "libx264",
                "-c:a", "aac",
                "-af", f"volume={vol:.2f}",
                "-shortest",
                output_filepath
            ])
        else:
            final_cmd.extend([
                "-map", "0:v:0",
                "-an",
                "-c:v", "libx264",
                output_filepath
            ])

        try:
            subprocess.run(final_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        except subprocess.CalledProcessError as e:
            logger.error(f"Assembly export encoding failed: {e.stderr.decode('utf-8', errors='ignore')}")
            if os.path.exists(raw_assembled):
                os.replace(raw_assembled, output_filepath)

        try:
            if os.path.exists(concat_list_path):
                os.remove(concat_list_path)
            if os.path.exists(raw_assembled):
                os.remove(raw_assembled)
            os.rmdir(temp_dir)
        except Exception:
            pass

        info = cls.get_video_info(output_filepath)
        return {
            "status": "COMPLETED",
            "output_path": output_filepath,
            "duration": info["duration"],
            "resolution": f"{info['width']}x{info['height']}",
            "fps": info["fps"],
            "file_size": info["size"]
        }

export_service = ExportService()
