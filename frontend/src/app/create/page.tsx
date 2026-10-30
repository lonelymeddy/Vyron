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
  Sun,
  Camera,
  Layers,
  Shirt,
  Car,
  CloudRain,
  ChevronDown,
  ChevronUp
} from "lucide-react";

type GenerationMode = "CHARACTER_REPLACEMENT" | "FULL_CGI_RECREATION" | "ORIGINAL_CGI_CREATION";

function CreatorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCharId = searchParams.get("character_id") || "";

  const [mode, setMode] = useState<GenerationMode>("CHARACTER_REPLACEMENT");
  const [title, setTitle] = useState("My Cinematic CGI Video");

  // Characters from Library
  const [savedCharacters, setSavedCharacters] = useState<any[]>([]);
  const [selectedCharId, setSelectedCharId] = useState<string>(initialCharId);
  const [characterImage, setCharacterImage] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState("");

  // Reference Video
  const [referenceVideo, setReferenceVideo] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<{ duration: number; resolution: string; fps: number } | null>(null);

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
  const [aiProvider, setAiProvider] = useState("kling_ai");

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    async function loadCharacters() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("vyron_token") : null;
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch("http://localhost:8000/api/characters", { headers });
        if (res.ok) {
          const chars = await res.json();
          setSavedCharacters(chars);
          if (initialCharId) {
            const match = chars.find((c: any) => c.id === initialCharId);
            if (match) {
              setSelectedCharId(match.id);
              setCharacterImage(match.image_url);
              setCharacterName(match.name);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load character library", err);
      }
    }
    loadCharacters();
  }, [initialCharId]);

  const handleSelectSavedCharacter = (charId: string) => {
    setSelectedCharId(charId);
    if (!charId) {
      setCharacterImage(null);
      setCharacterName("");
      return;
    }
    const match = savedCharacters.find((c) => c.id === charId);
    if (match) {
      setCharacterImage(match.image_url);
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
      const url = URL.createObjectURL(file);
      setCharacterImage(url);
      if (!characterName) setCharacterName(file.name.split(".")[0]);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        setToastMessage({ type: "error", text: "Please upload a valid reference video file (MP4, MOV, WEBM)." });
        return;
      }
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setReferenceVideo(url);
      setVideoMetadata({ duration: 15, resolution: "1080p", fps: 30 });
    }
  };

  const handleSubmit = async () => {
    if (!characterImage) {
      setToastMessage({ type: "error", text: "A character reference photo or library character is required." });
      return;
    }

    if ((mode === "CHARACTER_REPLACEMENT" || mode === "FULL_CGI_RECREATION") && !referenceVideo) {
      setToastMessage({
        type: "error",
        text: `Mode '${mode.replace(/_/g, " ")}' requires a reference video upload.`
      });
      return;
    }

    setSubmitting(true);
    setToastMessage(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("vyron_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      let charId = selectedCharId;

      // If user uploaded a brand new character image, create character record first
      if (!charId && characterImage) {
        const charRes = await fetch("http://localhost:8000/api/characters", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: characterName || "Custom Avatar",
            image_url: characterImage
          })
        });
        if (charRes.ok) {
          const charData = await charRes.json();
          charId = charData.id;
        }
      }

      // Create Project
      const projRes = await fetch("http://localhost:8000/api/projects", {
        method: "POST",
        headers,
        body: JSON.stringify({
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
        })
      });

      if (!projRes.ok) {
        const errData = await projRes.json().catch(() => ({ detail: "Project creation failed" }));
        throw new Error(errData.detail || "Failed to create project.");
      }

      const projData = await projRes.json();

      // Attach Source Video if mode requires reference video
      if (referenceVideo && (mode === "CHARACTER_REPLACEMENT" || mode === "FULL_CGI_RECREATION")) {
        await fetch(`http://localhost:8000/api/projects/${projData.id}/source-video?file_name=${encodeURIComponent(videoFile?.name || "reference.mp4")}&video_url=${encodeURIComponent(referenceVideo)}&duration_seconds=15.0&resolution=${encodeURIComponent(resolution)}`, {
          method: "POST",
          headers
        }).catch(() => null);
      }

      // Start Generation Job
      const genRes = await fetch("http://localhost:8000/api/generations", {
        method: "POST",
        headers,
        body: JSON.stringify({
          project_id: projData.id,
          provider_name: aiProvider
        })
      });

      if (!genRes.ok) {
        const genErr = await genRes.json().catch(() => ({ detail: "Generation start failed" }));
        throw new Error(genErr.detail || "Failed to submit generation job.");
      }

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
          <Badge variant="purple">STUDIO CREATOR</Badge>
          <Badge variant="cyan">3 CREATION MODES</Badge>
        </div>
        <h1 className="text-2xl font-extrabold text-white mt-2 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-violet-400" />
          AI Video Creator Studio
        </h1>
        <p className="text-slate-400 text-xs md:text-sm mt-1 leading-relaxed">
          Select a creation mode, upload or choose character references, provide natural language instructions, and configure cinematic CGI render settings.
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
          label="Project Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Erangel Tactical Cyber Heist"
        />
      </Card>

      {/* CREATION MODES SELECTION */}
      <div className="space-y-3">
        <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
          1. Select Generation Mode
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
              <h3 className="font-bold text-slate-100 text-sm">Mode 1: Character Replacement</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Replace original video avatar with your custom character while preserving exact motion, action physics, and timing.
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
              <h3 className="font-bold text-slate-100 text-sm">Mode 2: Full CGI Recreation</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Recreate entire reference video scenes, camera moves, lighting, outfits, and environments in PUBG-inspired 3D CGI.
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
              <h3 className="font-bold text-slate-100 text-sm">Mode 3: Original CGI Creation</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Generate brand new cinematic 3D CGI video directly from natural language prompts without requiring a reference video.
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
              2. Character Reference Input *
            </label>
            {characterImage && (
              <button
                onClick={() => {
                  setCharacterImage(null);
                  setSelectedCharId("");
                }}
                className="text-[11px] text-rose-400 hover:underline"
              >
                Clear Input
              </button>
            )}
          </div>

          {savedCharacters.length > 0 && (
            <Select
              label="Choose from Saved Library"
              value={selectedCharId}
              onChange={(e) => handleSelectSavedCharacter(e.target.value)}
            >
              <option value="">-- Upload New Character Photo Below --</option>
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
              <span className="text-[10px] text-slate-500 mt-1">PNG, JPG, WEBP (Clear face/body photo)</span>
              <input type="file" accept="image/*" onChange={handleCharacterUpload} className="hidden" />
            </label>
          )}

          <Input
            label="Character Name"
            value={characterName}
            onChange={(e) => setCharacterName(e.target.value)}
            placeholder="e.g. Tactical Ghost Operative"
          />
        </Card>

        {/* REFERENCE VIDEO UPLOAD */}
        <Card className={`space-y-4 ${mode === "ORIGINAL_CGI_CREATION" ? "opacity-40 pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Video className="w-4 h-4 text-indigo-400" />
              3. Reference Video Input {mode !== "ORIGINAL_CGI_CREATION" && "*"}
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
              <span className="text-[10px] text-slate-500 mt-1">MP4, MOV, WEBM (Up to 1080p, 60fps)</span>
              <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" disabled={mode === "ORIGINAL_CGI_CREATION"} />
            </label>
          )}

          {videoMetadata && (
            <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
              <span>Duration: ~{videoMetadata.duration}s</span>
              <span>Resolution: {videoMetadata.resolution}</span>
              <span>FPS: {videoMetadata.fps}</span>
            </div>
          )}
        </Card>
      </div>

      {/* CREATIVE PROMPT INSTRUCTIONS */}
      <Card className="space-y-3">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-cyan-400" />
          4. Creative Prompt & Scene Instructions
        </label>
        <Textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe scene details, camera actions, environment backdrop, lighting conditions, and character gear (e.g. Place operative in Erangel city ruins at dusk, wielding a sniper rifle with cinematic camera orbit...)"
        />
      </Card>

      {/* PRODUCTION & CGI CONTROLS */}
      <Card className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold text-slate-100">Production & CGI Render Parameters</h3>
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-violet-400 hover:underline flex items-center font-medium"
          >
            {showAdvanced ? "Hide Advanced Settings" : "Show Advanced Settings"}
            {showAdvanced ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Select label="Environment / Location" value={environment} onChange={(e) => setEnvironment(e.target.value)}>
            <option value="erangel_pubg">Erangel Military Base (PUBG)</option>
            <option value="miramar_desert">Miramar Desert Ruins</option>
            <option value="vikendi_snow">Vikendi Snowy Compound</option>
            <option value="cyberpunk_city">Cyberpunk Neon City</option>
            <option value="futuristic_hangar">Futuristic Sci-Fi Hangar</option>
          </Select>

          <Select label="Lighting Preset" value={lighting} onChange={(e) => setLighting(e.target.value)}>
            <option value="sunset_dramatic">Golden Hour Sunset</option>
            <option value="cinematic_night">Night Studio Key Light</option>
            <option value="overcast_stormy">Overcast Stormy Daylight</option>
            <option value="cyberpunk_neon">Cyberpunk Dual Neon</option>
          </Select>

          <Select label="Camera Motion" value={cameraMotion} onChange={(e) => setCameraMotion(e.target.value)}>
            <option value="cinematic_orbit">Cinematic 360 Orbit</option>
            <option value="dramatic_push_in">Dramatic Push-In Zoom</option>
            <option value="tracking_shot">Low-Angle Action Tracking</option>
            <option value="static_tripod">Static Studio Lens</option>
          </Select>

          <Select label="Aspect Ratio" value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
            <option value="16:9">16:9 Landscape (Widescreen)</option>
            <option value="9:16">9:16 Portrait (Shorts & Reels)</option>
            <option value="1:1">1:1 Square (Social)</option>
          </Select>

          <Select label="Resolution" value={resolution} onChange={(e) => setResolution(e.target.value)}>
            <option value="1080p">1080p Full HD</option>
            <option value="4K">4K Ultra HD CGI Engine</option>
          </Select>

          <Select label="AI Provider Engine" value={aiProvider} onChange={(e) => setAiProvider(e.target.value)}>
            <option value="kling_ai">Kling AI Engine v1.5</option>
            <option value="runway_gen3">Runway Gen-3 Alpha</option>
            <option value="mock_engine">VYRON High-Speed Engine</option>
          </Select>
        </div>

        {showAdvanced && (
          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select label="Outfit / Armor Customization" value={outfit} onChange={(e) => setOutfit(e.target.value)}>
              <option value="tactical_black">Level 3 Tactical Black Suit</option>
              <option value="desert_ghillie">Ghillie Sniper Camo</option>
              <option value="cyber_exosuit">Cybernetic Exosuit</option>
            </Select>

            <Select label="Vehicle Props" value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
              <option value="dacia_sedan">Armored Buggy / Dacia</option>
              <option value="hover_bike">Futuristic Hoverbike</option>
              <option value="none">No Vehicle Props</option>
            </Select>

            <Select label="Weather Effects" value={weather} onChange={(e) => setWeather(e.target.value)}>
              <option value="clear">Clear Skies</option>
              <option value="heavy_rain">Heavy Rain & Wet Surfaces</option>
              <option value="foggy">Dense Fog / Mist</option>
            </Select>
          </div>
        )}

        {/* SUBMIT BUTTON */}
        <div className="pt-4 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Render Cost: <span className="font-bold text-amber-400">10 CR</span> &bull; Estimated Render Queue Time: ~20s
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
      <Suspense fallback={<div className="p-6 text-slate-400">Loading Creator Studio...</div>}>
        <CreatorContent />
      </Suspense>
    </AppLayout>
  );
}
