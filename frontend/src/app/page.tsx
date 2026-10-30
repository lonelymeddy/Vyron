import React from "react";
import Link from "next/link";
import {
  Clapperboard,
  Sparkles,
  Video,
  Layers,
  Compass,
  ArrowRight,
  Wand2
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-violet-500 selection:text-white">
      <nav className="h-20 border-b border-slate-800/80 px-6 max-w-7xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center glow-violet">
            <Clapperboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-wider text-white">VYRON AI</span>
            <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase -mt-1">
              CREATE BEYOND REALITY
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/auth/signin">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm">
              Launch Studio
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </nav>

      <section className="py-20 px-6 max-w-6xl mx-auto text-center flex flex-col items-center">
        <Badge variant="purple" className="mb-6 py-1 px-3">
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          AI-POWERED CINEMATIC 3D VIDEO PLATFORM
        </Badge>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight">
          Transform Character Images into <span className="gradient-text">Cinematic 3D Videos</span>
        </h1>

        <p className="mt-6 text-slate-400 text-lg md:text-xl max-w-2xl leading-relaxed">
          VYRON AI empowers creators to replace characters, recreate CGI scenes, and generate original PUBG-inspired 3D virtual worlds with natural language control.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/create">
            <Button size="lg" className="px-8">
              <Sparkles className="w-5 h-5 mr-2" />
              Start Creating Now
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              <Compass className="w-5 h-5 mr-2" />
              Explore Showcase
            </Button>
          </Link>
        </div>

        <div className="mt-16 w-full max-w-4xl rounded-2xl overflow-hidden border border-slate-800 glow-violet bg-slate-900/60 relative group">
          <img
            src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop"
            alt="VYRON AI Cinematic 3D Scene"
            className="w-full h-[400px] object-cover object-center opacity-80 group-hover:opacity-100 transition-opacity duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090e] via-transparent to-transparent flex flex-col justify-end p-8 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="warning">PUBG-Inspired CGI World</Badge>
              <Badge variant="info">4K Ultra HD</Badge>
            </div>
            <h3 className="text-2xl font-bold text-white">Erangel City Heist — Character Replacement Engine</h3>
            <p className="text-slate-300 text-sm max-w-xl mt-1">
              Replaced default CGI avatar with custom uploaded tactical character image while preserving original physics, lighting, and camera motion.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-800/80 w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold">Three Core Generation Modes</h2>
          <p className="text-slate-400 text-sm mt-2">Designed for high-precision cinematic CGI video creation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:border-violet-500/50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center mb-4 border border-violet-500/20">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">Mode 1: Character Replacement</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Upload your character image and a reference video. Replaces the original character while keeping original motion, action, and environment intact.
            </p>
          </Card>

          <Card className="hover:border-indigo-500/50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">Mode 2: Full CGI Recreation</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Recreates reference video scenes, camera movements, and lighting in high-end CGI featuring your character in PUBG-inspired maps.
            </p>
          </Card>

          <Card className="hover:border-cyan-500/50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/20">
              <Wand2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">Mode 3: Original CGI Creation</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Generate entirely new 3D cinematic videos directly from natural language prompts, custom environments, clothing, and vehicle controls.
            </p>
          </Card>
        </div>
      </section>

      <footer className="mt-auto border-t border-slate-800/80 py-8 px-6 text-center text-slate-500 text-xs">
        <p>VYRON AI — CREATE BEYOND REALITY &copy; 2026. All rights reserved.</p>
      </footer>
    </div>
  );
}
