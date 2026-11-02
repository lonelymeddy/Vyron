"use client";

import React from "react";
import { Settings2, Cpu, Box, Bone } from "lucide-react";

interface CharacterConfigurationProps {
  generationMode: "SINGLE_IMAGE" | "MULTI_IMAGE" | "ADVANCED";
  setGenerationMode: (mode: "SINGLE_IMAGE" | "MULTI_IMAGE" | "ADVANCED") => void;
  generateRig: boolean;
  setGenerateRig: (val: boolean) => void;
  targetPolycount: number;
  setTargetPolycount: (val: number) => void;
}

export function CharacterConfiguration({
  generationMode,
  setGenerationMode,
  generateRig,
  setGenerateRig,
  targetPolycount,
  setTargetPolycount,
}: CharacterConfigurationProps) {
  return (
    <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
      <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
        <Settings2 className="w-4 h-4 text-violet-400" />
        Internal Engine Generation Settings
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Mode */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-violet-400" />
            Reconstruction Strategy
          </label>
          <select
            value={generationMode}
            onChange={(e) => setGenerationMode(e.target.value as any)}
            className="w-full bg-[#07090e] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
          >
            <option value="SINGLE_IMAGE">Mode A — Single Image Volumetric</option>
            <option value="MULTI_IMAGE">Mode B — Multi-View Alignment</option>
            <option value="ADVANCED">Mode C — High-Fidelity Sculpt</option>
          </select>
        </div>

        {/* Target Polygons */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-violet-400" />
            Target Polygon Density
          </label>
          <select
            value={targetPolycount}
            onChange={(e) => setTargetPolycount(Number(e.target.value))}
            className="w-full bg-[#07090e] border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
          >
            <option value={15000}>Low-Poly (15k faces - Fast Preview)</option>
            <option value={30000}>Production Humanoid (30k faces)</option>
            <option value={60000}>Cinematic Master (60k faces)</option>
          </select>
        </div>

        {/* Humanoid Rig */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
            <Bone className="w-3.5 h-3.5 text-violet-400" />
            Humanoid Armature Rig
          </label>
          <div className="flex items-center h-9">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={generateRig}
                onChange={(e) => setGenerateRig(e.target.checked)}
                className="rounded border-slate-700 text-violet-600 focus:ring-violet-500 bg-slate-900"
              />
              <span>Generate 16-Bone Humanoid Armature</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
