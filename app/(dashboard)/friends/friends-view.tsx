"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddFriendDialog } from "@/components/friends/add-friend-dialog";
import { CheckInButton } from "@/components/friends/check-in-button";
import { FriendsGallery } from "@/components/friends/friends-gallery";
import type { FriendCardData, FriendsStats } from "@/modules/friends/queries";
import type { Place } from "@/modules/places/queries";

type ViewMode = "cards" | "gallery";

function dueLabel(daysUntilDue: number | null, daysSince: number | null) {
  if (daysUntilDue === null) {
    return daysSince === null
      ? { label: "no contact yet", cls: "text-muted-foreground border-border" }
      : {
          label: `${daysSince}d ago`,
          cls: "text-muted-foreground border-border",
        };
  }
  if (daysUntilDue < 0) {
    return {
      label: `${Math.abs(daysUntilDue)}d overdue`,
      cls: "text-destructive border-destructive/40 bg-destructive/10",
    };
  }
  if (daysUntilDue === 0)
    return {
      label: "due today",
      cls: "text-warning border-warning/40 bg-warning/10",
    };
  if (daysUntilDue <= 3)
    return {
      label: `due in ${daysUntilDue}d`,
      cls: "text-warning border-warning/40 bg-warning/10",
    };
  return {
    label: `due in ${daysUntilDue}d`,
    cls: "text-muted-foreground border-border",
  };
}

export function FriendsView({
  friends,
  stats,
  knownPlaces,
}: {
  friends: FriendCardData[];
  stats: FriendsStats;
  knownPlaces: Pick<Place, "id" | "name" | "countryName">[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("cards");

  // Order: overdue first, then due-soon, then everyone else by name.
  const ordered = [...friends].sort((a, b) => {
    const aDue = a.daysUntilDue ?? Infinity;
    const bDue = b.daysUntilDue ?? Infinity;
    if (aDue !== bDue) return aDue - bDue;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Friends</h1>
          <p className="text-sm text-muted-foreground mt-1">
            People worth keeping track of. Check in regularly — it earns XP and
            keeps the relationship warm.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Badge
            variant="outline"
            className="border-glow-purple/30 text-glow-purple/80 font-mono text-xs"
          >
            🫂 {stats.total} friends · {stats.countries} countries
          </Badge>
          {stats.overdueCount > 0 && (
            <Badge
              variant="outline"
              className="border-destructive/40 text-destructive font-mono text-xs"
            >
              ⏰ {stats.overdueCount} overdue
            </Badge>
          )}
          <Badge
            variant="outline"
            className="border-xp/30 text-xp/80 font-mono text-xs"
          >
            ⚡ {stats.thisYearInteractions} this year
          </Badge>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            + Add friend
          </Button>
        </div>
      </div>

      {ordered.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => setView("cards")}
            className={`text-xs font-mono px-3 py-1 rounded-full border transition-colors ${
              view === "cards"
                ? "border-glow-purple text-glow-purple bg-glow-purple/10"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            ☰ Cards
          </button>
          <button
            type="button"
            onClick={() => setView("gallery")}
            className={`text-xs font-mono px-3 py-1 rounded-full border transition-colors ${
              view === "gallery"
                ? "border-glow-purple text-glow-purple bg-glow-purple/10"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            🖼️ Gallery
          </button>
        </div>
      )}

      {ordered.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center">
          <div className="text-5xl mb-2">🫂</div>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Add the first friend you want to keep in regular contact with. Set
            a reach-out cadence, then log every message, call, or meet — each
            check-in grants a little XP.
          </p>
          <div className="mt-4">
            <Button onClick={() => setAddOpen(true)}>+ Add friend</Button>
          </div>
        </div>
      ) : view === "gallery" ? (
        <FriendsGallery friends={ordered} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {ordered.map((f) => {
            const due = dueLabel(f.daysUntilDue, f.daysSinceContact);
            const initials = f.name
              .split(/\s+/)
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            return (
              <li
                key={f.id}
                className="rounded-xl border border-border bg-card hover:border-glow-purple/40 transition-colors"
              >
                <Link
                  href={`/friends/${f.id}`}
                  className="block p-3 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    {f.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={f.photoUrl}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full border border-border bg-muted/40 flex items-center justify-center text-sm font-bold text-glow-purple shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium leading-tight">
                        {f.name}
                        {f.nickname && (
                          <span className="text-muted-foreground/60 ml-1.5 text-xs">
                            “{f.nickname}”
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">
                        {f.currentPlace
                          ? `📍 ${f.currentPlace.name}`
                          : "📍 location unknown"}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider border rounded px-1.5 py-0.5 shrink-0 ${due.cls}`}
                    >
                      {due.label}
                    </span>
                  </div>
                  <div
                    onClick={(e) => e.preventDefault()}
                    className="flex items-start"
                  >
                    <CheckInButton friendId={f.id} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <AddFriendDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        knownPlaces={knownPlaces}
      />
    </div>
  );
}
