import { db } from "@/lib/db";
import { skillCategory, skill, skillPrerequisite } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";

export async function getCategoriesByUser(userId: string) {
  const categories = await db
    .select({
      id: skillCategory.id,
      userId: skillCategory.userId,
      name: skillCategory.name,
      description: skillCategory.description,
      icon: skillCategory.icon,
      color: skillCategory.color,
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
    },
  });
  return skills;
}

export async function getPrerequisitesForSkill(skillId: string) {
  return db.query.skillPrerequisite.findMany({
    where: (sp, { eq }) => eq(sp.skillId, skillId),
    with: {
      prerequisite: true,
    },
  });
}
