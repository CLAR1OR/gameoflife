import { db } from "@/lib/db";
import { skillCategory, skill, achievement } from "@/lib/db/schema";
import { eq, count, and, asc } from "drizzle-orm";

export async function getCategoriesByUser(userId: string) {
  const categories = await db
    .select({
      id: skillCategory.id,
      userId: skillCategory.userId,
      name: skillCategory.name,
      description: skillCategory.description,
      icon: skillCategory.icon,
      color: skillCategory.color,
      status: skillCategory.status,
      templateId: skillCategory.templateId,
      coverImage: skillCategory.coverImage,
      sortOrder: skillCategory.sortOrder,
      createdAt: skillCategory.createdAt,
      updatedAt: skillCategory.updatedAt,
      skillCount: count(skill.id),
    })
    .from(skillCategory)
    .leftJoin(skill, eq(skill.categoryId, skillCategory.id))
    .where(eq(skillCategory.userId, userId))
    .groupBy(skillCategory.id)
    .orderBy(skillCategory.sortOrder);

  return categories;
}

export async function getCategoryById(categoryId: string, userId: string) {
  const category = await db.query.skillCategory.findFirst({
    where: (cat, { and, eq }) =>
      and(eq(cat.id, categoryId), eq(cat.userId, userId)),
  });
  return category ?? null;
}

export async function getSkillsByCategory(categoryId: string, userId: string) {
  const skills = await db.query.skill.findMany({
    where: (s, { and, eq }) =>
      and(eq(s.categoryId, categoryId), eq(s.userId, userId)),
    with: {
      prerequisites: {
        with: {
          prerequisite: true,
        },
      },
      milestones: {
        orderBy: (m, { asc }) => [asc(m.sortOrder)],
      },
    },
  });
  return skills;
}

export async function getAchievementsByUser(userId: string) {
  return db
    .select()
    .from(achievement)
    .where(eq(achievement.userId, userId))
    .orderBy(asc(achievement.categoryId), asc(achievement.sortOrder));
}

export async function getAchievementsByCategory(
  categoryId: string,
  userId: string
) {
  return db
    .select()
    .from(achievement)
    .where(
      and(
        eq(achievement.categoryId, categoryId),
        eq(achievement.userId, userId)
      )
    )
    .orderBy(asc(achievement.sortOrder));
}

export type TodaysQuest = {
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  skillId: string;
  skillName: string;
  skillLevel: number;
  milestoneId: string;
  milestoneName: string;
  xpReward: number;
};

export async function getTodaysQuests(userId: string): Promise<TodaysQuest[]> {
  const categories = await db.query.skillCategory.findMany({
    where: (cat, { and: a, eq: e }) =>
      a(e(cat.userId, userId), e(cat.status, "active")),
    with: {
      skills: {
        orderBy: (s, { asc }) => [asc(s.createdAt)],
        with: {
          milestones: {
            orderBy: (m, { asc }) => [asc(m.sortOrder)],
          },
        },
      },
    },
    orderBy: (cat, { asc }) => [asc(cat.sortOrder)],
  });

  const quests: TodaysQuest[] = [];
  for (const cat of categories) {
    for (const sk of cat.skills) {
      // unlocked (level > 0) but not mastered (level < 4)
      if (sk.level <= 0 || sk.level >= 4) continue;
      const nextMilestone = sk.milestones.find((m) => !m.completed);
      if (!nextMilestone) continue;
      quests.push({
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        skillId: sk.id,
        skillName: sk.name,
        skillLevel: sk.level,
        milestoneId: nextMilestone.id,
        milestoneName: nextMilestone.name,
        xpReward: nextMilestone.xpReward,
      });
      break;
    }
  }
  return quests;
}

export async function getActivatedTemplateIds(userId: string): Promise<string[]> {
  const categories = await db.query.skillCategory.findMany({
    where: (cat, { and: a, eq: e }) => a(e(cat.userId, userId)),
    columns: { templateId: true },
  });
  return categories
    .map((c) => c.templateId)
    .filter((id): id is string => id !== null);
}
