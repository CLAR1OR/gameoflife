import { db } from "@/lib/db";
import {
  achievement,
  habit,
  habitCompletion,
  quest,
  skill,
} from "@/lib/db/schema";
import { and, eq, isNull, sum } from "drizzle-orm";
import { levelFromXp } from "./level";

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

  return skillXp + generalXp + questXp;
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
