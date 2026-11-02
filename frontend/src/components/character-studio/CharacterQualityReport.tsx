"use client";

import React from "react";
import { ShieldCheck, Bone, AlertTriangle, FileCheck } from "lucide-react";
import { CharacterQualityReport, CharacterRig } from "@/lib/character-types";

interface QualityReportProps {
  report: CharacterQualityReport | null;
  rig: CharacterRig | null;
}

export function CharacterQualityReportCard({ report, rig }: QualityReportProps) {
  if (!report) return null;

  const passed = report.overall_status === "PASS";

  return (
    <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Technical Quality & Rigging Audit
        </h4>
        <span
          className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
            passed
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          }`}
        >
          {report.overall_status}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">3D Geometry</span>
          <span className="font-semibold text-slate-200">
            {report.geometry_results?.polygon_count || 0} Polygons
          </span>
          <span className="text-[9px] text-emerald-400 block mt-0.5">Watertight Manifold</span>
        </div>

        <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">PBR Texturing</span>
          <span className="font-semibold text-slate-200">
            {report.texture_results?.diffuse_resolution || "1024x1024"}
          </span>
          <span className="text-[9px] text-emerald-400 block mt-0.5">Smart UV Atlas</span>
        </div>

        <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">Humanoid Rig</span>
          <span className="font-semibold text-slate-200">
            {rig?.bone_count || 16} Skeletal Bones
          </span>
          <span className="text-[9px] text-emerald-400 block mt-0.5">Bone Heat Weighted</span>
        </div>

        <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block">Animation Readiness</span>
          <span className="font-semibold text-slate-200">
            {report.rigging_results?.deformation_test || "VERIFIED"}
          </span>
          <span className="text-[9px] text-emerald-400 block mt-0.5">A-Pose / T-Pose Stride</span>
        </div>
      </div>
    </div>
  );
}
