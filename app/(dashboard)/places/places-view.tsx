"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WorldMapClient, type MapPin } from "@/components/map/world-map-client";
import { AddPlaceDialog } from "@/components/places/add-place-dialog";
import type { PlaceWithStats, PlacesStats } from "@/modules/places/queries";
import type { FriendCardData } from "@/modules/friends/queries";

type Filter = "all" | "places" | "friends";

export function PlacesView({
  places,
  stats,
  friends,
}: {
  places: PlaceWithStats[];
  stats: PlacesStats;
  friends: FriendCardData[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");

  const pins = useMemo<MapPin[]>(() => {
    const out: MapPin[] = [];
    if (filter !== "friends") {
      for (const p of places) {
        if (p.lat == null || p.lng == null) continue;
        out.push({
          id: `place:${p.id}`,
          kind: "place",
          name: p.name,
          subtitle: [p.countryName, p.visitCount > 0 ? `${p.visitCount} visit${p.visitCount === 1 ? "" : "s"}` : null]
            .filter(Boolean)
            .join(" · "),
          lat: p.lat,
          lng: p.lng,
          href: `/places/${p.id}`,
        });
      }
    }
    if (filter !== "places") {
      for (const f of friends) {
        const p = f.currentPlace;
        if (!p || p.lat == null || p.lng == null) continue;
        const initials = f.name
          .split(/\s+/)
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        out.push({
          id: `friend:${f.id}`,
          kind: "friend",
          name: f.name,
          subtitle: [p.name, p.countryName].filter(Boolean).join(" · "),
          lat: p.lat,
          lng: p.lng,
          marker: initials,
          href: `/friends/${f.id}`,
        });
      }
    }
    return out;
  }, [places, friends, filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Places</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Where you&apos;ve been + where your people are.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="border-glow/30 text-glow/80 font-mono text-xs">
            🗺️ {stats.placesTotal} places · {stats.countriesVisited} countries
          </Badge>
          <Badge variant="outline" className="border-glow-purple/30 text-glow-purple/80 font-mono text-xs">
            🫂 {friends.length} friends mapped
          </Badge>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            + Add place
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
          All
        </FilterPill>
        <FilterPill active={filter === "places"} onClick={() => setFilter("places")}>
          📍 Places only
        </FilterPill>
        <FilterPill active={filter === "friends"} onClick={() => setFilter("friends")}>
          👤 Friends only
        </FilterPill>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground">
          {pins.length} pin{pins.length === 1 ? "" : "s"}
        </span>
      </div>

      <WorldMapClient pins={pins} />

      <section>
        <h2 className="text-xs font-mono uppercase tracking-wider text-glow mb-3">
          📍 Recent places
        </h2>
        {places.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            No places yet — click &ldquo;+ Add place&rdquo; to drop your first
            pin.
          </div>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {places.slice(0, 20).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/places/${p.id}`}
                  className="block rounded-md border border-border/60 bg-card/40 p-3 hover:border-glow/40 transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium line-clamp-1">
                        {p.name}
                      </div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {[p.countryName, p.region].filter(Boolean).join(" · ") ||
                          "—"}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[10px] font-mono text-glow">
                        {p.visitCount} visit{p.visitCount === 1 ? "" : "s"}
                      </div>
                      {p.lastVisitedOn && (
                        <div className="text-[10px] font-mono text-muted-foreground/60">
                          {p.lastVisitedOn}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AddPlaceDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-mono px-3 py-1 rounded-full border transition-colors ${
        active
          ? "border-glow text-glow bg-glow/10"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
