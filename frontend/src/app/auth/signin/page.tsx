"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clapperboard, Lock, Mail, ArrowRight } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Invalid email or password" }));
        throw new Error(data.detail || "Authentication failed.");
      }

      const data = await res.json();
      if (data.access_token) {
        localStorage.setItem("vyron_token", data.access_token);
        router.push("/dashboard");
      } else {
        throw new Error("Token missing from server response.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Check backend server connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex items-center justify-center p-6 selection:bg-violet-600 selection:text-white">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-block group">
            <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center glow-violet mx-auto mb-3 transition-transform group-hover:scale-105">
              <Clapperboard className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Sign in to VYRON AI</h2>
            <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-widest">
              CREATE BEYOND REALITY
            </p>
          </Link>
        </div>

        <Card className="border-slate-800/80 bg-[#0c1017]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
                {error}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="creator@vyron.ai"
              icon={<Mail className="w-4 h-4" />}
            />

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <Link href="/auth/forgot-password" className="text-xs text-violet-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
              />
            </div>

            <Button type="submit" isLoading={loading} className="w-full mt-2">
              Sign In
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-violet-400 font-medium hover:underline">
              Create an account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
