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

const TOTAL_STAGES = 6;

const DEFAULT_HABITS: { name: string; icon: string }[] = [
  { name: "Getting up on time", icon: "⏰" },
  { name: "Piano", icon: "🎹" },
  { name: "Meditation", icon: "🧘" },
  { name: "Russian", icon: "🇷🇺" },
  { name: "Focusmate Session", icon: "👥" },
  { name: "Wim Hof practice", icon: "❄️" },
  { name: "No memes", icon: "🚫" },
];

// =====================
// CRUD
// =====================

export async function createHabit(data: {
  name: string;
  description?: string;
  icon?: string;
  skillId?: string | null;
  xpPerCompletion?: number;
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
      skillId: data.skillId ?? null,
      xpPerCompletion: data.xpPerCompletion ?? 1,
      sortOrder: existing.length,
    })
    .returning();

  revalidatePath("/habits");
  revalidatePath("/skills");
  return row;
}

export async function updateHabit(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    icon?: string;
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

    revalidatePath("/habits");
    return { completed: false };
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

  revalidatePath("/habits");
  return { completed: true };
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

// =====================
// SEED DEFAULTS
// =====================

export async function seedDefaultHabits() {
  const session = await requireSession();
  const existing = await db.query.habit.findMany({
    where: (h, { eq: e }) => e(h.userId, session.user.id),
  });
  if (existing.length > 0) return { seeded: false };

  await db.insert(habit).values(
    DEFAULT_HABITS.map((h, i) => ({
      userId: session.user.id,
      name: h.name,
      icon: h.icon,
      skillId: null,
      sortOrder: i,
    }))
  );

  revalidatePath("/habits");
  return { seeded: true };
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

