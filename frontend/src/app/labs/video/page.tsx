"use client";

import React, { useState } from "react";
import {
  Video as VideoIcon,
  Sparkles,
  Scissors,
  Maximize2,
  FileAudio,
  Download,
  AlertCircle,
  RefreshCw,
  Upload,
  CheckCircle2
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Badge } from "@/components/ui";
import { getToken } from "@/lib/api";

export default function VideoLabPage() {
  const [activeTab, setActiveTab] = useState<"generate" | "utilities">("generate");
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("Wan 2.1");
  const [duration, setDuration] = useState(5);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("720p");

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [utilityOp, setUtilityOp] = useState<"trim" | "resize" | "extract_audio" | "thumbnail">("thumbnail");
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(5);

  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resultItem, setResultItem] = useState<any | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setVideoFile(file);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("asset_type", "video");

    try {
      const token = getToken();
      const res = await fetch("/api/labs/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setVideoUrl(data.url);
      }
    } catch (err) {
      console.error("Video upload failed", err);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMessage("Please enter a scene prompt for the video");
      return;
    }
    setProcessing(true);
    setErrorMessage("");
    setResultItem(null);

    try {
      const token = getToken();
      const res = await fetch("/api/labs/video/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          model_name: selectedModel,
          aspect_ratio: aspectRatio,
          duration,
          resolution,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.detail || "Video generation failed");
      } else {
        setResultItem(data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const handleUtility = async () => {
    if (!videoUrl) {
      setErrorMessage("Please upload a video file first");
      return;
    }
    setProcessing(true);
    setErrorMessage("");
    setResultItem(null);

    try {
      const token = getToken();
      const res = await fetch("/api/labs/video/edit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          operation: utilityOp,
          video_url: videoUrl,
          start_time: startTime,
          end_time: endTime,
          resolution,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.detail || "Video utility failed");
      } else {
        setResultItem(data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error occurred");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <VideoIcon className="w-6 h-6 text-violet-400" />
              Video Lab Studio
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Text-to-Video Synthesis (Wan 2.1, Wan 2.2, LTX-Video) & Native Processing Utilities
            </p>
          </div>

          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab("generate")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "generate"
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Text-to-Video
            </button>
            <button
              onClick={() => setActiveTab("utilities")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "utilities"
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Video Utilities & Editing
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
                      Scene Description & Motion Prompt
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g. Cinematic drone tracking shot gliding through a neon cyber city at night, rain pouring on glass skyscrapers..."
                      rows={4}
                      className="w-full bg-[#080b11] border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-200 block mb-1.5">
                        Video Foundation Engine
                      </label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full bg-[#080b11] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                      >
                        <option value="Wan 2.1">Wan 2.1 (Apache 2.0)</option>
                        <option value="Wan 2.2">Wan 2.2 I2V-A14B (Apache 2.0)</option>
                        <option value="LTX-Video">LTX-Video (Apache 2.0)</option>
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
                        <option value="16:9">16:9 Widescreen (1280x720)</option>
                        <option value="9:16">9:16 Vertical Story (720x1280)</option>
                        <option value="1:1">1:1 Square</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-200 block mb-1.5">
                        Target Duration
                      </label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full bg-[#080b11] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                      >
                        <option value={3}>3 Seconds</option>
                        <option value={5}>5 Seconds</option>
                        <option value={10}>10 Seconds</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-200 block mb-1.5">
                        Output Resolution
                      </label>
                      <select
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        className="w-full bg-[#080b11] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                      >
                        <option value="720p">720p HD</option>
                        <option value="1080p">1080p Full HD</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={processing}
                    className="w-full mt-2 bg-violet-600 hover:bg-violet-500"
                  >
                    {processing ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Queuing Video Render Worker...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Generate Video
                      </span>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-1.5">
                      Upload Video File
                    </label>
                    <label className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-violet-500 bg-[#080b11]">
                      <Upload className="w-5 h-5 text-violet-400 mb-1" />
                      <span className="text-xs text-slate-300">
                        {videoFile ? videoFile.name : "Choose an MP4/WEBM video"}
                      </span>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    {videoUrl && (
                      <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Video uploaded successfully
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-1.5">
                      Video Utility Operation
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setUtilityOp("thumbnail")}
                        className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
                          utilityOp === "thumbnail"
                            ? "bg-violet-600/20 border-violet-500 text-white"
                            : "bg-[#080b11] border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <VideoIcon className="w-3.5 h-3.5 text-violet-400" />
                        Thumbnail Extraction
                      </button>

                      <button
                        onClick={() => setUtilityOp("extract_audio")}
                        className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
                          utilityOp === "extract_audio"
                            ? "bg-violet-600/20 border-violet-500 text-white"
                            : "bg-[#080b11] border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <FileAudio className="w-3.5 h-3.5 text-emerald-400" />
                        Audio Extraction
                      </button>

                      <button
                        onClick={() => setUtilityOp("trim")}
                        className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
                          utilityOp === "trim"
                            ? "bg-violet-600/20 border-violet-500 text-white"
                            : "bg-[#080b11] border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <Scissors className="w-3.5 h-3.5 text-amber-400" />
                        Video Trimming
                      </button>

                      <button
                        onClick={() => setUtilityOp("resize")}
                        className={`p-2 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
                          utilityOp === "resize"
                            ? "bg-violet-600/20 border-violet-500 text-white"
                            : "bg-[#080b11] border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                        Video Resizing
                      </button>
                    </div>
                  </div>

                  {utilityOp === "trim" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-200 block mb-1">
                          Start Sec
                        </label>
                        <input
                          type="number"
                          value={startTime}
                          onChange={(e) => setStartTime(Number(e.target.value))}
                          className="w-full bg-[#080b11] border border-slate-800 rounded-xl p-2 text-xs text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-200 block mb-1">
                          End Sec
                        </label>
                        <input
                          type="number"
                          value={endTime}
                          onChange={(e) => setEndTime(Number(e.target.value))}
                          className="w-full bg-[#080b11] border border-slate-800 rounded-xl p-2 text-xs text-slate-100"
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleUtility}
                    disabled={processing || !videoUrl}
                    className="w-full mt-2 bg-violet-600 hover:bg-violet-500"
                  >
                    {processing ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processing Video Pipeline...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Scissors className="w-4 h-4" />
                        Execute Operation
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
                    Video Preview & Player
                  </span>
                  {resultItem && (
                    <Badge variant="success" className="text-[10px]">
                      Processed
                    </Badge>
                  )}
                </div>

                {errorMessage && (
                  <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Inference Worker Notice</p>
                      <p className="mt-0.5 text-slate-300">{errorMessage}</p>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex items-center justify-center min-h-[340px] bg-black/60 rounded-xl border border-slate-800/80 overflow-hidden relative">
                  {processing ? (
                    <div className="text-center space-y-2">
                      <RefreshCw className="w-8 h-8 text-violet-400 animate-spin mx-auto" />
                      <p className="text-xs text-slate-400">Processing media stream...</p>
                    </div>
                  ) : resultItem ? (
                    resultItem.mime_type?.startsWith("image") ? (
                      <img src={resultItem.output_url} alt="Thumbnail" className="max-h-[380px] object-contain rounded-lg" />
                    ) : (
                      <video src={resultItem.output_url} controls className="max-h-[380px] w-full object-contain rounded-lg" />
                    )
                  ) : (
                    <div className="text-center space-y-2 text-slate-600">
                      <VideoIcon className="w-12 h-12 mx-auto" />
                      <p className="text-xs">Generated or edited video preview will appear here</p>
                    </div>
                  )}
                </div>
              </div>

              {resultItem && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-xs text-slate-400 truncate max-w-sm">
                    <p className="font-semibold text-slate-200 truncate">{resultItem.title}</p>
                    <p className="text-[10px] text-slate-500">
                      Engine: {resultItem.model_name} • Format: {resultItem.mime_type}
                    </p>
                  </div>
                  <a href={resultItem.output_url} download>
                    <Button size="sm">
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Download Video Asset
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
