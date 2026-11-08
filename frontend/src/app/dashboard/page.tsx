"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Badge, Skeleton } from "@/components/ui";
import {
  Sparkles,
  Image as ImageIcon,
  Video,
  Mic,
  Music2,
  FolderKanban,
  Coins,
  ChevronRight,
  ArrowUpRight,
  Sliders,
  Cpu
} from "lucide-react";

interface CreationItem {
  id: string;
  modality: string;
  title: string;
  prompt: string;
  media_url: string;
  model_name: string;
  created_at: string;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [creations, setCreations] = useState<CreationItem[]>([]);
  const [credits, setCredits] = useState<number>(100);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("vyron_token");
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const [credRes, creationsRes] = await Promise.all([
          fetch("/api/credits/balance", { headers: headers as HeadersInit })
            .then((r) => (r.ok ? r.json() : { balance: 100 }))
            .catch(() => ({ balance: 100 })),
          fetch("/api/labs/creations", { headers: headers as HeadersInit })
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => []),
        ]);

        if (credRes && typeof credRes.balance === "number") {
          setCredits(credRes.balance);
        }
        setCreations(creationsRes || []);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const labs = [
    {
      title: "Image Lab",
      desc: "FLUX.1 Schnell & Qwen-Image generation, Real-ESRGAN upscaling & rembg background removal.",
      href: "/labs/image",
      icon: ImageIcon,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
      badge: "FLUX / Qwen / rembg",
    },
    {
      title: "Video Lab",
      desc: "Wan 2.1 & LTX-Video text-to-video, image animation, and FFmpeg video transformations.",
      href: "/labs/video",
      icon: Video,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      badge: "Wan 2.1 / LTX / FFmpeg",
    },
    {
      title: "Voice Lab",
      desc: "Kokoro-82M text-to-speech, OpenVoice V2 authorized voice cloning & Whisper transcription.",
      href: "/labs/voice",
      icon: Mic,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      badge: "Kokoro / Whisper / OpenVoice",
    },
    {
      title: "Music Lab",
      desc: "ACE-Step 1.5 music & song generation, vocal & instrumental synthesis with waveform player.",
      href: "/labs/music",
      icon: Music2,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      badge: "ACE-Step 1.5",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* WELCOME BANNER */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-950/80 via-slate-900 to-[#0c1017] border border-violet-500/30 p-6 md:p-8 glow-violet shadow-2xl">
          <div className="relative z-10 max-w-3xl space-y-3">
            <Badge variant="purple" className="py-1 px-3">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-violet-400" />
              YOUR CREATIVE AI LABORATORY &bull; VYRON AI LABS
            </Badge>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Multimodal Neural AI Generation Studio
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Create high-fidelity images, cinematic videos, expressive speech synthesis, and full-length music compositions through one unified AI workspace.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link href="/labs/image">
                <Button size="md">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Launch Image Lab
                </Button>
              </Link>
              <Link href="/tools">
                <Button variant="outline" size="md">
                  <Sliders className="w-4 h-4 mr-2" />
                  AI Creative Studio
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">My Creations</p>
              <p className="text-2xl font-bold text-white">{creations.length}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Active AI Models</p>
              <p className="text-2xl font-bold text-white">12 Models</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Available Credits</p>
              <p className="text-2xl font-bold text-amber-400">{credits} CR</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Platform Status</p>
              <p className="text-xs font-bold text-emerald-400">All Labs Ready</p>
            </div>
          </Card>
        </div>

        {/* 4 PRIMARY CREATIVE WORKSPACES */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            Primary Creative Workspaces
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {labs.map((lab) => {
              const Icon = lab.icon;
              return (
                <Link key={lab.title} href={lab.href} className="group">
                  <Card className="p-6 transition-all duration-200 hover:border-violet-500/50 hover:bg-slate-900/60 flex flex-col justify-between h-full">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`w-12 h-12 rounded-xl ${lab.bg} border ${lab.border} ${lab.color} flex items-center justify-center`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <Badge variant="charcoal" className="text-[10px] text-slate-400 border-slate-700">
                          {lab.badge}
                        </Badge>
                      </div>
                      <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors flex items-center gap-2">
                        {lab.title}
                        <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {lab.desc}
                      </p>
                    </div>
                    <div className="pt-4 flex items-center justify-between text-xs font-medium text-violet-400">
                      <span>Launch Studio</span>
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* RECENT CREATIONS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-violet-400" />
              Recent Creations
            </h2>
            <Link href="/creations" className="text-xs text-violet-400 hover:underline flex items-center font-medium">
              View All Creations <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : creations.length === 0 ? (
            <Card className="text-center py-10 border-dashed border-slate-800">
              <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-200">No creations saved yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Explore the Image, Video, Voice, and Music labs to begin generating AI content.
              </p>
              <Link href="/labs/image">
                <Button size="sm">
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Create First Artwork
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {creations.slice(0, 3).map((item) => (
                <Card key={item.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="purple" className="text-[10px] capitalize">
                      {item.modality}
                    </Badge>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{item.prompt}</p>
                  </div>
                  {item.media_url && item.modality === "image" && (
                    <img src={item.media_url} alt={item.title} className="w-full h-28 object-cover rounded-lg bg-slate-900" />
                  )}
                  {item.media_url && (item.modality === "voice" || item.modality === "music") && (
                    <audio controls src={item.media_url} className="w-full h-8 mt-2" />
                  )}
                  {item.media_url && item.modality === "video" && (
                    <video controls src={item.media_url} className="w-full h-28 object-cover rounded-lg bg-slate-900" />
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
