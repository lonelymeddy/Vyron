"use client";

import React from "react";
import { CheckCircle2, Loader2, AlertCircle, Clock, Layers } from "lucide-react";
import { CharacterGeneration } from "@/lib/character-types";

interface GenerationPipelineProps {
  generation: CharacterGeneration;
}

const PIPELINES = [
  { num: 1, name: "Image Ingestion & Silhouette Analysis", stages: [1, 2, 3, 4, 5] },
  { num: 2, name: "AI 3D Geometry Reconstruction", stages: [6, 7, 8, 9, 10] },
  { num: 3, name: "Mesh Repair & PBR Textures", stages: [11, 12, 13, 14, 15] },
  { num: 4, name: "Humanoid Rigging & Export", stages: [16, 17, 18, 19, 20] },
];

export function GenerationPipeline({ generation }: GenerationPipelineProps) {
  const currentP = generation.current_pipeline;
  const currentS = generation.current_stage;
  const isFailed = generation.status === "FAILED";
  const isComplete = generation.status === "COMPLETED";

  return (
    <div className="space-y-4 p-5 bg-[#0a0e17] border border-slate-800 rounded-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-violet-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Internal 4-Pipeline Reconstruction Status
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-violet-400">{generation.progress_percentage}%</span>
          <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isFailed ? "bg-rose-500" : isComplete ? "bg-emerald-500" : "bg-violet-500"
              }`}
              style={{ width: `${generation.progress_percentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {PIPELINES.map((p) => {
          const isPassed = !isFailed && (isComplete || currentP > p.num);
          const isCurrent = !isComplete && !isFailed && currentP === p.num;

          return (
            <div
              key={p.num}
              className={`p-3 rounded-xl border text-xs transition-all ${
                isPassed
                  ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                  : isCurrent
                  ? "bg-violet-950/30 border-violet-500/50 text-violet-200"
                  : isFailed && currentP === p.num
                  ? "bg-rose-950/20 border-rose-500/40 text-rose-300"
                  : "bg-slate-900/40 border-slate-800 text-slate-500"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-[10px] tracking-wider uppercase">Pipeline {p.num}</span>
                {isPassed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                ) : isFailed && currentP === p.num ? (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>
              <p className="font-semibold text-slate-200 truncate">{p.name}</p>
              <p className="text-[10px] text-slate-400 mt-1">
                {isPassed
                  ? "5 of 5 Stages Done"
                  : isCurrent
                  ? `Stage ${currentS} Active`
                  : isFailed && currentP === p.num
                  ? "Pipeline Stalled"
                  : "Pending"}
              </p>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-slate-400 pt-2 border-t border-slate-800 flex items-center justify-between">
        <span>Active Stage: <strong className="text-slate-200">{generation.stage_name}</strong></span>
        <span>Version: #{generation.generation_version}</span>
      </div>
    </div>
  );
}
