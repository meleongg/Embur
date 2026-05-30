"use client";

import EmburLogo from "@/components/embur-logo";
import { cn } from "@/lib/utils";

type MarketingBrandProps = {
  logoSize?: number;
  showWordmark?: boolean;
  className?: string;
  wordmarkClassName?: string;
};

export default function MarketingBrand({
  logoSize = 32,
  showWordmark = true,
  className,
  wordmarkClassName,
}: MarketingBrandProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <EmburLogo size={logoSize} />
      {showWordmark && (
        <span
          className={cn(
            "ml-2 text-xl font-bold text-foreground tracking-tight",
            wordmarkClassName
          )}
        >
          Embur
        </span>
      )}
    </div>
  );
}
