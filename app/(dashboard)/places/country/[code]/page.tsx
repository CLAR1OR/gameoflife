import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth-server";
import {
  getCountrySummary,
  getPlacesInCountry,
} from "@/modules/places/queries";
import {
  WorldMapClient,
  type MapPin,
} from "@/components/map/world-map-client";
import { countryFlag } from "@/lib/country-flag";

export default async function CountryDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const session = await requireSession();
  const [summary, places] = await Promise.all([
    getCountrySummary(session.user.id, code),
    getPlacesInCountry(session.user.id, code),
  ]);
  if (!summary) notFound();

  const pins: MapPin[] = places
    .filter((p) => p.lat != null && p.lng != null)
    .map((p) => ({
      id: p.id,
      kind: "place",
      name: p.name,
      subtitle:
        p.visitCount > 0
          ? `${p.visitCount} visit${p.visitCount === 1 ? "" : "s"}`
          : "Place",
      lat: p.lat as number,
      lng: p.lng as number,
      href: `/places/${p.id}`,
    }));

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
        <div className="flex items-center gap-3">
          <span className="text-5xl drop-shadow-lg">
            {countryFlag(summary.countryCode)}
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {summary.countryName}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-mono">
              {summary.countryCode} ·{" "}
              {summary.placesCount} place
              {summary.placesCount === 1 ? "" : "s"} ·{" "}
              {summary.visitsCount} visit
              {summary.visitsCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        {summary.firstVisitedOn && (
          <div className="text-right">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              First visit
            </div>
            <div className="text-xs font-mono">{summary.firstVisitedOn}</div>
            {summary.lastVisitedOn !== summary.firstVisitedOn && (
              <>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-1">
                  Last visit
                </div>
                <div className="text-xs font-mono">{summary.lastVisitedOn}</div>
              </>
            )}
          </div>
        )}
      </div>

      {pins.length > 0 && <WorldMapClient pins={pins} height={360} />}

      <section className="space-y-2">
        <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
          📍 Places in {summary.countryName}
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {places.map((p) => (
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
      </section>
    </div>
  );
}
