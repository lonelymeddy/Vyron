"use client";

import React, { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card } from "@/components/ui";
import { Settings, User as UserIcon, Shield, Database, CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "storage">("profile");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-violet-400" />
            Studio Settings & Preferences
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your account details, authentication security, and cloud storage configuration.
          </p>
        </div>

        <div className="flex border-b border-slate-800 gap-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "profile"
                ? "border-violet-500 text-violet-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <UserIcon className="w-4 h-4" /> Profile & Account
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "security"
                ? "border-violet-500 text-violet-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Shield className="w-4 h-4" /> Security & Privacy
          </button>

          <button
            onClick={() => setActiveTab("storage")}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === "storage"
                ? "border-violet-500 text-violet-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Database className="w-4 h-4" /> Private Storage (R2/S3)
          </button>
        </div>

        {saved && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        {activeTab === "profile" && (
          <Card>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Display Name</label>
                <input
                  type="text"
                  defaultValue="VYRON Creator"
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  defaultValue="creator@vyron.ai"
                  disabled
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>

              <Button type="submit" size="sm">Save Changes</Button>
            </form>
          </Card>
        )}

        {activeTab === "security" && (
          <Card className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200">Authentication & Security</h3>
            <p className="text-xs text-slate-400">
              VYRON AI uses Supabase Auth or JWT-encrypted session handling. All uploaded character photos and reference video assets remain 100% private and accessible only by your user account.
            </p>
            <Button size="sm" variant="outline">Change Password</Button>
          </Card>
        )}

        {activeTab === "storage" && (
          <Card className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200">Private Cloud Storage Configuration</h3>
            <p className="text-xs text-slate-400">
              Configured storage backend: <span className="font-semibold text-slate-200">Cloudflare R2 (S3 Compatible)</span>. Signed URLs ensure non-public direct asset protection.
            </p>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
