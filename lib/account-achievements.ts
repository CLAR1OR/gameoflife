import { db } from "@/lib/db";
import {
  achievement,
  book,
  habit,
  habitCompletion,
  quest,
  skill,
  xpSession,
} from "@/lib/db/schema";
import { XP_PER_BOOK } from "@/modules/books/types";
import { and, count, eq, gte, isNull, sum } from "drizzle-orm";
import { levelFromXp } from "./level";
import { formatLocalDate } from "./date";

/**
 * Compute total account XP across skills + unlinked habits + completed quests.
 * Shared helper used by both the dashboard/status-bar view and the
 * level-achievement checks.
 */
export async function computeTotalAccountXp(userId: string): Promise<number> {
  // Skill XP
  const [skillXpRow] = await db
    .select({ total: sum(skill.currentXp) })
    .from(skill)
    .where(eq(skill.userId, userId));
  const skillXp = Number(skillXpRow?.total ?? 0);

  // General XP from unlinked habits
  const unlinkedRows = await db
    .select({
      habitId: habit.id,
      xpPer: habit.xpPerCompletion,
    })
    .from(habit)
    .where(and(eq(habit.userId, userId), isNull(habit.skillId)));

  let generalXp = 0;
  for (const h of unlinkedRows) {
    const completions = await db
      .select({ id: habitCompletion.id })
      .from(habitCompletion)
      .where(eq(habitCompletion.habitId, h.habitId));
    generalXp += completions.length * h.xpPer;
  }

  // Completed quest XP
  const questRows = await db
    .select({ xp: quest.xpReward })
    .from(quest)
    .where(and(eq(quest.userId, userId), eq(quest.status, "completed")));
  const questXp = questRows.reduce((sum, r) => sum + r.xp, 0);

  // Books-read XP: flat XP_PER_BOOK per finished book
  const [readBooksRow] = await db
    .select({ c: count() })
    .from(book)
    .where(and(eq(book.userId, userId), eq(book.status, "read")));
  const booksXp = Number(readBooksRow?.c ?? 0) * XP_PER_BOOK;

  return skillXp + generalXp + questXp + booksXp;
}

const LEVEL_ACHIEVEMENTS: {
  name: string;
  description: string;
  icon: string;
  level: number;
}[] = [
  { name: "First Steps", description: "Reach level 5", icon: "🌱", level: 5 },
  { name: "Committed", description: "Reach level 10", icon: "🔥", level: 10 },
  { name: "Seasoned", description: "Reach level 25", icon: "⚔️", level: 25 },
  { name: "Veteran", description: "Reach level 50", icon: "🏆", level: 50 },
  { name: "Grandmaster", description: "Reach level 75", icon: "💎", level: 75 },
  { name: "Legendary", description: "Reach level 100", icon: "👑", level: 100 },
];

export async function ensureLevelAchievementsSeeded(userId: string) {
  const existing = await db.query.achievement.findMany({
    where: (a, { and: _and, eq: _eq }) =>
      _and(_eq(a.userId, userId), _eq(a.triggerType, "account_level")),
  });
  if (existing.length > 0) return;

  await db.insert(achievement).values(
    LEVEL_ACHIEVEMENTS.map((a) => ({
      userId,
      categoryId: null,
      source: "custom" as const,
      name: a.name,
      description: a.description,
      icon: a.icon,
      triggerType: "account_level" as const,
      triggerCount: a.level,
    }))
  );
}

/**
 * Re-evaluate every account_level achievement for this user based on current
 * total XP. Returns names that newly unlocked.
 */
export async function checkAccountLevelAchievements(
  userId: string
): Promise<string[]> {
  await ensureLevelAchievementsSeeded(userId);
  const totalXp = await computeTotalAccountXp(userId);
  const currentLevel = levelFromXp(totalXp);

  const achievements = await db.query.achievement.findMany({
    where: (a, { and: _and, eq: _eq }) =>
      _and(_eq(a.userId, userId), _eq(a.triggerType, "account_level")),
  });

  const newlyUnlocked: string[] = [];
  for (const a of achievements) {
    if (a.triggerCount == null) continue;
    const shouldBeUnlocked = currentLevel >= a.triggerCount;
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

/** XP earned in the last rolling 7 days (skill + unlinked habits + quests). */
export async function computeWeeklyXp(userId: string): Promise<number> {
  // Rolling 7-day window starting 6 days ago, including today
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);
  const weekAgoISODate = formatLocalDate(weekAgo);

  // Skill XP from the xp_session log (milestones + linked-habit completions)
  const [skillXpRow] = await db
    .select({ total: sum(xpSession.xpGained) })
    .from(xpSession)
    .where(
      and(
        eq(xpSession.userId, userId),
        gte(xpSession.loggedAt, weekAgo)
      )
    );
  const skillXp = Number(skillXpRow?.total ?? 0);

  // Unlinked habit XP: count completions in the last 7 days and multiply
  const unlinkedHabits = await db
    .select({
      habitId: habit.id,
      xpPer: habit.xpPerCompletion,
    })
    .from(habit)
    .where(and(eq(habit.userId, userId), isNull(habit.skillId)));

  let unlinkedXp = 0;
  for (const h of unlinkedHabits) {
    const [completionCount] = await db
      .select({ c: count() })
      .from(habitCompletion)
      .where(
        and(
          eq(habitCompletion.habitId, h.habitId),
          gte(habitCompletion.date, weekAgoISODate)
        )
      );
    unlinkedXp += Number(completionCount.c) * h.xpPer;
  }

  // Quest XP: completed in the last 7 days
  const questRows = await db
    .select({ xp: quest.xpReward })
    .from(quest)
    .where(
      and(
        eq(quest.userId, userId),
        eq(quest.status, "completed"),
        gte(quest.completedAt, weekAgo)
      )
    );
  const questXp = questRows.reduce((sum, r) => sum + r.xp, 0);

  return skillXp + unlinkedXp + questXp;
}

/** Simple count of total and unlocked achievements for a user. */
export async function getAchievementCounts(userId: string): Promise<{
  total: number;
  unlocked: number;
}> {
  const rows = await db
    .select({ isUnlocked: achievement.isUnlocked })
    .from(achievement)
    .where(eq(achievement.userId, userId));
  return {
    total: rows.length,
    unlocked: rows.filter((r) => r.isUnlocked).length,
  };
}

/** Default weekly XP goal. Can be made user-configurable later. */
export const DEFAULT_WEEKLY_XP_GOAL = 500;
