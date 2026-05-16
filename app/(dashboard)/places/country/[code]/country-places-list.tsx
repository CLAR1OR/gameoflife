"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import type { PlaceWithStats } from "@/modules/places/types";

export function CountryPlacesList({
  places,
  countryName,
}: {
  places: PlaceWithStats[];
  countryName: string;
}) {
  const [hikesOnly, setHikesOnly] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let list = places;
    if (hikesOnly) list = list.filter((p) => p.hikeCount > 0);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.region?.toLowerCase().includes(q) ?? false)
      );
    }
    return list;
  }, [places, hikesOnly, search]);

  const filtersActive = hikesOnly || search.trim().length > 0;

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
          📍 Places in {countryName}{" "}
          <span className="text-muted-foreground/60">
            ({filtered.length})
          </span>
        </h2>
        {filtersActive && (
          <button
            type="button"
            onClick={() => {
              setHikesOnly(false);
              setSearch("");
            }}
            className="text-[11px] font-mono text-muted-foreground hover:text-foreground"
          >
            clear filters
          </button>
        )}
      </div>

      {places.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setHikesOnly((s) => !s)}
            className={`h-7 px-2.5 rounded-md border text-xs font-mono transition-colors ${
              hikesOnly
                ? "border-glow text-glow bg-glow/10"
                : "border-input text-muted-foreground hover:text-foreground"
            }`}
            title="Show only places where you logged a hike"
          >
            🥾 Hikes only
          </button>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name / region…"
            className="h-7 text-xs flex-1 min-w-[160px]"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground italic text-center py-3">
          No places match the current filter.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {filtered.map((p) => (
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
                      {p.region ?? p.type}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] font-mono text-glow">
                      {p.visitCount} visit
                      {p.visitCount === 1 ? "" : "s"}
                      {p.hikeCount > 0 && (
                        <span className="ml-1.5">🥾 {p.hikeCount}</span>
                      )}
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
  );
}
