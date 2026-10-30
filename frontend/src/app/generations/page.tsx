"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Badge, Skeleton } from "@/components/ui";
import { ListOrdered, Clock, RefreshCw, Play } from "lucide-react";

export default function GenerationCenterPage() {
  const [generations, setGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGenerations = async () => {
    try {
      const token = localStorage.getItem("vyron_token");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch("http://localhost:8000/api/generations", { headers });
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ListOrdered className="w-6 h-6 text-violet-400" />
              Generation Queue Center
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Real-time monitoring of active and completed AI video rendering jobs.
            </p>
          </div>

          <Button size="sm" variant="outline" onClick={fetchGenerations}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh Queue
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : generations.length === 0 ? (
          <Card className="text-center py-12 border-dashed border-slate-800">
            <Clock className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No Generation Jobs in Queue</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              When you submit a video generation from the Creator Studio, its processing progress will appear here.
            </p>
            <Link href="/create">
              <Button size="sm">Create New Video</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {generations.map((g) => (
              <Card key={g.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={g.status === "COMPLETED" ? "success" : g.status === "FAILED" ? "error" : "purple"}>
                      {g.status}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-200">Provider: {g.provider_name}</span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">Job ID: {g.id}</p>
                  <p className="text-[11px] text-slate-500">Submitted: {new Date(g.created_at).toLocaleString()}</p>
                </div>

                <div className="w-full md:w-64 space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Render Progress</span>
                    <span className="font-bold">{g.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full transition-all duration-300"
                      style={{ width: `${g.progress_percentage}%` }}
                    />
                  </div>
                </div>

                <Link href={`/projects/${g.project_id}`}>
                  <Button size="sm" variant="outline">
                    <Play className="w-3.5 h-3.5 mr-1" />
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
