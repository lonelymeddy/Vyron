"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Badge, Skeleton } from "@/components/ui";
import { Download, ArrowLeft, RefreshCw, Film } from "lucide-react";

function VideoResultContent() {
  const params = useParams();
  const projectId = params?.id as string;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    async function fetchProject() {
      try {
        const token = localStorage.getItem("vyron_token");
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`http://localhost:8000/api/projects/${projectId}`, { headers });
        if (res.ok) {
          setProject(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <Card className="text-center py-12">
        <h2 className="text-lg font-bold text-slate-100">Project Not Found</h2>
        <Link href="/projects" className="mt-4 inline-block">
          <Button size="sm">Back to Projects</Button>
        </Link>
      </Card>
    );
  }

  const completedGeneration = project.generations?.find((g: any) => g.status === "COMPLETED") || project.generations?.[0];
  const generatedVideo = completedGeneration?.generated_videos?.[0];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/projects" className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Projects
        </Link>

        <Badge variant={project.status === "COMPLETED" ? "success" : "purple"}>
          {project.status}
        </Badge>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">{project.title}</h1>
        <p className="text-xs text-slate-400 mt-1">
          Generation Mode: {project.generation_mode?.replace(/_/g, " ")} &bull; Created {new Date(project.created_at).toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card className="p-2 bg-slate-950 border-slate-800 rounded-xl overflow-hidden glow-violet">
            {generatedVideo ? (
              <video src={generatedVideo.video_url} controls autoPlay className="w-full rounded-lg aspect-video object-cover" />
            ) : (
              <div className="w-full aspect-video rounded-lg bg-slate-900 flex flex-col items-center justify-center p-6 text-center">
                <Film className="w-10 h-10 text-slate-600 mb-2" />
                <p className="text-sm font-semibold text-slate-300">Rendering in Progress</p>
                <p className="text-xs text-slate-500 mt-1">
                  AI generation is processing. Check back shortly or view status in the Generation Center.
                </p>
              </div>
            )}
          </Card>

          {generatedVideo && (
            <div className="flex items-center justify-between p-4 bg-slate-900/60 rounded-xl border border-slate-800">
              <div>
                <h4 className="text-xs font-semibold text-slate-200">Generated Render Specs</h4>
                <p className="text-[11px] text-slate-400">Resolution: 1080p &bull; FPS: 30 &bull; Format: MP4</p>
              </div>
              <a href={generatedVideo.video_url} download target="_blank" rel="noreferrer">
                <Button size="sm">
                  <Download className="w-4 h-4 mr-1.5" />
                  Download Video
                </Button>
              </a>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 pb-2 border-b border-slate-800">Project Configuration</h3>

            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Creative Instructions</label>
              <p className="text-xs text-slate-300 bg-slate-900 p-2.5 rounded border border-slate-800">
                {project.prompt_instructions || "No custom prompt provided."}
              </p>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Character Model</label>
              <p className="text-xs text-slate-300 font-semibold">
                {project.character?.name || "Custom Character Upload"}
              </p>
            </div>

            <div className="pt-2">
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
    </div>
  );
}

export default function VideoResultPage() {
  return (
    <AppLayout>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <VideoResultContent />
      </Suspense>
    </AppLayout>
  );
}
