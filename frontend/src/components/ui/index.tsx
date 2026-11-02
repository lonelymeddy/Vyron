"use client";

import React, { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { X, Play, Pause, Volume2, VolumeX, Maximize, AlertTriangle, CheckCircle2, Info, AlertCircle } from "lucide-react";

export * from "./Logo";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// BUTTON
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  isLoading,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyle = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer";

  const variants = {
    primary: "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-900/20 glow-violet border border-violet-500/30",
    secondary: "bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-700/80 hover:border-slate-600",
    outline: "border border-slate-700/80 hover:border-violet-500/50 text-slate-300 hover:text-white bg-slate-900/40 hover:bg-slate-800/50",
    danger: "bg-rose-600/90 hover:bg-rose-600 text-white border border-rose-500/30 shadow-lg shadow-rose-950/30",
    ghost: "hover:bg-slate-800/60 text-slate-400 hover:text-slate-100",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5 gap-1.5",
    md: "text-sm px-4 py-2 gap-2",
    lg: "text-base px-6 py-3 gap-2.5 font-semibold",
  };

  return (
    <button
      className={cn(baseStyle, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      ) : null}
      {children}
    </button>
  );
}

// FORM CONTROLS
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className, ...props }: InputProps) {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="block text-xs font-semibold text-slate-300">{label}</label>}
      <div className="relative flex items-center">
        {icon && <div className="absolute left-3 text-slate-500 pointer-events-none">{icon}</div>}
        <input
          className={cn(
            "w-full bg-[#0a0e17] border border-slate-800 rounded-lg py-2 text-sm text-slate-100 placeholder-slate-500 transition-colors focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500",
            icon ? "pl-9 pr-3" : "px-3",
            error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500",
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] text-rose-400 font-medium">{error}</p>}
    </div>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="block text-xs font-semibold text-slate-300">{label}</label>}
      <textarea
        className={cn(
          "w-full bg-[#0a0e17] border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 transition-colors focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500",
          error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-[11px] text-rose-400 font-medium">{error}</p>}
    </div>
  );
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: { value: string; label: string }[];
}

export function Select({ label, error, options, children, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1.5 w-full">
      {label && <label className="block text-xs font-semibold text-slate-300">{label}</label>}
      <select
        className={cn(
          "w-full bg-[#0a0e17] border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 cursor-pointer",
          error && "border-rose-500 focus:border-rose-500 focus:ring-rose-500",
          className
        )}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#0c1017] text-slate-200">
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {error && <p className="text-[11px] text-rose-400 font-medium">{error}</p>}
    </div>
  );
}

// CARD & PANELS
export function Card({
  children,
  className,
  glow = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { glow?: boolean }) {
  return (
    <div
      className={cn(
        "glass-panel rounded-xl p-5 transition-all duration-200 border border-slate-800/80 hover:border-slate-700/80 bg-[#0d121c]/90",
        glow && "glow-violet border-violet-500/30",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// BADGE & STATUS INDICATORS
export function Badge({
  children,
  variant = "info",
  className,
}: {
  children: React.ReactNode;
  variant?: "info" | "success" | "warning" | "error" | "purple" | "cyan" | "charcoal";
  className?: string;
}) {
  const styles = {
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    error: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    purple: "bg-violet-500/10 text-violet-300 border-violet-500/20",
    cyan: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    charcoal: "bg-slate-800/80 text-slate-300 border-slate-700/60",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusIndicator({ status }: { status: string }) {
  const normalized = status?.toUpperCase();

  const statusMap: Record<string, { label: string; variant: "info" | "success" | "warning" | "error" | "purple" | "cyan" | "charcoal"; pulse?: boolean }> = {
    DRAFT: { label: "Draft", variant: "charcoal" },
    UPLOADING: { label: "Uploading", variant: "info", pulse: true },
    ANALYZING: { label: "Analyzing", variant: "cyan", pulse: true },
    QUEUED: { label: "Queued", variant: "warning", pulse: true },
    PROCESSING: { label: "Processing", variant: "purple", pulse: true },
    POST_PROCESSING: { label: "Post-Processing", variant: "purple", pulse: true },
    COMPLETED: { label: "Completed", variant: "success" },
    FAILED: { label: "Failed", variant: "error" },
    CANCELLED: { label: "Cancelled", variant: "charcoal" },
  };

  const current = statusMap[normalized] || { label: status || "Unknown", variant: "charcoal" };

  return (
    <Badge variant={current.variant} className="gap-1.5">
      <span className={cn("w-1.5 h-1.5 rounded-full bg-current", current.pulse && "animate-pulse")} />
      <span>{current.label}</span>
    </Badge>
  );
}

// MODAL & CONFIRMATION DIALOG
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0c1017] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative glow-violet">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-lg font-bold text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>{children}</div>

        {footer && <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  isDanger = true,
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant={isDanger ? "danger" : "primary"} size="sm" onClick={onConfirm} isLoading={isLoading}>
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3 py-2">
        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
      </div>
    </Modal>
  );
}

// SKELETON LOADER
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-slate-800/60", className)} />;
}

// TOAST / NOTIFICATION BANNER
export function Toast({
  type = "info",
  title,
  message,
  onClose,
}: {
  type?: "success" | "error" | "warning" | "info";
  title?: string;
  message: string;
  onClose?: () => void;
}) {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-400 shrink-0" />,
  };

  const borderStyles = {
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-200",
    error: "bg-rose-500/10 border-rose-500/30 text-rose-200",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-200",
    info: "bg-blue-500/10 border-blue-500/30 text-blue-200",
  };

  return (
    <div className={cn("p-4 rounded-xl border flex items-start justify-between gap-3 text-xs shadow-lg", borderStyles[type])}>
      <div className="flex items-start gap-2.5">
        {icons[type]}
        <div>
          {title && <h5 className="font-bold mb-0.5">{title}</h5>}
          <p className="leading-relaxed">{message}</p>
        </div>
      </div>
      {onClose && (
        <button onClick={onClose} className="opacity-70 hover:opacity-100 p-0.5">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// VIDEO PLAYERS
export function VideoPlayer({ src, poster, className }: { src: string; poster?: string; className?: string }) {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (playing) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className={cn("relative group rounded-xl overflow-hidden bg-black border border-slate-800", className)}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        onEnded={() => setPlaying(false)}
        className="w-full h-full object-contain"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="p-2 rounded-lg bg-slate-900/80 hover:bg-violet-600 text-white transition-colors"
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleMute}
            className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 transition-colors"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function BeforeAfterPlayer({
  originalSrc,
  generatedSrc,
}: {
  originalSrc?: string | null;
  generatedSrc: string;
}) {
  const [activeTab, setActiveTab] = useState<"generated" | "original">("generated");

  if (!originalSrc) {
    return <VideoPlayer src={generatedSrc} className="aspect-video w-full" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
        <span className="text-xs font-semibold text-slate-300 px-3">Visual Comparison Mode</span>
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("generated")}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-md transition-colors",
              activeTab === "generated"
                ? "bg-violet-600 text-white glow-violet"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            AI Generated Output
          </button>
          <button
            onClick={() => setActiveTab("original")}
            className={cn(
              "px-3 py-1 text-xs font-semibold rounded-md transition-colors",
              activeTab === "original"
                ? "bg-violet-600 text-white glow-violet"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Original Reference Video
          </button>
        </div>
      </div>

      <VideoPlayer
        src={activeTab === "generated" ? generatedSrc : originalSrc}
        className="aspect-video w-full"
      />
    </div>
  );
}
