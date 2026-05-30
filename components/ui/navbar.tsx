"use client";

import { appNavItems } from "@/lib/nav-config";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 w-full border-t border-border/80 bg-background/95 py-2 px-4 z-[9999] backdrop-blur-md shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_-4px_rgba(0,0,0,0.4)]">
      <nav className="max-w-md mx-auto">
        <ul className="flex justify-between items-center">
          {appNavItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <li key={item.href} className="flex flex-col items-center">
                <Link href={item.href}>
                  <div className="flex flex-col items-center space-y-1">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm scale-105"
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {item.icon}
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
