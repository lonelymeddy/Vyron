"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Skeleton, StatusIndicator } from "@/components/ui";
import { ListOrdered, Clock, RefreshCw, Play, Cpu, Layers } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function GenerationCenterPage() {
  const [generations, setGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGenerations = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("vyron_token") : null;
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${API_BASE_URL}/api/generations`, { headers });
      if (res.ok) {
        setGenerations(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenerations();
    const interval = setInterval(fetchGenerations, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ListOrdered className="w-6 h-6 text-violet-400" />
              Generation Queue Center
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 leading-relaxed">
              Real-time monitoring of AI CGI video rendering jobs across queue stages.
            </p>
          </div>

          <Button size="sm" variant="outline" onClick={fetchGenerations}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh Queue
          </Button>
        </div>

        {/* JOB STATUSES KEY */}
        <Card className="p-4 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 border-slate-800">
          <div className="flex items-center gap-2 font-semibold text-slate-300">
            <Cpu className="w-4 h-4 text-violet-400" />
            <span>Supported Job Pipeline States:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusIndicator status="DRAFT" />
            <StatusIndicator status="UPLOADING" />
            <StatusIndicator status="ANALYZING" />
            <StatusIndicator status="QUEUED" />
            <StatusIndicator status="PROCESSING" />
            <StatusIndicator status="POST_PROCESSING" />
            <StatusIndicator status="COMPLETED" />
            <StatusIndicator status="FAILED" />
          </div>
        </Card>

        {/* GENERATIONS LIST */}
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : generations.length === 0 ? (
          <Card className="text-center py-16 border-dashed border-slate-800">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No Generation Jobs in Queue</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
              When you launch a video generation from the Creator Studio, its pipeline progress will display here in real time.
            </p>
            <Link href="/create">
              <Button size="sm">Create New Video</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {generations.map((g) => (
              <Card key={g.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-violet-500/40 transition-all">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusIndicator status={g.status} />
                    <span className="text-xs font-bold text-slate-200 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800">
                      Provider: {g.provider_name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">Job Reference ID: {g.id}</p>
                  <p className="text-[11px] text-slate-500">
                    Submitted: {new Date(g.created_at).toLocaleString()}
                  </p>
                </div>

                {/* PROGRESS BAR */}
                <div className="w-full md:w-72 space-y-2">
                  <div className="flex justify-between items-center text-xs text-slate-300">
                    <span className="flex items-center gap-1 font-semibold">
                      <Layers className="w-3.5 h-3.5 text-violet-400" /> Render Progress
                    </span>
                    <span className="font-bold text-violet-400">{g.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 h-full transition-all duration-300"
                      style={{ width: `${Math.max(5, g.progress_percentage)}%` }}
                    />
                  </div>
                </div>

                <Link href={`/projects/${g.project_id}`}>
                  <Button size="sm" variant="secondary" className="shrink-0">
                    <Play className="w-3.5 h-3.5 mr-1.5" />
                    View Output
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
