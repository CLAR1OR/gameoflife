"use server";

import { db } from "@/lib/db";
import { quest, achievement } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { MAX_SIDE_QUESTS } from "./types";

export type QuestAutoAchievementSpec = {
  enabled: boolean;
  icon?: string;
  name?: string;
  description?: string;
};

// =====================
// CRUD
// =====================

export async function createQuest(data: {
  type: "main" | "side";
  name: string;
  description?: string;
  icon?: string;
  xpReward?: number;
  autoAchievement?: QuestAutoAchievementSpec;
}) {
  const session = await requireSession();

  // Validate slot availability
  const activeOfType = await db.query.quest.findMany({
    where: (q, { and: a, eq: e }) =>
      a(e(q.userId, session.user.id), e(q.status, "active"), e(q.type, data.type)),
  });

  if (data.type === "main" && activeOfType.length >= 1) {
    throw new Error(
      "You already have an active main quest. Complete or abandon it first."
    );
  }
  if (data.type === "side" && activeOfType.length >= MAX_SIDE_QUESTS) {
    throw new Error(
      `You already have ${MAX_SIDE_QUESTS} active side quests. Complete or abandon one first.`
    );
  }

  const [row] = await db
    .insert(quest)
    .values({
      userId: session.user.id,
      type: data.type,
      name: data.name,
      description: data.description ?? null,
      icon: data.icon ?? (data.type === "main" ? "⚔️" : "📜"),
      xpReward: data.xpReward ?? (data.type === "main" ? 100 : 25),
      status: "active",
      sortOrder: activeOfType.length,
    })
    .returning();

  // Create per-quest achievement if requested
  if (data.autoAchievement?.enabled) {
    await db.insert(achievement).values({
      userId: session.user.id,
      categoryId: null,
      source: "custom",
      name: data.autoAchievement.name ?? `Completed: ${data.name}`,
      description:
        data.autoAchievement.description ??
        `Completed the ${data.type} quest "${data.name}"`,
      icon: data.autoAchievement.icon ?? (data.type === "main" ? "👑" : "🎯"),
      triggerType: "quest_completed",
      triggerQuestId: row.id,
    });
  }

  // Lazy-seed the generic quest count achievements on first quest creation
  await seedGenericQuestAchievements(session.user.id);

  revalidatePath("/quests");
  revalidatePath("/achievements");
  return row;
}

export async function updateQuest(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    icon?: string;
    xpReward?: number;
  }
) {
  const session = await requireSession();
  await db
    .update(quest)
    .set(data)
    .where(and(eq(quest.id, id), eq(quest.userId, session.user.id)));

  revalidatePath("/quests");
}

export async function completeQuest(id: string) {
  const session = await requireSession();
  const row = await db.query.quest.findFirst({
    where: (q, { and: a, eq: e }) =>
      a(e(q.id, id), e(q.userId, session.user.id)),
  });
  if (!row) throw new Error("Quest not found");
  if (row.status !== "active") throw new Error("Quest is not active");

  await db
    .update(quest)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(quest.id, id));

  const newlyUnlocked = await checkQuestAchievements(session.user.id, id);

  revalidatePath("/quests");
  revalidatePath("/");
  revalidatePath("/achievements");
  return { xp: row.xpReward, newAchievements: newlyUnlocked };
}

export async function abandonQuest(id: string) {
  const session = await requireSession();
  await db
    .update(quest)
    .set({ status: "abandoned", completedAt: new Date() })
    .where(and(eq(quest.id, id), eq(quest.userId, session.user.id)));

  revalidatePath("/quests");
}

export async function restoreQuest(id: string) {
  const session = await requireSession();
  const row = await db.query.quest.findFirst({
    where: (q, { and: a, eq: e }) =>
      a(e(q.id, id), e(q.userId, session.user.id)),
  });
  if (!row) throw new Error("Quest not found");
  if (row.status === "active") return;

  // Check slot availability before restoring
  const activeOfType = await db.query.quest.findMany({
    where: (q, { and: a, eq: e }) =>
      a(e(q.userId, session.user.id), e(q.status, "active"), e(q.type, row.type)),
  });
  if (row.type === "main" && activeOfType.length >= 1) {
    throw new Error("You already have an active main quest");
  }
  if (row.type === "side" && activeOfType.length >= MAX_SIDE_QUESTS) {
    throw new Error("No free side-quest slot");
  }

  await db
    .update(quest)
    .set({ status: "active", completedAt: null })
    .where(eq(quest.id, id));

  // If it was previously completed, we need to re-lock the quest-completed
  // achievement since completion is no longer true.
  await checkQuestAchievements(session.user.id, id);

  revalidatePath("/quests");
  revalidatePath("/achievements");
}

