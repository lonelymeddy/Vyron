"use client";

import React from "react";
import { CharacterReferenceImage } from "@/lib/character-types";
import { Compass, CheckCircle2 } from "lucide-react";

interface ReferenceImageGalleryProps {
  references: CharacterReferenceImage[];
  primaryImageUrl?: string;
}

export function ReferenceImageGallery({ references, primaryImageUrl }: ReferenceImageGalleryProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Compass className="w-4 h-4 text-violet-400" />
          Ingested Character Reference Angles ({references.length + (primaryImageUrl ? 1 : 0)})
        </h4>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {primaryImageUrl && (
          <div className="relative group border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
            <img src={primaryImageUrl} alt="Primary Portrait" className="w-full h-32 object-cover" />
            <div className="absolute top-2 left-2 bg-violet-600/80 backdrop-blur text-white text-[10px] px-1.5 py-0.5 rounded font-bold">
              PRIMARY
            </div>
            <div className="p-1.5 text-[10px] text-slate-400 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <span>Front Angle</span>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            </div>
          </div>
        )}

        {references.map((ref) => (
          <div key={ref.id} className="relative group border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
            <img
              src={ref.processed_file_path || ref.original_file_path}
              alt="Reference View"
              className="w-full h-32 object-cover"
            />
            <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur text-slate-200 text-[10px] px-1.5 py-0.5 rounded uppercase font-semibold">
              {ref.view_type}
            </div>
            <div className="p-1.5 text-[10px] text-slate-400 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
              <span>Confidence: {Math.round(ref.confidence * 100)}%</span>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
