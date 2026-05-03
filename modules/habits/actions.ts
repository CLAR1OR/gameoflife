"use server";

import { db } from "@/lib/db";
import {
  habit,
  habitCompletion,
  skill,
  achievement,
  xpSession,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { calculateLevel } from "@/lib/xp";
import { todayISO } from "@/lib/date";
import { checkAccountLevelAchievements } from "@/lib/account-achievements";
import { evaluateQuestTaskTriggers } from "@/lib/quest-task-triggers";

const TOTAL_STAGES = 6;

// =====================
// CRUD
// =====================

export type AutoAchievementSpec =
  | { kind: "streak"; days: number }
  | { kind: "total"; count: number };

export async function createHabit(data: {
  name: string;
  description?: string;
  icon?: string;
  kind?: "daily" | "irregular";
  skillId?: string | null;
  xpPerCompletion?: number;
  autoAchievements?: AutoAchievementSpec[];
}) {
  const session = await requireSession();
  const existing = await db.query.habit.findMany({
    where: (h, { and: a, eq: e }) =>
      a(e(h.userId, session.user.id), e(h.archived, false)),
  });
  const [row] = await db
    .insert(habit)
    .values({
      userId: session.user.id,
      name: data.name,
      description: data.description ?? null,
      icon: data.icon ?? "✅",
      kind: data.kind ?? "daily",
      skillId: data.skillId ?? null,
      xpPerCompletion: data.xpPerCompletion ?? 1,
      sortOrder: existing.length,
    })
    .returning();

  // Auto-create achievements for this habit
  if (data.autoAchievements?.length) {
    const achievementRows = data.autoAchievements.map((spec, i) => {
      if (spec.kind === "streak") {
        return {
          userId: session.user.id,
          categoryId: null,
          source: "custom" as const,
          name: `${data.name}: ${spec.days}-day streak`,
          description: `Complete "${data.name}" for ${spec.days} consecutive days`,
          icon: spec.days >= 100 ? "🏆" : spec.days >= 30 ? "🔥" : "✨",
          triggerType: "habit_streak" as const,
          triggerHabitId: row.id,
          triggerCount: spec.days,
          sortOrder: i,
        };
      }
      return {
        userId: session.user.id,
        categoryId: null,
        source: "custom" as const,
        name: `${data.name}: ${spec.count} completions`,
        description: `Complete "${data.name}" a total of ${spec.count} times`,
        icon: spec.count >= 500 ? "👑" : spec.count >= 100 ? "💎" : "⭐",
        triggerType: "habit_total" as const,
        triggerHabitId: row.id,
        triggerCount: spec.count,
        sortOrder: i + 100,
      };
    });
    await db.insert(achievement).values(achievementRows);
  }

  revalidatePath("/habits");
  revalidatePath("/skills");
  revalidatePath("/achievements");
  return row;
}

export async function updateHabit(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    icon?: string;
    kind?: "daily" | "irregular";
    skillId?: string | null;
    xpPerCompletion?: number;
  }
) {
  const session = await requireSession();
  await db
    .update(habit)
    .set(data)
    .where(and(eq(habit.id, id), eq(habit.userId, session.user.id)));

  revalidatePath("/habits");
  revalidatePath("/skills");
}

export async function setHabitPaused(id: string, paused: boolean) {
  const session = await requireSession();
  await db
    .update(habit)
    .set({ paused })
    .where(and(eq(habit.id, id), eq(habit.userId, session.user.id)));

  revalidatePath("/habits");
  revalidatePath("/skills");
}

export async function deleteHabit(id: string) {
  const session = await requireSession();
  await db
    .delete(habit)
    .where(and(eq(habit.id, id), eq(habit.userId, session.user.id)));

  revalidatePath("/habits");
  revalidatePath("/skills");
}

// =====================
// COMPLETIONS
// =====================

