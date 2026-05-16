import { db } from "@/lib/db";
import {
  friend,
  friendInteraction,
  friendEvent,
  place,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import {
  seedAchievements,
  evaluateAchievements,
  type AchievementSpec,
} from "./achievement-engine";

const FRIEND_TRIGGERS = [
  "friends_count",
  "friend_interactions_count",
  "friend_countries",
  "friend_events_count",
] as const;

type FriendTrigger = (typeof FRIEND_TRIGGERS)[number];

const FRIEND_ACHIEVEMENTS: AchievementSpec<FriendTrigger>[] = [
  // Friend headcount
  { name: "First Friend", description: "Add your first friend", icon: "🫂", triggerType: "friends_count", triggerCount: 1 },
  { name: "Inner Circle", description: "5 friends in the book", icon: "👥", triggerType: "friends_count", triggerCount: 5 },
  { name: "Crew", description: "10 friends in the book", icon: "🧑‍🤝‍🧑", triggerType: "friends_count", triggerCount: 10 },
  { name: "Tribe", description: "25 friends in the book", icon: "🌟", triggerType: "friends_count", triggerCount: 25 },
  { name: "Big Network", description: "50 friends in the book", icon: "🕸️", triggerType: "friends_count", triggerCount: 50 },

  // Check-in volume
  { name: "First Check-in", description: "Log your first interaction", icon: "✓", triggerType: "friend_interactions_count", triggerCount: 1 },
  { name: "Reaching Out", description: "10 interactions logged", icon: "💬", triggerType: "friend_interactions_count", triggerCount: 10 },
  { name: "Connector", description: "50 interactions logged", icon: "🤝", triggerType: "friend_interactions_count", triggerCount: 50 },
  { name: "Heart of the Group", description: "100 interactions logged", icon: "💞", triggerType: "friend_interactions_count", triggerCount: 100 },
  { name: "Friendship Marathoner", description: "500 interactions logged", icon: "♾️", triggerType: "friend_interactions_count", triggerCount: 500 },

  // Friends in N countries
  { name: "International", description: "Friends in 2 countries", icon: "🌍", triggerType: "friend_countries", triggerCount: 2 },
  { name: "Global Friends", description: "Friends in 5 countries", icon: "✈️", triggerType: "friend_countries", triggerCount: 5 },
  { name: "Worldwide Network", description: "Friends in 10 countries", icon: "🌐", triggerType: "friend_countries", triggerCount: 10 },

  // Life events tracked
  { name: "Bookkeeper", description: "Log your first life event for a friend", icon: "🌱", triggerType: "friend_events_count", triggerCount: 1 },
  { name: "Witness", description: "10 life events logged across friends", icon: "📓", triggerType: "friend_events_count", triggerCount: 10 },
];

export async function ensureFriendAchievementsSeeded(userId: string) {
  await seedAchievements(userId, FRIEND_TRIGGERS, FRIEND_ACHIEVEMENTS);
}

export async function checkFriendAchievements(
  userId: string
): Promise<string[]> {
  await ensureFriendAchievementsSeeded(userId);

  const [friends, interactionRows, eventRows] = await Promise.all([
    db.select().from(friend).where(eq(friend.userId, userId)),
    db
      .select({ id: friendInteraction.id })
      .from(friendInteraction)
      .where(eq(friendInteraction.userId, userId)),
    db
      .select({ id: friendEvent.id })
      .from(friendEvent)
      .where(eq(friendEvent.userId, userId)),
  ]);

  const activeFriends = friends.filter((f) => !f.archived);

  // Friends in N distinct countries — derived from each friend's current
  // residence's country code.
  const residenceIds = activeFriends
    .map((f) => f.currentResidenceId)
    .filter((id): id is string => !!id);
  const places =
    residenceIds.length > 0
      ? await db
          .select({ id: place.id, countryCode: place.countryCode })
          .from(place)
          .where(inArray(place.id, residenceIds))
      : [];
  const placeMap = new Map(places.map((p) => [p.id, p]));
  const countrySet = new Set<string>();
  for (const f of activeFriends) {
    const p = f.currentResidenceId ? placeMap.get(f.currentResidenceId) : null;
    if (p?.countryCode) countrySet.add(p.countryCode);
  }

  return evaluateAchievements(userId, FRIEND_TRIGGERS, {
    friends_count: activeFriends.length,
    friend_interactions_count: interactionRows.length,
    friend_countries: countrySet.size,
    friend_events_count: eventRows.length,
  });
}
