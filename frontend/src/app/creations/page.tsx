"use client";

import React, { useState, useEffect } from "react";
import {
  FolderHeart,
  Image as ImageIcon,
  Video as VideoIcon,
  Mic,
  Music2,
  Trash2,
  Download,
  Layers
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui";
import { getToken } from "@/lib/api";

export default function CreationsPage() {
  const [creations, setCreations] = useState<any[]>([]);
  const [selectedModality, setSelectedModality] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const fetchCreations = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const url = selectedModality === "all"
        ? "/api/labs/creations"
        : `/api/labs/creations?modality=${selectedModality}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCreations(data);
      }
    } catch (err) {
      console.error("Failed to load creations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreations();
  }, [selectedModality]);

  const handleDelete = async (id: string) => {
    try {
      const token = getToken();
      const res = await fetch(`/api/labs/creations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCreations((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete creation", err);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <FolderHeart className="w-6 h-6 text-violet-400" />
              My Creations Library
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Persistent storage, preview, and download center for all your generated images, videos, voices, and music.
            </p>
          </div>

          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
            {[
              { id: "all", label: "All Assets" },
              { id: "image", label: "Images" },
              { id: "video", label: "Videos" },
              { id: "voice", label: "Voices" },
              { id: "music", label: "Music" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedModality(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedModality === f.id
                    ? "bg-violet-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading your creations library...</div>
        ) : creations.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20 space-y-3">
            <Layers className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">No creations found in this category</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Open Image Lab, Video Lab, Voice Lab, or Music Lab to create your first asset.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {creations.map((c) => (
              <Card key={c.id} className="p-4 bg-[#0d121c] border border-slate-800/80 flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div className="aspect-square bg-black/60 rounded-xl overflow-hidden flex items-center justify-center relative border border-slate-800/80">
                    {c.modality === "image" ? (
                      <img src={c.output_url} alt={c.title} className="w-full h-full object-cover" />
                    ) : c.modality === "video" ? (
                      <video src={c.output_url} controls className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-violet-400 p-4">
                        {c.modality === "voice" ? <Mic className="w-10 h-10" /> : <Music2 className="w-10 h-10" />}
                        <audio src={c.output_url} controls className="w-full max-w-[200px]" />
                      </div>
                    )}
                    <span className="absolute top-2 left-2 text-[9px] uppercase font-bold bg-black/80 px-2 py-0.5 rounded text-white border border-slate-700">
                      {c.modality}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-100 truncate">{c.title}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Model: {c.model_name}</p>
                    {c.prompt && (
                      <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 italic">
                        "{c.prompt}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[9px] text-slate-500">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={c.output_url}
                      download
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
