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
import { CountryPlacesList } from "./country-places-list";

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
      kind: p.hikeCount > 0 ? "hike" : "place",
      name: p.name,
      subtitle: [
        p.visitCount > 0
          ? `${p.visitCount} visit${p.visitCount === 1 ? "" : "s"}`
          : "Place",
        p.hikeCount > 0
          ? `${p.hikeCount} hike${p.hikeCount === 1 ? "" : "s"}`
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
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
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
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

      <CountryPlacesList
        places={places}
        countryName={summary.countryName}
      />
    </div>
  );
}
