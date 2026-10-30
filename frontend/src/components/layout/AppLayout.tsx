"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clapperboard,
  Sparkles,
  Users,
  FolderKanban,
  ListOrdered,
  Settings,
  Coins,
  Compass,
  Zap,
  LogOut
} from "lucide-react";
import { cn, Button } from "@/components/ui";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Compass },
  { name: "AI Video Creator", href: "/create", icon: Sparkles, highlight: true },
  { name: "Character Library", href: "/characters", icon: Users },
  { name: "My Projects", href: "/projects", icon: FolderKanban },
  { name: "Generation Center", href: "/generations", icon: ListOrdered },
  { name: "Settings", href: "/settings", icon: Settings },
];

function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              isActive
                ? "bg-violet-600/15 text-violet-300 border border-violet-500/30"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50",
              item.highlight && !isActive && "text-slate-200 bg-gradient-to-r from-violet-950/30 to-indigo-950/30 border border-violet-500/20"
            )}
          >
            <Icon className={cn("w-4 h-4", isActive ? "text-violet-400" : "text-slate-400")} />
            <span>{item.name}</span>
            {item.highlight && (
              <span className="ml-auto text-[10px] font-semibold bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded border border-violet-500/30">
                AI 3D
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col md:flex-row">
      <aside className="w-full md:w-64 border-r border-slate-800/80 bg-[#0c1017] flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center glow-violet">
              <Clapperboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider text-white">VYRON AI</span>
              <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase -mt-1">
                CREATE BEYOND REALITY
              </p>
            </div>
          </Link>
        </div>

        <Suspense fallback={<div className="p-4 text-xs text-slate-500">Loading navigation...</div>}>
          <NavLinks />
        </Suspense>

        <div className="p-4 m-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-300 font-medium">Available Credits</span>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              100 CR
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-400 h-full w-[80%]" />
          </div>
          <p className="text-[11px] text-slate-400">
            Resets on 1st of month. Need more GPU horsepower?
          </p>
        </div>

        <div className="p-3 border-t border-slate-800/80">
          <Link href="/auth/signin">
            <Button variant="ghost" size="sm" className="w-full justify-start text-slate-400 hover:text-slate-200">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-slate-800/80 px-6 flex items-center justify-between bg-[#07090e]/80 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              VYRON AI Cinematic Studio Engine v1.0
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
              Engine Online
            </span>
            <Link href="/create">
              <Button size="sm">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                Create New Video
              </Button>
            </Link>
          </div>
        </header>

        <div className="p-6 max-w-7xl w-full mx-auto flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
