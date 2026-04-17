"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { APP_MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function TopNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border/50 bg-sidebar/80 backdrop-blur-md px-6">
      {/* Left: Logo */}
      <Link href="/" className="text-lg font-bold tracking-tight text-glow glow-green-text shrink-0">
        Game of Life
      </Link>

      {/* Center: Navigation icons */}
      <div className="flex items-center gap-1">
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
                className="group relative flex h-10 w-10 items-center justify-center rounded-lg text-xl opacity-30 cursor-not-allowed"
              >
                {mod.icon}
                <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-muted-foreground border border-border opacity-0 group-hover:opacity-100 transition-opacity">
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
                "group relative flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all",
                isActive
                  ? "bg-glow/10 text-glow glow-green"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {mod.icon}
              <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground border border-border opacity-0 group-hover:opacity-100 transition-opacity">
                {mod.name}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Right: User */}
      <div className="shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-full border border-glow/30 hover:border-glow/60 transition-all">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="text-xs bg-glow/10 text-glow font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{user?.name ?? "User"}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
