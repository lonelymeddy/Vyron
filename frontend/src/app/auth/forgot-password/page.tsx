"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Clapperboard, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button, Card } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center glow-violet mx-auto mb-3">
            <Clapperboard className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Reset Password</h2>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest">VYRON AI ACCOUNT RECOVERY</p>
        </div>

        <Card className="border-slate-800 bg-[#0c1017]">
          {submitted ? (
            <div className="text-center py-4 space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-slate-100">Reset Link Sent</h3>
              <p className="text-xs text-slate-400">
                If an account exists for <span className="text-slate-200">{email}</span>, password reset instructions have been sent.
              </p>
              <Link href="/auth/signin">
                <Button variant="secondary" size="sm" className="mt-4">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Enter your email address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="creator@vyron.ai"
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Send Recovery Email
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
