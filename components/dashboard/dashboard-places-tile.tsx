import Link from "next/link";
import type { PlacesStats } from "@/modules/places/queries";
import { DashboardCountryFill } from "./dashboard-country-fill";

const TOTAL_COUNTRIES = 195;

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

      <div className="flex items-baseline gap-3 flex-wrap">
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

      {stats.countryCodes.length > 0 && (
        <DashboardCountryFill countryCodes={stats.countryCodes} />
      )}
    </Link>
  );
}