export async function toggleHabitCompletion(habitId: string, date?: string) {
  const session = await requireSession();
  const targetDate = date ?? todayISO();

  const row = await db.query.habit.findFirst({
    where: (h, { and: a, eq: e }) =>
      a(e(h.id, habitId), e(h.userId, session.user.id)),
  });
  if (!row) throw new Error("Habit not found");

  const existing = await db.query.habitCompletion.findFirst({
    where: (hc, { and: a, eq: e }) =>
      a(e(hc.habitId, habitId), e(hc.date, targetDate)),
  });

  if (existing) {
    // Uncheck: remove completion + subtract XP
    await db
      .delete(habitCompletion)
      .where(eq(habitCompletion.id, existing.id));

    if (row.skillId) {
      await adjustSkillXp(row.skillId, session.user.id, -row.xpPerCompletion, habitId);
    }

    const achievementsReverted = await checkHabitAchievements(
      habitId,
      session.user.id
    );
    await checkAccountLevelAchievements(session.user.id);
    await evaluateQuestTaskTriggers(session.user.id);

    revalidatePath("/habits");
    revalidatePath("/achievements");
    revalidatePath("/quests");
    revalidatePath("/");
    return { completed: false, newAchievements: [] as string[], achievementsReverted };
  }

  // Check: add completion + add XP
  await db.insert(habitCompletion).values({
    habitId,
    userId: session.user.id,
    date: targetDate,
  });

  if (row.skillId) {
    await adjustSkillXp(row.skillId, session.user.id, row.xpPerCompletion, habitId);
  }

  const newAchievements = await checkHabitAchievements(
    habitId,
    session.user.id
  );
  const levelAchievements = await checkAccountLevelAchievements(
    session.user.id
  );
  await evaluateQuestTaskTriggers(session.user.id);

  revalidatePath("/habits");
  revalidatePath("/achievements");
  revalidatePath("/quests");
  revalidatePath("/");
  return {
    completed: true,
    newAchievements: [...newAchievements, ...levelAchievements],
    achievementsReverted: [] as string[],
  };
}

/**
 * Log an irregular habit completion. Unlike daily habits, this always inserts
 * a new completion row (no toggle) — an irregular habit can be logged multiple
 * times per day.
 */
export async function logIrregularHabit(habitId: string) {
  const session = await requireSession();
  const targetDate = todayISO();

  const row = await db.query.habit.findFirst({
    where: (h, { and: a, eq: e }) =>
      a(e(h.id, habitId), e(h.userId, session.user.id)),
  });
  if (!row) throw new Error("Habit not found");
  if (row.kind !== "irregular") {
    throw new Error("This habit is daily — use toggleHabitCompletion");
  }

  await db.insert(habitCompletion).values({
    habitId,
    userId: session.user.id,
    date: targetDate,
  });

  if (row.skillId) {
    await adjustSkillXp(
      row.skillId,
      session.user.id,
      row.xpPerCompletion,
      habitId
    );
  }

  const newAchievements = await checkHabitAchievements(
    habitId,
    session.user.id
  );
  const levelAchievements = await checkAccountLevelAchievements(
    session.user.id
  );
  await evaluateQuestTaskTriggers(session.user.id);

  revalidatePath("/habits");
  revalidatePath("/achievements");
  revalidatePath("/quests");
  revalidatePath("/");
  return {
    logged: true,
    newAchievements: [...newAchievements, ...levelAchievements],
  };
}

/**
 * Remove the most recent completion of an irregular habit logged today.
 * Used for "undo last" when the user misclicks.
 */
export async function undoLastIrregularLog(habitId: string) {
  const session = await requireSession();
  const targetDate = todayISO();

  const row = await db.query.habit.findFirst({
    where: (h, { and: a, eq: e }) =>
      a(e(h.id, habitId), e(h.userId, session.user.id)),
  });
  if (!row) throw new Error("Habit not found");

  const mostRecent = await db.query.habitCompletion.findFirst({
    where: (hc, { and: a, eq: e }) =>
      a(
        e(hc.habitId, habitId),
        e(hc.userId, session.user.id),
        e(hc.date, targetDate)
      ),
    orderBy: (hc, { desc }) => [desc(hc.completedAt)],
  });
  if (!mostRecent) return { removed: false };

  await db
    .delete(habitCompletion)
    .where(eq(habitCompletion.id, mostRecent.id));

  if (row.skillId) {
    await adjustSkillXp(
      row.skillId,
      session.user.id,
      -row.xpPerCompletion,
      habitId
    );
  }

  await checkHabitAchievements(habitId, session.user.id);
  await checkAccountLevelAchievements(session.user.id);

  revalidatePath("/habits");
  revalidatePath("/achievements");
  revalidatePath("/");
  return { removed: true };
}

/**
 * Evaluate habit_streak and habit_total achievements linked to this habit.
 * Returns names of achievements that newly unlocked.
 */
