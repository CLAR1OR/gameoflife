import { db } from "@/lib/db";
import {
  friend,
  friendInteraction,
  friendEvent,
  friendMilestone,
  place,
} from "@/lib/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import {
  seedAchievements,
  evaluateAchievements,
  type AchievementSpec,
} from "./achievement-engine";
import {
  FRIEND_STAGES,
  friendStageFromCount,
} from "@/modules/friends/milestone-templates";

const FRIEND_TRIGGERS = [
  "friends_count",
  "friend_interactions_count",
  "friend_countries",
  "friend_events_count",
  "friend_friend_count",
  "friend_close_friend_count",
  "friend_inner_circle_count",
  "friend_family_count",
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

  // Friendship-stage tiers — count of friends at each stage.
  { name: "Best Bud", description: "Reach Friend stage with at least one person", icon: "🤝", triggerType: "friend_friend_count", triggerCount: 1 },
  { name: "Five Friends", description: "5 people at Friend stage or above", icon: "🤝", triggerType: "friend_friend_count", triggerCount: 5 },
  { name: "Close Quarters", description: "First Close friend", icon: "💛", triggerType: "friend_close_friend_count", triggerCount: 1 },
  { name: "Tight Three", description: "3 Close friends", icon: "💛", triggerType: "friend_close_friend_count", triggerCount: 3 },
  { name: "Inner Sanctum", description: "First Inner-circle friend", icon: "🌟", triggerType: "friend_inner_circle_count", triggerCount: 1 },
  { name: "Inner Trio", description: "3 Inner-circle friends", icon: "🌟", triggerType: "friend_inner_circle_count", triggerCount: 3 },
  { name: "Inner Five", description: "5 Inner-circle friends", icon: "🌟", triggerType: "friend_inner_circle_count", triggerCount: 5 },
  { name: "Found Family", description: "A friend reaches Family stage", icon: "🫶", triggerType: "friend_family_count", triggerCount: 1 },
  { name: "Built a Family", description: "3 people at Family stage", icon: "🫶", triggerType: "friend_family_count", triggerCount: 3 },
];

export async function ensureFriendAchievementsSeeded(userId: string) {
  await seedAchievements(userId, FRIEND_TRIGGERS, FRIEND_ACHIEVEMENTS);
}

export async function checkFriendAchievements(
  userId: string
): Promise<string[]> {
  await ensureFriendAchievementsSeeded(userId);

  const [friends, interactionRows, eventRows, milestoneCounts] =
    await Promise.all([
      db.select().from(friend).where(eq(friend.userId, userId)),
      db
        .select({ id: friendInteraction.id })
        .from(friendInteraction)
        .where(eq(friendInteraction.userId, userId)),
      db
        .select({ id: friendEvent.id })
        .from(friendEvent)
        .where(eq(friendEvent.userId, userId)),
      db
        .select({
          friendId: friendMilestone.friendId,
          completed: sql<number>`coalesce(sum(case when ${friendMilestone.completed} then 1 else 0 end), 0)`,
        })
        .from(friendMilestone)
        .where(eq(friendMilestone.userId, userId))
        .groupBy(friendMilestone.friendId),
    ]);

  const activeFriends = friends.filter((f) => !f.archived);
  const activeIds = new Set(activeFriends.map((f) => f.id));

  // Stage counts — count friends at each stage tier or above.
  const stageCounts = new Map<string, number>();
  for (const s of FRIEND_STAGES) stageCounts.set(s.key, 0);
  for (const m of milestoneCounts) {
    if (!activeIds.has(m.friendId)) continue;
    const stage = friendStageFromCount(Number(m.completed));
    // A friend at "inner circle" also counts toward "close friend" and
    // "friend" thresholds — bump every tier ≤ the current stage.
    for (const s of FRIEND_STAGES) {
      if (s.min <= stage.min) {
        stageCounts.set(s.key, (stageCounts.get(s.key) ?? 0) + 1);
      }
    }
  }
  // Active friends that have no milestone row counted as "acquaintance" —
  // already 0 across all our non-acquaintance triggers, so nothing to do.

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
    friend_friend_count: stageCounts.get("friend") ?? 0,
    friend_close_friend_count: stageCounts.get("close_friend") ?? 0,
    friend_inner_circle_count: stageCounts.get("inner_circle") ?? 0,
    friend_family_count: stageCounts.get("family") ?? 0,
  });
}

// Re-export `and` so the unused-import linter doesn't complain — it's
// imported alongside `eq` for readability and may be needed by future
// stage queries.
void and;
