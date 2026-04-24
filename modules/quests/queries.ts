import { db } from "@/lib/db";
import { quest, questTask } from "@/lib/db/schema";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { Quest, QuestStats, QuestWithTasks, QuestTask } from "./types";
export { MAX_SIDE_QUESTS } from "./types";
export type { QuestStats };

function computeProgress(tasks: QuestTask[], status: Quest["status"]) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  // If no subtasks, status drives the 0/100 view
  const pct =
    total === 0
      ? status === "completed"
        ? 100
        : 0
      : Math.round((done / total) * 100);
  return { done, total, pct };
}

async function attachTasks(
  quests: Quest[]
): Promise<QuestWithTasks[]> {
  if (quests.length === 0) return [];
  const tasks = await db
    .select()
    .from(questTask)
    .where(
      inArray(
        questTask.questId,
        quests.map((q) => q.id)
      )
    )
    .orderBy(asc(questTask.sortOrder), asc(questTask.createdAt));

  const byQuest = new Map<string, QuestTask[]>();
  for (const t of tasks) {
    const list = byQuest.get(t.questId) ?? [];
    list.push(t);
    byQuest.set(t.questId, list);
  }
  return quests.map((q) => {
    const list = byQuest.get(q.id) ?? [];
    return { ...q, tasks: list, progress: computeProgress(list, q.status) };
  });
}

export async function getActiveQuests(userId: string): Promise<{
  main: QuestWithTasks | null;
  side: QuestWithTasks[];
}> {
  const rows = await db
    .select()
    .from(quest)
    .where(and(eq(quest.userId, userId), eq(quest.status, "active")))
    .orderBy(asc(quest.sortOrder), asc(quest.createdAt));
  const withTasks = await attachTasks(rows);
  const main = withTasks.find((q) => q.type === "main") ?? null;
  const side = withTasks.filter((q) => q.type === "side");
  return { main, side };
}

export async function getArchivedQuests(
  userId: string
): Promise<QuestWithTasks[]> {
  const rows = await db
    .select()
    .from(quest)
    .where(eq(quest.userId, userId))
    .orderBy(desc(quest.completedAt), desc(quest.createdAt));
  const filtered = rows.filter((r) => r.status !== "active");
  return attachTasks(filtered);
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
