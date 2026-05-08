import Link from "next/link";
import type { PlacesStats } from "@/modules/places/queries";
import { DashboardCountryFill } from "./dashboard-country-fill";

const TOTAL_COUNTRIES = 195;

/** ISO-3166-1 alpha-2 → flag emoji. */
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
}: {
  stats: PlacesStats;
}) {
  if (stats.placesTotal === 0) return null;

  const pct = Math.round((stats.countriesVisited / TOTAL_COUNTRIES) * 100);

  return (
    <Link
      href="/places"
      className="block rounded-xl border bg-card p-4 hover:border-glow/40 transition-colors space-y-3"
    >
      <div className="flex items-baseline justify-between gap-3">
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

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-start">
        {/* Left column — stats + flags */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-3xl font-mono text-glow tabular-nums leading-none">
                {stats.countriesVisited}
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">
                countries
              </div>
            </div>
            <div>
              <div className="text-3xl font-mono text-foreground tabular-nums leading-none">
                {stats.placesTotal}
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">
                places
              </div>
            </div>
            <div>
              <div className="text-3xl font-mono text-xp tabular-nums leading-none">
                {stats.visitsThisYear}
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">
                visits / yr
              </div>
            </div>
          </div>

          {stats.countryCodes.length > 0 && (
            <div>
              <div className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                Visited
              </div>
              <div className="flex flex-wrap gap-0.5 text-base leading-tight">
                {stats.countryCodes.slice(0, 80).map((c) => (
                  <span key={c} title={c}>
                    {countryFlag(c)}
                  </span>
                ))}
                {stats.countryCodes.length > 80 && (
                  <span className="text-[10px] font-mono text-muted-foreground self-end ml-1">
                    + {stats.countryCodes.length - 80} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right column — world map */}
        {stats.countryCodes.length > 0 && (
          <DashboardCountryFill countryCodes={stats.countryCodes} />
        )}
      </div>
    </Link>
  );
}
