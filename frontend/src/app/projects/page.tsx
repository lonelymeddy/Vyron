"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Badge, Skeleton } from "@/components/ui";
import { FolderKanban, Plus, Search, Trash2 } from "lucide-react";

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("vyron_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const url = search
        ? `http://localhost:8000/api/projects?search=${encodeURIComponent(search)}`
        : "http://localhost:8000/api/projects";
      const res = await fetch(url, { headers });
      if (res.ok) {
        setProjects(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [search]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const token = localStorage.getItem("vyron_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      await fetch(`http://localhost:8000/api/projects/${id}`, {
        method: "DELETE",
        headers
      });
      fetchProjects();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FolderKanban className="w-6 h-6 text-violet-400" />
              My Projects
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage your saved cinematic 3D creation projects and video generations.
            </p>
          </div>

          <Link href="/create">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              New Project
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects by title..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : projects.length === 0 ? (
          <Card className="text-center py-12 border-dashed border-slate-800">
            <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No Projects Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              You haven't created any video projects yet.
            </p>
            <Link href="/create">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Create New Project
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <Card className="hover:border-violet-500/50 p-5 space-y-4 flex flex-col justify-between h-full transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={p.status === "COMPLETED" ? "success" : "purple"}>
                        {p.status}
                      </Badge>
                      <span className="text-[10px] text-slate-400">
                        {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-100 text-base">{p.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {p.prompt_instructions || "No custom creative prompt specified."}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-violet-400 font-medium">
                      {p.generation_mode?.replace(/_/g, " ")}
                    </span>
                    <button
                      onClick={(e) => handleDelete(p.id, e)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
