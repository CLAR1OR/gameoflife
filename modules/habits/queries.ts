import { db } from "@/lib/db";
import { habit, habitCompletion, skill, skillCategory, quest } from "@/lib/db/schema";
import { and, asc, count, eq, gte, isNotNull, inArray, isNull, sum } from "drizzle-orm";
import { calcStreak, lastNDates, todayISO } from "@/lib/date";
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

  // Completions in range (for the 7-day dots and current streak)
  const inRangeCompletions = await db
    .select({ habitId: habitCompletion.habitId, date: habitCompletion.date })
    .from(habitCompletion)
    .where(
      and(
        inArray(habitCompletion.habitId, habitIds),
        gte(habitCompletion.date, firstDate)
      )
    );

  // ALL-time completions (for total + best streak)
  const allCompletions = await db
    .select({ habitId: habitCompletion.habitId, date: habitCompletion.date })
    .from(habitCompletion)
    .where(inArray(habitCompletion.habitId, habitIds));

  const inRangeByHabit = new Map<string, string[]>();
  for (const c of inRangeCompletions) {
    const list = inRangeByHabit.get(c.habitId) ?? [];
    list.push(c.date);
    inRangeByHabit.set(c.habitId, list);
  }
  for (const list of inRangeByHabit.values()) list.sort();

  const allByHabit = new Map<string, string[]>();
  for (const c of allCompletions) {
    const list = allByHabit.get(c.habitId) ?? [];
    list.push(c.date);
    allByHabit.set(c.habitId, list);
  }

  // Best streak computed from all-time dates
  const calcBest = (allDates: string[]): number => {
    if (allDates.length === 0) return 0;
    const sorted = [...allDates].sort();
    let best = 1;
    let current = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1] + "T00:00:00");
      const curr = new Date(sorted[i] + "T00:00:00");
      const diffDays = Math.round(
        (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays === 1) {
        current++;
        if (current > best) best = current;
      } else {
        current = 1;
      }
    }
    return best;
  };

  const today = todayISO();

  return rows.map((r) => {
    const inRange = inRangeByHabit.get(r.habit.id) ?? [];
    const all = allByHabit.get(r.habit.id) ?? [];
    const isIrregular = r.habit.kind === "irregular";
    const todayCount = all.filter((d) => d === today).length;
    return {
      ...r.habit,
      completedDates: inRange,
      currentStreak: isIrregular ? 0 : calcStreak(all),
      bestStreak: isIrregular ? 0 : calcBest(all),
      totalCompletions: all.length,
      todayCount,
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

// =====================
// STATISTICS
// =====================

/** Longest streak ever within a set of completed dates. */
function calcBestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...dates].sort();
  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T00:00:00");
    const curr = new Date(sorted[i] + "T00:00:00");
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      current++;
      if (current > best) best = current;
    } else {
      current = 1;
    }
  }
  return best;
}

export type HabitDetailStats = {
  totalCompletions: number;
  currentStreak: number;
  bestStreak: number;
  last30Completions: number;
  completionRatePct: number; // last 30 days
  totalXpEarned: number;
};

export async function getHabitDetailStats(
  habitId: string,
  userId: string
): Promise<HabitDetailStats> {
  const h = await db.query.habit.findFirst({
    where: (row, { and: a, eq: e }) =>
      a(e(row.id, habitId), e(row.userId, userId)),
  });
  if (!h) {
    return {
      totalCompletions: 0,
      currentStreak: 0,
      bestStreak: 0,
      last30Completions: 0,
      completionRatePct: 0,
      totalXpEarned: 0,
    };
  }

  const all = await db
    .select({ date: habitCompletion.date })
    .from(habitCompletion)
    .where(
      and(
        eq(habitCompletion.habitId, habitId),
        eq(habitCompletion.userId, userId)
      )
    );
  const dates = all.map((r) => r.date);
  const set = new Set(dates);

  const last30 = lastNDates(30);
  const last30Done = last30.filter((d) => set.has(d)).length;

  return {
    totalCompletions: dates.length,
    currentStreak: calcStreak(dates.sort()),
    bestStreak: calcBestStreak(dates),
    last30Completions: last30Done,
    completionRatePct: Math.round((last30Done / 30) * 100),
    totalXpEarned: dates.length * h.xpPerCompletion,
  };
}

