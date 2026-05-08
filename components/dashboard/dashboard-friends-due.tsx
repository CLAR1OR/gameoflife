"use client";

import Link from "next/link";
import { CheckInButton } from "@/components/friends/check-in-button";
import type { FriendCardData } from "@/modules/friends/queries";

export function DashboardFriendsDue({
  friends,
}: {
  friends: FriendCardData[];
}) {
  if (friends.length === 0) return null;

  return (
    <section className="rounded-xl border border-glow-purple/30 bg-glow-purple/5 p-4 space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-base">🫂</span>
          <h2 className="text-xs font-mono uppercase tracking-wider text-glow-purple">
            Friends due to reach out · {friends.length}
          </h2>
        </div>
        <Link
          href="/friends"
          className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          Open friends →
        </Link>
      </div>
      <ul className="space-y-1.5">
        {friends.slice(0, 5).map((f) => {
          const initials = f.name
            .split(/\s+/)
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
          const due = f.daysUntilDue ?? 0;
          const label =
            due < 0 ? `${Math.abs(due)}d overdue` : "due today";
          return (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-md border border-border/60 bg-card/60 px-3 py-2"
            >
              {f.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={f.photoUrl}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="h-7 w-7 rounded-full border border-border bg-muted/40 flex items-center justify-center text-[11px] font-bold text-glow-purple shrink-0">
                  {initials}
                </div>
              )}
              <Link
                href={`/friends/${f.id}`}
                className="flex-1 min-w-0 text-sm font-medium hover:text-glow-purple transition-colors line-clamp-1"
              >
                {f.name}
              </Link>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider border rounded px-1.5 py-0 shrink-0 ${
                  due < 0
                    ? "text-destructive border-destructive/40 bg-destructive/10"
                    : "text-warning border-warning/40 bg-warning/10"
                }`}
              >
                {label}
              </span>
              <CheckInButton friendId={f.id} variant="outline" />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
