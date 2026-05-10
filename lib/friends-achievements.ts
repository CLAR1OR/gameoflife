import { db } from "@/lib/db";
import {
  achievement,
  friend,
  friendInteraction,
  friendEvent,
  place,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type FriendAchievementSpec = {
  name: string;
  description: string;
  icon: string;
  triggerType:
    | "friends_count"
    | "friend_interactions_count"
    | "friend_countries"
    | "friend_events_count";
  triggerCount: number;
};

const FRIEND_ACHIEVEMENTS: FriendAchievementSpec[] = [
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
  const existing = await db.query.achievement.findMany({
    where: (a, { and: _and, eq: _eq, or: _or }) =>
      _and(
        _eq(a.userId, userId),
        _or(
          _eq(a.triggerType, "friends_count"),
          _eq(a.triggerType, "friend_interactions_count"),
          _eq(a.triggerType, "friend_countries"),
          _eq(a.triggerType, "friend_events_count")
        )
      ),
  });
  const existingKeys = new Set(
    existing.map((a) => `${a.triggerType}:${a.triggerCount}`)
  );
  const toInsert = FRIEND_ACHIEVEMENTS.filter(
    (a) => !existingKeys.has(`${a.triggerType}:${a.triggerCount}`)
  );
  if (toInsert.length === 0) return;
  await db.insert(achievement).values(
    toInsert.map((a) => ({
      userId,
      categoryId: null,
      source: "custom" as const,
      name: a.name,
      description: a.description,
      icon: a.icon,
      triggerType: a.triggerType,
      triggerCount: a.triggerCount,
    }))
  );
}

export async function checkFriendAchievements(userId: string): Promise<string[]> {
  await ensureFriendAchievementsSeeded(userId);

  const friends = await db
    .select()
    .from(friend)
    .where(eq(friend.userId, userId));

  const activeFriends = friends.filter((f) => !f.archived);
  const friendsCount = activeFriends.length;

  const interactionRows = await db
    .select({ id: friendInteraction.id })
    .from(friendInteraction)
    .where(eq(friendInteraction.userId, userId));
  const friendInteractionsCount = interactionRows.length;

  const eventRows = await db
    .select({ id: friendEvent.id })
    .from(friendEvent)
    .where(eq(friendEvent.userId, userId));
  const friendEventsCount = eventRows.length;

  // Friends in N distinct countries — derived from each friend's current
  // residence's country code.
  const residenceIds = activeFriends
    .map((f) => f.currentResidenceId)
    .filter((id): id is string => !!id);
  const places =
    residenceIds.length > 0
      ? await db
          .select({
            id: place.id,
            countryCode: place.countryCode,
          })
          .from(place)
          .where(
            // userId scoped + only the residences we care about
            inArray(place.id, residenceIds)
          )
      : [];
  const countrySet = new Set<string>();
  const placeMap = new Map(places.map((p) => [p.id, p]));
  for (const f of activeFriends) {
    const p = f.currentResidenceId ? placeMap.get(f.currentResidenceId) : null;
    if (p?.countryCode) countrySet.add(p.countryCode);
  }
  const friendCountries = countrySet.size;

  const stats: Record<
    FriendAchievementSpec["triggerType"],
    number
  > = {
    friends_count: friendsCount,
    friend_interactions_count: friendInteractionsCount,
    friend_countries: friendCountries,
    friend_events_count: friendEventsCount,
  };

  const rows = await db.query.achievement.findMany({
    where: (a, { and: _and, eq: _eq, or: _or }) =>
      _and(
        _eq(a.userId, userId),
        _or(
          _eq(a.triggerType, "friends_count"),
          _eq(a.triggerType, "friend_interactions_count"),
          _eq(a.triggerType, "friend_countries"),
          _eq(a.triggerType, "friend_events_count")
        )
      ),
  });

  const newlyUnlocked: string[] = [];
  for (const a of rows) {
    if (a.triggerCount == null) continue;
    const value = stats[a.triggerType as keyof typeof stats] ?? 0;
    const should = value >= a.triggerCount;
    if (should && !a.isUnlocked) {
      await db
        .update(achievement)
        .set({ isUnlocked: true, unlockedAt: new Date() })
        .where(eq(achievement.id, a.id));
      newlyUnlocked.push(a.name);
    } else if (!should && a.isUnlocked) {
      await db
        .update(achievement)
        .set({ isUnlocked: false, unlockedAt: null })
        .where(eq(achievement.id, a.id));
    }
  }
  if (newlyUnlocked.length > 0) revalidatePath("/achievements");
  return newlyUnlocked;
}
