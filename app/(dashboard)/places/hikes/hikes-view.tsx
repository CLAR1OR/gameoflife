"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { countryFlag } from "@/lib/country-flag";
import {
  WorldMapClient,
  type MapPin,
} from "@/components/map/world-map-client";
import { EditVisitDialog } from "@/components/places/edit-visit-dialog";
import type {
  HikeOuting,
  HikeStats,
  PlaceVisit,
  TripWithStats,
} from "@/modules/places/types";

type Sort = "date_desc" | "km_desc" | "elev_desc";

export function HikesView({
  hikes,
  stats,
  trips,
}: {
  hikes: HikeOuting[];
  stats: HikeStats;
  trips: TripWithStats[];
}) {
  const [country, setCountry] = useState("all");
  const [year, setYear] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("date_desc");
  const [editing, setEditing] = useState<PlaceVisit | null>(null);

  const countryOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const h of hikes) {
      if (h.place.countryCode)
        map.set(h.place.countryCode, h.place.countryName ?? h.place.countryCode);
    }
    return Array.from(map.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [hikes]);

  const yearOptions = useMemo(() => {
    const set = new Set<string>();
    for (const h of hikes) set.add(h.visit.startedOn.slice(0, 4));
    return Array.from(set).sort().reverse();
  }, [hikes]);

  const filtered = useMemo(() => {
    let list = hikes;
    if (country !== "all")
      list = list.filter((h) => h.place.countryCode === country);
    if (year !== "all")
      list = list.filter((h) => h.visit.startedOn.startsWith(year));
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (h) =>
          h.place.name.toLowerCase().includes(q) ||
          (h.place.countryName?.toLowerCase().includes(q) ?? false) ||
          (h.visit.notes?.toLowerCase().includes(q) ?? false)
      );
    }
    const sorted = [...list];
    if (sort === "date_desc") {
      sorted.sort((a, b) => b.visit.startedOn.localeCompare(a.visit.startedOn));
    } else if (sort === "km_desc") {
      sorted.sort((a, b) => (b.visit.distanceKm ?? 0) - (a.visit.distanceKm ?? 0));
    } else if (sort === "elev_desc") {
      sorted.sort(
        (a, b) => (b.visit.elevationM ?? 0) - (a.visit.elevationM ?? 0)
      );
    }
    return sorted;
  }, [hikes, country, year, search, sort]);

  const filteredKm = filtered.reduce(
    (s, h) => s + (h.visit.distanceKm ?? 0),
    0
  );
  const filteredElev = filtered.reduce(
    (s, h) => s + (h.visit.elevationM ?? 0),
    0
  );

  const pins = useMemo<MapPin[]>(() => {
    const out: MapPin[] = [];
    for (const h of filtered) {
      if (h.place.lat == null || h.place.lng == null) continue;
      out.push({
        id: `hike:${h.visit.id}`,
        kind: "hike",
        name: h.place.name,
        subtitle: [
          h.visit.startedOn,
          h.visit.distanceKm != null ? `${h.visit.distanceKm} km` : null,
          h.visit.elevationM != null
            ? `${h.visit.elevationM.toLocaleString()} m`
            : null,
        ]
          .filter(Boolean)
          .join(" · "),
        lat: h.place.lat,
        lng: h.place.lng,
        href: `/places/${h.place.id}`,
      });
    }
    return out;
  }, [filtered]);

  const filtersActive =
    country !== "all" || year !== "all" || search.trim().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/places"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to places
        </Link>
      </div>

      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">🥾 Hikes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Every hike outing — multiple routes from the same place each get
            their own row.
          </p>
        </div>
      </div>

      {stats.hikesCount > 0 && (
        <div className="rounded-xl border border-glow/20 bg-glow/5 p-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-mono text-glow tabular-nums">
              {stats.hikesCount}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              outings
            </span>
          </div>
          <div className="text-muted-foreground/40">·</div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-mono text-foreground tabular-nums">
              {stats.totalKm.toFixed(1)}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              km total
            </span>
          </div>
          <div className="text-muted-foreground/40">·</div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-mono text-xp tabular-nums">
              {stats.totalElevation.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              m climbed
            </span>
          </div>
          {stats.longestKm > 0 && (
            <span className="ml-auto text-[10px] font-mono text-muted-foreground">
              longest {stats.longestKm} km · highest{" "}
              {stats.highestElevation.toLocaleString()} m
            </span>
          )}
        </div>
      )}

      {pins.length > 0 && <WorldMapClient pins={pins} height={360} />}

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
            🥾 Hikes{" "}
            <span className="text-muted-foreground/60">
              ({filtered.length})
            </span>
            {filtersActive && filtered.length > 0 && (
              <span className="ml-2 text-muted-foreground/60 normal-case tracking-normal">
                {filteredKm.toFixed(1)} km · {filteredElev.toLocaleString()} m
              </span>
            )}
          </h2>
          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setCountry("all");
                setYear("all");
                setSearch("");
              }}
              className="text-[11px] font-mono text-muted-foreground hover:text-foreground"
            >
              clear filters
            </button>
          )}
        </div>

        {hikes.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {countryOptions.length > 0 && (
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
            )}
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
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="h-7 rounded-md border border-input bg-background px-2 text-xs"
            >
              <option value="date_desc">Newest first</option>
              <option value="km_desc">Longest first</option>
              <option value="elev_desc">Most climbed first</option>
            </select>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search place / country / notes…"
              className="h-7 text-xs flex-1 min-w-[160px]"
            />
          </div>
        )}

        {hikes.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
            No hikes logged yet — open a place and tick &ldquo;This visit is a
            hike&rdquo; when you log a visit.
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-3">
            No hikes match the current filter.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {filtered.map((h) => (
              <li
                key={h.visit.id}
                className="rounded-md border border-border/60 bg-card/40 px-3 py-2 group hover:border-glow/40 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono text-muted-foreground shrink-0 w-24">
                    {h.visit.startedOn}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <Link
                        href={`/places/${h.place.id}`}
                        className="text-sm font-medium hover:text-glow"
                      >
                        {h.place.name}
                      </Link>
                      {h.place.countryCode && (
                        <Link
                          href={`/places/country/${h.place.countryCode}`}
                          className="text-[10px] font-mono text-muted-foreground hover:text-foreground"
                        >
                          {countryFlag(h.place.countryCode)}{" "}
                          {h.place.countryName ?? h.place.countryCode}
                        </Link>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {h.visit.distanceKm != null && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono border-glow/30 text-glow"
                        >
                          📏 {h.visit.distanceKm} km
                        </Badge>
                      )}
                      {h.visit.elevationM != null && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono border-glow/30 text-glow"
                        >
                          ⛰️ {h.visit.elevationM.toLocaleString()} m
                        </Badge>
                      )}
                      {h.visit.rating != null && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono border-xp/30 text-xp"
                        >
                          {"★".repeat(h.visit.rating)}
                        </Badge>
                      )}
                    </div>
                    {h.visit.notes && (
                      <p className="text-xs text-foreground/80 whitespace-pre-wrap mt-1 line-clamp-2">
                        {h.visit.notes}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity h-7 px-2 text-[11px]"
                    onClick={() => setEditing(h.visit)}
                  >
                    Edit
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <EditVisitDialog
        visit={editing}
        trips={trips}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
