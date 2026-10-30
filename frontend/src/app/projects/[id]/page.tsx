"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, StatusIndicator, Skeleton, BeforeAfterPlayer, ConfirmationModal, Toast } from "@/components/ui";
import { Download, ArrowLeft, RefreshCw, Film, Trash2, Settings, User as UserIcon } from "lucide-react";
import { apiClient, Project } from "@/lib/api";

function VideoResultContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    if (!projectId) return;

    async function fetchProject() {
      try {
        const data = await apiClient.projects.get(projectId);
        setProject(data);
      } catch (err) {
        console.error("Failed to load project:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [projectId]);

  const handleDelete = async () => {
    if (!projectId) return;
    setDeleting(true);
    try {
      await apiClient.projects.delete(projectId);
      router.push("/projects");
    } catch (err: any) {
      setToastMessage({ type: "error", text: err.message || "Failed to delete project." });
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[420px] w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <Card className="text-center py-16 max-w-lg mx-auto space-y-4 border-slate-800">
        <Film className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-lg font-bold text-slate-100">Project Not Found</h2>
        <p className="text-xs text-slate-400">The requested project record could not be loaded or was deleted.</p>
        <Link href="/projects" className="inline-block pt-2">
          <Button size="sm">Back to Projects</Button>
        </Link>
      </Card>
    );
  }

  const completedGeneration = project.generations?.find((g) => g.status === "COMPLETED") || project.generations?.[0];
  const generatedVideo = completedGeneration?.generated_videos?.[0];
  const sourceVideo = project.source_videos?.[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/projects" className="inline-flex items-center text-xs text-slate-400 hover:text-slate-100 font-medium">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Projects
        </Link>

        <div className="flex items-center gap-3">
          <StatusIndicator status={project.status} />
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
            title="Delete Project"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.text}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* PROJECT TITLE & MODE */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">{project.title}</h1>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Mode: <span className="text-violet-400 font-semibold">{project.generation_mode?.replace(/_/g, " ")}</span> &bull; Created {new Date(project.created_at).toLocaleString()}
        </p>
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* VIDEO DISPLAY AREA */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-3 bg-black/90 border-slate-800 rounded-2xl overflow-hidden glow-violet">
            {generatedVideo ? (
              <BeforeAfterPlayer
                originalSrc={sourceVideo?.video_url}
                generatedSrc={generatedVideo.video_url}
              />
            ) : (
              <div className="w-full aspect-video rounded-xl bg-[#0a0e17] flex flex-col items-center justify-center p-8 text-center space-y-3">
                <Film className="w-12 h-12 text-slate-600 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-200">
                  {project.status === "FAILED" ? "Generation Failed" : "Video Rendering in Progress"}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  {project.status === "FAILED"
                    ? completedGeneration?.error_message || "The AI render engine reported an error during video synthesis."
                    : "Your CGI video generation is processing in the queue center."}
                </p>
                {project.status !== "FAILED" && (
                  <Link href="/generations">
                    <Button size="sm" variant="outline" className="mt-2">
                      View Queue Progress
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </Card>

          {/* DOWNLOAD & SPECS */}
          {generatedVideo && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900/80 rounded-xl border border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Generated Video Specifications</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Resolution: {project.settings?.resolution || "1080p"} &bull; FPS: 30 &bull; Format: MP4 &bull; Codec: H.264
                </p>
              </div>
              <a href={generatedVideo.video_url} download target="_blank" rel="noreferrer" className="shrink-0">
                <Button size="sm">
                  <Download className="w-4 h-4 mr-1.5" />
                  Download Video File
                </Button>
              </a>
            </div>
          )}
        </div>

        {/* SIDEBAR PARAMETERS */}
        <div className="space-y-4">
          <Card className="p-5 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Settings className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-bold text-slate-100">Project Configuration</h3>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 block">Prompt & Instructions</label>
              <p className="text-xs text-slate-300 bg-[#0a0e17] p-3 rounded-lg border border-slate-800 leading-relaxed">
                {project.prompt_instructions || "No custom prompt provided."}
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-400 block flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-violet-400" /> Character Model
              </label>
              <p className="text-xs text-slate-200 font-bold bg-[#0a0e17] p-2.5 rounded-lg border border-slate-800">
                {project.character?.name || "Custom Upload Avatar"}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Environment:</span>
                <span className="text-slate-200 font-semibold">{project.settings?.environment || "Erangel PUBG"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Lighting:</span>
                <span className="text-slate-200 font-semibold">{project.settings?.lighting || "Dramatic Sunset"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Camera Motion:</span>
                <span className="text-slate-200 font-semibold">{project.settings?.camera_motion || "Cinematic Orbit"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Aspect Ratio:</span>
                <span className="text-slate-200 font-semibold">{project.settings?.aspect_ratio || "16:9"}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800">
              <Link href="/create">
                <Button size="sm" variant="outline" className="w-full">
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Regenerate Video
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* DELETE MODAL */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete '${project.title}'? This action is permanent.`}
        confirmText="Delete Project"
        isLoading={deleting}
      />
    </div>
  );
}

export default function VideoResultPage() {
  return (
    <AppLayout>
      <Suspense fallback={<Skeleton className="h-72 w-full" />}>
        <VideoResultContent />
      </Suspense>
    </AppLayout>
  );
}
