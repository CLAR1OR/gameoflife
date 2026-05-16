"use client";

import Link from "next/link";
import type { UpcomingBirthday } from "@/modules/friends/types";

/**
 * Horizontal strip showing the next few upcoming birthdays. Designed for
 * the top of the friends page — at-a-glance reminder of who's about to
 * have their day.
 */
export function BirthdaysStrip({
  birthdays,
}: {
  birthdays: UpcomingBirthday[];
}) {
  if (birthdays.length === 0) return null;
  return (
    <section className="rounded-xl border border-glow-purple/20 bg-glow-purple/5 p-3 space-y-2">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h2 className="text-xs font-mono uppercase tracking-wider text-glow-purple">
          🎂 Upcoming birthdays
        </h2>
        <span className="text-[10px] font-mono text-muted-foreground">
          {birthdays.length} in the next 30 days
        </span>
      </div>
      <ul className="flex gap-2 overflow-x-auto pb-1 -mb-1">
        {birthdays.map((b) => {
          const initials = b.name
            .split(/\s+/)
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
          const todayBadge = b.daysUntil === 0;
          return (
            <li key={b.friendId} className="shrink-0">
              <Link
                href={`/friends/${b.friendId}`}
                className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 transition-colors min-w-[160px] ${
                  todayBadge
                    ? "border-xp/50 bg-xp/10 hover:border-xp"
                    : "border-border/60 bg-card/60 hover:border-glow-purple/50"
                }`}
              >
                {b.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.photoUrl}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover border border-border shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full flex items-center justify-center bg-glow-purple/15 text-xs font-bold text-glow-purple shrink-0">
                    {initials}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium line-clamp-1">
                    {b.name}
                    {b.turningAge != null && (
                      <span className="ml-1 text-muted-foreground/80">
                        · {b.turningAge}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground tabular-nums">
                    {todayBadge
                      ? "🎉 today"
                      : b.daysUntil === 1
                        ? "tomorrow"
                        : `in ${b.daysUntil}d · ${b.label}`}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
