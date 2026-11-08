"use client";

import React, { useState, useEffect } from "react";
import {
  Mic,
  FileText,
  Volume2,
  Download,
  AlertCircle,
  RefreshCw,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Trash2
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Badge } from "@/components/ui";
import { getToken } from "@/lib/api";

export default function VoiceLabPage() {
  const [activeTab, setActiveTab] = useState<"tts" | "transcribe" | "cloning">("tts");

  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState("af_sarah");
  const [speed, setSpeed] = useState(1.0);
  const [voices, setVoices] = useState<any[]>([]);

  const [transcribeAudioFile, setTranscribeAudioFile] = useState<File | null>(null);
  const [transcribeAudioUrl, setTranscribeAudioUrl] = useState("");
  const [transcriptionResult, setTranscriptionResult] = useState<any | null>(null);

  const [cloneName, setCloneName] = useState("");
  const [cloneDescription, setCloneDescription] = useState("");
  const [cloneAudioFile, setCloneAudioFile] = useState<File | null>(null);
  const [cloneAudioUrl, setCloneAudioUrl] = useState("");
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<any[]>([]);

  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resultItem, setResultItem] = useState<any | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const token = getToken();
        const resVoices = await fetch("/api/labs/voices");
        if (resVoices.ok) {
          const vData = await resVoices.json();
          setVoices(vData.voices || []);
        }

        if (token) {
          const resProfiles = await fetch("/api/labs/voice/clone/profiles", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (resProfiles.ok) {
            const pData = await resProfiles.json();
            setSavedProfiles(pData || []);
          }
        }
      } catch (err) {
        console.error("Failed to load voice dependencies", err);
      }
    }
    loadData();
  }, []);

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: "transcribe" | "clone") => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (target === "transcribe") setTranscribeAudioFile(file);
    else setCloneAudioFile(file);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("asset_type", target === "transcribe" ? "audio" : "voice_samples");

    try {
      const token = getToken();
      const res = await fetch("/api/labs/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        if (target === "transcribe") setTranscribeAudioUrl(data.url);
        else setCloneAudioUrl(data.url);
      }
    } catch (err) {
      console.error("Audio upload failed", err);
    }
  };

  const handleGenerateTTS = async () => {
    if (!text.trim()) {
      setErrorMessage("Please enter text for speech generation");
      return;
    }
    setProcessing(true);
    setErrorMessage("");
    setResultItem(null);

    try {
      const token = getToken();
      const res = await fetch("/api/labs/voice/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          text,
          voice_id: voiceId,
          speed,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.detail || "Voice synthesis failed");
      } else {
        setResultItem(data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const handleTranscribe = async () => {
    if (!transcribeAudioUrl) {
      setErrorMessage("Please upload an audio file to transcribe");
      return;
    }
    setProcessing(true);
    setErrorMessage("");
    setTranscriptionResult(null);

    try {
      const token = getToken();
      const formData = new FormData();
      formData.append("audio_url", transcribeAudioUrl);

      const res = await fetch("/api/labs/voice/transcribe", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.detail || "Transcription failed");
      } else {
        setTranscriptionResult(data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateProfile = async () => {
    if (!cloneName || !cloneAudioUrl) {
      setErrorMessage("Please specify a profile name and voice reference sample");
      return;
    }
    if (!consentConfirmed) {
      setErrorMessage("You must confirm voice sample ownership and explicit permission");
      return;
    }

    setProcessing(true);
    setErrorMessage("");

    try {
      const token = getToken();
      const res = await fetch("/api/labs/voice/clone/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: cloneName,
          description: cloneDescription,
          sample_audio_url: cloneAudioUrl,
          consent_confirmed: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.detail || "Failed to create voice profile");
      } else {
        setSavedProfiles((prev) => [data, ...prev]);
        setCloneName("");
        setCloneDescription("");
        setCloneAudioFile(null);
        setCloneAudioUrl("");
        setConsentConfirmed(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Network error occurred");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    try {
      const token = getToken();
      const res = await fetch(`/api/labs/voice/clone/profile/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSavedProfiles((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete profile", err);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <Mic className="w-6 h-6 text-emerald-400" />
              Voice Lab Studio
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Natural Text-to-Speech (Kokoro-82M), Timestamped Whisper Transcription & Authorized OpenVoice V2 Cloning
            </p>
          </div>

          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab("tts")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "tts"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Text-to-Speech
            </button>
            <button
              onClick={() => setActiveTab("transcribe")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "transcribe"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Whisper Transcription
            </button>
            <button
              onClick={() => setActiveTab("cloning")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "cloning"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Authorized Voice Profiles
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <Card className="p-5 bg-[#0d121c] border border-slate-800/80 space-y-4">
              {activeTab === "tts" ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-1.5">
                      Text to Speak
                    </label>
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Type or paste narration, dialogue, or announcements here..."
                      rows={5}
                      className="w-full bg-[#080b11] border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-1.5">
                      Kokoro Voice Actor
                    </label>
                    <select
                      value={voiceId}
                      onChange={(e) => setVoiceId(e.target.value)}
                      className="w-full bg-[#080b11] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    >
                      {voices.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.gender})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-1.5">
                      Speaking Speed: {speed.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min={0.7}
                      max={1.5}
                      step={0.1}
                      value={speed}
                      onChange={(e) => setSpeed(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  <Button
                    onClick={handleGenerateTTS}
                    disabled={processing}
                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500"
                  >
                    {processing ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating Audio Stream...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4" />
                        Generate Voice Narration
                      </span>
                    )}
                  </Button>
                </>
              ) : activeTab === "transcribe" ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-1.5">
                      Upload Audio to Transcribe
                    </label>
                    <label className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-emerald-500 bg-[#080b11]">
                      <Upload className="w-5 h-5 text-emerald-400 mb-1" />
                      <span className="text-xs text-slate-300">
                        {transcribeAudioFile ? transcribeAudioFile.name : "Choose audio (WAV, MP3, M4A)"}
                      </span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleAudioUpload(e, "transcribe")}
                        className="hidden"
                      />
                    </label>
                    {transcribeAudioUrl && (
                      <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Audio loaded ready for Whisper
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleTranscribe}
                    disabled={processing || !transcribeAudioUrl}
                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500"
                  >
                    {processing ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Running Whisper Transcription...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Extract Subtitles & Timestamps
                      </span>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-1.5">
                      Voice Profile Name
                    </label>
                    <input
                      type="text"
                      value={cloneName}
                      onChange={(e) => setCloneName(e.target.value)}
                      placeholder="e.g. My Authorized Narrative Voice"
                      className="w-full bg-[#080b11] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-200 block mb-1.5">
                      Upload Reference Voice Sample
                    </label>
                    <label className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-emerald-500 bg-[#080b11]">
                      <Upload className="w-5 h-5 text-emerald-400 mb-1" />
                      <span className="text-xs text-slate-300">
                        {cloneAudioFile ? cloneAudioFile.name : "Choose clean voice sample audio"}
                      </span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleAudioUpload(e, "clone")}
                        className="hidden"
                      />
                    </label>
                    {cloneAudioUrl && (
                      <div className="mt-2 text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Voice reference uploaded
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="consent"
                        checked={consentConfirmed}
                        onChange={(e) => setConsentConfirmed(e.target.checked)}
                        className="mt-0.5 accent-emerald-500"
                      />
                      <label htmlFor="consent" className="text-[11px] text-slate-300 leading-tight">
                        I confirm that I own this voice or possess explicit written permission to create this profile. I will not use this tool for unauthorized impersonation.
                      </label>
                    </div>
                  </div>

                  <Button
                    onClick={handleCreateProfile}
                    disabled={processing || !consentConfirmed || !cloneAudioUrl}
                    className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500"
                  >
                    {processing ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Extracting Voice Tone Color...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        Create Authorized Voice Profile
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
                    Voice Laboratory Monitor
                  </span>
                  {(resultItem || transcriptionResult) && (
                    <Badge variant="success" className="text-[10px]">
                      Success
                    </Badge>
                  )}
                </div>

                {errorMessage && (
                  <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Voice Engine Notice</p>
                      <p className="mt-0.5 text-slate-300">{errorMessage}</p>
                    </div>
                  </div>
                )}

                <div className="mt-4 min-h-[320px] bg-black/60 rounded-xl border border-slate-800/80 p-5 flex flex-col justify-center">
                  {processing ? (
                    <div className="text-center space-y-2">
                      <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                      <p className="text-xs text-slate-400">Synthesizing audio waves...</p>
                    </div>
                  ) : activeTab === "transcribe" && transcriptionResult ? (
                    <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2">
                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                          Full Transcript
                        </span>
                        <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                          {transcriptionResult.text}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Timestamped Subtitles ({transcriptionResult.segments.length} segments)
                        </span>
                        {transcriptionResult.segments.map((seg: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 text-[11px] p-2 rounded bg-slate-900/60 border border-slate-800/60"
                          >
                            <span className="text-emerald-400 font-mono shrink-0">
                              [{seg.start}s - {seg.end}s]
                            </span>
                            <span className="text-slate-300">{seg.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : activeTab === "cloning" ? (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-slate-200 block">
                        Saved Authorized Voice Profiles ({savedProfiles.length})
                      </span>
                      {savedProfiles.length === 0 ? (
                        <p className="text-xs text-slate-500">No authorized voice profiles registered yet.</p>
                      ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {savedProfiles.map((p) => (
                            <div
                              key={p.id}
                              className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between"
                            >
                              <div>
                                <h4 className="text-xs font-bold text-slate-200">{p.name}</h4>
                                <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                                  <ShieldCheck className="w-3 h-3" /> Consent Confirmed • {p.model_name}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteProfile(p.id)}
                                className="text-slate-500 hover:text-red-400 p-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : resultItem ? (
                    <div className="space-y-4 text-center">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                        <Volume2 className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-200">{resultItem.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Duration: {resultItem.duration_seconds}s • Model: {resultItem.model_name}
                        </p>
                      </div>
                      <div className="pt-2 flex justify-center">
                        <audio src={resultItem.output_url} controls className="w-full max-w-md" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 text-slate-600">
                      <Volume2 className="w-12 h-12 mx-auto" />
                      <p className="text-xs">Audio output or transcription will preview here</p>
                    </div>
                  )}
                </div>
              </div>

              {resultItem && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    <p className="font-semibold text-slate-200">{resultItem.title}</p>
                    <p className="text-[10px] text-slate-500">Kokoro-82M High Fidelity WAV</p>
                  </div>
                  <a href={resultItem.output_url} download>
                    <Button size="sm">
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Download Audio
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
