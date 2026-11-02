import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Video,
  Layers,
  Compass,
  ArrowRight,
  Wand2,
  ShieldCheck,
  Zap,
  Film
} from "lucide-react";
import { Button, Card, Badge, Logo } from "@/components/ui";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-violet-600 selection:text-white antialiased">
      {/* NAVIGATION */}
      <nav className="h-20 border-b border-slate-800/80 px-6 max-w-7xl w-full mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center transition-transform group-hover:scale-105">
            <Logo size={42} priority />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-wider text-white block leading-none">VYRON AI</span>
            <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-1">
              CREATE BEYOND REALITY
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/auth/signin">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/create">
            <Button size="sm">
              GET STARTED
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="py-20 px-6 max-w-6xl mx-auto text-center flex flex-col items-center">
        <Badge variant="purple" className="mb-6 py-1 px-3.5 text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-violet-400" />
          AI CINEMATIC CGI VIDEO CREATION PLATFORM
        </Badge>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight text-slate-100">
          Transform Character Images into <span className="gradient-text">Cinematic 3D Video Masterpieces</span>
        </h1>

        <p className="mt-6 text-slate-400 text-base md:text-lg max-w-2xl leading-relaxed">
          VYRON AI provides high-precision AI video generation to replace characters, recreate CGI scenes, and render original virtual worlds with natural language control.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/create">
            <Button size="lg" className="px-8 shadow-xl">
              <Sparkles className="w-5 h-5 mr-2" />
              GET STARTED NOW
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg" className="px-6">
              <Compass className="w-5 h-5 mr-2" />
              Studio Workspace
            </Button>
          </Link>
        </div>

        {/* HERO SHOWCASE PREVIEW */}
        <div className="mt-16 w-full max-w-5xl rounded-2xl overflow-hidden border border-slate-800/90 glow-violet bg-[#0c1017] relative group shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop"
            alt="VYRON AI Cinematic 3D Scene"
            className="w-full h-[360px] md:h-[460px] object-cover object-center opacity-85 group-hover:opacity-100 transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-transparent to-transparent flex flex-col justify-end p-6 md:p-8 text-left">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="cyan">PUBG CGI World</Badge>
              <Badge variant="purple">4K Ultra HD Engine</Badge>
              <Badge variant="success">Active Render Output</Badge>
            </div>
            <h3 className="text-2xl font-bold text-white">Character Replacement & Scene Synthesis</h3>
            <p className="text-slate-300 text-xs md:text-sm max-w-xl mt-1 leading-relaxed">
              Maintained original physics, camera motion, and cinematic lighting while replacing character avatars with custom high-resolution inputs.
            </p>
          </div>
        </div>
      </section>

      {/* CORE MODES SECTION */}
      <section className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/80 w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">Three Distinct Generation Modes</h2>
          <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
            Engineered specifically for high-precision CGI production workflows
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:border-violet-500/50 transition-colors p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Mode 1: Character Replacement</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Upload a character photo and a reference video. Replaces the original character while retaining realistic body motion, action timing, and scene physics.
            </p>
          </Card>

          <Card className="hover:border-indigo-500/50 transition-colors p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Mode 2: Full CGI Recreation</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Recreates reference video camera moves and lighting inside fully rendered 3D environments featuring customizable outfits, vehicles, and weather settings.
            </p>
          </Card>

          <Card className="hover:border-cyan-500/50 transition-colors p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Wand2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Mode 3: Original CGI Creation</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Synthesize brand new 3D cinematic scenes directly from prompt instructions, environments, and character assets without requiring a reference video.
            </p>
          </Card>
        </div>
      </section>

      {/* ARCHITECTURE HIGHLIGHTS */}
      <section className="py-12 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-400 text-xs">
          <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-200 text-xs mb-1">Private Asset Protection</h4>
              <p>Uploaded character images and video references are stored securely with signed cloud access controls.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800/80 flex items-start gap-3">
            <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-200 text-xs mb-1">Queue & Render Monitoring</h4>
              <p>Monitor status updates live across Queued, Processing, and Post-processing render pipeline stages.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800/80 flex items-start gap-3">
            <Film className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-200 text-xs mb-1">Multi-Provider AI Registry</h4>
              <p>Modular backend orchestration ready for production Kling AI, Runway AI, or custom video engines.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-slate-800/80 py-8 px-6 text-center text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center">
              <Logo size={24} />
            </div>
            <span className="font-bold text-slate-300">VYRON AI</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-[10px] tracking-widest text-slate-500 uppercase">CREATE BEYOND REALITY</span>
          </div>
          <p>&copy; 2026 VYRON AI Studio. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
