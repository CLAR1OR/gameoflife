"use client";

import Link from "next/link";
import { CheckInButton } from "@/components/friends/check-in-button";
import type { PersonAttentionItem } from "@/modules/friends/types";

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function DashboardPeopleToThinkAbout({
  items,
}: {
  items: PersonAttentionItem[];
}) {
  if (items.length === 0) return null;

  const overdueCount = items.filter((i) => i.kind === "overdue").length;
  const birthdayCount = items.filter((i) => i.kind === "birthday").length;

  // Pick the section accent based on what's actually inside.
  const cls =
    overdueCount > 0
      ? "border-glow-purple/30 bg-glow-purple/5"
      : "border-xp/30 bg-xp/5";

  return (
    <section className={`rounded-xl border ${cls} p-4 space-y-2`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-base">🫂</span>
          <h2 className="text-xs font-mono uppercase tracking-wider text-glow-purple">
            People to think about
          </h2>
          <span className="text-[10px] font-mono text-muted-foreground">
            {overdueCount > 0 && `${overdueCount} overdue`}
            {overdueCount > 0 && birthdayCount > 0 && " · "}
            {birthdayCount > 0 && `${birthdayCount} birthday${birthdayCount === 1 ? "" : "s"}`}
          </span>
        </div>
        <Link
          href="/friends"
          className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          Open friends →
        </Link>
      </div>
      <ul className="space-y-1.5">
        {items.slice(0, 6).map((item) => {
          const initials = initialsOf(item.name);
          if (item.kind === "overdue") {
            const days = item.daysOverdue;
            const label =
              days === 0
                ? "due today"
                : days === 1
                  ? "1d overdue"
                  : `${days}d overdue`;
            const pillCls =
              days === 0
                ? "text-warning border-warning/40 bg-warning/10"
                : "text-destructive border-destructive/40 bg-destructive/10";
            return (
              <li
                key={`o-${item.friendId}`}
                className="flex items-center gap-3 rounded-md border border-border/60 bg-card/60 px-3 py-2"
              >
                {item.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.photoUrl}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full border border-border bg-muted/40 flex items-center justify-center text-[11px] font-bold text-glow-purple shrink-0">
                    {initials}
                  </div>
                )}
                <Link
                  href={`/friends/${item.friendId}`}
                  className="flex-1 min-w-0 text-sm font-medium hover:text-glow-purple transition-colors line-clamp-1"
                >
                  {item.name}
                </Link>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider border rounded px-1.5 py-0.5 shrink-0 ${pillCls}`}
                >
                  {label}
                </span>
                <CheckInButton friendId={item.friendId} variant="outline" />
              </li>
            );
          }
          // Birthday
          const days = item.daysUntil;
          const label =
            days === 0
              ? "today 🎉"
              : days === 1
                ? "tomorrow"
                : `in ${days}d`;
          const pillCls =
            days === 0
              ? "text-xp border-xp/40 bg-xp/10 animate-pulse"
              : days <= 7
                ? "text-warning border-warning/40 bg-warning/10"
                : "text-muted-foreground border-border";
          return (
            <li key={`b-${item.friendId}`}>
              <Link
                href={`/friends/${item.friendId}`}
                className="flex items-center gap-3 rounded-md border border-border/60 bg-card/60 px-3 py-2 hover:border-xp/40 transition-colors"
              >
                {item.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.photoUrl}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full border border-border bg-muted/40 flex items-center justify-center text-[11px] font-bold text-xp shrink-0">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium leading-tight line-clamp-1">
                    🎂 {item.name}
                    {item.turningAge != null && (
                      <span className="text-muted-foreground/60 ml-2 text-xs font-mono">
                        turns {item.turningAge}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    {item.label}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider border rounded px-1.5 py-0.5 shrink-0 ${pillCls}`}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
