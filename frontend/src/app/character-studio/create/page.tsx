"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Input, Toast } from "@/components/ui";
import { Box, Sparkles, ArrowRight } from "lucide-react";
import { CharacterUpload } from "@/components/character-studio/CharacterUpload";
import { CharacterConfiguration } from "@/components/character-studio/CharacterConfiguration";
import { apiClient } from "@/lib/api";
import { characterStudioApi } from "@/lib/character-api";

export default function CreateCharacterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Settings
  const [generationMode, setGenerationMode] = useState<"SINGLE_IMAGE" | "MULTI_IMAGE" | "ADVANCED">("SINGLE_IMAGE");
  const [generateRig, setGenerateRig] = useState(true);
  const [targetPolycount, setTargetPolycount] = useState(30000);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setToast({ type: "error", text: "Please select an image file to upload." });
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      // 1. Upload initial character
      const charName = name.trim() || selectedFile.name.split(".")[0];
      const char = await apiClient.characters.uploadImage(selectedFile, charName, description);

      // 2. Trigger 3D generation
      await characterStudioApi.startGeneration(char.id, {
        generation_mode: generationMode,
        generate_rig: generateRig,
        target_polycount: targetPolycount,
      });

      // 3. Route to character studio workspace
      router.push(`/character-studio/${char.id}`);
    } catch (err: any) {
      setToast({ type: "error", text: err.message || "Failed to initiate 3D generation." });
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            Reconstruct 3D Character
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Upload character portrait photos to execute the 4-pipeline internal 3D reconstruction engine.
          </p>
        </div>

        {toast && <Toast type={toast.type} message={toast.text} onClose={() => setToast(null)} />}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Character Name"
                placeholder="e.g. Cyberpunk Operative"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Description (Optional)"
                placeholder="Tactical armored warrior..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <CharacterUpload
              selectedFile={selectedFile}
              onFileSelected={(file) => {
                setSelectedFile(file);
                if (!name) setName(file.name.split(".")[0]);
              }}
            />

            <CharacterConfiguration
              generationMode={generationMode}
              setGenerationMode={setGenerationMode}
              generateRig={generateRig}
              setGenerateRig={setGenerateRig}
              targetPolycount={targetPolycount}
              setTargetPolycount={setTargetPolycount}
            />

            <Button type="submit" isLoading={loading} disabled={!selectedFile} className="w-full">
              <Box className="w-4 h-4 mr-2" />
              Launch Internal 3D Reconstruction Pipeline
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>
        </form>
      </div>
    </AppLayout>
  );
}
