"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";

const icons: Record<string, string> = {
  Home: "🏠",
  TreePine: "⚔️",
  Repeat: "🔄",
  FolderKanban: "📁",
  Trophy: "🏆",
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-56 flex-col border-r border-border/50 bg-sidebar">
      <div className="flex h-14 items-center border-b border-border/50 px-4">
        <Link href="/" className="text-lg font-bold tracking-tight text-glow glow-green-text">
          Game of Life
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {APP_MODULES.map((mod) => {
          const isActive =
            mod.href === "/"
              ? pathname === "/"
              : pathname.startsWith(mod.href);
          return (
            <Link
              key={mod.href}
              href={mod.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                isActive
                  ? "bg-glow/10 text-glow border border-glow/20 glow-green"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <span className="text-base">{icons[mod.icon] ?? "📦"}</span>
              {mod.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border/50 p-3">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50">
          v0.1.0
        </div>
      </div>
    </aside>
  );
}
