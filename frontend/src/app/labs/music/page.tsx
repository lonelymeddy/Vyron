"use client";

import React, { useState } from "react";
import {
  Music2,
  Sparkles,
  Disc3,
  Sliders,
  Volume2,
  Download,
  AlertCircle,
  RefreshCw,
  ChevronDown
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Badge } from "@/components/ui";
import { getToken } from "@/lib/api";

const genres = [
  "Cinematic Electronic",
  "Synthwave & Cyberpunk",
  "Ambient Orchestral",
  "Lo-Fi Beats",
  "Tech House & EDM",
  "Acoustic & Indie",
  "Epic Trailer & Hybrid",
];

const moods = [
  "Inspirational & Uplifting",
  "Epic & Tense",
  "Mysterious & Atmospheric",
  "Relaxing & Chill",
  "Energetic & Driving",
  "Dark & Dramatic",
];

export default function MusicLabPage() {
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState(genres[0]);
  const [mood, setMood] = useState(moods[0]);
  const [bpm, setBpm] = useState(124);
  const [duration, setDuration] = useState(15);
  const [isInstrumental, setIsInstrumental] = useState(true);
  const [lyrics, setLyrics] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [resultItem, setResultItem] = useState<any | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMessage("Please enter a track theme or musical description.");
      return;
    }
    setGenerating(true);
    setErrorMessage("");
    setResultItem(null);

    try {
      const token = getToken();
      const res = await fetch("/api/labs/music/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          genre,
          mood,
          bpm,
          duration,
          is_instrumental: isInstrumental,
          lyrics: isInstrumental ? null : lyrics,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.detail || "We couldn't generate your music. Please try again.");
      } else {
        setResultItem(data);
      }
    } catch (err: any) {
      setErrorMessage("We couldn't generate your music. Please try again.");
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
              <Music2 className="w-6 h-6 text-amber-400" />
              Music Lab
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Compose complete songs, create instrumentals, and synthesize music from lyrics.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <Card className="p-5 bg-[#0d121c] border border-slate-800/80 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1.5">
                  Track Description & Theme
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Uplifting cinematic track with driving bassline, melodic arpeggios, and warm pads..."
                  rows={3}
                  className="w-full bg-[#080b11] border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1.5">
                    Genre
                  </label>
                  <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-[#080b11] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {genres.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-200 block mb-1.5">
                    Mood & Energy
                  </label>
                  <select
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="w-full bg-[#080b11] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    {moods.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Track Composition Type */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-200">
                    Arrangement
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsInstrumental(true)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                        isInstrumental
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "text-slate-400 border-slate-800 hover:text-white"
                      }`}
                    >
                      Instrumental
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInstrumental(false)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                        !isInstrumental
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "text-slate-400 border-slate-800 hover:text-white"
                      }`}
                    >
                      Vocal Song
                    </button>
                  </div>
                </div>

                {!isInstrumental && (
                  <div className="mt-3">
                    <label className="text-xs font-bold text-slate-200 block mb-1.5">
                      Lyrics (Verse & Chorus)
                    </label>
                    <textarea
                      value={lyrics}
                      onChange={(e) => setLyrics(e.target.value)}
                      placeholder="Paste verse and chorus lyrics here..."
                      rows={4}
                      className="w-full bg-[#080b11] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
              </div>

              {/* Progressive Disclosure: Tempo & Duration */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{showAdvanced ? "Hide Rhythm & Duration" : "Adjust Tempo & Duration"}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
                </button>

                {showAdvanced && (
                  <div className="mt-3 p-3 bg-[#080b11] border border-slate-800 rounded-xl grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Tempo: {bpm} BPM
                      </label>
                      <input
                        type="range"
                        min={70}
                        max={160}
                        value={bpm}
                        onChange={(e) => setBpm(Number(e.target.value))}
                        className="w-full accent-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                        Track Length
                      </label>
                      <select
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full bg-[#0d121c] border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      >
                        <option value={10}>10s (Intro / Stinger)</option>
                        <option value={15}>15s (Standard Clip)</option>
                        <option value={30}>30s (Extended)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full mt-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500"
              >
                {generating ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Composing Track...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Disc3 className="w-4 h-4" />
                    Generate Music Track
                  </span>
                )}
              </Button>
            </Card>
          </div>

          <div className="lg:col-span-7">
            <Card className="p-6 bg-[#0d121c] border border-slate-800/80 min-h-[480px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Audio Master Player
                  </span>
                  {resultItem && (
                    <Badge variant="warning" className="text-[10px]">
                      Mastered
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

                <div className="mt-4 min-h-[320px] bg-black/60 rounded-xl border border-slate-800/80 p-6 flex flex-col items-center justify-center">
                  {generating ? (
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 rounded-full border-2 border-amber-500/30 border-t-amber-400 animate-spin mx-auto" />
                      <p className="text-xs text-slate-300 font-medium">Composing harmonics, rhythm, and arrangement...</p>
                      <p className="text-[10px] text-slate-500">Mastering stereo audio track</p>
                    </div>
                  ) : resultItem ? (
                    <div className="space-y-6 w-full max-w-md text-center">
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500/20 via-rose-500/20 to-purple-500/20 border border-amber-500/30 flex items-center justify-center mx-auto shadow-xl">
                        <Disc3 className="w-12 h-12 text-amber-400 animate-[spin_10s_linear_infinite]" />
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-white truncate">{resultItem.title}</h3>
                        <p className="text-xs text-amber-400/90 mt-1">
                          {resultItem.parameters?.genre} &bull; {resultItem.parameters?.bpm} BPM &bull; {resultItem.duration_seconds}s
                        </p>
                      </div>

                      <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 w-full shadow-lg">
                        <audio src={resultItem.output_url} controls className="w-full" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-2 text-slate-600">
                      <Music2 className="w-12 h-12 mx-auto" />
                      <p className="text-xs">Generated music track will play here</p>
                    </div>
                  )}
                </div>
              </div>

              {resultItem && (
                <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    <p className="font-semibold text-slate-200">{resultItem.title}</p>
                    <p className="text-[10px] text-slate-500">Stereo Audio WAV &bull; Mastered</p>
                  </div>
                  <a href={resultItem.output_url} download>
                    <Button size="sm" className="bg-amber-600 hover:bg-amber-500">
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Download Master Track
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
