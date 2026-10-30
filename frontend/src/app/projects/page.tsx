"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Skeleton, StatusIndicator, ConfirmationModal, Input, Select, Toast } from "@/components/ui";
import { FolderKanban, Plus, Search, Trash2, Play, Film, Calendar } from "lucide-react";
import { apiClient, Project } from "@/lib/api";

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("");

  // Delete State
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const fetchProjects = async () => {
    try {
      const data = await apiClient.projects.list({
        search: search || undefined,
        mode: modeFilter || undefined,
      });
      setProjects(data);
    } catch (err) {
      console.error("Error loading projects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [search, modeFilter]);

  const handleDeleteConfirm = async () => {
    if (!deleteProject) return;

    setDeleting(true);
    try {
      await apiClient.projects.delete(deleteProject.id);
      setToastMessage({ type: "success", text: "Project deleted successfully." });
      setDeleteProject(null);
      fetchProjects();
    } catch (err: any) {
      setToastMessage({ type: "error", text: err.message || "Failed to delete project." });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FolderKanban className="w-6 h-6 text-violet-400" />
              My Projects
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 leading-relaxed">
              Manage, search, filter, and inspect your saved cinematic CGI video projects and outputs.
            </p>
          </div>

          <Link href="/create">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Create New Project
            </Button>
          </Link>
        </div>

        {toastMessage && (
          <Toast
            type={toastMessage.type}
            message={toastMessage.text}
            onClose={() => setToastMessage(null)}
          />
        )}

        {/* SEARCH & FILTERS */}
        <Card className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:flex-1">
            <Input
              placeholder="Search projects by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4 text-slate-500" />}
            />
          </div>

          <div className="w-full md:w-64">
            <Select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
            >
              <option value="">All Generation Modes</option>
              <option value="CHARACTER_REPLACEMENT">Character Replacement</option>
              <option value="FULL_CGI_RECREATION">Full CGI Recreation</option>
              <option value="ORIGINAL_CGI_CREATION">Original CGI Creation</option>
            </Select>
          </div>
        </Card>

        {/* PROJECTS GRID */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        ) : projects.length === 0 ? (
          <Card className="text-center py-16 border-dashed border-slate-800">
            <FolderKanban className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No Projects Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
              {search || modeFilter
                ? "No projects match your search or mode filter. Try clearing filters."
                : "You haven't created any video projects yet."}
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
              <Card key={p.id} className="p-5 space-y-4 flex flex-col justify-between hover:border-violet-500/50 transition-all group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <StatusIndicator status={p.status} />
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-violet-400 shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-100 text-sm truncate">{p.title}</h3>
                      <p className="text-[11px] text-violet-400 font-semibold mt-0.5">
                        {p.generation_mode?.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {p.prompt_instructions || "No custom prompt instructions specified."}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <Link href={`/projects/${p.id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full text-xs">
                      <Film className="w-3.5 h-3.5 mr-1" />
                      Open Project
                    </Button>
                  </Link>
                  <button
                    onClick={() => setDeleteProject(p)}
                    className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        <ConfirmationModal
          isOpen={!!deleteProject}
          onClose={() => setDeleteProject(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Project"
          message={`Are you sure you want to delete '${deleteProject?.title}'? All generated videos and history for this project will be removed.`}
          confirmText="Delete Project"
          isLoading={deleting}
        />
      </div>
    </AppLayout>
  );
}