export type OverallHabitStats = {
  activeHabits: number;
  pausedHabits: number;
  totalCompletions: number;
  totalXpFromHabits: number;
  xpToSkills: number;
  generalXp: number;
  bestDailyStreak: number;
  last30DaysCompletions: number;
  avgCompletionsPerDay: number;
};

export async function getOverallHabitStats(
  userId: string
): Promise<OverallHabitStats> {
  const habits = await db.query.habit.findMany({
    where: (row, { and: a, eq: e }) =>
      a(e(row.userId, userId), e(row.archived, false)),
  });

  const activeCount = habits.filter((h) => !h.paused).length;
  const pausedCount = habits.filter((h) => h.paused).length;

  if (habits.length === 0) {
    return {
      activeHabits: 0,
      pausedHabits: 0,
      totalCompletions: 0,
      totalXpFromHabits: 0,
      xpToSkills: 0,
      generalXp: 0,
      bestDailyStreak: 0,
      last30DaysCompletions: 0,
      avgCompletionsPerDay: 0,
    };
  }

  const completions = await db
    .select({
      habitId: habitCompletion.habitId,
      date: habitCompletion.date,
    })
    .from(habitCompletion)
    .where(eq(habitCompletion.userId, userId));

  // Map completions to habits to get xpPerCompletion
  const xpByHabit = new Map(habits.map((h) => [h.id, h.xpPerCompletion]));
  const linkedByHabit = new Map(habits.map((h) => [h.id, !!h.skillId]));

  let xpToSkills = 0;
  let generalXp = 0;
  for (const c of completions) {
    const xp = xpByHabit.get(c.habitId) ?? 0;
    if (linkedByHabit.get(c.habitId)) xpToSkills += xp;
    else generalXp += xp;
  }

  const last30 = new Set(lastNDates(30));
  const last30Count = completions.filter((c) => last30.has(c.date)).length;

  // Best-ever daily streak (consecutive days with ≥1 completion)
  const allDates = new Set(completions.map((c) => c.date));
  const sortedDates = Array.from(allDates).sort();
  const bestDailyStreak = calcBestStreak(sortedDates);

  return {
    activeHabits: activeCount,
    pausedHabits: pausedCount,
    totalCompletions: completions.length,
    totalXpFromHabits: xpToSkills + generalXp,
    xpToSkills,
    generalXp,
    bestDailyStreak,
    last30DaysCompletions: last30Count,
    avgCompletionsPerDay: Math.round((last30Count / 30) * 10) / 10,
  };
}

export async function getTotalAccountXp(userId: string): Promise<number> {
  // Skill XP: sum of all skill.currentXp for the user
  const [skillXpRow] = await db
    .select({ total: sum(skill.currentXp) })
    .from(skill)
    .where(eq(skill.userId, userId));
  const skillXp = Number(skillXpRow?.total ?? 0);

  // General XP: unlinked habit completions × xpPerCompletion
  const unlinkedRows = await db
    .select({
      completionCount: count(habitCompletion.id),
      xpPer: habit.xpPerCompletion,
    })
    .from(habit)
    .leftJoin(habitCompletion, eq(habitCompletion.habitId, habit.id))
    .where(and(eq(habit.userId, userId), isNull(habit.skillId)))
    .groupBy(habit.id);

  const generalXp = unlinkedRows.reduce(
    (sum, r) => sum + Number(r.completionCount) * r.xpPer,
    0
  );

  // Quest XP: sum of completed quest xpRewards
  const questRows = await db
    .select({ xp: quest.xpReward })
    .from(quest)
    .where(and(eq(quest.userId, userId), eq(quest.status, "completed")));
  const questXp = questRows.reduce((sum, r) => sum + r.xp, 0);

  return skillXp + generalXp + questXp;
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
