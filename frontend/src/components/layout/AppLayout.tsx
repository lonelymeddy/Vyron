"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Compass,
  Image as ImageIcon,
  Video as VideoIcon,
  Mic,
  Music2,
  FolderHeart,
  Wand2,
  Settings,
  Coins,
  Sparkles,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Cpu
} from "lucide-react";
import { cn, Button, Logo } from "@/components/ui";
import { apiClient, getToken, User } from "@/lib/api";

const navItems = [
  { name: "Home", href: "/dashboard", icon: Compass },
  { name: "Image Lab", href: "/labs/image", icon: ImageIcon, highlight: true, tag: "FLUX / Qwen" },
  { name: "Video Lab", href: "/labs/video", icon: VideoIcon, highlight: true, tag: "Wan / LTX" },
  { name: "Voice Lab", href: "/labs/voice", icon: Mic, highlight: true, tag: "Kokoro" },
  { name: "Music Lab", href: "/labs/music", icon: Music2, highlight: true, tag: "ACE-Step" },
  { name: "My Creations", href: "/creations", icon: FolderHeart },
  { name: "AI Tools", href: "/tools", icon: Wand2 },
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
              item.highlight && !isActive && "text-slate-200 bg-gradient-to-r from-violet-950/20 to-slate-900/40 border border-violet-500/10"
            )}
          >
            <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-violet-400" : "text-slate-400")} />
            <span className="truncate">{item.name}</span>
            {item.tag && (
              <span className="ml-auto text-[9px] font-bold bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded border border-violet-500/30 shrink-0">
                {item.tag}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [credits, setCredits] = useState<number>(100);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authenticating, setAuthenticating] = useState(true);

  useEffect(() => {
    async function initSession() {
      const token = getToken();
      if (!token) {
        setAuthenticating(false);
        router.push("/auth/signin");
        return;
      }

      try {
        const [user, creditData] = await Promise.all([
          apiClient.auth.getMe(),
          apiClient.credits.getBalance().catch(() => ({ balance: 100, updated_at: "" })),
        ]);
        setCurrentUser(user);
        if (creditData && typeof creditData.balance === "number") {
          setCredits(creditData.balance);
        }
      } catch (err) {
        console.error("Session verification failed", err);
        router.push("/auth/signin");
      } finally {
        setAuthenticating(false);
      }
    }

    initSession();
  }, [router]);

  const handleSignOut = () => {
    apiClient.auth.logout();
  };

  if (authenticating) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center mx-auto animate-bounce">
            <Logo size={44} priority />
          </div>
          <p className="text-xs text-slate-400 font-medium tracking-wide">Initializing Creative Laboratory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col md:flex-row antialiased selection:bg-violet-600 selection:text-white">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 border-r border-slate-800/80 bg-[#0c1017] flex-col shrink-0 sticky top-0 h-screen z-20">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="transition-transform group-hover:scale-105">
              <Logo size={38} priority />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-wider text-white block leading-none">VYRON AI LABS</span>
              <p className="text-[8px] text-violet-400 font-bold tracking-widest uppercase mt-1">
                CREATIVE AI LABORATORY
              </p>
            </div>
          </Link>
        </div>

        <Suspense fallback={<div className="p-4 text-xs text-slate-500">Loading labs...</div>}>
          <NavLinks />
        </Suspense>

        {currentUser && (
          <div className="px-4 py-2 text-xs text-slate-400 flex items-center gap-2 border-t border-slate-800/60 mx-3 pt-3">
            <UserIcon className="w-3.5 h-3.5 text-violet-400" />
            <span className="truncate font-semibold text-slate-200">{currentUser.full_name || currentUser.email}</span>
          </div>
        )}

        <div className="p-4 m-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-300 font-medium">Lab Credits</span>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
              {credits} CR
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-violet-500 h-full transition-all duration-300" style={{ width: `${Math.min(100, Math.max(10, credits))}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 leading-normal">
            Multi-modal studio ready. Image, Video, Voice & Music engines loaded.
          </p>
        </div>

        <div className="p-3 border-t border-slate-800/80">
          <Button onClick={handleSignOut} variant="ghost" size="sm" className="w-full justify-start text-slate-400 hover:text-slate-200">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden border-b border-slate-800/80 bg-[#0c1017] px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo size={32} priority />
          <div>
            <span className="font-bold text-sm tracking-wider text-white block leading-none">VYRON AI LABS</span>
            <span className="text-[7.5px] text-violet-400 font-semibold tracking-widest uppercase">CREATIVE AI LABORATORY</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/labs/image">
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
              <Button onClick={handleSignOut} variant="ghost" size="sm" className="w-full justify-start text-slate-400">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="hidden md:flex h-16 border-b border-slate-800/80 px-6 items-center justify-between bg-[#07090e]/90 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-slate-300 font-semibold uppercase tracking-wider">
              VYRON AI LABS — Multi-Modal Neural Workspace
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
              Labs Operational
            </span>
            <Link href="/labs/image">
              <Button size="sm">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Start Creating
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
