"use client";

import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import Image from "next/image";

type EmburLogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export default function EmburLogo({
  size = 32,
  className,
  priority = false,
}: EmburLogoProps) {
  const { theme } = useTheme();
  const src =
    theme === "dark" ? "/brand/embur-dark.svg" : "/brand/embur-light.svg";

  return (
    <Image
      src={src}
      alt="Embur"
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0 rounded-xl", className)}
    />
  );
}
