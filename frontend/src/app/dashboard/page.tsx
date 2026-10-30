"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Badge, Skeleton, StatusIndicator } from "@/components/ui";
import {
  Sparkles,
  Plus,
  Users,
  Video,
  FolderKanban,
  Coins,
  ChevronRight,
  Play,
  Film,
  Activity,
  ArrowUpRight
} from "lucide-react";
import { apiClient, Character, Project, Generation } from "@/lib/api";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [credits, setCredits] = useState<number>(100);

  useEffect(() => {
    async function fetchData() {
      try {
        const [projRes, charRes, genRes, credRes] = await Promise.all([
          apiClient.projects.list().catch(() => []),
          apiClient.characters.list().catch(() => []),
          apiClient.generations.list().catch(() => []),
          apiClient.credits.getBalance().catch(() => ({ balance: 100, updated_at: "" })),
        ]);

        setProjects(projRes);
        setCharacters(charRes);
        setGenerations(genRes);
        if (credRes && typeof credRes.balance === "number") {
          setCredits(credRes.balance);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* WELCOME BANNER */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-950/70 via-indigo-950/50 to-[#0c1017] border border-violet-500/30 p-6 md:p-8 glow-violet shadow-2xl">
          <div className="relative z-10 max-w-2xl space-y-3">
            <Badge variant="purple" className="py-1 px-3">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-violet-400" />
              CREATE BEYOND REALITY &bull; STUDIO DASHBOARD
            </Badge>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Welcome to VYRON AI Studio
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Upload character reference images and render cinematic 3D CGI videos with natural language controls, AI character replacement, and PUBG-inspired environments.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link href="/create">
                <Button size="md">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create New Video
                </Button>
              </Link>
              <Link href="/characters">
                <Button variant="outline" size="md">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Character Library
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
              <p className="text-xs text-slate-400 font-medium">Saved Projects</p>
              <p className="text-2xl font-bold text-white">{projects.length}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Character Avatars</p>
              <p className="text-2xl font-bold text-white">{characters.length}</p>
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
              <Video className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Render Engine Status</p>
              <p className="text-xs font-bold text-emerald-400">Online & Ready</p>
            </div>
          </Card>
        </div>

        {/* RECENT PROJECTS & GENERATION ACTIVITY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* RECENT PROJECTS */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-violet-400" />
                Recent Projects
              </h2>
              <Link href="/projects" className="text-xs text-violet-400 hover:underline flex items-center font-medium">
                View All Projects <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : projects.length === 0 ? (
              <Card className="text-center py-12 border-dashed border-slate-800">
                <Film className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-200">No Projects Created Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                  Start your first cinematic project by uploading a character image and configuring generation parameters.
                </p>
                <Link href="/create">
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Create First Video
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {projects.slice(0, 5).map((p) => (
                  <Link key={p.id} href={`/projects/${p.id}`}>
                    <Card className="hover:border-violet-500/50 flex items-center justify-between gap-4 p-4 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-violet-400 shrink-0">
                          <Play className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-100">{p.title}</h4>
                          <p className="text-[11px] text-slate-400">{p.generation_mode?.replace(/_/g, " ")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusIndicator status={p.status} />
                        <ArrowUpRight className="w-4 h-4 text-slate-500" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* GENERATION ACTIVITY & CHARACTER SHORTCUTS */}
          <div className="space-y-6">
            {/* RECENT GENERATION ACTIVITY */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  Recent Generation Activity
                </h2>
                <Link href="/generations" className="text-xs text-violet-400 hover:underline flex items-center font-medium">
                  Queue Center <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>

              {loading ? (
                <Skeleton className="h-32 w-full" />
              ) : generations.length === 0 ? (
                <Card className="text-center py-6 border-dashed border-slate-800">
                  <p className="text-xs text-slate-400">No active or recent video renders.</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {generations.slice(0, 3).map((g) => (
                    <Card key={g.id} className="p-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <StatusIndicator status={g.status} />
                        <span className="text-[10px] text-slate-400 font-mono">{g.provider_name}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>Progress: {g.progress_percentage}%</span>
                        <span>{new Date(g.created_at).toLocaleTimeString()}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* CHARACTER LIBRARY SHORTCUT */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  Character Library
                </h2>
                <Link href="/characters" className="text-xs text-violet-400 hover:underline flex items-center font-medium">
                  Manage <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </Link>
              </div>

              {loading ? (
                <Skeleton className="h-32 w-full" />
              ) : characters.length === 0 ? (
                <Card className="text-center py-6 border-dashed border-slate-800 space-y-2">
                  <p className="text-xs text-slate-400">No character models uploaded.</p>
                  <Link href="/characters">
                    <Button size="sm" variant="outline">
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Upload Character
                    </Button>
                  </Link>
                </Card>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {characters.slice(0, 4).map((c) => (
                    <Link key={c.id} href={`/create?character_id=${c.id}`}>
                      <Card className="p-2.5 text-center hover:border-violet-500/50 transition-colors group">
                        <img
                          src={c.image_url}
                          alt={c.name}
                          className="w-full h-20 object-cover rounded-lg mb-2 bg-slate-900 group-hover:opacity-90"
                        />
                        <p className="text-xs font-semibold text-slate-200 truncate">{c.name}</p>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
