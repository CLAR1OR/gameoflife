import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth-server";
import {
  getTripById,
  getVisitsForTrip,
} from "@/modules/places/queries";
import {
  WorldMapClient,
  type MapPin,
} from "@/components/map/world-map-client";
import { TripDetailView } from "./trip-detail-view";

export default async function TripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const t = await getTripById(id, session.user.id);
  if (!t) notFound();
  const visits = await getVisitsForTrip(id, session.user.id);

  const pins: MapPin[] = visits
    .filter((v) => v.place.lat != null && v.place.lng != null)
    .map((v) => ({
      id: v.visit.id,
      kind: "place",
      name: v.place.name,
      subtitle: v.visit.startedOn,
      lat: v.place.lat as number,
      lng: v.place.lng as number,
      href: `/places/${v.place.id}`,
    }));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/places/trips"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; All trips
        </Link>
      </div>
      <TripDetailView trip={t} visits={visits} />
      {pins.length > 0 && <WorldMapClient pins={pins} height={360} />}
    </div>
  );
}
