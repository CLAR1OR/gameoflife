import { requireSession } from "@/lib/auth-server";
import {
  getFriendsByUser,
  getFriendsStats,
} from "@/modules/friends/queries";
import { getPlacesByUser } from "@/modules/places/queries";
import { FriendsView } from "./friends-view";

export default async function FriendsPage() {
  const session = await requireSession();
  const [friends, stats, places] = await Promise.all([
    getFriendsByUser(session.user.id),
    getFriendsStats(session.user.id),
    getPlacesByUser(session.user.id),
  ]);

  const knownPlaces = places.map((p) => ({
    id: p.id,
    name: p.name,
    countryName: p.countryName,
  }));

  return (
    <FriendsView friends={friends} stats={stats} knownPlaces={knownPlaces} />
  );
}
