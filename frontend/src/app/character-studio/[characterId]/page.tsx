"use client";

import React, { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Skeleton, Toast } from "@/components/ui";
import { Box, Sparkles, RefreshCw, ArrowLeft, Video } from "lucide-react";
import { apiClient, Character } from "@/lib/api";
import { characterStudioApi } from "@/lib/character-api";
import {
  CharacterReferenceImage,
  CharacterGeneration,
  CharacterQualityReport,
  CharacterRig,
} from "@/lib/character-types";
import { Character3DViewer } from "@/components/character-studio/Character3DViewer";
import { GenerationPipeline } from "@/components/character-studio/GenerationPipeline";
import { ReferenceImageGallery } from "@/components/character-studio/ReferenceImageGallery";
import { CharacterQualityReportCard } from "@/components/character-studio/CharacterQualityReport";
import { CharacterExportControls } from "@/components/character-studio/CharacterExport";

function WorkspaceContent({ characterId }: { characterId: string }) {
  const [character, setCharacter] = useState<Character | null>(null);
  const [references, setReferences] = useState<CharacterReferenceImage[]>([]);
  const [activeGen, setActiveGen] = useState<CharacterGeneration | null>(null);
  const [qualityReport, setQualityReport] = useState<CharacterQualityReport | null>(null);
  const [rig, setRig] = useState<CharacterRig | null>(null);

  const [loading, setLoading] = useState(true);
  const [reconstructing, setReconstructing] = useState(false);
  const [toast, setToast] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const loadData = async () => {
    try {
      const [char, refs, rep, rigData] = await Promise.all([
        apiClient.characters.get(characterId),
        characterStudioApi.listReferences(characterId).catch(() => []),
        characterStudioApi.getQualityReport(characterId).catch(() => null),
        characterStudioApi.getRig(characterId).catch(() => null),
      ]);
      setCharacter(char);
      setReferences(refs);
      setQualityReport(rep);
      setRig(rigData);

      if ((char as any).active_generation_id) {
        const gen = await characterStudioApi.getGenerationStatus((char as any).active_generation_id).catch(() => null);
        setActiveGen(gen);
      }
    } catch (err: any) {
      setToast({ type: "error", text: err.message || "Failed to load character workspace" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [characterId]);

  // Polling generation status if running
  useEffect(() => {
    if (!activeGen || activeGen.status === "COMPLETED" || activeGen.status === "FAILED") return;

    const interval = setInterval(async () => {
      try {
        const gen = await characterStudioApi.getGenerationStatus(activeGen.id);
        setActiveGen(gen);
        if (gen.status === "COMPLETED") {
          loadData();
          clearInterval(interval);
        }
      } catch (err) {}
    }, 2500);

    return () => clearInterval(interval);
  }, [activeGen]);

  const handleRegenerate = async () => {
    setReconstructing(true);
    setToast(null);
    try {
      const gen = await characterStudioApi.startGeneration(characterId, {
        generation_mode: "SINGLE_IMAGE",
        generate_rig: true,
      });
      setActiveGen(gen);
      setToast({ type: "success", text: "New 3D reconstruction job queued!" });
    } catch (err: any) {
      setToast({ type: "error", text: err.message || "Failed to restart generation." });
    } finally {
      setReconstructing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (!character) {
    return (
      <Card className="p-8 text-center space-y-4">
        <p className="text-slate-300">Character not found.</p>
        <Link href="/character-studio">
          <Button size="sm">Back to Studio</Button>
        </Link>
      </Card>
    );
  }

  const modelAssetUrl = (character as any).model_asset_url;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/character-studio">
            <Button size="sm" variant="outline" className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Box className="w-5 h-5 text-violet-400" />
              {character.name}
            </h1>
            <p className="text-slate-400 text-xs">
              3D Studio Asset &bull; Created {new Date(character.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleRegenerate} isLoading={reconstructing}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Re-Sculpt 3D Model
          </Button>
          <Link href={`/create?character_id=${character.id}`}>
            <Button size="sm">
              <Video className="w-3.5 h-3.5 mr-1.5" />
              Use in AI Video
            </Button>
          </Link>
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.text} onClose={() => setToast(null)} />}

      {/* PIPELINE EXECUTION PROGRESS IF ACTIVE */}
      {activeGen && <GenerationPipeline generation={activeGen} />}

      {/* 3D VIEWER WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Character3DViewer modelUrl={modelAssetUrl} />
          <CharacterExportControls characterId={character.id} hasExport={!!modelAssetUrl} />
        </div>

        <div className="space-y-4">
          <ReferenceImageGallery references={references} primaryImageUrl={character.image_url} />
          <CharacterQualityReportCard report={qualityReport} rig={rig} />
        </div>
      </div>
    </div>
  );
}

function WorkspaceResolver({ params }: { params: Promise<{ characterId: string }> }) {
  const resolved = use(params);
  return <WorkspaceContent characterId={resolved.characterId} />;
}

export default function CharacterStudioWorkspace({ params }: { params: Promise<{ characterId: string }> }) {
  return (
    <AppLayout>
      <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
        <WorkspaceResolver params={params} />
      </Suspense>
    </AppLayout>
  );
}
