import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth-server";
import {
  getPlaceById,
  getVisitsForPlace,
  getTripsByUser,
} from "@/modules/places/queries";
import { PlaceDetailView } from "./place-detail-view";

export default async function PlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const place = await getPlaceById(id, session.user.id);
  if (!place) notFound();
  const [visits, trips] = await Promise.all([
    getVisitsForPlace(id, session.user.id),
    getTripsByUser(session.user.id),
  ]);
  return <PlaceDetailView place={place} visits={visits} trips={trips} />;
}
