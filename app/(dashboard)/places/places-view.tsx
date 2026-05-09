"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  WorldMapClient,
  type MapPin,
} from "@/components/map/world-map-client";
import { AddPlaceDialog } from "@/components/places/add-place-dialog";
import { ConfirmAddAtPointDialog } from "@/components/places/confirm-add-at-point-dialog";
import { countryFlag } from "@/lib/country-flag";
import type { PlaceWithStats, PlacesStats } from "@/modules/places/queries";
import type { FriendCardData } from "@/modules/friends/queries";

type LayerFilter = "all" | "places" | "friends";

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
  const [layer, setLayer] = useState<LayerFilter>("all");
  const [addMode, setAddMode] = useState(false);
  const [pickedCoords, setPickedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Derived data sets for filter dropdowns.
  const countryOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of places) {
      if (p.countryCode) {
        map.set(p.countryCode, p.countryName ?? p.countryCode);
      }
    }
    return Array.from(map.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [places]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of places) set.add(p.type);
    return Array.from(set).sort();
  }, [places]);

  const yearOptions = useMemo(() => {
    const set = new Set<string>();
    for (const p of places) {
      if (p.lastVisitedOn) set.add(p.lastVisitedOn.slice(0, 4));
    }
    return Array.from(set).sort().reverse();
  }, [places]);

  const [country, setCountry] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [year, setYear] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filteredPlaces = useMemo(() => {
    let list = places;
    if (country !== "all")
      list = list.filter((p) => p.countryCode === country);
    if (type !== "all") list = list.filter((p) => p.type === type);
    if (year !== "all")
      list = list.filter((p) => p.lastVisitedOn?.startsWith(year));
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.countryName?.toLowerCase().includes(q) ?? false) ||
          (p.region?.toLowerCase().includes(q) ?? false)
      );
    }
    return list;
  }, [places, country, type, year, search]);

  const pins = useMemo<MapPin[]>(() => {
    const out: MapPin[] = [];
    if (layer !== "friends") {
      for (const p of filteredPlaces) {
        if (p.lat == null || p.lng == null) continue;
        out.push({
          id: `place:${p.id}`,
          kind: "place",
          name: p.name,
          subtitle: [
            p.countryName,
            p.visitCount > 0
              ? `${p.visitCount} visit${p.visitCount === 1 ? "" : "s"}`
              : null,
          ]
            .filter(Boolean)
            .join(" · "),
          lat: p.lat,
          lng: p.lng,
          href: `/places/${p.id}`,
        });
      }
    }
    if (layer !== "places") {
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
  }, [filteredPlaces, friends, layer]);

  const filtersActive = country !== "all" || type !== "all" || year !== "all" || search.trim().length > 0;

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
          <Badge
            variant="outline"
            className="border-glow/30 text-glow/80 font-mono text-xs"
          >
            🗺️ {stats.placesTotal} places · {stats.countriesVisited} countries
          </Badge>
          <Badge
            variant="outline"
            className="border-glow-purple/30 text-glow-purple/80 font-mono text-xs"
          >
            🫂 {friends.length} friends mapped
          </Badge>
          <Link href="/places/trips">
            <Button size="sm" variant="outline">
              🧳 Trips
            </Button>
          </Link>
          <Button
            size="sm"
            variant={addMode ? "default" : "outline"}
            onClick={() => setAddMode((s) => !s)}
            title="Click anywhere on the map to drop a pin"
            className={
              addMode
                ? "bg-glow/20 hover:bg-glow/30 text-glow border border-glow/40"
                : ""
            }
          >
            {addMode ? "✕ Cancel pick" : "🎯 Pick on map"}
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            + Add place
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <FilterPill active={layer === "all"} onClick={() => setLayer("all")}>
          All
        </FilterPill>
        <FilterPill
          active={layer === "places"}
          onClick={() => setLayer("places")}
        >
          📍 Places only
        </FilterPill>
        <FilterPill
          active={layer === "friends"}
          onClick={() => setLayer("friends")}
        >
          👤 Friends only
        </FilterPill>
        <span className="ml-auto text-[10px] font-mono text-muted-foreground">
          {pins.length} pin{pins.length === 1 ? "" : "s"}
        </span>
      </div>

      <WorldMapClient
        pins={pins}
        addMode={addMode}
        onMapClick={
          addMode
            ? (info) => {
                setPickedCoords({ lat: info.lat, lng: info.lng });
                setAddMode(false);
              }
            : undefined
        }
      />
      {addMode && (
        <p className="text-xs font-mono text-glow text-center">
          🎯 Click anywhere on the map to drop a pin and add a place there.
        </p>
      )}
      <ConfirmAddAtPointDialog
        coords={pickedCoords}
        onClose={() => setPickedCoords(null)}
      />

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
            📍 Places{" "}
            <span className="text-muted-foreground/60">
              ({filteredPlaces.length})
            </span>
          </h2>
          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setCountry("all");
                setType("all");
                setYear("all");
                setSearch("");
              }}
              className="text-[11px] font-mono text-muted-foreground hover:text-foreground"
            >
              clear filters
            </button>
          )}
        </div>

        {/* Filters */}
        {places.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="h-7 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="all">All countries</option>
              {countryOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {countryFlag(c.code)} {c.name}
                </option>
              ))}
            </select>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-7 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="all">All types</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {yearOptions.length > 0 && (
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="h-7 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="all">All years</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            )}
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name / country / region…"
              className="h-7 text-xs flex-1 min-w-[160px]"
            />
          </div>
        )}

        {places.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            No places yet — click &ldquo;+ Add place&rdquo; to drop your first
            pin.
          </div>
        ) : filteredPlaces.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-3">
            No places match the current filter.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {filteredPlaces.slice(0, 40).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/places/${p.id}`}
                  className="flex gap-3 rounded-md border border-border/60 bg-card/40 p-2 hover:border-glow/40 transition-colors"
                >
                  {p.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.coverImage}
                      alt=""
                      className="h-14 w-20 object-cover rounded shrink-0 border border-border"
                    />
                  ) : (
                    <div className="h-14 w-20 flex items-center justify-center bg-muted/30 rounded shrink-0 border border-dashed border-border text-base text-muted-foreground/60">
                      {p.countryCode ? countryFlag(p.countryCode) : "🗺️"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-sm font-medium line-clamp-1">
                        {p.name}
                      </div>
                      {p.lastVisitedOn && (
                        <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
                          {p.lastVisitedOn}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {[p.countryName, p.region].filter(Boolean).join(" · ") ||
                        "—"}
                    </div>
                    <div className="text-[10px] font-mono text-glow mt-0.5">
                      {p.visitCount} visit{p.visitCount === 1 ? "" : "s"} ·{" "}
                      <span className="text-muted-foreground/60">{p.type}</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {filteredPlaces.length > 40 && (
          <p className="text-[11px] text-muted-foreground/60 text-center">
            Showing 40 of {filteredPlaces.length}. Add filters to narrow down.
          </p>
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
