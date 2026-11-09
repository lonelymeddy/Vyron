import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Image as ImageIcon,
  Video,
  Mic,
  Music2,
  Sliders,
  ArrowRight,
  ShieldCheck,
  Zap,
  Palette
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
            <span className="font-extrabold text-xl tracking-wider text-white block leading-none">VYRON AI LABS</span>
            <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-1">
              YOUR CREATIVE AI LABORATORY
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/auth/signin">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm">
              Launch Studio
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="py-20 px-6 max-w-6xl mx-auto text-center flex flex-col items-center">
        <Badge variant="purple" className="mb-6 py-1 px-3.5 text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-violet-400" />
          YOUR CREATIVE AI LABORATORY &bull; ALL-IN-ONE STUDIO
        </Badge>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight text-slate-100">
          Professional AI Creation for <span className="gradient-text">Images, Videos, Voice & Music</span>
        </h1>

        <p className="mt-6 text-slate-400 text-base md:text-lg max-w-2xl leading-relaxed">
          VYRON AI LABS gives creators an intuitive, high-performance platform to generate captivating visual artwork, cinematic video sequences, expressive voiceovers, and studio-grade music.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/dashboard">
            <Button size="lg" className="px-8 shadow-xl">
              <Sparkles className="w-5 h-5 mr-2" />
              ENTER THE LABS
            </Button>
          </Link>
          <Link href="/labs/image">
            <Button variant="outline" size="lg" className="px-6">
              <ImageIcon className="w-5 h-5 mr-2" />
              Explore Image Lab
            </Button>
          </Link>
        </div>
      </section>

      {/* FOUR MAIN AI LABS */}
      <section className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/80 w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">The Four Creative AI Studios</h2>
          <p className="text-slate-400 text-sm mt-2 max-w-xl mx-auto">
            Everything you need to turn creative ideas into finished commercial productions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/labs/image" className="group">
            <Card className="hover:border-violet-500/50 transition-colors p-6 space-y-3 h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20 mb-3">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-100 group-hover:text-violet-300 transition-colors">Image Lab</h3>
                <p className="text-slate-400 text-xs leading-relaxed mt-1">
                  Create original digital artwork, enhance resolutions, remove backgrounds, and generate custom image variations with precision.
                </p>
              </div>
              <div className="text-xs font-semibold text-violet-400 pt-2 flex items-center">
                Launch Studio &rarr;
              </div>
            </Card>
          </Link>

          <Link href="/labs/video" className="group">
            <Card className="hover:border-blue-500/50 transition-colors p-6 space-y-3 h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 mb-3">
                  <Video className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-100 group-hover:text-blue-300 transition-colors">Video Lab</h3>
                <p className="text-slate-400 text-xs leading-relaxed mt-1">
                  Generate cinematic video sequences from descriptions, animate still imagery, and trim or enhance video assets effortlessly.
                </p>
              </div>
              <div className="text-xs font-semibold text-blue-400 pt-2 flex items-center">
                Launch Studio &rarr;
              </div>
            </Card>
          </Link>

          <Link href="/labs/voice" className="group">
            <Card className="hover:border-emerald-500/50 transition-colors p-6 space-y-3 h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 mb-3">
                  <Mic className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">Voice Lab</h3>
                <p className="text-slate-400 text-xs leading-relaxed mt-1">
                  Synthesize lifelike voice narration, transcribe spoken audio into timestamped subtitles, and manage authorized custom voice profiles.
                </p>
              </div>
              <div className="text-xs font-semibold text-emerald-400 pt-2 flex items-center">
                Launch Studio &rarr;
              </div>
            </Card>
          </Link>

          <Link href="/labs/music" className="group">
            <Card className="hover:border-amber-500/50 transition-colors p-6 space-y-3 h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 mb-3">
                  <Music2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-300 transition-colors">Music Lab</h3>
                <p className="text-slate-400 text-xs leading-relaxed mt-1">
                  Compose complete musical tracks, generate instrumentals across genres and tempos, and synthesize songs directly from lyrics.
                </p>
              </div>
              <div className="text-xs font-semibold text-amber-400 pt-2 flex items-center">
                Launch Studio &rarr;
              </div>
            </Card>
          </Link>
        </div>
      </section>

      {/* CORE CAPABILITIES */}
      <section className="py-12 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-400 text-xs">
          <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-200 text-xs mb-1">Ethical Creation & Data Safety</h4>
              <p>Strict privacy safeguards ensure your uploaded assets and finished media remain private and protected under your account.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800/80 flex items-start gap-3">
            <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-200 text-xs mb-1">High-Speed Creation</h4>
              <p>Instant audio synthesis, parallel image rendering, and responsive video processing deliver fast turnaround times.</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800/80 flex items-start gap-3">
            <Palette className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-200 text-xs mb-1">Unified Creative Library</h4>
              <p>All your generated images, video scenes, narration clips, and music stems are organized in one central creation hub.</p>
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
            <span className="font-bold text-slate-300">VYRON AI LABS</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-[10px] tracking-widest text-slate-500 uppercase">YOUR CREATIVE AI LABORATORY</span>
          </div>
          <p>&copy; 2026 VYRON AI LABS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
