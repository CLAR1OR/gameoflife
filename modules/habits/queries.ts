import { db } from "@/lib/db";
import { habit, habitCompletion, skill, skillCategory } from "@/lib/db/schema";
import { and, asc, eq, gte, isNotNull, inArray } from "drizzle-orm";
import { calcStreak, lastNDates } from "@/lib/date";
import type { HabitWithLink } from "./types";

export async function getHabitsWithStatus(
  userId: string,
  rangeDays = 30
): Promise<HabitWithLink[]> {
  const rows = await db
    .select({
      habit: habit,
      skillName: skill.name,
      categoryId: skillCategory.id,
      categoryName: skillCategory.name,
      categoryIcon: skillCategory.icon,
    })
    .from(habit)
    .leftJoin(skill, eq(habit.skillId, skill.id))
    .leftJoin(skillCategory, eq(skill.categoryId, skillCategory.id))
    .where(and(eq(habit.userId, userId), eq(habit.archived, false)))
    .orderBy(asc(habit.sortOrder), asc(habit.createdAt));

  if (rows.length === 0) return [];

  const dates = lastNDates(rangeDays);
  const firstDate = dates[0];

  const habitIds = rows.map((r) => r.habit.id);
  const completions = await db
    .select({ habitId: habitCompletion.habitId, date: habitCompletion.date })
    .from(habitCompletion)
    .where(
      and(
        inArray(habitCompletion.habitId, habitIds),
        gte(habitCompletion.date, firstDate)
      )
    );

  const byHabit = new Map<string, string[]>();
  for (const c of completions) {
    const list = byHabit.get(c.habitId) ?? [];
    list.push(c.date);
    byHabit.set(c.habitId, list);
  }
  for (const list of byHabit.values()) list.sort();

  return rows.map((r) => {
    const completed = byHabit.get(r.habit.id) ?? [];
    return {
      ...r.habit,
      completedDates: completed,
      currentStreak: calcStreak(completed),
      skillName: r.skillName,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      categoryIcon: r.categoryIcon,
    };
  });
}

/** Which skill categories have at least one habit linked (via their subskills)? */
export async function getCategoryIdsWithHabits(
  userId: string
): Promise<Set<string>> {
  const rows = await db
    .select({ categoryId: skill.categoryId })
    .from(habit)
    .innerJoin(skill, eq(habit.skillId, skill.id))
    .where(
      and(
        eq(habit.userId, userId),
        eq(habit.archived, false),
        isNotNull(habit.skillId)
      )
    );
  return new Set(rows.map((r) => r.categoryId));
}

/** All subskills for the current user, grouped by category — for the habit skill-linking dropdown. */
export async function getSubskillsGrouped(userId: string) {
  const rows = await db
    .select({
      skillId: skill.id,
      skillName: skill.name,
      categoryId: skillCategory.id,
      categoryName: skillCategory.name,
      categoryIcon: skillCategory.icon,
    })
    .from(skill)
    .innerJoin(skillCategory, eq(skill.categoryId, skillCategory.id))
    .where(eq(skill.userId, userId))
    .orderBy(asc(skillCategory.name), asc(skill.name));

  const groups = new Map<
    string,
    { categoryId: string; categoryName: string; categoryIcon: string | null; subskills: { id: string; name: string }[] }
  >();
  for (const r of rows) {
    const key = r.categoryId;
    if (!groups.has(key)) {
      groups.set(key, {
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        categoryIcon: r.categoryIcon,
        subskills: [],
      });
    }
    groups.get(key)!.subskills.push({ id: r.skillId, name: r.skillName });
  }
  return Array.from(groups.values());
}
