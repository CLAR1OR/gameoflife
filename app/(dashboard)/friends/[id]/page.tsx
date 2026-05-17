import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth-server";
import {
  getFriendById,
  getResidencesForFriend,
  getInteractionsForFriend,
  getTagsForFriend,
  getFriendTags,
  getContactsForFriend,
  getEventsForFriend,
  getFriendMilestones,
  getInteractionDayMapForFriend,
} from "@/modules/friends/queries";
import { getPlacesByUser } from "@/modules/places/queries";
import { FriendDetailView } from "./friend-detail-view";

export default async function FriendPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const friend = await getFriendById(id, session.user.id);
  if (!friend) notFound();

  const [
    residences,
    interactions,
    places,
    friendTags,
    allTags,
    contacts,
    events,
    milestones,
    interactionDayMap,
  ] = await Promise.all([
    getResidencesForFriend(id, session.user.id),
    getInteractionsForFriend(id, session.user.id),
    getPlacesByUser(session.user.id),
    getTagsForFriend(id, session.user.id),
    getFriendTags(session.user.id),
    getContactsForFriend(id, session.user.id),
    getEventsForFriend(id, session.user.id),
    getFriendMilestones(id, session.user.id),
    getInteractionDayMapForFriend(session.user.id, id, 371),
  ]);

  const interactionCounts: Record<string, number> = {};
  for (const [date, n] of interactionDayMap.entries()) interactionCounts[date] = n;

  const knownPlaces = places.map((p) => ({
    id: p.id,
    name: p.name,
    countryName: p.countryName,
  }));

  return (
    <FriendDetailView
      friend={friend}
      residences={residences}
      interactions={interactions}
      knownPlaces={knownPlaces}
      friendTags={friendTags}
      allTags={allTags}
      contacts={contacts}
      events={events}
      milestones={milestones}
      interactionCounts={interactionCounts}
    />
  );
}
