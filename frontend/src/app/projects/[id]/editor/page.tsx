"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Badge, Skeleton, Toast } from "@/components/ui";
import {
  ArrowLeft, Play, Pause, RotateCcw, SkipBack, SkipForward,
  Sliders, Layers, CheckCircle2, AlertTriangle, AlertCircle,
  Download, RefreshCw, ZoomIn, ZoomOut, Volume2, VolumeX,
  Eye, Film, Video, ShieldCheck, Settings, History
} from "lucide-react";
import {
  apiClient, EditorProjectData, EditorShotData, ShotAdjustment,
  ShotRenderVersion, QualityControlReport, ExportJob
} from "@/lib/api";

function EditorContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [data, setData] = useState<EditorProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedShotId, setSelectedShotId] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [comparisonMode, setComparisonMode] = useState<"side-by-side" | "overlay">("side-by-side");
  const [overlaySplit, setOverlaySplit] = useState(50);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [audioMuted, setAudioMuted] = useState(false);
  const [audioVolume, setAudioVolume] = useState(1.0);
  const [savingAdjustments, setSavingAdjustments] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [qcRunning, setQcRunning] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportJob, setExportJob] = useState<ExportJob | null>(null);
  const [exportResolution, setExportResolution] = useState("1080p");
  const [exportFps, setExportFps] = useState(30);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [activeAdjustments, setActiveAdjustments] = useState<Partial<ShotAdjustment>>({});
  const [activeTab, setActiveTab] = useState<"character" | "camera" | "lighting" | "versions" | "qc">("character");

  const refVideoRef = useRef<HTMLVideoElement>(null);
  const reconVideoRef = useRef<HTMLVideoElement>(null);

  const loadEditorData = async () => {
    try {
      const res = await apiClient.editor.getData(projectId);
      setData(res);
      if (res.shots.length > 0) {
        const currentShot = res.shots.find((s: EditorShotData) => s.shot_id === selectedShotId) || res.shots[0];
        setSelectedShotId(currentShot.shot_id);
        setActiveAdjustments(currentShot.adjustments || {});
      }
      if (res.active_export) {
        setExportJob(res.active_export);
      }
    } catch (err: any) {
      console.error("Failed to load editor data:", err);
      setToastMessage({ type: "error", text: err.message || "Failed to load project editor data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      loadEditorData();
    }
  }, [projectId]);

  const selectedShot = data?.shots.find((s) => s.shot_id === selectedShotId) || data?.shots[0];

  useEffect(() => {
    if (selectedShot) {
      setActiveAdjustments(selectedShot.adjustments || {});
    }
  }, [selectedShotId]);

  const togglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);

    if (refVideoRef.current) {
      if (nextState) refVideoRef.current.play().catch(() => {});
      else refVideoRef.current.pause();
    }
    if (reconVideoRef.current) {
      if (nextState) reconVideoRef.current.play().catch(() => {});
      else reconVideoRef.current.pause();
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const time = e.currentTarget.currentTime;
    setCurrentTime(time);
    if (e.currentTarget === refVideoRef.current && reconVideoRef.current) {
      if (Math.abs(reconVideoRef.current.currentTime - time) > 0.15) {
        reconVideoRef.current.currentTime = time;
      }
    }
  };

  const seekTo = (time: number) => {
    setCurrentTime(time);
    if (refVideoRef.current) refVideoRef.current.currentTime = time;
    if (reconVideoRef.current) reconVideoRef.current.currentTime = time;
  };

  const stepFrame = (forward: boolean) => {
    const step = 1 / 30;
    const target = Math.max(0, currentTime + (forward ? step : -step));
    seekTo(target);
  };

  const handleSaveAdjustment = async (key: keyof ShotAdjustment, value: any) => {
    const updated = { ...activeAdjustments, [key]: value };
    setActiveAdjustments(updated);
  };

  const commitAdjustments = async () => {
    if (!selectedShot) return;
    setSavingAdjustments(true);
    try {
      const saved = await apiClient.editor.updateAdjustments(projectId, selectedShot.shot_id, activeAdjustments);
      setActiveAdjustments(saved);
      setToastMessage({ type: "success", text: `Adjustments saved for Shot #${selectedShot.shot_id}` });
      await loadEditorData();
    } catch (err: any) {
      setToastMessage({ type: "error", text: err.message || "Failed to save adjustments." });
    } finally {
      setSavingAdjustments(false);
    }
  };

  const handleRegenerateShot = async () => {
    if (!selectedShot) return;
    setRegenerating(true);
    try {
      await apiClient.editor.regenerateShot(
        projectId,
        selectedShot.shot_id,
        selectedShot.start_time,
        selectedShot.end_time
      );
      setToastMessage({ type: "success", text: `Shot #${selectedShot.shot_id} regenerated successfully!` });
      await loadEditorData();
    } catch (err: any) {
      setToastMessage({ type: "error", text: err.message || "Shot regeneration failed." });
    } finally {
      setRegenerating(false);
    }
  };

  const handleSelectVersion = async (versionId: string) => {
    if (!selectedShot) return;
    try {
      await apiClient.editor.selectVersion(projectId, selectedShot.shot_id, versionId);
      setToastMessage({ type: "success", text: `Activated shot version.` });
      await loadEditorData();
    } catch (err: any) {
      setToastMessage({ type: "error", text: err.message || "Failed to switch version." });
    }
  };

  const handleRunQc = async () => {
    setQcRunning(true);
    try {
      const qc = await apiClient.editor.runQualityControl(projectId, selectedShot?.shot_id);
      setToastMessage({ type: "success", text: `QC inspection completed. Status: ${qc.continuity_status}` });
      await loadEditorData();
    } catch (err: any) {
      setToastMessage({ type: "error", text: err.message || "Quality check failed." });
    } finally {
      setQcRunning(false);
    }
  };

  const handleTriggerExport = async () => {
    setExporting(true);
    try {
      const job = await apiClient.editor.triggerExport(projectId, {
        resolution: exportResolution,
        fps: exportFps,
        format: "mp4",
        audio_config: {
          mode: audioMuted ? "muted" : "original",
          volume: audioVolume
        }
      });
      setExportJob(job);
      setToastMessage({ type: "success", text: "Production export job submitted." });

      const poll = setInterval(async () => {
        try {
          const status = await apiClient.editor.getExportStatus(projectId, job.id);
          setExportJob(status);
          if (status.status === "COMPLETED" || status.status === "FAILED") {
            clearInterval(poll);
            setExporting(false);
            if (status.status === "COMPLETED") {
              setToastMessage({ type: "success", text: "Video assembly and export completed!" });
            } else {
              setToastMessage({ type: "error", text: status.error_message || "Export failed." });
            }
          }
        } catch {
          clearInterval(poll);
          setExporting(false);
        }
      }, 2000);

    } catch (err: any) {
      setToastMessage({ type: "error", text: err.message || "Failed to initiate export." });
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[480px] lg:col-span-2 rounded-2xl" />
            <Skeleton className="h-[480px] rounded-2xl" />
          </div>
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout>
        <Card className="text-center py-16 max-w-lg mx-auto space-y-4 border-slate-800">
          <Film className="w-12 h-12 text-slate-600 mx-auto" />
          <h2 className="text-lg font-bold text-slate-100">Editor Data Unavailable</h2>
          <p className="text-xs text-slate-400">Could not initialize production workspace for this project.</p>
          <Link href={`/projects/${projectId}`}>
            <Button size="sm">Back to Project</Button>
          </Link>
        </Card>
      </AppLayout>
    );
  }

  const activeShotVideoUrl = selectedShot?.active_version?.video_url || data.reconstructed_video_url;

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <Link
              href={`/projects/${projectId}`}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">{data.title}</h1>
                <Badge variant="purple" className="text-[10px] tracking-wider font-mono border-violet-500/40 text-violet-300">
                  CINEMATIC STUDIO
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                Mode: <span className="text-slate-200 font-medium">{data.generation_mode.replace(/_/g, " ")}</span> &bull; Total Duration: {data.total_duration}s &bull; Shots: {data.shots.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRunQc}
              disabled={qcRunning}
              className="text-xs"
            >
              <ShieldCheck className={`w-3.5 h-3.5 mr-1.5 ${qcRunning ? "animate-spin" : "text-emerald-400"}`} />
              {qcRunning ? "Analyzing..." : "Run QC Check"}
            </Button>

            <Button
              size="sm"
              onClick={() => setExportModalOpen(true)}
              className="bg-violet-600 hover:bg-violet-500 text-xs shadow-lg shadow-violet-900/30 font-semibold"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export Production
            </Button>
          </div>
        </div>

        {toastMessage && (
          <Toast
            type={toastMessage.type}
            message={toastMessage.text}
            onClose={() => setToastMessage(null)}
          />
        )}

        {/* WORKSPACE UPPER: COMPARISON PLAYER & REFINEMENT CONTROLS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COMPARISON VIEWPORT */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between px-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">View Mode:</span>
                <button
                  onClick={() => setComparisonMode("side-by-side")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${comparisonMode === "side-by-side" ? "bg-violet-600/30 text-violet-300 border border-violet-500/40 font-semibold" : "hover:text-white"}`}
                >
                  Side-by-Side
                </button>
                <button
                  onClick={() => setComparisonMode("overlay")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${comparisonMode === "overlay" ? "bg-violet-600/30 text-violet-300 border border-violet-500/40 font-semibold" : "hover:text-white"}`}
                >
                  Overlay Split
                </button>
              </div>

              <div className="flex items-center gap-3 font-mono text-[11px]">
                <span>Time: {currentTime.toFixed(2)}s / {data.total_duration.toFixed(2)}s</span>
              </div>
            </div>

            <Card className="p-3 bg-black/95 border-slate-800 rounded-2xl overflow-hidden glow-violet">
              {comparisonMode === "side-by-side" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video flex flex-col justify-center border border-slate-800">
                    <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-mono bg-black/70 text-slate-300 backdrop-blur border border-slate-700">
                      ORIGINAL REFERENCE
                    </span>
                    {data.reference_video_url ? (
                      <video
                        ref={refVideoRef}
                        src={data.reference_video_url}
                        onTimeUpdate={handleTimeUpdate}
                        muted={audioMuted}
                        className="w-full h-full object-contain"
                        playsInline
                      />
                    ) : (
                      <div className="text-center p-6 text-xs text-slate-500">No reference video available</div>
                    )}
                  </div>

                  <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video flex flex-col justify-center border border-violet-900/40">
                    <span className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-mono bg-violet-950/80 text-violet-200 backdrop-blur border border-violet-800">
                      RECONSTRUCTED (SHOT #{selectedShot?.shot_id})
                    </span>
                    {activeShotVideoUrl ? (
                      <video
                        ref={reconVideoRef}
                        src={activeShotVideoUrl}
                        muted
                        className="w-full h-full object-contain"
                        playsInline
                      />
                    ) : (
                      <div className="text-center p-6 text-xs text-slate-500">Rendering preview pending</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden bg-slate-950 aspect-video border border-slate-800">
                  {data.reference_video_url && (
                    <video
                      ref={refVideoRef}
                      src={data.reference_video_url}
                      onTimeUpdate={handleTimeUpdate}
                      muted={audioMuted}
                      className="absolute inset-0 w-full h-full object-contain"
                      playsInline
                    />
                  )}
                  {activeShotVideoUrl && (
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `polygon(${overlaySplit}% 0, 100% 0, 100% 100%, ${overlaySplit}% 100%)` }}
                    >
                      <video
                        ref={reconVideoRef}
                        src={activeShotVideoUrl}
                        muted
                        className="w-full h-full object-contain"
                        playsInline
                      />
                    </div>
                  )}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-violet-400 shadow-md cursor-ew-resize z-20 flex items-center justify-center"
                    style={{ left: `${overlaySplit}%` }}
                  >
                    <div className="w-5 h-5 -ml-2.5 rounded-full bg-violet-500 flex items-center justify-center shadow text-[9px] text-white font-bold select-none">
                      &harr;
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={overlaySplit}
                    onChange={(e) => setOverlaySplit(Number(e.target.value))}
                    className="absolute inset-0 opacity-0 cursor-ew-resize w-full h-full z-30"
                  />
                  <div className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-mono bg-black/70 text-slate-300">
                    Original &larr; &bull; &rarr; Reconstructed
                  </div>
                </div>
              )}

              {/* TRANSPORT CONTROLS */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80 px-2">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => stepFrame(false)}
                    title="Previous Frame"
                    className="p-2 h-8 w-8 text-slate-400 hover:text-white"
                  >
                    <SkipBack className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    onClick={togglePlay}
                    className="h-8 w-8 p-0 rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-900/40"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => stepFrame(true)}
                    title="Next Frame"
                    className="p-2 h-8 w-8 text-slate-400 hover:text-white"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => seekTo(0)}
                    title="Restart"
                    className="p-2 h-8 w-8 text-slate-400 hover:text-white ml-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setAudioMuted(!audioMuted)}
                    className="p-1.5 text-slate-400 hover:text-white rounded transition-colors"
                    title={audioMuted ? "Unmute Reference Audio" : "Mute Audio"}
                  >
                    {audioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={audioVolume}
                    onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                    className="w-16 accent-violet-500 h-1 bg-slate-800 rounded cursor-pointer"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* SHOT REFINEMENT PANEL */}
          <div className="space-y-4">
            <Card className="p-4 bg-slate-900/90 border-slate-800 rounded-2xl flex flex-col h-full">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-violet-400" />
                  <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                    Shot #{selectedShot?.shot_id} Refinement
                  </h3>
                </div>
                <Badge variant="charcoal" className="text-[10px] border-slate-700 text-slate-400">
                  {selectedShot?.duration}s
                </Badge>
              </div>

              {/* TABS */}
              <div className="flex border-b border-slate-800/80 my-2 text-[11px] gap-1 overflow-x-auto py-1">
                <button
                  onClick={() => setActiveTab("character")}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${activeTab === "character" ? "bg-violet-600/30 text-violet-300 font-semibold" : "text-slate-400 hover:text-white"}`}
                >
                  Character
                </button>
                <button
                  onClick={() => setActiveTab("camera")}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${activeTab === "camera" ? "bg-violet-600/30 text-violet-300 font-semibold" : "text-slate-400 hover:text-white"}`}
                >
                  Camera
                </button>
                <button
                  onClick={() => setActiveTab("lighting")}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${activeTab === "lighting" ? "bg-violet-600/30 text-violet-300 font-semibold" : "text-slate-400 hover:text-white"}`}
                >
                  Lighting
                </button>
                <button
                  onClick={() => setActiveTab("versions")}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${activeTab === "versions" ? "bg-violet-600/30 text-violet-300 font-semibold" : "text-slate-400 hover:text-white"}`}
                >
                  Versions ({selectedShot?.versions.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab("qc")}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${activeTab === "qc" ? "bg-violet-600/30 text-violet-300 font-semibold" : "text-slate-400 hover:text-white"}`}
                >
                  QC
                </button>
              </div>

              {/* TAB CONTENT */}
              <div className="space-y-3.5 py-2 flex-1 overflow-y-auto max-h-[380px] pr-1">
                {activeTab === "character" && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Horizontal Position (X)</span>
                        <span className="font-mono text-slate-200">{activeAdjustments.pos_x || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="-150"
                        max="150"
                        value={activeAdjustments.pos_x || 0}
                        onChange={(e) => handleSaveAdjustment("pos_x", parseFloat(e.target.value))}
                        className="w-full accent-violet-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Vertical Position (Y)</span>
                        <span className="font-mono text-slate-200">{activeAdjustments.pos_y || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="-150"
                        max="150"
                        value={activeAdjustments.pos_y || 0}
                        onChange={(e) => handleSaveAdjustment("pos_y", parseFloat(e.target.value))}
                        className="w-full accent-violet-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Character Scale Multiplier</span>
                        <span className="font-mono text-slate-200">{(activeAdjustments.scale || 1.0).toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.05"
                        value={activeAdjustments.scale || 1.0}
                        onChange={(e) => handleSaveAdjustment("scale", parseFloat(e.target.value))}
                        className="w-full accent-violet-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Ground Contact Offset</span>
                        <span className="font-mono text-slate-200">{activeAdjustments.ground_offset || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={activeAdjustments.ground_offset || 0}
                        onChange={(e) => handleSaveAdjustment("ground_offset", parseFloat(e.target.value))}
                        className="w-full accent-violet-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {activeTab === "camera" && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Field of View (FOV)</span>
                        <span className="font-mono text-slate-200">{activeAdjustments.camera_fov || 50}°</span>
                      </div>
                      <input
                        type="range"
                        min="24"
                        max="85"
                        value={activeAdjustments.camera_fov || 50}
                        onChange={(e) => handleSaveAdjustment("camera_fov", parseFloat(e.target.value))}
                        className="w-full accent-violet-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1">Camera Movement Mode</label>
                      <select
                        value={activeAdjustments.camera_movement || "standard"}
                        onChange={(e) => handleSaveAdjustment("camera_movement", e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                      >
                        <option value="standard">Standard Reference Tracking</option>
                        <option value="dolly_in">Cinematic Dolly In</option>
                        <option value="pedestal_up">Pedestal Up</option>
                        <option value="static_tripod">Static Hero Tripod</option>
                      </select>
                    </div>
                  </div>
                )}

                {activeTab === "lighting" && (
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Light Intensity Gain</span>
                        <span className="font-mono text-slate-200">{(activeAdjustments.light_intensity || 1.0).toFixed(2)}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.3"
                        max="2.5"
                        step="0.05"
                        value={activeAdjustments.light_intensity || 1.0}
                        onChange={(e) => handleSaveAdjustment("light_intensity", parseFloat(e.target.value))}
                        className="w-full accent-violet-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Color Temperature</span>
                        <span className="font-mono text-slate-200">{Math.round(activeAdjustments.light_color_temp || 5500)}K</span>
                      </div>
                      <input
                        type="range"
                        min="2500"
                        max="9000"
                        step="100"
                        value={activeAdjustments.light_color_temp || 5500}
                        onChange={(e) => handleSaveAdjustment("light_color_temp", parseFloat(e.target.value))}
                        className="w-full accent-violet-500 h-1.5 bg-slate-800 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                )}

                {activeTab === "versions" && (
                  <div className="space-y-2 text-xs">
                    <p className="text-[11px] text-slate-400">
                      Renders for Shot #{selectedShot?.shot_id}. Select any previous render to restore it.
                    </p>
                    {selectedShot?.versions && selectedShot.versions.length > 0 ? (
                      selectedShot.versions.map((ver) => (
                        <div
                          key={ver.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between ${ver.is_selected ? "border-violet-500/80 bg-violet-950/20" : "border-slate-800 bg-slate-950 hover:border-slate-700"}`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-200">Version {ver.version_number}</span>
                              {ver.is_selected && (
                                <Badge variant="success" className="text-[9px] py-0 px-1.5">
                                  ACTIVE
                                </Badge>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500">
                              {new Date(ver.created_at).toLocaleTimeString()} &bull; {ver.resolution || "1080p"}
                            </span>
                          </div>

                          {!ver.is_selected && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSelectVersion(ver.id)}
                              className="text-[11px] h-7 px-2"
                            >
                              Restore
                            </Button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-500 text-xs">
                        No previous versions recorded.
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "qc" && (
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-slate-400">Shot Continuity:</span>
                      <span className={`font-bold ${selectedShot?.qc_report?.continuity_status === "PASS" ? "text-emerald-400" : "text-amber-400"}`}>
                        {selectedShot?.qc_report?.continuity_status || "Not Checked"}
                      </span>
                    </div>

                    {selectedShot?.qc_report ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                          <div>Black Frames: <span className="font-mono text-slate-300">{selectedShot.qc_report.black_frames}</span></div>
                          <div>Missing Frames: <span className="font-mono text-slate-300">{selectedShot.qc_report.missing_frames}</span></div>
                          <div>FPS: <span className="font-mono text-slate-300">{selectedShot.qc_report.fps_measured}</span></div>
                          <div>Audio: <span className="font-mono text-slate-300">{selectedShot.qc_report.has_audio ? "Present" : "None"}</span></div>
                        </div>

                        {selectedShot.qc_report.issues.length > 0 ? (
                          <div className="space-y-1">
                            <span className="text-[11px] font-semibold text-slate-400">Issues Flagged:</span>
                            {selectedShot.qc_report.issues.map((iss, i) => (
                              <div key={i} className="p-2 rounded bg-amber-950/20 border border-amber-800/40 text-[11px] text-amber-200">
                                {iss.description}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] pt-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> All automated quality checks passed.
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-500 text-[11px]">Run QC Check to inspect this shot.</p>
                    )}
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-3 border-t border-slate-800 space-y-2 mt-auto">
                <Button
                  size="sm"
                  onClick={commitAdjustments}
                  disabled={savingAdjustments}
                  className="w-full text-xs"
                >
                  {savingAdjustments ? "Saving Adjustments..." : "Save Adjustments"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRegenerateShot}
                  disabled={regenerating}
                  className="w-full text-xs border-violet-500/40 text-violet-300 hover:bg-violet-950/30"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${regenerating ? "animate-spin" : ""}`} />
                  {regenerating ? "Regenerating Shot..." : "Regenerate Shot Only"}
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* WORKSPACE LOWER: CINEMATIC MULTI-TRACK TIMELINE */}
        <Card className="p-4 bg-slate-900/95 border-slate-800 rounded-2xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                Cinematic Production Timeline
              </span>
              <span className="text-slate-400 text-[11px]">
                Selected: <span className="text-violet-400 font-semibold">Shot #{selectedShot?.shot_id}</span> ({selectedShot?.start_time}s - {selectedShot?.end_time}s)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px]">Zoom:</span>
              <button
                onClick={() => setTimelineZoom(Math.max(0.5, timelineZoom - 0.25))}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-slate-300 font-mono text-[10px]">{timelineZoom}x</span>
              <button
                onClick={() => setTimelineZoom(Math.min(2.5, timelineZoom + 0.25))}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="relative overflow-x-auto select-none pt-2 pb-4">
            <div
              className="relative min-w-full space-y-2"
              style={{ width: `${Math.max(100, data.total_duration * 120 * timelineZoom)}px` }}
            >
              {/* PLAYHEAD */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-30 pointer-events-none transition-all duration-75"
                style={{
                  left: `${(currentTime / Math.max(1, data.total_duration)) * 100}%`
                }}
              >
                <div className="w-2.5 h-2.5 -ml-1 -top-1 absolute bg-rose-500 rounded-sm rotate-45 shadow" />
              </div>

              {/* TIMESTAMPS RULER */}
              <div className="h-5 flex border-b border-slate-800 text-[9px] font-mono text-slate-500 relative">
                {Array.from({ length: Math.ceil(data.total_duration) + 1 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute top-0"
                    style={{ left: `${(i / Math.max(1, data.total_duration)) * 100}%` }}
                  >
                    | {i}s
                  </div>
                ))}
              </div>

              {/* TRACK 1: SHOTS & SCENES */}
              <div className="flex h-14 bg-slate-950/80 rounded-xl p-1 gap-1.5 border border-slate-800/80 relative">
                {data.shots.map((shot) => {
                  const widthPct = (shot.duration / Math.max(1, data.total_duration)) * 100;
                  const isSelected = shot.shot_id === selectedShotId;

                  return (
                    <div
                      key={shot.shot_id}
                      onClick={() => {
                        setSelectedShotId(shot.shot_id);
                        seekTo(shot.start_time);
                      }}
                      style={{ width: `${widthPct}%` }}
                      className={`h-full rounded-lg p-2 cursor-pointer transition-all flex flex-col justify-between overflow-hidden relative border ${
                        isSelected
                          ? "border-violet-500 bg-violet-950/40 shadow-lg shadow-violet-900/30"
                          : "border-slate-800 bg-slate-900/90 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-200 truncate">
                          Shot #{shot.shot_id}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {shot.duration}s
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 truncate">
                        <span>{shot.camera_type}</span>
                        {shot.active_version && (
                          <span className="text-emerald-400 font-semibold font-mono">
                            v{shot.active_version.version_number}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* TRACK 2: CHARACTER TRACK */}
              <div className="flex h-8 bg-slate-950/60 rounded-lg p-1 gap-1.5 border border-slate-800/60">
                {data.shots.map((shot) => {
                  const widthPct = (shot.duration / Math.max(1, data.total_duration)) * 100;
                  return (
                    <div
                      key={shot.shot_id}
                      style={{ width: `${widthPct}%` }}
                      className={`h-full rounded px-2 flex items-center text-[10px] font-mono truncate ${
                        shot.has_character
                          ? "bg-violet-900/30 text-violet-300 border border-violet-800/40"
                          : "bg-slate-900 text-slate-500 border border-slate-800"
                      }`}
                    >
                      {shot.has_character ? "Character Tracking" : "Environment Cut"}
                    </div>
                  );
                })}
              </div>

              {/* TRACK 3: AUDIO TRACK */}
              <div className="flex h-7 bg-slate-950/40 rounded-lg p-1 gap-1.5 border border-slate-800/40">
                <div className="w-full h-full rounded px-2 flex items-center text-[10px] font-mono text-slate-400 bg-emerald-950/20 border border-emerald-900/30 truncate">
                  Audio: {data.reference_metadata?.has_audio ? "Reference Master (Preserved)" : "No Audio"}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* EXPORT MODAL */}
        {exportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <Card className="w-full max-w-md p-6 bg-slate-900 border-slate-800 rounded-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-violet-400" /> Assemble & Export Production
                </h3>
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Target Resolution</label>
                  <select
                    value={exportResolution}
                    onChange={(e) => setExportResolution(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
                  >
                    <option value="original">Original Reference Resolution</option>
                    <option value="720p">720p HD (1280x720)</option>
                    <option value="1080p">1080p Full HD (1920x1080)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Frame Rate</label>
                  <select
                    value={exportFps}
                    onChange={(e) => setExportFps(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200"
                  >
                    <option value={24}>24 FPS (Cinematic 24p)</option>
                    <option value={30}>30 FPS (Standard)</option>
                    <option value={60}>60 FPS (High Frame Rate)</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                  <span className="font-semibold text-slate-300">Audio Setting:</span>
                  <p className="text-slate-400">
                    {audioMuted ? "Muted (No audio track)" : "Original Reference Audio Track preserved & synchronized."}
                  </p>
                </div>

                {exportJob && (
                  <div className="p-3 bg-violet-950/20 border border-violet-800/40 rounded-xl space-y-2">
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="text-slate-300">Status: {exportJob.status}</span>
                      <span className="text-violet-300">{exportJob.progress_percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-violet-600 h-full transition-all duration-300"
                        style={{ width: `${exportJob.progress_percentage}%` }}
                      />
                    </div>
                    {exportJob.output_url && (
                      <div className="pt-2">
                        <a
                          href={exportJob.output_url}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="w-full inline-block"
                        >
                          <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-500 text-xs">
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            Download Rendered Production ({((exportJob.file_size || 0) / (1024 * 1024)).toFixed(1)} MB)
                          </Button>
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setExportModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={handleTriggerExport}
                  disabled={exporting}
                  className="bg-violet-600 hover:bg-violet-500"
                >
                  {exporting ? "Assembling..." : "Start Assembly & Export"}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function CinematicProductionEditorPage() {
  return (
    <React.Suspense fallback={
      <AppLayout>
        <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[480px] w-full rounded-2xl" />
        </div>
      </AppLayout>
    }>
      <EditorContent />
    </React.Suspense>
  );
}
