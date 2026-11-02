"use client";

import React, { useState } from "react";
import { Download, Box, Check, FileDown } from "lucide-react";
import { Button } from "@/components/ui";
import { characterStudioApi } from "@/lib/character-api";

interface CharacterExportProps {
  characterId: string;
  hasExport: boolean;
}

export function CharacterExportControls({ characterId, hasExport }: CharacterExportProps) {
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const handleDownload = (format: "glb" | "obj" | "fbx") => {
    setDownloadingFormat(format);
    const url = characterStudioApi.getExportDownloadUrl(characterId, format);
    window.open(url, "_blank");
    setTimeout(() => setDownloadingFormat(null), 1500);
  };

  return (
    <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <FileDown className="w-4 h-4 text-violet-400" />
          Export Character 3D Assets
        </h4>
        <span className="text-[10px] text-slate-400">PBR Textures & Armature Embedded</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          onClick={() => handleDownload("glb")}
          disabled={!hasExport || downloadingFormat === "glb"}
          className="text-xs"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Download GLB (Web / Real-time)
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => handleDownload("obj")}
          disabled={!hasExport || downloadingFormat === "obj"}
          className="text-xs"
        >
          <Box className="w-3.5 h-3.5 mr-1.5" />
          Download OBJ (Geometry Mesh)
        </Button>
      </div>
    </div>
  );
}
