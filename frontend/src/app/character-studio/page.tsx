"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Skeleton } from "@/components/ui";
import { Box, Sparkles, Plus, Cpu, Layers, ExternalLink } from "lucide-react";
import { apiClient, Character } from "@/lib/api";
import { characterStudioApi } from "@/lib/character-api";
import { CharacterEngineStatus } from "@/lib/character-types";

export default function CharacterStudioIndexPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [engineStatus, setEngineStatus] = useState<CharacterEngineStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const [chars, status] = await Promise.all([
          apiClient.characters.list(),
          characterStudioApi.getSystemStatus().catch(() => null),
        ]);
        setCharacters(chars);
        setEngineStatus(status);
      } catch (err) {
        console.error("Failed to load studio assets:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Box className="w-6 h-6 text-violet-400" />
              Internal 3D Character Studio
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              Production 3D Character Reconstruction Engine &bull; Zero External AI APIs &bull; 100% Local Inference
            </p>
          </div>

          <Link href="/character-studio/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Reconstruct New 3D Character
            </Button>
          </Link>
        </div>

        {/* SYSTEM STATUS CARD */}
        {engineStatus && (
          <Card className="p-4 bg-[#0a0e17] border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Native Reconstruction Engine Online</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    Offline Ready
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Device: {engineStatus.system.device_type.toUpperCase()} &bull; Blender 4.0:{" "}
                  {engineStatus.system.blender_installed ? "Active" : "Not Found"} &bull; Rigging Engine: Operational
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Layers className="w-4 h-4 text-violet-400" />
              <span>4 Processing Pipelines &bull; 20 Verified Stages</span>
            </div>
          </Card>
        )}

        {/* CHARACTER ROSTER */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : characters.length === 0 ? (
          <Card className="p-12 text-center border-dashed border-slate-800">
            <Box className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No 3D Character Assets Yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Upload photographs of a character or portrait to initiate AI 3D reconstruction and automated humanoid rigging.
            </p>
            <Link href="/character-studio/create">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Generate First Character
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {characters.map((c) => (
              <Card key={c.id} className="p-4 flex flex-col justify-between hover:border-violet-500/50 transition-all">
                <div className="space-y-3">
                  <div className="h-48 rounded-lg overflow-hidden bg-slate-950 border border-slate-800 relative">
                    <img src={c.image_url} alt={c.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                      <span className="text-[9px] bg-slate-950/80 backdrop-blur text-violet-300 border border-violet-500/30 px-1.5 py-0.5 rounded font-bold uppercase">
                        3D Character
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-100 truncate">{c.name}</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Uploaded {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center gap-2">
                  <Link href={`/character-studio/${c.id}`} className="flex-1">
                    <Button size="sm" className="w-full text-xs">
                      <Box className="w-3.5 h-3.5 mr-1.5 text-violet-300" />
                      Open in 3D Studio
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
