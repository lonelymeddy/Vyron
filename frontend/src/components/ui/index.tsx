import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  isLoading,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}) {
  const baseStyle = "inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-500/50";

  const variants = {
    primary: "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-900/20 glow-violet border border-violet-500/30",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700",
    outline: "border border-slate-700 hover:border-violet-500/50 text-slate-300 hover:text-white bg-slate-900/40",
    danger: "bg-rose-600/80 hover:bg-rose-600 text-white border border-rose-500/30",
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
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
}

export function Card({
  children,
  className,
  glow = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { glow?: boolean }) {
  return (
    <div
      className={cn(
        "glass-panel rounded-xl p-5 transition-all duration-200 hover:border-slate-700/80",
        glow && "glow-violet",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-800/60", className)}
    />
  );
}

export function Badge({
  children,
  variant = "info",
  className,
}: {
  children: React.ReactNode;
  variant?: "info" | "success" | "warning" | "error" | "purple";
  className?: string;
}) {
  const styles = {
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    error: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    purple: "bg-violet-500/10 text-violet-400 border-violet-500/20",
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
