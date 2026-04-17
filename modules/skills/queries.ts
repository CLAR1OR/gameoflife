import { db } from "@/lib/db";
import { skillCategory, skill } from "@/lib/db/schema";
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
      status: skillCategory.status,
      templateId: skillCategory.templateId,
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

export async function getActivatedTemplateIds(userId: string): Promise<string[]> {
  const categories = await db.query.skillCategory.findMany({
    where: (cat, { and: a, eq: e }) => a(e(cat.userId, userId)),
    columns: { templateId: true },
  });
  return categories
    .map((c) => c.templateId)
    .filter((id): id is string => id !== null);
}
