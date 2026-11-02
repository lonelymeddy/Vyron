import React from "react";
import Image from "next/image";
import { cn } from "@/components/ui";

interface LogoProps {
  className?: string;
  size?: number;
  width?: number;
  height?: number;
  variant?: "full" | "icon";
  alt?: string;
  priority?: boolean;
}

export function Logo({
  className,
  size = 36,
  width,
  height,
  variant = "icon",
  alt = "VYRON AI Logo",
  priority = false,
}: LogoProps) {
  const src = variant === "icon" ? "/logo-icon.png" : "/logo.png";
  const finalWidth = width ?? size;
  const finalHeight = height ?? size;

  return (
    <Image
      src={src}
      alt={alt}
      width={finalWidth}
      height={finalHeight}
      priority={priority}
      className={cn("object-contain select-none", className)}
    />
  );
}

export default Logo;
