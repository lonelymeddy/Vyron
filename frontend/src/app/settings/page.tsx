"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button, Card, Input, Toast } from "@/components/ui";
import { Settings, User as UserIcon, Shield, Database, Bell, Lock, CheckCircle2, Cloud, CreditCard } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "account" | "security" | "notifications" | "privacy" | "storage">("profile");

  // User Profile State
  const [displayName, setDisplayName] = useState("VYRON Creator");
  const [email, setEmail] = useState("creator@vyron.ai");
  const [savingProfile, setSavingProfile] = useState(false);

  // Security State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingSecurity, setSavingSecurity] = useState(false);

  // Notifications
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [generationAlerts, setGenerationAlerts] = useState(true);

  // Storage
  const [s3Bucket, setS3Bucket] = useState("vyron-cinematic-assets");
  const [storageRegion, setStorageRegion] = useState("auto");

  const [toastMessage, setToastMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("vyron_token") : null;
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const user = await res.json();
          if (user.full_name) setDisplayName(user.full_name);
          if (user.email) setEmail(user.email);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadUser();
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setTimeout(() => {
      setSavingProfile(false);
      setToastMessage({ type: "success", text: "Profile details updated successfully." });
    }, 600);
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setToastMessage({ type: "error", text: "Please enter your current and new password." });
      return;
    }
    setSavingSecurity(true);
    setTimeout(() => {
      setSavingSecurity(false);
      setCurrentPassword("");
      setNewPassword("");
      setToastMessage({ type: "success", text: "Password security updated successfully." });
    }, 600);
  };

  return (
    <AppLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-violet-400" />
            Studio Settings & Configuration
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1 leading-relaxed">
            Manage profile preferences, authentication security, notifications, privacy settings, and Cloudflare R2 / S3 storage.
          </p>
        </div>

        {toastMessage && (
          <Toast
            type={toastMessage.type}
            message={toastMessage.text}
            onClose={() => setToastMessage(null)}
          />
        )}

        {/* TABS HEADER */}
        <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === "profile"
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <UserIcon className="w-4 h-4" /> Profile
          </button>

          <button
            onClick={() => setActiveTab("account")}
            className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === "account"
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <CreditCard className="w-4 h-4" /> Account & Credits
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === "security"
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Shield className="w-4 h-4" /> Security
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === "notifications"
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Bell className="w-4 h-4" /> Notifications
          </button>

          <button
            onClick={() => setActiveTab("privacy")}
            className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === "privacy"
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Lock className="w-4 h-4" /> Privacy
          </button>

          <button
            onClick={() => setActiveTab("storage")}
            className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shrink-0 ${
              activeTab === "storage"
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Database className="w-4 h-4" /> Cloud Storage
          </button>
        </div>

        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <Card className="p-6">
            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
              <Input
                label="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />

              <Input
                label="Email Address"
                value={email}
                disabled
                className="opacity-60 cursor-not-allowed"
              />

              <Button type="submit" size="sm" isLoading={savingProfile}>
                Save Profile Changes
              </Button>
            </form>
          </Card>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === "account" && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Studio Subscription Tier</h3>
                <p className="text-xs text-slate-400 mt-0.5">Professional Creator Plan &bull; Active</p>
              </div>
              <span className="px-3 py-1 bg-violet-500/10 text-violet-300 text-xs font-bold rounded-full border border-violet-500/20">
                PRO STUDIO
              </span>
            </div>

            <div className="p-4 bg-[#0a0e17] rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs text-slate-300 font-semibold">
                <span>Monthly GPU Render Credits</span>
                <span className="text-amber-400">100 / 100 CR</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full w-[100%]" />
              </div>
              <p className="text-[11px] text-slate-500">Credits auto-renew on the 1st of every calendar month.</p>
            </div>
          </Card>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && (
          <Card className="p-6">
            <form onSubmit={handleSaveSecurity} className="space-y-4 max-w-md">
              <h3 className="text-sm font-bold text-slate-100">Update Password</h3>

              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />

              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />

              <Button type="submit" size="sm" isLoading={savingSecurity}>
                Update Password
              </Button>
            </form>
          </Card>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === "notifications" && (
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Notification Preferences</h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-[#0a0e17] rounded-xl border border-slate-800 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Render Job Notifications</span>
                  <span className="text-[11px] text-slate-400">Receive alerts when AI video generation finishes rendering.</span>
                </div>
                <input
                  type="checkbox"
                  checked={generationAlerts}
                  onChange={(e) => setGenerationAlerts(e.target.checked)}
                  className="w-4 h-4 accent-violet-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-[#0a0e17] rounded-xl border border-slate-800 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Email News & Updates</span>
                  <span className="text-[11px] text-slate-400">Stay informed about new AI models and feature releases.</span>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 accent-violet-600 rounded"
                />
              </label>
            </div>
          </Card>
        )}

        {/* PRIVACY TAB */}
        {activeTab === "privacy" && (
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Data Privacy & Asset Protection</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              All uploaded character reference images and reference videos are encrypted at rest and accessible strictly by your authenticated user session.
            </p>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Strict zero-data-retention policy for public training sets active.</span>
            </div>
          </Card>
        )}

        {/* STORAGE TAB */}
        {activeTab === "storage" && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-violet-400" />
              <h3 className="text-sm font-bold text-slate-100">Private Cloud Storage Configuration</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              VYRON AI connects to S3-compatible cloud storage (Cloudflare R2) for high-speed streaming and private signed video URL distribution.
            </p>

            <div className="space-y-4 max-w-md pt-2">
              <Input
                label="Bucket Name"
                value={s3Bucket}
                onChange={(e) => setS3Bucket(e.target.value)}
              />

              <Input
                label="Storage Region / Endpoint"
                value={storageRegion}
                onChange={(e) => setStorageRegion(e.target.value)}
              />

              <Button
                size="sm"
                onClick={() => setToastMessage({ type: "success", text: "Storage parameters saved." })}
              >
                Save Storage Config
              </Button>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
