"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { APP_MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TodoistNavBadge } from "@/components/integrations/todoist-nav-badge";
import { GoogleCalendarNavBadge } from "@/components/integrations/google-calendar-nav-badge";

export function TopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const onAccountPage = pathname === "/account";

  return (
    <div className="sticky top-0 z-50 flex justify-center pt-2 sm:pt-4 pb-2 pointer-events-none px-2">
      <nav className="pointer-events-auto flex items-center gap-1 rounded-full border border-border/60 bg-card/80 backdrop-blur-xl px-2 py-1.5 shadow-lg shadow-black/20 max-w-full overflow-x-auto no-scrollbar">
        {/* Navigation icons */}
        {APP_MODULES.map((mod) => {
          const isActive =
            mod.href === "/"
              ? pathname === "/"
              : pathname.startsWith(mod.href);
          const isEnabled = mod.enabled;

          if (!isEnabled) {
            return (
              <div
                key={mod.href}
                className="group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl opacity-30 cursor-not-allowed"
              >
                {mod.icon}
                <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-muted-foreground border border-border opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity">
                  {mod.name} — soon
                </span>
              </div>
            );
          }

          return (
            <Link
              key={mod.href}
              href={mod.href}
              className={cn(
                "group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl transition-all",
                isActive
                  ? "bg-glow/15 text-glow ring-1 ring-glow/40 shadow-[0_0_12px_rgba(0,255,136,0.3)]"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground hover:scale-110"
              )}
            >
              {mod.icon}
              <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground border border-border opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity">
                {mod.name}
              </span>
            </Link>
          );
        })}

        {/* Subtle separator */}
        <div className="h-6 w-px bg-border/60 mx-1 shrink-0" />

        {/* Global search — keyboard ⌘K / / */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new CustomEvent("open-global-search"));
          }}
          title="Search (⌘K)"
          className="group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl text-muted-foreground hover:bg-accent hover:text-foreground hover:scale-110 transition-all"
        >
          🔍
          <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground border border-border opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity font-mono">
            Search (⌘K)
          </span>
        </button>

        <TodoistNavBadge />
        <GoogleCalendarNavBadge />

        <div className="h-6 w-px bg-border/60 mx-1 shrink-0" />

        {/* User avatar — opens the account page */}
        <Link
          href="/account"
          title={user?.name ? `${user.name} · Account` : "Account"}
          className={cn(
            "group flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all",
            onAccountPage
              ? "border-glow/60 shadow-[0_0_12px_rgba(0,255,136,0.3)]"
              : "border-glow/30 hover:border-glow/60"
          )}
        >
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-xs bg-glow/10 text-glow font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
      </nav>
    </div>
  );
}