async function checkHabitAchievements(
  habitId: string,
  userId: string
): Promise<string[]> {
  const achievements = await db.query.achievement.findMany({
    where: (a, { and: _and, eq: _eq }) =>
      _and(_eq(a.triggerHabitId, habitId), _eq(a.userId, userId)),
  });
  if (achievements.length === 0) return [];

  const completions = await db
    .select({ date: habitCompletion.date })
    .from(habitCompletion)
    .where(
      and(eq(habitCompletion.habitId, habitId), eq(habitCompletion.userId, userId))
    );
  const dates = completions.map((c) => c.date).sort();
  const totalCompletions = dates.length;

  // Current streak ending today or yesterday
  const set = new Set(dates);
  let currentStreak = 0;
  const now = new Date();
  const todayStr = todayISO();
  const startOffset = set.has(todayStr) ? 0 : 1;
  for (let i = startOffset; i < 3650; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (set.has(key)) currentStreak++;
    else break;
  }

  const newlyUnlocked: string[] = [];
  for (const a of achievements) {
    if (a.triggerCount == null) continue;
    let shouldBeUnlocked = false;
    if (a.triggerType === "habit_streak") {
      shouldBeUnlocked = currentStreak >= a.triggerCount;
    } else if (a.triggerType === "habit_total") {
      shouldBeUnlocked = totalCompletions >= a.triggerCount;
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

async function adjustSkillXp(
  skillId: string,
  userId: string,
  delta: number,
  sourceHabitId: string
) {
  const s = await db.query.skill.findFirst({
    where: (sk, { and: a, eq: e }) =>
      a(e(sk.id, skillId), e(sk.userId, userId)),
  });
  if (!s) return;
  if (s.level === 0) return; // locked skills can't gain XP from habits

  const newXp = Math.max(0, s.currentXp + delta);
  const newLevel = calculateLevel(newXp);
  await db
    .update(skill)
    .set({ currentXp: newXp, level: newLevel, updatedAt: new Date() })
    .where(eq(skill.id, skillId));

  if (delta > 0) {
    await db.insert(xpSession).values({
      userId,
      skillId,
      xpGained: delta,
      note: `Habit: ${sourceHabitId}`,
    });
  } else {
    // Remove the most recent matching XP session for this habit
    const recent = await db.query.xpSession.findFirst({
      where: (xs, { and: a, eq: e }) =>
        a(
          e(xs.userId, userId),
          e(xs.skillId, skillId),
          e(xs.note, `Habit: ${sourceHabitId}`)
        ),
      orderBy: (xs, { desc }) => [desc(xs.loggedAt)],
    });
    if (recent) {
      await db.delete(xpSession).where(eq(xpSession.id, recent.id));
    }
  }

  // Re-check achievements for this skill's category
  await checkCategoryAchievements(s.categoryId, userId);
  revalidatePath(`/skills/${s.categoryId}`);
  revalidatePath("/achievements");
}

async function checkCategoryAchievements(categoryId: string, userId: string) {
  const achievements = await db.query.achievement.findMany({
    where: (a, { and: _and, eq: _eq }) =>
      _and(_eq(a.categoryId, categoryId), _eq(a.userId, userId)),
  });

  const skills = await db.query.skill.findMany({
    where: (s, { and: _and, eq: _eq }) =>
      _and(_eq(s.categoryId, categoryId), _eq(s.userId, userId)),
  });

  if (skills.length === 0) return;

  const totalMilestones = await db.query.milestone.findMany({
    where: (m, { inArray: _in }) =>
      _in(m.skillId, skills.map((s) => s.id)),
    columns: { id: true, completed: true },
  });
  const completedCount = totalMilestones.filter((m) => m.completed).length;
  const stage =
    totalMilestones.length === 0
      ? 0
      : Math.min(
          TOTAL_STAGES,
          Math.floor((completedCount / totalMilestones.length) * TOTAL_STAGES)
        );

  const allMastered = skills.length > 0 && skills.every((s) => s.level === 4);

  for (const a of achievements) {
    if (a.triggerType === "manual") continue;

    let shouldBeUnlocked = false;
    if (a.triggerType === "subskill_mastered" && a.triggerSkillId) {
      const s = skills.find((sk) => sk.id === a.triggerSkillId);
      shouldBeUnlocked = s?.level === 4;
    } else if (a.triggerType === "stage_reached" && a.triggerStage != null) {
      shouldBeUnlocked = stage >= a.triggerStage;
    } else if (a.triggerType === "all_mastered") {
      shouldBeUnlocked = allMastered;
    }

    if (shouldBeUnlocked && !a.isUnlocked) {
      await db
        .update(achievement)
        .set({ isUnlocked: true, unlockedAt: new Date() })
        .where(eq(achievement.id, a.id));
    } else if (!shouldBeUnlocked && a.isUnlocked) {
      await db
        .update(achievement)
        .set({ isUnlocked: false, unlockedAt: null })
        .where(eq(achievement.id, a.id));
    }
  }
}

export async function reorderHabits(orderedIds: string[]) {
  const session = await requireSession();
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(habit)
      .set({ sortOrder: i })
      .where(
        and(eq(habit.id, orderedIds[i]), eq(habit.userId, session.user.id))
      );
  }
  revalidatePath("/habits");
}

