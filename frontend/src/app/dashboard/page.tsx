"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Badge, Skeleton } from "@/components/ui";
import {
  Sparkles,
  Plus,
  Users,
  Video,
  FolderKanban,
  Coins,
  ChevronRight,
  Play,
  Film
} from "lucide-react";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<any[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [credits, setCredits] = useState<number>(100);

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("vyron_token");
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

        const [projRes, charRes, credRes] = await Promise.all([
          fetch("http://localhost:8000/api/projects", { headers }).catch(() => null),
          fetch("http://localhost:8000/api/characters", { headers }).catch(() => null),
          fetch("http://localhost:8000/api/credits/balance", { headers }).catch(() => null)
        ]);

        if (projRes && projRes.ok) setProjects(await projRes.json());
        if (charRes && charRes.ok) setCharacters(await charRes.json());
        if (credRes && credRes.ok) {
          const credData = await credRes.json();
          setCredits(credData.balance);
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
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-950/60 via-indigo-950/40 to-slate-900 border border-violet-500/30 p-8 glow-violet">
          <div className="relative z-10 max-w-2xl">
            <Badge variant="purple" className="mb-3">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              VYRON AI STUDIO ENGINE v1.0
            </Badge>
            <h1 className="text-3xl font-extrabold text-white">Welcome to VYRON AI</h1>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed">
              Upload character references and generate high-end cinematic 3D videos with AI character replacement, full CGI recreations, and PUBG-inspired virtual worlds.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/create">
                <Button size="md">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Create New Video
                </Button>
              </Link>
              <Link href="/characters">
                <Button variant="outline" size="md">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Characters
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Projects</p>
              <p className="text-2xl font-bold text-white">{projects.length}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Character Models</p>
              <p className="text-2xl font-bold text-white">{characters.length}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Available Credits</p>
              <p className="text-2xl font-bold text-amber-400">{credits} CR</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">CGI Render Engine</p>
              <p className="text-xs font-bold text-emerald-400">Online & Ready</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-violet-400" />
                Recent Projects
              </h2>
              <Link href="/projects" className="text-xs text-violet-400 hover:underline flex items-center">
                View All <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
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
                <h3 className="text-base font-semibold text-slate-200">No Projects Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                  Start your first cinematic project by uploading a character image and reference video.
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
                {projects.slice(0, 4).map((p) => (
                  <Link key={p.id} href={`/projects/${p.id}`}>
                    <Card className="hover:border-violet-500/50 flex items-center justify-between gap-4 p-4 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-violet-400">
                          <Play className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-100">{p.title}</h4>
                          <p className="text-xs text-slate-400">{p.generation_mode?.replace(/_/g, " ")}</p>
                        </div>
                      </div>
                      <Badge variant={p.status === "COMPLETED" ? "success" : "purple"}>
                        {p.status}
                      </Badge>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                Character Library
              </h2>
              <Link href="/characters" className="text-xs text-violet-400 hover:underline flex items-center">
                Manage <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>

            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : characters.length === 0 ? (
              <Card className="text-center py-8 border-dashed border-slate-800">
                <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 mb-3">No character models uploaded yet.</p>
                <Link href="/characters">
                  <Button size="sm" variant="outline">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Upload Character
                  </Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {characters.slice(0, 4).map((c) => (
                  <Card key={c.id} className="p-3 text-center">
                    <img
                      src={c.image_url}
                      alt={c.name}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                    />
                    <p className="text-xs font-semibold text-slate-200 truncate">{c.name}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
