"use client";

import React, { Suspense, useState, useEffect } from "react";
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
  LogOut,
  Menu,
  X
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

function NavLinks({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-violet-600/20 text-violet-300 border border-violet-500/40 glow-violet font-semibold"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60",
              item.highlight && !isActive && "text-slate-200 bg-gradient-to-r from-violet-950/40 to-indigo-950/40 border border-violet-500/30"
            )}
          >
            <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-violet-400" : "text-slate-400")} />
            <span className="truncate">{item.name}</span>
            {item.highlight && (
              <span className="ml-auto text-[10px] font-bold bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded border border-violet-500/30 shrink-0">
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [credits, setCredits] = useState<number>(100);

  useEffect(() => {
    async function fetchCredits() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("vyron_token") : null;
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch("http://localhost:8000/api/credits/balance", { headers }).catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          setCredits(data.balance ?? 100);
        }
      } catch (err) {
        console.error("Failed to load credits", err);
      }
    }
    fetchCredits();
  }, []);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col md:flex-row antialiased selection:bg-violet-600 selection:text-white">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 border-r border-slate-800/80 bg-[#0c1017] flex-col shrink-0 sticky top-0 h-screen z-20">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center glow-violet transition-transform group-hover:scale-105">
              <Clapperboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-wider text-white block leading-none">VYRON AI</span>
              <p className="text-[9px] text-slate-400 font-bold tracking-widest uppercase mt-1">
                CREATE BEYOND REALITY
              </p>
            </div>
          </Link>
        </div>

        <Suspense fallback={<div className="p-4 text-xs text-slate-500">Loading navigation...</div>}>
          <NavLinks />
        </Suspense>

        <div className="p-4 m-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-300 font-medium">Credit Balance</span>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              {credits} CR
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-400 h-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(10, credits))}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            Each video generation uses 10 credits. Real-time rendering active.
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

      {/* MOBILE HEADER */}
      <header className="md:hidden border-b border-slate-800/80 bg-[#0c1017] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center glow-violet">
            <Clapperboard className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-base tracking-wider text-white block leading-none">VYRON AI</span>
            <span className="text-[8px] text-slate-400 font-semibold tracking-widest uppercase">CREATE BEYOND REALITY</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/create">
            <Button size="sm" className="px-2.5 py-1 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </Button>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white rounded-lg bg-slate-800/80"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* MOBILE NAV DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col pt-16">
          <div className="flex-1 bg-[#0c1017] border-b border-slate-800 p-4 flex flex-col">
            <NavLinks onItemClick={() => setMobileMenuOpen(false)} />

            <div className="p-4 my-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-300 font-medium">Available Credits</span>
                </div>
                <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  {credits} CR
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start text-slate-400">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="hidden md:flex h-16 border-b border-slate-800/80 px-6 items-center justify-between bg-[#07090e]/90 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              VYRON AI Cinematic CGI Studio Engine
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
              Engine Online
            </span>
            <Link href="/create">
              <Button size="sm">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Create New Video
              </Button>
            </Link>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl w-full mx-auto flex-1 space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
