"use client";

import Navbar from "@/components/ui/navbar";
import { appNavItems } from "@/lib/nav-config";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="hidden lg:flex lg:w-56 lg:flex-col lg:shrink-0 lg:border-r lg:border-border/80 lg:bg-background/95 lg:backdrop-blur-md">
        <div className="px-4 py-8">
          <p className="text-lg font-bold tracking-tight text-foreground">
            FitFlash
          </p>
        </div>
        <nav className="flex-1 px-3 pb-8">
          <ul className="space-y-1">
            {appNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col pb-24 lg:pb-8">
        <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
        <div className="lg:hidden">
          <Navbar />
        </div>
      </div>
    </div>
  );
}
