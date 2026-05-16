"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AddFriendDialog } from "@/components/friends/add-friend-dialog";
import { CheckInButton } from "@/components/friends/check-in-button";
import { FriendsGallery } from "@/components/friends/friends-gallery";
import { BirthdaysStrip } from "@/components/friends/birthdays-strip";
import { YearHeatmap } from "@/components/habits/year-heatmap";
import { TagChip } from "@/components/friends/tag-chip";
import { TagManagerDialog } from "@/components/friends/friend-tags-section";
import { archiveFriend } from "@/modules/friends/actions";
import { toast } from "sonner";
import type {
  FriendCardData,
  FriendsStats,
  FriendTag,
  UpcomingBirthday,
} from "@/modules/friends/types";
import type { Place } from "@/modules/places/types";

type ViewMode = "cards" | "gallery";
type SortMode = "due" | "recent" | "name" | "added";

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

const KIND_PREVIEW_ICON: Record<string, string> = {
  message: "💬",
  call: "📞",
  meet: "🤝",
  letter: "💌",
  event: "🎉",
  trip: "✈️",
  other: "·",
};

export function FriendsView({
  friends,
  archived,
  stats,
  knownPlaces,
  allTags,
  interactionCounts,
  birthdays,
}: {
  friends: FriendCardData[];
  archived: FriendCardData[];
  stats: FriendsStats;
  knownPlaces: Pick<Place, "id" | "name" | "countryName">[];
  allTags: FriendTag[];
  interactionCounts: Record<string, number>;
  birthdays: UpcomingBirthday[];
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("gallery");
  const [sort, setSort] = useState<SortMode>("due");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");
  const [tagsManagerOpen, setTagsManagerOpen] = useState(false);

  const source = showArchived ? archived : friends;

  const filtered = useMemo(() => {
    let list = source;
    if (tagFilter) {
      list = list.filter((f) => f.tags.some((t) => t.id === tagFilter));
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.nickname?.toLowerCase().includes(q) ?? false) ||
          (f.currentPlace?.name.toLowerCase().includes(q) ?? false)
      );
    }
    const sorted = [...list];
    if (sort === "due") {
      sorted.sort((a, b) => {
        const aDue = a.daysUntilDue ?? Infinity;
        const bDue = b.daysUntilDue ?? Infinity;
        if (aDue !== bDue) return aDue - bDue;
        return a.name.localeCompare(b.name);
      });
    } else if (sort === "recent") {
      sorted.sort((a, b) => {
        const aDays = a.daysSinceContact ?? Infinity;
        const bDays = b.daysSinceContact ?? Infinity;
        if (aDays !== bDays) return aDays - bDays;
        return a.name.localeCompare(b.name);
      });
    } else if (sort === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "added") {
      sorted.sort((a, b) => {
        const at =
          typeof a.createdAt === "number"
            ? a.createdAt * 1000
            : (a.createdAt as Date).getTime();
        const bt =
          typeof b.createdAt === "number"
            ? b.createdAt * 1000
            : (b.createdAt as Date).getTime();
        return bt - at;
      });
    }
    return sorted;
  }, [source, tagFilter, search, sort]);

  async function handleUnarchive(friendId: string) {
    // Reuse archiveFriend by un-archiving via updateFriend would be better,
    // but we don't have that action exposed. For simplicity, handle via a
    // small inline call to updateFriend through the existing API isn't
    // available — provide a basic restore via an action wrapper.
    void friendId;
    toast.info("To restore an archived friend, edit them and save.");
  }
  void handleUnarchive;
  void archiveFriend;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Friends</h1>
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => setTagsManagerOpen(true)}
          >
            🏷️ Tags
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            + Add friend
          </Button>
        </div>
      </div>

      {birthdays.length > 0 && <BirthdaysStrip birthdays={birthdays} />}

      {stats.thisYearInteractions > 0 && (
        <YearHeatmap
          counts={interactionCounts}
          accent="glow-purple"
          title="🫂 Interactions"
          unit="interactions"
        />
      )}

      {(friends.length > 0 || archived.length > 0) && (
        <div className="rounded-xl border bg-card p-3 space-y-3">
          {/* Row 1 — view toggle, sort, search */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1">
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
            <div className="h-5 w-px bg-border/60 mx-1" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="h-7 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="due">Sort: next due</option>
              <option value="recent">Sort: most recent contact</option>
              <option value="name">Sort: name (A→Z)</option>
              <option value="added">Sort: recently added</option>
            </select>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, nickname, or city…"
              className="h-7 text-xs flex-1 min-w-[180px]"
            />
            {archived.length > 0 && (
              <button
                type="button"
                onClick={() => setShowArchived((s) => !s)}
                className={`text-xs font-mono px-3 py-1 rounded-full border transition-colors ${
                  showArchived
                    ? "border-warning text-warning bg-warning/10"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {showArchived
                  ? `← Active (${friends.length})`
                  : `🗄️ Archived (${archived.length})`}
              </button>
            )}
          </div>

          {/* Row 2 — tag filter pills */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setTagFilter(null)}
                className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border transition-colors ${
                  tagFilter === null
                    ? "border-glow-purple text-glow-purple bg-glow-purple/10"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                all
              </button>
              {allTags.map((t) => (
                <TagChip
                  key={t.id}
                  tag={t}
                  selected={tagFilter === t.id}
                  onClick={() =>
                    setTagFilter((cur) => (cur === t.id ? null : t.id))
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {filtered.length === 0 && source.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center">
          <div className="text-5xl mb-2">🫂</div>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {showArchived
              ? "No archived friends."
              : "Add the first friend you want to keep in regular contact with. Set a reach-out cadence, then log every message, call, or meet — each check-in grants a little XP."}
          </p>
          {!showArchived && (
            <div className="mt-4">
              <Button onClick={() => setAddOpen(true)}>+ Add friend</Button>
            </div>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No friends match the current filter.
        </p>
      ) : view === "gallery" ? (
        <FriendsGallery friends={filtered} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {filtered.map((f) => {
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
                  className="block p-3 space-y-2"
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
                      <div className="text-sm font-medium leading-tight line-clamp-1">
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

                  {f.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {f.tags.map((t) => (
                        <TagChip key={t.id} tag={t} size="xs" />
                      ))}
                    </div>
                  )}

                  {f.lastInteractionNote && (
                    <p className="text-[11px] text-muted-foreground italic line-clamp-2 leading-snug">
                      {f.lastInteractionKind &&
                        `${KIND_PREVIEW_ICON[f.lastInteractionKind] ?? "·"} `}
                      &ldquo;{f.lastInteractionNote}&rdquo;
                    </p>
                  )}

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

      <TagManagerDialog
        open={tagsManagerOpen}
        onOpenChange={(o) => {
          setTagsManagerOpen(o);
          if (!o) router.refresh();
        }}
        tags={allTags}
      />
    </div>
  );
}
