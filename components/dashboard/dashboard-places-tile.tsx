import Link from "next/link";
import type { PlacesStats } from "@/modules/places/queries";

const TOTAL_COUNTRIES = 195;

/** Convert an ISO-3166-1 alpha-2 country code into the flag emoji. */
function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "🌐";
  const base = 127397; // 0x1F1E6 - 'A'.charCodeAt(0)
  return (
    String.fromCodePoint(base + code.toUpperCase().charCodeAt(0)) +
    String.fromCodePoint(base + code.toUpperCase().charCodeAt(1))
  );
}

export function DashboardPlacesTile({
  stats,
  showFlags = true,
}: {
  stats: PlacesStats;
  showFlags?: boolean;
}) {
  if (stats.placesTotal === 0) return null;

  const pct = Math.round((stats.countriesVisited / TOTAL_COUNTRIES) * 100);

  return (
    <Link
      href="/places"
      className="block rounded-xl border bg-card p-4 hover:border-glow/40 transition-colors"
    >
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🗺️</span>
          <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
            Places
          </h2>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground">
          {pct}% of the world
        </span>
      </div>
      <div className="flex items-baseline gap-3 mb-2">
        <div>
          <div className="text-3xl font-mono text-glow tabular-nums">
            {stats.countriesVisited}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            countries
          </div>
        </div>
        <div className="text-muted-foreground/60 text-2xl">·</div>
        <div>
          <div className="text-3xl font-mono text-foreground tabular-nums">
            {stats.placesTotal}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            places
          </div>
        </div>
        <div className="text-muted-foreground/60 text-2xl">·</div>
        <div>
          <div className="text-3xl font-mono text-xp tabular-nums">
            {stats.visitsThisYear}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            visits / yr
          </div>
        </div>
      </div>
      {showFlags && stats.countryCodes.length > 0 && (
        <div className="flex flex-wrap gap-0.5 text-base leading-tight">
          {stats.countryCodes.slice(0, 60).map((c) => (
            <span key={c} title={c}>
              {countryFlag(c)}
            </span>
          ))}
          {stats.countryCodes.length > 60 && (
            <span className="text-[10px] font-mono text-muted-foreground self-end ml-1">
              + {stats.countryCodes.length - 60} more
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
