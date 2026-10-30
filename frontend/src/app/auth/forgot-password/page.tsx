"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Clapperboard, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
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
            <h2 className="text-2xl font-bold tracking-tight text-white">Password Recovery</h2>
            <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-widest">
              VYRON AI ACCOUNT RECOVERY
            </p>
          </Link>
        </div>

        <Card className="border-slate-800/80 bg-[#0c1017]">
          {submitted ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-slate-100">Recovery Email Sent</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                If an account exists for <span className="text-slate-200 font-semibold">{email}</span>, a password reset link has been dispatched.
              </p>
              <div className="pt-2">
                <Link href="/auth/signin">
                  <Button variant="secondary" size="sm" className="w-full">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Enter your account email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@vyron.ai"
                icon={<Mail className="w-4 h-4" />}
              />

              <Button type="submit" className="w-full">
                Send Reset Link
              </Button>

              <div className="text-center pt-2">
                <Link href="/auth/signin" className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
