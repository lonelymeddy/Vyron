"use client";

import React, { useState } from "react";
import {
  Wand2,
  Sparkles,
  BookOpen,
  Copy,
  Check,
  RefreshCw,
  FileText,
  Music,
  Video,
  Image as ImageIcon
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card } from "@/components/ui";
import { getToken } from "@/lib/api";

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState<"studio" | "assistant">("studio");

  const [rawPrompt, setRawPrompt] = useState("");
  const [modality, setModality] = useState("image");
  const [optimizedPrompt, setOptimizedPrompt] = useState("");
  const [optimizing, setOptimizing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [assistantType, setAssistantType] = useState("lyrics");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("cinematic");
  const [assistantOutput, setAssistantOutput] = useState("");
  const [assistantRunning, setAssistantRunning] = useState(false);

  const handleOptimizePrompt = async () => {
    if (!rawPrompt.trim()) return;
    setOptimizing(true);
    try {
      const token = getToken();
      const res = await fetch("/api/labs/tools/prompt-studio/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: rawPrompt,
          modality,
          mode: "improve",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setOptimizedPrompt(data.enhanced_prompt);
      }
    } catch (err) {
      console.error("Optimize failed", err);
    } finally {
      setOptimizing(false);
    }
  };

  const handleAssistant = async () => {
    if (!topic.trim()) return;
    setAssistantRunning(true);
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append("request_type", assistantType);
      formData.append("topic", topic);
      formData.append("tone", tone);

      const res = await fetch("/api/labs/tools/assistant/generate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setAssistantOutput(data.content);
      }
    } catch (err) {
      console.error("Assistant failed", err);
    } finally {
      setAssistantRunning(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Wand2 className="w-6 h-6 text-violet-400" />
              AI Prompt Studio & Creative Assistant
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Optimize prompts for FLUX, Wan, Kokoro, & ACE-Step, or generate full song lyrics and video scripts.
            </p>
          </div>

          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab("studio")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "studio"
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Prompt Studio
            </button>
            <button
              onClick={() => setActiveTab("assistant")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "assistant"
                  ? "bg-violet-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Creative Assistant
            </button>
          </div>
        </div>

        {activeTab === "studio" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 bg-[#0d121c] border border-slate-800/80 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                Prompt Optimization Engine
              </h3>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Target AI Modality
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "image", label: "Image", icon: ImageIcon },
                    { id: "video", label: "Video", icon: Video },
                    { id: "music", label: "Music", icon: Music },
                    { id: "voice", label: "Voice", icon: FileText },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setModality(m.id)}
                      className={`p-2 rounded-xl text-xs font-semibold border flex flex-col items-center gap-1 ${
                        modality === m.id
                          ? "bg-violet-600/20 border-violet-500 text-white"
                          : "bg-[#080b11] border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <m.icon className="w-4 h-4" />
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Your Draft Idea / Raw Prompt
                </label>
                <textarea
                  value={rawPrompt}
                  onChange={(e) => setRawPrompt(e.target.value)}
                  placeholder="e.g. A cyber samurai in neon rain..."
                  rows={5}
                  className="w-full bg-[#080b11] border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
                />
              </div>

              <Button
                onClick={handleOptimizePrompt}
                disabled={optimizing || !rawPrompt.trim()}
                className="w-full bg-violet-600 hover:bg-violet-500"
              >
                {optimizing ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Optimizing Model Keywords...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Enhance & Expand Prompt
                  </span>
                )}
              </Button>
            </Card>

            <Card className="p-6 bg-[#0d121c] border border-slate-800/80 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white">Enhanced Model Output</h3>
                  {optimizedPrompt && (
                    <button
                      onClick={() => handleCopy(optimizedPrompt)}
                      className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copied" : "Copy Prompt"}
                    </button>
                  )}
                </div>

                <div className="mt-4 p-4 rounded-xl bg-black/60 border border-slate-800/80 min-h-[220px]">
                  {optimizedPrompt ? (
                    <p className="text-xs text-slate-200 leading-relaxed font-mono">
                      {optimizedPrompt}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-600 italic">
                      Your refined cinematic prompt will be displayed here, structured specifically for open diffusion & transformer weights.
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 leading-normal">
                Prompt Studio incorporates negative keyword suppression, camera lens parameters, and lighting styles automatically tailored to the selected lab.
              </div>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 bg-[#0d121c] border border-slate-800/80 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-violet-400" />
                Creative Assistant
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Generation Type
                  </label>
                  <select
                    value={assistantType}
                    onChange={(e) => setAssistantType(e.target.value)}
                    className="w-full bg-[#080b11] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                  >
                    <option value="lyrics">Song Lyrics (Verse & Chorus)</option>
                    <option value="script">Cinematic Video Script</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Tone / Style
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-[#080b11] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
                  >
                    <option value="cinematic">Cinematic & Atmospheric</option>
                    <option value="futuristic">Futuristic Cyberpunk</option>
                    <option value="emotional">Emotional & Melodic</option>
                    <option value="inspirational">Uplifting Anthem</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Concept Topic or Core Idea
                </label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Breakthrough into a new digital reality beyond limits..."
                  rows={4}
                  className="w-full bg-[#080b11] border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
                />
              </div>

              <Button
                onClick={handleAssistant}
                disabled={assistantRunning || !topic.trim()}
                className="w-full bg-violet-600 hover:bg-violet-500"
              >
                {assistantRunning ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Writing Composition...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Generate Content
                  </span>
                )}
              </Button>
            </Card>

            <Card className="p-6 bg-[#0d121c] border border-slate-800/80 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white">Assistant Generation</h3>
                  {assistantOutput && (
                    <button
                      onClick={() => handleCopy(assistantOutput)}
                      className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copied" : "Copy Text"}
                    </button>
                  )}
                </div>

                <div className="mt-4 p-4 rounded-xl bg-black/60 border border-slate-800/80 min-h-[220px] whitespace-pre-wrap font-mono text-xs text-slate-200">
                  {assistantOutput ? (
                    assistantOutput
                  ) : (
                    <span className="text-slate-600 italic font-sans">
                      Generated song lyrics or video script will load here. You can directly copy and paste lyrics into Music Lab or scripts into Voice Lab!
                    </span>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
