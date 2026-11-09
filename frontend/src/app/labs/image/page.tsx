"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Image as ImageIcon,
  Scissors,
  Maximize2,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Upload,
  ChevronDown,
  Wand2,
  Sliders
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Badge } from "@/components/ui";
import { getToken } from "@/lib/api";

const creativeStyles = [
  { id: "photorealistic", label: "Photorealistic", description: "Ultra-high detail with natural lighting and realistic textures" },
  { id: "cinematic", label: "Cinematic Film", description: "Dramatic 35mm film color grading with atmospheric depth" },
  { id: "digital_art", label: "Digital Artwork", description: "Vibrant conceptual illustration and modern digital painting" },
  { id: "fantasy", label: "Fantasy & Sci-Fi", description: "Mythical, otherworldly landscapes and futuristic aesthetics" },
];

export default function ImageLabPage() {
  const [activeTab, setActiveTab] = useState<"generate" | "edit">("generate");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("photorealistic");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [qualityLevel, setQualityLevel] = useState(4);
  const [seed, setSeed] = useState<number | "">("");

  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editOperation, setEditOperation] = useState("remove_background");
  const [scaleFactor, setScaleFactor] = useState(2);

  const [generating, setGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resultItem, setResultItem] = useState<any | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setEditImageFile(file);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("asset_type", "image");

    try {
      const token = getToken();
      const res = await fetch("/api/labs/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setEditImageUrl(data.url);
      } else {
        setErrorMessage("Image upload failed. Please try a different image.");
      }
    } catch (err) {
      setErrorMessage("Could not upload image. Please check your network connection.");
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMessage("Please enter an image description to generate.");
      return;
    }
    setGenerating(true);
    setErrorMessage("");
    setResultItem(null);

    try {
      const token = getToken();
      const res = await fetch("/api/labs/image/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          negative_prompt: negativePrompt,
          model_name: selectedStyle,
          aspect_ratio: aspectRatio,
          steps: qualityLevel,
          seed: seed === "" ? null : Number(seed),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.detail || "Image generation is temporarily unavailable. Please try again.");
      } else {
        setResultItem(data);
      }
    } catch (err: any) {
      setErrorMessage("Image generation is temporarily unavailable. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleEdit = async () => {
    if (!editImageUrl) {
      setErrorMessage("Please upload an image to edit.");
      return;
    }
    setGenerating(true);
    setErrorMessage("");
    setResultItem(null);

    try {
      const token = getToken();
      const res = await fetch("/api/labs/image/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: prompt || `Image edit: ${editOperation}`,
          image_url: editImageUrl,
          operation: editOperation,
          scale_factor: scaleFactor,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.detail || "Image editing could not be completed. Please try again.");
      } else {
        setResultItem(data);
      }
    } catch (err: any) {
      setErrorMessage("Image editing could not be completed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <ImageIcon className="w-6 h-6 text-violet-400" />
              Image Lab
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Create striking imagery, remove backgrounds, enhance resolution, and generate variations.
            </p>
          </div>

          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => { setActiveTab("generate"); setErrorMessage(""); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "generate"
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Images
            </button>
            <button
              onClick={() => { setActiveTab("edit"); setErrorMessage(""); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "edit"
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Edit & Enhance
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <Card className="p-5 bg-[#0d121c] border border-slate-800/80 space-y-4">
              {activeTab === "generate" ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-1.5">
                      Prompt
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe the image you want to create in detail..."
                      rows={4}
                      className="w-full bg-[#080b11] border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-200 block mb-1.5">
                        Creative Style
                      </label>
                      <select
                        value={selectedStyle}
                        onChange={(e) => setSelectedStyle(e.target.value)}
                        className="w-full bg-[#080b11] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                      >
                        {creativeStyles.map((s) => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-200 block mb-1.5">
                        Aspect Ratio
                      </label>
                      <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                        className="w-full bg-[#080b11] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                      >
                        <option value="1:1">1:1 Square</option>
                        <option value="16:9">16:9 Widescreen</option>
                        <option value="9:16">9:16 Portrait</option>
                        <option value="4:3">4:3 Standard</option>
                      </select>
                    </div>
                  </div>

                  {/* Progressive Disclosure: Advanced Creative Controls */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{showAdvanced ? "Hide Advanced Settings" : "Show Advanced Settings"}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                    </button>

                    {showAdvanced && (
                      <div className="mt-3 p-3 bg-[#080b11] border border-slate-800 rounded-xl space-y-3">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                            Avoid in Image (Negative Elements)
                          </label>
                          <input
                            type="text"
                            value={negativePrompt}
                            onChange={(e) => setNegativePrompt(e.target.value)}
                            placeholder="e.g. blurry, oversaturated, deformed"
                            className="w-full bg-[#0d121c] border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                              Detail Level: {qualityLevel}
                            </label>
                            <input
                              type="range"
                              min={2}
                              max={8}
                              value={qualityLevel}
                              onChange={(e) => setQualityLevel(Number(e.target.value))}
                              className="w-full accent-violet-500"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                              Creative Seed
                            </label>
                            <input
                              type="number"
                              value={seed}
                              onChange={(e) => setSeed(e.target.value === "" ? "" : Number(e.target.value))}
                              placeholder="Random"
                              className="w-full bg-[#0d121c] border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full mt-2 bg-violet-600 hover:bg-violet-500"
                  >
                    {generating ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating Artwork...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Generate Image
                      </span>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-1.5">
                      Upload Source Image
                    </label>
                    <label className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-violet-500 bg-[#080b11]">
                      <Upload className="w-5 h-5 text-violet-400 mb-1" />
                      <span className="text-xs text-slate-300">
                        {editImageFile ? editImageFile.name : "Choose an image file (PNG, JPG, WEBP)"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    {editImageUrl && (
                      <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Image uploaded and ready
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-1.5">
                      Creative Tool
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setEditOperation("remove_background")}
                        className={`p-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
                          editOperation === "remove_background"
                            ? "bg-violet-600/20 border-violet-500 text-white"
                            : "bg-[#080b11] border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <Scissors className="w-3.5 h-3.5 text-violet-400" />
                        Remove Background
                      </button>

                      <button
                        onClick={() => setEditOperation("upscale")}
                        className={`p-2.5 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
                          editOperation === "upscale"
                            ? "bg-violet-600/20 border-violet-500 text-white"
                            : "bg-[#080b11] border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                        Upscale & Restore
                      </button>
                    </div>
                  </div>

                  {editOperation === "upscale" && (
                    <div>
                      <label className="text-xs font-bold text-slate-200 block mb-1.5">
                        Enhancement Scale
                      </label>
                      <select
                        value={scaleFactor}
                        onChange={(e) => setScaleFactor(Number(e.target.value))}
                        className="w-full bg-[#080b11] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                      >
                        <option value={2}>2x High Clarity</option>
                        <option value={4}>4x Ultra High-Resolution</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-1.5">
                      Modification Instructions (Optional)
                    </label>
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Optional styling instructions..."
                      className="w-full bg-[#080b11] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <Button
                    onClick={handleEdit}
                    disabled={generating || !editImageUrl}
                    className="w-full mt-2 bg-violet-600 hover:bg-violet-500"
                  >
                    {generating ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processing Image...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Wand2 className="w-4 h-4" />
                        Apply Tool
                      </span>
                    )}
                  </Button>
                </>
              )}
            </Card>
          </div>

          <div className="lg:col-span-7">
            <Card className="p-6 bg-[#0d121c] border border-slate-800/80 min-h-[480px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Image Preview
                  </span>
                  {resultItem && (
                    <Badge variant="success" className="text-[10px]">
                      Ready
                    </Badge>
                  )}
                </div>

                {errorMessage && (
                  <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Notice</p>
                      <p className="mt-0.5 text-slate-300">{errorMessage}</p>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-center min-h-[340px] bg-black/60 rounded-xl border border-slate-800/80 overflow-hidden relative">
                  {generating ? (
                    <div className="text-center space-y-2">
                      <RefreshCw className="w-8 h-8 text-violet-400 animate-spin mx-auto" />
                      <p className="text-xs text-slate-400">Rendering high-resolution artwork...</p>
                    </div>
                  ) : resultItem ? (
                    <img
                      src={resultItem.output_url}
                      alt={resultItem.title}
                      className="max-h-[380px] object-contain rounded-lg shadow-xl"
                    />
                  ) : (
                    <div className="text-center space-y-2 text-slate-600">
                      <ImageIcon className="w-12 h-12 mx-auto" />
                      <p className="text-xs">Generated or edited artwork will appear here</p>
                    </div>
                  )}
                </div>
              </div>

              {resultItem && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-xs text-slate-400 truncate max-w-sm">
                    <p className="font-semibold text-slate-200 truncate">{resultItem.title}</p>
                    <p className="text-[10px] text-slate-500">Format: PNG</p>
                  </div>
                  <a href={resultItem.output_url} download>
                    <Button size="sm">
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Download Image
                    </Button>
                  </a>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
