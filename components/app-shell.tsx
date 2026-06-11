"use client";

import EmburLogo from "@/components/embur-logo";
import Navbar from "@/components/ui/navbar";
import { appNavItems } from "@/lib/nav-config";
import {
  LEGACY_SIDEBAR_STORAGE_KEY,
  migrateLocalStorageKey,
  SIDEBAR_STORAGE_KEY,
} from "@/lib/storage-keys";
import { cn } from "@/lib/utils";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    migrateLocalStorageKey(SIDEBAR_STORAGE_KEY, LEGACY_SIDEBAR_STORAGE_KEY);
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col lg:shrink-0 lg:border-r lg:border-border/80 lg:bg-background/95 lg:backdrop-blur-md transition-[width] duration-200 ease-in-out",
          collapsed ? "lg:w-[4.5rem]" : "lg:w-56"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 py-6",
            collapsed ? "flex-col px-2" : "justify-between px-4"
          )}
        >
          {collapsed ? (
            <EmburLogo size={36} />
          ) : (
            <Link
              href="/protected/workouts"
              className="flex items-center gap-2 min-w-0"
            >
              <EmburLogo size={32} />
              <span className="text-lg font-bold tracking-tight text-foreground truncate">
                Embur
              </span>
            </Link>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              collapsed && "mt-2"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </div>

        <nav className="flex-1 px-2 pb-8">
          <ul className="space-y-1">
            {appNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    aria-label={item.label}
                    className={cn(
                      "flex items-center rounded-xl py-2.5 text-sm font-medium transition-colors",
                      collapsed ? "justify-center px-2" : "gap-3 px-3",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col pb-24 lg:pb-8">
        <div className="embur-app flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
        <div className="lg:hidden">
          <Navbar />
        </div>
      </div>
    </div>
  );
}
