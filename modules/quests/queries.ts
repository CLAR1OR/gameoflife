import { db } from "@/lib/db";
import { quest } from "@/lib/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import type { Quest, QuestStats } from "./types";
export { MAX_SIDE_QUESTS } from "./types";
export type { QuestStats };

export async function getActiveQuests(userId: string): Promise<{
  main: Quest | null;
  side: Quest[];
}> {
  const rows = await db
    .select()
    .from(quest)
    .where(and(eq(quest.userId, userId), eq(quest.status, "active")))
    .orderBy(asc(quest.sortOrder), asc(quest.createdAt));

  const main = rows.find((q) => q.type === "main") ?? null;
  const side = rows.filter((q) => q.type === "side");
  return { main, side };
}

export async function getArchivedQuests(userId: string): Promise<Quest[]> {
  return db
    .select()
    .from(quest)
    .where(
      and(
        eq(quest.userId, userId),
        // status != 'active'
      )
    )
    .orderBy(desc(quest.completedAt), desc(quest.createdAt))
    .then((rows) => rows.filter((r) => r.status !== "active"));
}

export async function getQuestStats(userId: string): Promise<QuestStats> {
  const rows = await db
    .select()
    .from(quest)
    .where(eq(quest.userId, userId));

  return {
    sideCompleted: rows.filter(
      (r) => r.type === "side" && r.status === "completed"
    ).length,
    mainCompleted: rows.filter(
      (r) => r.type === "main" && r.status === "completed"
    ).length,
    totalAbandoned: rows.filter((r) => r.status === "abandoned").length,
    totalXpFromQuests: rows
      .filter((r) => r.status === "completed")
      .reduce((sum, r) => sum + r.xpReward, 0),
  };
}

export async function getCompletedQuestsXp(userId: string): Promise<number> {
  const rows = await db
    .select({ xpReward: quest.xpReward })
    .from(quest)
    .where(and(eq(quest.userId, userId), eq(quest.status, "completed")));
  return rows.reduce((sum, r) => sum + r.xpReward, 0);
}
