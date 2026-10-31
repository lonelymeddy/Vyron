import os
import subprocess
import logging
from typing import List, Optional
from app.services.storage import storage_service

logger = logging.getLogger(__name__)

class VideoAssemblyService:
    @staticmethod
    def assemble_shots(shot_urls: List[str], output_filename: str) -> str:
        if not shot_urls:
            return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"

        local_files = []
        for url in shot_urls:
            local_path = storage_service.get_file_path(url)
            if local_path and os.path.exists(local_path):
                local_files.append(local_path)

        if len(local_files) >= 2:
            try:
                out_dir = os.path.join("static", "uploads", "assembled")
                os.makedirs(out_dir, exist_ok=True)
                concat_list = os.path.join(out_dir, f"concat_{output_filename}.txt")
                with open(concat_list, "w") as f:
                    for lf in local_files:
                        f.write(f"file '{lf}'\n")

                out_path = os.path.join(out_dir, f"{output_filename}.mp4")
                cmd = [
                    "ffmpeg", "-y", "-f", "concat", "-safe", "0",
                    "-i", concat_list, "-c", "copy", out_path
                ]
                subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                if os.path.exists(out_path):
                    return f"/static/uploads/assembled/{output_filename}.mp4"
            except Exception as e:
                logger.warning(f"FFmpeg assembly failed, falling back to first shot: {e}")

        return shot_urls[0]

video_assembly_service = VideoAssemblyService()
