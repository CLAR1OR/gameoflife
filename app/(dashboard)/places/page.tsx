import { requireSession } from "@/lib/auth-server";
import { getPlacesByUser, getPlacesStats } from "@/modules/places/queries";
import { getFriendsByUser } from "@/modules/friends/queries";
import { PlacesView } from "./places-view";

export default async function PlacesPage() {
  const session = await requireSession();
  const [places, stats, friends] = await Promise.all([
    getPlacesByUser(session.user.id),
    getPlacesStats(session.user.id),
    getFriendsByUser(session.user.id),
  ]);

  return <PlacesView places={places} stats={stats} friends={friends} />;
}