export async function deleteQuest(id: string) {
  const session = await requireSession();
  await db
    .delete(quest)
    .where(and(eq(quest.id, id), eq(quest.userId, session.user.id)));

  revalidatePath("/quests");
  revalidatePath("/achievements");
}

// =====================
// ACHIEVEMENT HELPERS
// =====================

async function checkQuestAchievements(
  userId: string,
  triggeringQuestId: string
): Promise<string[]> {
  const achievements = await db.query.achievement.findMany({
    where: (a, { and: _and, eq: _eq, or: _or }) =>
      _and(
        _eq(a.userId, userId),
        _or(
          _eq(a.triggerType, "quest_completed"),
          _eq(a.triggerType, "side_quest_count"),
          _eq(a.triggerType, "main_quest_count")
        )
      ),
  });

  // Load quest counts for this user
  const allQuests = await db
    .select()
    .from(quest)
    .where(eq(quest.userId, userId));
  const sideCompleted = allQuests.filter(
    (q) => q.type === "side" && q.status === "completed"
  ).length;
  const mainCompleted = allQuests.filter(
    (q) => q.type === "main" && q.status === "completed"
  ).length;

  const newlyUnlocked: string[] = [];
  for (const a of achievements) {
    let shouldBeUnlocked = false;

    if (a.triggerType === "quest_completed" && a.triggerQuestId) {
      const q = allQuests.find((x) => x.id === a.triggerQuestId);
      shouldBeUnlocked = q?.status === "completed";
      // Highlight the triggering quest specifically
      void triggeringQuestId;
    } else if (
      a.triggerType === "side_quest_count" &&
      a.triggerCount != null
    ) {
      shouldBeUnlocked = sideCompleted >= a.triggerCount;
    } else if (
      a.triggerType === "main_quest_count" &&
      a.triggerCount != null
    ) {
      shouldBeUnlocked = mainCompleted >= a.triggerCount;
    }

    if (shouldBeUnlocked && !a.isUnlocked) {
      await db
        .update(achievement)
        .set({ isUnlocked: true, unlockedAt: new Date() })
        .where(eq(achievement.id, a.id));
      newlyUnlocked.push(a.name);
    } else if (!shouldBeUnlocked && a.isUnlocked) {
      await db
        .update(achievement)
        .set({ isUnlocked: false, unlockedAt: null })
        .where(eq(achievement.id, a.id));
    }
  }
  return newlyUnlocked;
}

async function seedGenericQuestAchievements(userId: string) {
  // Only seed if the user has zero quest-count achievements
  const existing = await db.query.achievement.findMany({
    where: (a, { and: _and, eq: _eq, or: _or }) =>
      _and(
        _eq(a.userId, userId),
        _or(
          _eq(a.triggerType, "side_quest_count"),
          _eq(a.triggerType, "main_quest_count")
        )
      ),
  });
  if (existing.length > 0) return;

  await db.insert(achievement).values([
    {
      userId,
      categoryId: null,
      source: "custom",
      name: "First Steps on the Quest",
      description: "Complete your first side quest",
      icon: "🗺️",
      triggerType: "side_quest_count",
      triggerCount: 1,
    },
    {
      userId,
      categoryId: null,
      source: "custom",
      name: "Side Quest Enthusiast",
      description: "Complete 10 side quests",
      icon: "⚔️",
      triggerType: "side_quest_count",
      triggerCount: 10,
    },
    {
      userId,
      categoryId: null,
      source: "custom",
      name: "Side Quest Master",
      description: "Complete 25 side quests",
      icon: "🏆",
      triggerType: "side_quest_count",
      triggerCount: 25,
    },
    {
      userId,
      categoryId: null,
      source: "custom",
      name: "Legendary Adventurer",
      description: "Complete 50 side quests",
      icon: "👑",
      triggerType: "side_quest_count",
      triggerCount: 50,
    },
    {
      userId,
      categoryId: null,
      source: "custom",
      name: "Main Character",
      description: "Complete your first main quest",
      icon: "🌟",
      triggerType: "main_quest_count",
      triggerCount: 1,
    },
    {
      userId,
      categoryId: null,
      source: "custom",
      name: "Hero's Journey",
      description: "Complete 5 main quests",
      icon: "🗡️",
      triggerType: "main_quest_count",
      triggerCount: 5,
    },
  ]);
}
