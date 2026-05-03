import { db } from "@/lib/db";
import {
  questTask,
  quest,
  habitCompletion,
  milestone,
  book,
} from "@/lib/db/schema";
import { and, count, eq, ne } from "drizzle-orm";

/**
 * Re-evaluate every auto-trigger quest task for a user and flip the
 * `completed` flag based on the current state of the underlying module.
 *
 * Sticky on completion — once a milestone/book trigger fires, we don't
 * un-complete it if the underlying milestone is later un-completed
 * (the user can still toggle manually). Habit-count triggers do
 * un-complete if the count drops below the threshold.
 *
 * Returns `true` if anything changed; callers can decide whether to
 * re-evaluate the parent quest or just revalidate paths.
 */
export async function evaluateQuestTaskTriggers(
  userId: string
): Promise<boolean> {
  const tasks = await db
    .select()
    .from(questTask)
    .where(and(eq(questTask.userId, userId), ne(questTask.triggerType, "manual")));

  if (tasks.length === 0) return false;

  // Pre-fetch counts per habit so we don't run N queries
  const habitIds = Array.from(
    new Set(
      tasks
        .filter((t) => t.triggerType === "habit_count" && t.triggerHabitId)
        .map((t) => t.triggerHabitId as string)
    )
  );
  const habitCounts = new Map<string, number>();
  for (const id of habitIds) {
    const [{ c }] = await db
      .select({ c: count() })
      .from(habitCompletion)
      .where(eq(habitCompletion.habitId, id));
    habitCounts.set(id, Number(c));
  }

  let changed = false;
  for (const t of tasks) {
    let shouldBeComplete: boolean | null = null;

    if (t.triggerType === "milestone" && t.triggerMilestoneId) {
      const m = await db.query.milestone.findFirst({
        where: (row, { and: a, eq: e }) =>
          a(e(row.id, t.triggerMilestoneId as string), e(row.userId, userId)),
      });
      if (m && m.completed) shouldBeComplete = true;
    } else if (t.triggerType === "book" && t.triggerBookId) {
      const b = await db.query.book.findFirst({
        where: (row, { and: a, eq: e }) =>
          a(e(row.id, t.triggerBookId as string), e(row.userId, userId)),
      });
      if (b && b.status === "read") shouldBeComplete = true;
    } else if (t.triggerType === "habit_count" && t.triggerHabitId) {
      const cnt = habitCounts.get(t.triggerHabitId) ?? 0;
      const target = t.triggerCount ?? 1;
      shouldBeComplete = cnt >= target;
    }

    if (shouldBeComplete === null) continue;

    if (shouldBeComplete && !t.completed) {
      await db
        .update(questTask)
        .set({ completed: true, completedAt: new Date() })
        .where(eq(questTask.id, t.id));
      changed = true;
    } else if (
      !shouldBeComplete &&
      t.completed &&
      t.triggerType === "habit_count"
    ) {
      // Habit-count triggers un-complete if the count drops back below.
      // Milestone/book triggers stay sticky.
      await db
        .update(questTask)
        .set({ completed: false, completedAt: null })
        .where(eq(questTask.id, t.id));
      changed = true;
    }
  }

  return changed;
}

/** Filter for "this quest has at least one auto-trigger task". Used to
 * decide whether to revalidate `/quests` after a habit/milestone/book
 * action. Cheap because we just check existence. */
export async function userHasTriggerTasks(userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: questTask.id })
    .from(questTask)
    .innerJoin(quest, eq(questTask.questId, quest.id))
    .where(
      and(eq(questTask.userId, userId), ne(questTask.triggerType, "manual"))
    )
    .limit(1);
  return rows.length > 0;
}
