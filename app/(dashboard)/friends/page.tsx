import { requireSession } from "@/lib/auth-server";
import {
  getFriendsByUser,
  getFriendsStats,
  getFriendTags,
} from "@/modules/friends/queries";
import { getPlacesByUser } from "@/modules/places/queries";
import { FriendsView } from "./friends-view";

export default async function FriendsPage() {
  const session = await requireSession();
  const [friends, allFriends, stats, places, allTags] = await Promise.all([
    getFriendsByUser(session.user.id),
    getFriendsByUser(session.user.id, { includeArchived: true }),
    getFriendsStats(session.user.id),
    getPlacesByUser(session.user.id),
    getFriendTags(session.user.id),
  ]);

  const archived = allFriends.filter((f) => f.archived);

  const knownPlaces = places.map((p) => ({
    id: p.id,
    name: p.name,
    countryName: p.countryName,
  }));

  return (
    <FriendsView
      friends={friends}
      archived={archived}
      stats={stats}
      knownPlaces={knownPlaces}
      allTags={allTags}
    />
  );
}
