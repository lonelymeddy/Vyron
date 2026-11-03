"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Badge, Input, Textarea, Select, Toast } from "@/components/ui";
import {
  Sparkles,
  Upload,
  Video,
  User as UserIcon,
  Film,
  Wand2,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
  FileEdit,
  Eye
} from "lucide-react";
import {
  apiClient, Character, GenerationMode, ProviderCapabilityInfo, Storyboard, ReconstructionBlueprint
} from "@/lib/api";

function CreatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCharId = searchParams.get("character_id") || "";

  const [mode, setMode] = useState<GenerationMode>("CHARACTER_REPLACEMENT");
  const [title, setTitle] = useState("My Cinematic CGI Video");

  // Characters from Library
  const [savedCharacters, setSavedCharacters] = useState<Character[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<string>(initialCharId);
  const [characterImage, setCharacterImage] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState("");
  const [charFile, setCharFile] = useState<File | null>(null);

  // Reference Video
  const [referenceVideo, setReferenceVideo] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Creative Prompt
  const [prompt, setPrompt] = useState("");

  // Production Settings
  const [environment, setEnvironment] = useState("erangel_pubg");
  const [outfit, setOutfit] = useState("tactical_black");
  const [vehicle, setVehicle] = useState("dacia_sedan");
  const [lighting, setLighting] = useState("sunset_dramatic");
  const [weather, setWeather] = useState("clear");
  const [cameraMotion, setCameraMotion] = useState("cinematic_orbit");
  const [animationStyle, setAnimationStyle] = useState("hyper_realistic");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("1080p");
  const [aiProvider, setAiProvider] = useState("vyron_reconstruction_engine");

  // Providers & Capabilities
  const [availableProviders, setAvailableProviders] = useState<ProviderCapabilityInfo[]>([]);
  const [selectedProviderInfo, setSelectedProviderInfo] = useState<ProviderCapabilityInfo | null>(null);

  // Storyboard State (for Mode 2)
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [showStoryboardModal, setShowStoryboardModal] = useState(false);
  const [analyzingStoryboard, setAnalyzingStoryboard] = useState(false);

  // Reconstruction Blueprint State (for Mode 1)
  const [blueprint, setBlueprint] = useState<ReconstructionBlueprint | null>(null);
  const [showBlueprintModal, setShowBlueprintModal] = useState(false);
  const [analyzingBlueprint, setAnalyzingBlueprint] = useState(false);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [chars, provs] = await Promise.all([
          apiClient.characters.list().catch(() => []),
          apiClient.generations.getProviders().catch(() => [])
        ]);
        setSavedCharacters(chars);
        setAvailableProviders(provs);

        const currentProv = provs.find((p) => p.name === aiProvider) || provs[0] || null;
        setSelectedProviderInfo(currentProv);

        if (initialCharId) {
          const match = chars.find((c) => String(c.id) === String(initialCharId));
          if (match) {
            setSelectedCharId(String(match.id));
            setCharacterImage(match.image_url || null);
            setCharacterName(match.name);
          }
        }
      } catch (err) {
        console.error("Failed to load initial studio data", err);
      }
    }
    loadInitialData();
  }, [initialCharId]);

  const handleProviderChange = (newProviderName: string) => {
    setAiProvider(newProviderName);
    const p = availableProviders.find((x) => x.name === newProviderName) || null;
    setSelectedProviderInfo(p);
  };

  const handleSelectSavedCharacter = (charId: string) => {
    setSelectedCharId(charId);
    setCharFile(null);
    if (!charId) {
      setCharacterImage(null);
      setCharacterName("");
      return;
    }
    const match = savedCharacters.find((c) => String(c.id) === String(charId));
    if (match) {
      setCharacterImage(match.image_url || null);
      setCharacterName(match.name);
    }
  };

  const handleCharacterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setToastMessage({ type: "error", text: "Please upload a valid character image file (PNG, JPG, WEBP)." });
        return;
      }
      setSelectedCharId("");
      setCharFile(file);
      const url = URL.createObjectURL(file);
      setCharacterImage(url);
      if (!characterName) setCharacterName(file.name.split(".")[0]);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/") && !file.name.match(/\.(mp4|mov|webm|avi|mkv)$/i)) {
        setToastMessage({ type: "error", text: "Please upload a valid reference video file (MP4, MOV, WEBM)." });
        return;
      }
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setReferenceVideo(url);
    }
  };

  const handleGenerateStoryboardPreview = async () => {
    if (!videoFile && !referenceVideo) {
      setToastMessage({ type: "error", text: "Upload a reference video before generating scene plan." });
      return;
    }

    setAnalyzingStoryboard(true);
    setToastMessage(null);

    try {
      let charId = selectedCharId;
      if (!charId && charFile) {
        const uploadedChar = await apiClient.characters.uploadImage(charFile, characterName || "Avatar Reference");
        charId = String(uploadedChar.id);
        setSelectedCharId(charId);
      }

      const proj = await apiClient.projects.create({
        title: title || "Recreation Project",
        generation_mode: mode,
        character_id: charId || null,
        prompt_instructions: prompt,
        settings: { environment, outfit, vehicle, lighting, weather, camera_motion: cameraMotion }
      });

      if (videoFile) {
        await apiClient.projects.uploadSourceVideo(proj.id, videoFile);
      }

      const sb = await apiClient.generations.generateStoryboard(proj.id);
      setStoryboard(sb);
      setShowStoryboardModal(true);
      setToastMessage({ type: "success", text: `Prepared ${sb.total_scenes} cinematic scenes for your project.` });
    } catch (err: any) {
      setToastMessage({ type: "error", text: err.message || "Failed to generate scene plan." });
    } finally {
      setAnalyzingStoryboard(false);
    }
  };

  const handleAnalyzeReferenceBlueprint = async () => {
    if (!videoFile && !referenceVideo) {
      setToastMessage({ type: "error", text: "Upload a reference video before previewing scene shots." });
      return;
    }

    setAnalyzingBlueprint(true);
    setToastMessage(null);

    try {
      let charId = selectedCharId;
      if (!charId && charFile) {
        const uploadedChar = await apiClient.characters.uploadImage(charFile, characterName || "Avatar Reference");
        charId = String(uploadedChar.id);
        setSelectedCharId(charId);
      }

      const proj = await apiClient.projects.create({
        title: title || "Character Replacement Project",
        generation_mode: mode,
        character_id: charId || null,
        prompt_instructions: prompt,
        settings: { environment, outfit, vehicle, lighting, weather, camera_motion: cameraMotion }
      });

      if (videoFile) {
        await apiClient.projects.uploadSourceVideo(proj.id, videoFile);
      }

      const bp = await apiClient.generations.getBlueprint(proj.id);
      setBlueprint(bp);
      setShowBlueprintModal(true);
      setToastMessage({ type: "success", text: `Analysed video: ${bp.total_shots} scenes ready for replacement.` });
    } catch (err: any) {
      setToastMessage({ type: "error", text: err.message || "Failed to analyse reference video." });
    } finally {
      setAnalyzingBlueprint(false);
    }
  };

  const handleSubmit = async () => {
    if (!characterImage) {
      setToastMessage({ type: "error", text: "A character reference photo or library character is required." });
      return;
    }

    if ((mode === "CHARACTER_REPLACEMENT" || mode === "FULL_CGI_RECREATION") && !referenceVideo && !videoFile) {
      setToastMessage({
        type: "error",
        text: `Mode '${mode.replace(/_/g, " ")}' requires a reference video upload.`
      });
      return;
    }

    setSubmitting(true);
    setToastMessage(null);

    try {
      let charId = selectedCharId;

      if (!charId && charFile) {
        const uploadedChar = await apiClient.characters.uploadImage(charFile, characterName || "Custom Avatar");
        charId = String(uploadedChar.id);
      }

      const project = await apiClient.projects.create({
        title: title || "Untitled CGI Project",
        generation_mode: mode,
        character_id: charId || null,
        prompt_instructions: prompt,
        settings: {
          environment,
          outfit,
          vehicle,
          lighting,
          weather,
          camera_motion: cameraMotion,
          animation_style: animationStyle,
          aspect_ratio: aspectRatio,
          resolution: resolution
        }
      });

      if (videoFile && (mode === "CHARACTER_REPLACEMENT" || mode === "FULL_CGI_RECREATION")) {
        await apiClient.projects.uploadSourceVideo(project.id, videoFile);
      }

      if (mode === "FULL_CGI_RECREATION") {
        await apiClient.generations.generateStoryboard(project.id);
      }

      await apiClient.generations.start(project.id, aiProvider);
      router.push("/generations");
    } catch (err: any) {
      setToastMessage({ type: "error", text: err.message || "Error submitting video generation job." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="purple">CINEMATIC CREATOR</Badge>
          <Badge variant="cyan">3 CREATION MODES</Badge>
        </div>
        <h1 className="text-2xl font-extrabold text-white mt-2 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-violet-400" />
          Create New Project
        </h1>
        <p className="text-slate-400 text-xs md:text-sm mt-1 leading-relaxed">
          Select your creation mode, upload character and video references, configure camera and lighting, and generate cinematic 3D CGI productions.
        </p>
      </div>

      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.text}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* PROJECT TITLE */}
      <Card className="p-4">
        <Input
          label="Project Name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Erangel Tactical Extraction"
        />
      </Card>

      {/* CREATION MODES SELECTION */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
          1. Select Creation Mode
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            onClick={() => setMode("CHARACTER_REPLACEMENT")}
            className={`cursor-pointer transition-all p-5 space-y-3 ${
              mode === "CHARACTER_REPLACEMENT"
                ? "border-violet-500 bg-violet-950/20 glow-violet"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                <Video className="w-5 h-5" />
              </div>
              {mode === "CHARACTER_REPLACEMENT" && <CheckCircle2 className="w-5 h-5 text-violet-400" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Character Replacement</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Replace video characters with your custom avatar while preserving original motion, action, and lighting.
              </p>
            </div>
          </Card>

          <Card
            onClick={() => setMode("FULL_CGI_RECREATION")}
            className={`cursor-pointer transition-all p-5 space-y-3 ${
              mode === "FULL_CGI_RECREATION"
                ? "border-indigo-500 bg-indigo-950/20 glow-violet"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Film className="w-5 h-5" />
              </div>
              {mode === "FULL_CGI_RECREATION" && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Full CGI Recreation</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Recreate entire video scenes with custom 3D virtual environments, vehicles, and multi-shot pacing.
              </p>
            </div>
          </Card>

          <Card
            onClick={() => setMode("ORIGINAL_CGI_CREATION")}
            className={`cursor-pointer transition-all p-5 space-y-3 ${
              mode === "ORIGINAL_CGI_CREATION"
                ? "border-cyan-500 bg-cyan-950/20 glow-violet"
                : "border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
                <Wand2 className="w-5 h-5" />
              </div>
              {mode === "ORIGINAL_CGI_CREATION" && <CheckCircle2 className="w-5 h-5 text-cyan-400" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Original CGI Creation</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Generate brand-new cinematic scenes directly from prompts & character reference photos.
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* INPUT ASSETS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CHARACTER SELECTION / UPLOAD */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-violet-400" />
              2. Character Reference *
            </label>
            {characterImage && (
              <button
                onClick={() => {
                  setCharacterImage(null);
                  setSelectedCharId("");
                  setCharFile(null);
                }}
                className="text-[11px] text-rose-400 hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {savedCharacters.length > 0 && (
            <Select
              label="Select from Library"
              value={selectedCharId}
              onChange={(e) => handleSelectSavedCharacter(e.target.value)}
            >
              <option value="">-- Upload New Character Photo --</option>
              {savedCharacters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}

          {characterImage ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-700 h-52 bg-slate-950 flex items-center justify-center">
              <img src={characterImage} alt="Character Preview" className="h-full object-contain" />
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-800 hover:border-violet-500/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors h-52 bg-slate-900/40">
              <Upload className="w-8 h-8 text-slate-500 mb-2" />
              <span className="text-xs font-semibold text-slate-300">Click to upload character image</span>
              <span className="text-[10px] text-slate-500 mt-1">PNG, JPG, WEBP</span>
              <input type="file" accept="image/*" onChange={handleCharacterUpload} className="hidden" />
            </label>
          )}

          <Input
            label="Character Name"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="e.g. Tactical Operative"
          />
        </Card>

        {/* REFERENCE VIDEO UPLOAD */}
        <Card className={`space-y-4 ${mode === "ORIGINAL_CGI_CREATION" ? "opacity-40 pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Video className="w-4 h-4 text-indigo-400" />
              3. Reference Video {mode !== "ORIGINAL_CGI_CREATION" && "*"}
            </label>
            {referenceVideo && (
              <button
                onClick={() => {
                  setReferenceVideo(null);
                  setVideoFile(null);
                }}
                className="text-[11px] text-rose-400 hover:underline"
              >
                Clear Video
              </button>
            )}
          </div>

          {referenceVideo ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-700 h-52 bg-slate-950 flex items-center justify-center">
              <video src={referenceVideo} controls className="h-full object-contain" />
            </div>
          ) : (
            <label className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors h-52 bg-slate-900/40">
              <Film className="w-8 h-8 text-slate-500 mb-2" />
              <span className="text-xs font-semibold text-slate-300">
                {mode === "ORIGINAL_CGI_CREATION" ? "Not required for Mode 3" : "Click to upload reference video"}
              </span>
              <span className="text-[10px] text-slate-500 mt-1">MP4, MOV, WEBM</span>
              <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" disabled={mode === "ORIGINAL_CGI_CREATION"} />
            </label>
          )}

          {videoFile && (
            <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span className="truncate">{videoFile.name}</span>
              <span>{(videoFile.size / 1024 / 1024).toFixed(1)} MB</span>
            </div>
          )}

          {mode === "CHARACTER_REPLACEMENT" && (referenceVideo || videoFile) && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              isLoading={analyzingBlueprint}
              onClick={handleAnalyzeReferenceBlueprint}
              className="w-full text-xs"
            >
              <Eye className="w-4 h-4 mr-1.5 text-cyan-400" />
              Preview Video Analysis
            </Button>
          )}

          {mode === "FULL_CGI_RECREATION" && (referenceVideo || videoFile) && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              isLoading={analyzingStoryboard}
              onClick={handleGenerateStoryboardPreview}
              className="w-full text-xs"
            >
              <FileEdit className="w-4 h-4 mr-1.5 text-violet-400" />
              Preview Scene Plan
            </Button>
          )}
        </Card>
      </div>

      {/* RECONSTRUCTION BLUEPRINT MODAL */}
      {showBlueprintModal && blueprint && (
        <Card className="border border-cyan-500/30 bg-cyan-950/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-slate-100 text-sm">
                Video Analysis ({blueprint.total_shots} Shots Identified)
              </h3>
            </div>
            <button
              onClick={() => setShowBlueprintModal(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {blueprint.shots.map((shot, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-cyan-300">
                  <span>Shot #{shot.shot_id}</span>
                  <span>{shot.duration}s</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  <p><strong>Action:</strong> {shot.action_description}</p>
                  <p><strong>Camera:</strong> {shot.camera_type}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* STORYBOARD PREVIEW MODAL */}
      {showStoryboardModal && storyboard && (
        <Card className="border border-violet-500/30 bg-violet-950/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-violet-400" />
              <h3 className="font-bold text-slate-100 text-sm">Scene Plan ({storyboard.total_scenes} Scenes)</h3>
            </div>
            <button
              onClick={() => setShowStoryboardModal(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {storyboard.scenes.map((sc, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-violet-300">
                  <span>Scene #{sc.scene_number}</span>
                  <span>{sc.duration_seconds}s</span>
                </div>
                <p className="text-slate-200 font-medium">{sc.title}</p>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <div><strong>Action:</strong> {sc.character_action}</div>
                  <div><strong>Camera:</strong> {sc.camera_direction}</div>
                  <div><strong>Lighting:</strong> {sc.lighting}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* CREATIVE PROMPT */}
      <Card className="space-y-3">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-cyan-400" />
          4. Creative Prompt & Scene Description
        </label>
        <Textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your scene: e.g. A character walks through an Erangel military compound at sunset, approaches a black vehicle with a cinematic camera orbit..."
        />
      </Card>

      {/* PRODUCTION CONTROLS */}
      <Card className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold text-slate-100">Production Settings</h3>
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-violet-400 hover:underline flex items-center font-medium"
          >
            {showAdvanced ? "Hide Options" : "More Options"}
            {showAdvanced ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Select label="Environment / Location" value={environment} onChange={(e) => setEnvironment(e.target.value)}>
            <option value="erangel_pubg">Erangel Military Outpost</option>
            <option value="miramar_desert">Miramar Desert Ruins</option>
            <option value="vikendi_snow">Vikendi Snow Base</option>
            <option value="cyberpunk_city">Cyberpunk Neon City</option>
            <option value="futuristic_hangar">Futuristic Sci-Fi Hangar</option>
          </Select>

          <Select label="Lighting Atmosphere" value={lighting} onChange={(e) => setLighting(e.target.value)}>
            <option value="sunset_dramatic">Golden Hour Sunset</option>
            <option value="cinematic_night">Night Key Light</option>
            <option value="overcast_stormy">Overcast Stormy Daylight</option>
            <option value="cyberpunk_neon">Cyberpunk Dual Neon</option>
          </Select>

          <Select label="Camera Motion" value={cameraMotion} onChange={(e) => setCameraMotion(e.target.value)}>
            <option value="cinematic_orbit">Cinematic 360 Orbit</option>
            <option value="dramatic_push_in">Dramatic Push-In Zoom</option>
            <option value="tracking_shot">Low-Angle Action Tracking</option>
            <option value="static_tripod">Static Lens</option>
          </Select>

          <Select label="Aspect Ratio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
            <option value="16:9">16:9 Landscape (Widescreen)</option>
            <option value="9:16">9:16 Portrait (Shorts & Reels)</option>
            <option value="1:1">1:1 Square</option>
          </Select>

          <Select label="Resolution" value={resolution} onChange={(e) => setResolution(e.target.value)}>
            <option value="1080p">1080p Full HD</option>
            <option value="720p">720p HD</option>
            <option value="4K">4K Ultra HD</option>
          </Select>

          <Select label="Generation Engine" value={aiProvider} onChange={(e) => handleProviderChange(e.target.value)}>
            <option value="vyron_reconstruction_engine">VYRON Native 3D Engine (Active)</option>
            {availableProviders
              .filter((p) => p.name !== "vyron_reconstruction_engine")
              .map((p) => (
                <option key={p.name} value={p.name} disabled={!p.is_configured}>
                  {p.display_name} {p.is_configured ? "(Ready)" : "(API Key Required)"}
                </option>
              ))}
          </Select>
        </div>

        {showAdvanced && (
          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Outfit Customization" value={outfit} onChange={(e) => setOutfit(e.target.value)}>
              <option value="tactical_black">Tactical Combat Suit</option>
              <option value="desert_ghillie">Desert Ghillie Camo</option>
              <option value="cyber_exosuit">Cybernetic Exosuit</option>
            </Select>

            <Select label="Vehicle Props" value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
              <option value="dacia_sedan">Armored Buggy</option>
              <option value="sports_car_gt">Sports Car GT</option>
              <option value="hover_bike">Futuristic Hoverbike</option>
              <option value="none">No Vehicle</option>
            </Select>

            <Select label="Weather Effects" value={weather} onChange={(e) => setWeather(e.target.value)}>
              <option value="clear">Clear Skies</option>
              <option value="heavy_rain">Rain & Storm</option>
              <option value="foggy">Dense Mist</option>
            </Select>
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <div className="pt-4 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Project Cost: <span className="font-bold text-amber-400">10 CR</span>
          </div>

          <Button
            size="lg"
            isLoading={submitting}
            onClick={handleSubmit}
            className="w-full md:w-auto px-8 shadow-xl"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Generate Video (10 CR)
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function CreateVideoPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="p-6 text-slate-400">Loading Creator...</div>}>
        <CreatorContent />
      </Suspense>
    </AppLayout>
  );
}
