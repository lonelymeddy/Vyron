"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card } from "@/components/ui";
import {
  Sparkles,
  Upload,
  Video,
  User as UserIcon,
  Film,
  Wand2,
  CheckCircle2,
  AlertCircle,
  X
} from "lucide-react";

type GenerationMode = "CHARACTER_REPLACEMENT" | "FULL_CGI_RECREATION" | "ORIGINAL_CGI_CREATION";

export default function CreateVideoPage() {
  const router = useRouter();

  const [mode, setMode] = useState<GenerationMode>("CHARACTER_REPLACEMENT");
  const [title, setTitle] = useState("My Cinematic Project");
  const [characterImage, setCharacterImage] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState("");
  const [referenceVideo, setReferenceVideo] = useState<string | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<{ duration: number; resolution: string } | null>(null);
  const [prompt, setPrompt] = useState("");

  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("1080p");
  const [visualStyle, setVisualStyle] = useState("pubg_cinematic");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCharacterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please upload a valid image file (PNG, JPG, WEBP).");
        return;
      }
      setError(null);
      const url = URL.createObjectURL(file);
      setCharacterImage(url);
      if (!characterName) setCharacterName(file.name.split(".")[0]);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        setError("Please upload a valid video file (MP4, MOV, WEBM).");
        return;
      }
      setError(null);
      const url = URL.createObjectURL(file);
      setReferenceVideo(url);
      setVideoMetadata({ duration: 15, resolution: "1080p" });
    }
  };

  const handleSubmit = async () => {
    if (!characterImage) {
      setError("A character reference image is required to generate cinematic 3D videos.");
      return;
    }

    if ((mode === "CHARACTER_REPLACEMENT" || mode === "FULL_CGI_RECREATION") && !referenceVideo) {
      setError(`Mode '${mode.replace(/_/g, " ")}' requires a reference video.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem("vyron_token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const charRes = await fetch("http://localhost:8000/api/characters", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: characterName || "Custom Character",
          image_url: characterImage
        })
      });
      const charData = charRes.ok ? await charRes.json() : null;

      const projRes = await fetch("http://localhost:8000/api/projects", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: title || "Untitled CGI Project",
          generation_mode: mode,
          character_id: charData?.id,
          prompt_instructions: prompt,
          settings: {
            aspect_ratio: aspectRatio,
            resolution: resolution,
            visual_style: visualStyle
          }
        })
      });

      if (!projRes.ok) {
        throw new Error("Failed to create project record.");
      }

      const projData = await projRes.json();

      const genRes = await fetch("http://localhost:8000/api/generations", {
        method: "POST",
        headers,
        body: JSON.stringify({
          project_id: projData.id,
          provider_name: "mock_engine"
        })
      });

      if (!genRes.ok) {
        const genErr = await genRes.json();
        throw new Error(genErr.detail || "Failed to start AI generation job.");
      }

      router.push(`/generations`);
    } catch (err: any) {
      setError(err.message || "Error submitting video generation job.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-violet-400" />
            AI Video Creator Studio
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure character input, video references, and generation parameters for high-end cinematic 3D output.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4 hover:text-white" />
            </button>
          </div>
        )}

        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-200">1. Select Generation Mode</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              onClick={() => setMode("CHARACTER_REPLACEMENT")}
              className={`cursor-pointer transition-all ${
                mode === "CHARACTER_REPLACEMENT"
                  ? "border-violet-500 bg-violet-950/20 glow-violet"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Video className="w-5 h-5 text-violet-400" />
                {mode === "CHARACTER_REPLACEMENT" && <CheckCircle2 className="w-4 h-4 text-violet-400" />}
              </div>
              <h3 className="font-bold text-slate-100 text-sm">Mode 1: Character Replacement</h3>
              <p className="text-xs text-slate-400 mt-1">
                Replace original video avatar with your custom character while maintaining original movement.
              </p>
            </Card>

            <Card
              onClick={() => setMode("FULL_CGI_RECREATION")}
              className={`cursor-pointer transition-all ${
                mode === "FULL_CGI_RECREATION"
                  ? "border-indigo-500 bg-indigo-950/20 glow-violet"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Film className="w-5 h-5 text-indigo-400" />
                {mode === "FULL_CGI_RECREATION" && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
              </div>
              <h3 className="font-bold text-slate-100 text-sm">Mode 2: Full CGI Recreation</h3>
              <p className="text-xs text-slate-400 mt-1">
                Recreate entire scenes, camera angles and lighting in PUBG-inspired 3D virtual environments.
              </p>
            </Card>

            <Card
              onClick={() => setMode("ORIGINAL_CGI_CREATION")}
              className={`cursor-pointer transition-all ${
                mode === "ORIGINAL_CGI_CREATION"
                  ? "border-cyan-500 bg-cyan-950/20 glow-violet"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Wand2 className="w-5 h-5 text-cyan-400" />
                {mode === "ORIGINAL_CGI_CREATION" && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
              </div>
              <h3 className="font-bold text-slate-100 text-sm">Mode 3: Original CGI Creation</h3>
              <p className="text-xs text-slate-400 mt-1">
                Generate brand new cinematic 3D CGI video directly from text instructions and assets.
              </p>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-violet-400" />
                Character Reference Image *
              </label>
              {characterImage && (
                <button
                  onClick={() => setCharacterImage(null)}
                  className="text-[11px] text-rose-400 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>

            {characterImage ? (
              <div className="relative rounded-lg overflow-hidden border border-slate-700 h-48 bg-slate-900 flex items-center justify-center">
                <img src={characterImage} alt="Character Preview" className="h-full object-contain" />
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-800 hover:border-violet-500/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors h-48 bg-slate-900/40">
                <Upload className="w-8 h-8 text-slate-500 mb-2" />
                <span className="text-xs font-medium text-slate-300">Click to upload character photo</span>
                <span className="text-[10px] text-slate-500 mt-1">Supports PNG, JPG, WEBP (Max 20MB)</span>
                <input type="file" accept="image/*" onChange={handleCharacterUpload} className="hidden" />
              </label>
            )}

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Character Name</label>
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="e.g. Ghost Operator"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
              />
            </div>
          </Card>

          <Card className={`space-y-4 ${mode === "ORIGINAL_CGI_CREATION" ? "opacity-40 pointer-events-none" : ""}`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                <Video className="w-4 h-4 text-indigo-400" />
                Reference CGI / Gameplay Video {mode !== "ORIGINAL_CGI_CREATION" && "*"}
              </label>
              {referenceVideo && (
                <button
                  onClick={() => setReferenceVideo(null)}
                  className="text-[11px] text-rose-400 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>

            {referenceVideo ? (
              <div className="relative rounded-lg overflow-hidden border border-slate-700 h-48 bg-slate-900 flex items-center justify-center">
                <video src={referenceVideo} controls className="h-full object-contain" />
              </div>
            ) : (
              <label className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors h-48 bg-slate-900/40">
                <Film className="w-8 h-8 text-slate-500 mb-2" />
                <span className="text-xs font-medium text-slate-300">Click to upload reference video</span>
                <span className="text-[10px] text-slate-500 mt-1">MP4, MOV, WEBM (Up to 1080p, max 100MB)</span>
                <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
              </label>
            )}

            {videoMetadata && (
              <div className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-900 p-2 rounded border border-slate-800">
                <span>Duration: ~{videoMetadata.duration}s</span>
                <span>Resolution: {videoMetadata.resolution}</span>
              </div>
            )}
          </Card>
        </div>

        <Card className="space-y-3">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-cyan-400" />
            Natural-Language Creative Instructions
          </label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Place my character inside a cinematic PUBG-inspired city environment, wearing a black tactical suit, holding a sniper rifle at sunset..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
          />
        </Card>

        <Card className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200"
              >
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Portrait Shorts)</option>
                <option value="1:1">1:1 (Square)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Resolution</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200"
              >
                <option value="1080p">1080p FHD</option>
                <option value="4K">4K UHD Engine</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Visual Style</label>
              <select
                value={visualStyle}
                onChange={(e) => setVisualStyle(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200"
              >
                <option value="pubg_cinematic">PUBG Realistic CGI</option>
                <option value="cyberpunk">Cyberpunk Neon</option>
                <option value="photorealistic">Photorealistic</option>
              </select>
            </div>
          </div>

          <Button
            size="lg"
            isLoading={submitting}
            onClick={handleSubmit}
            className="w-full md:w-auto px-8"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Generate Video (10 CR)
          </Button>
        </Card>
      </div>
    </AppLayout>
  );
}
