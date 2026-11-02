"use client";

import React, { useState } from "react";
import { UploadCloud, Image as ImageIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui";

interface CharacterUploadProps {
  onFileSelected: (file: File) => void;
  selectedFile: File | null;
  uploading?: boolean;
}

export function CharacterUpload({ onFileSelected, selectedFile, uploading }: CharacterUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Unsupported format. Please upload JPG, PNG, or WebP.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("File exceeds 15MB limit.");
      return;
    }
    setError(null);
    onFileSelected(file);
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
          dragOver
            ? "border-violet-500 bg-violet-950/20"
            : "border-slate-800 hover:border-slate-700 bg-slate-950/40"
        }`}
        onClick={() => document.getElementById("char-file-input")?.click()}
      >
        <input
          id="char-file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-violet-600/10 flex items-center justify-center border border-violet-500/20 text-violet-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              Drag & Drop reference portrait or photograph
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports JPEG, PNG, WebP up to 15MB &bull; 100% processed locally
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-950/30 p-2.5 rounded-lg border border-rose-800/40">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {selectedFile && (
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center text-slate-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200 truncate max-w-xs">{selectedFile.name}</p>
              <p className="text-[10px] text-slate-400">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          </div>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
            Ready to Ingest
          </span>
        </div>
      )}
    </div>
  );
}
