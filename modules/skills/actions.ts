"use server";

import { db } from "@/lib/db";
import { skillCategory, skill, skillPrerequisite, xpSession } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { calculateLevel } from "@/lib/xp";

// =====================
// CATEGORY ACTIONS
// =====================

export async function createCategory(data: {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}) {
  const session = await requireSession();
  const [category] = await db
    .insert(skillCategory)
    .values({
      userId: session.user.id,
      name: data.name,
      description: data.description ?? null,
      icon: data.icon ?? null,
      color: data.color ?? null,
    })
    .returning();

  revalidatePath("/skills");
  return category;
}

export async function updateCategory(
  categoryId: string,
  data: {
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
  }
) {
  const session = await requireSession();
  const [updated] = await db
    .update(skillCategory)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(skillCategory.id, categoryId),
        eq(skillCategory.userId, session.user.id)
      )
    )
    .returning();

  revalidatePath("/skills");
  return updated;
}

export async function deleteCategory(categoryId: string) {
  const session = await requireSession();
  await db
    .delete(skillCategory)
    .where(
      and(
        eq(skillCategory.id, categoryId),
        eq(skillCategory.userId, session.user.id)
      )
    );

  revalidatePath("/skills");
}

// =====================
// SKILL ACTIONS
// =====================

export async function createSkill(data: {
  categoryId: string;
  name: string;
  description?: string;
  prerequisiteIds?: string[];
}) {
  const session = await requireSession();
  const [newSkill] = await db
    .insert(skill)
    .values({
      categoryId: data.categoryId,
      userId: session.user.id,
      name: data.name,
      description: data.description ?? null,
      level: 1,
    })
    .returning();

  if (data.prerequisiteIds?.length) {
    await db.insert(skillPrerequisite).values(
      data.prerequisiteIds.map((prereqId) => ({
        skillId: newSkill.id,
        prerequisiteId: prereqId,
        requiredLevel: 1,
      }))
    );
    // If skill has prerequisites, it starts locked (level 0)
    await db
      .update(skill)
      .set({ level: 0 })
      .where(eq(skill.id, newSkill.id));
    newSkill.level = 0;
  }

  revalidatePath(`/skills/${data.categoryId}`);
  return newSkill;
}

export async function updateSkill(
  skillId: string,
  data: { name?: string; description?: string }
) {
  const session = await requireSession();
  const [updated] = await db
    .update(skill)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(skill.id, skillId), eq(skill.userId, session.user.id)))
    .returning();

  if (updated) {
    revalidatePath(`/skills/${updated.categoryId}`);
  }
  return updated;
}

export async function deleteSkill(skillId: string) {
  const session = await requireSession();
  const [deleted] = await db
    .delete(skill)
    .where(and(eq(skill.id, skillId), eq(skill.userId, session.user.id)))
    .returning();

  if (deleted) {
    revalidatePath(`/skills/${deleted.categoryId}`);
  }
}

// =====================
// XP / SESSION ACTIONS
// =====================

export async function logXpSession(data: {
  skillId: string;
  xpGained: number;
  duration?: number;
  note?: string;
}) {
  const session = await requireSession();

  // Get current skill state
  const currentSkill = await db.query.skill.findFirst({
    where: (s, { and: a, eq: e }) =>
      a(e(s.id, data.skillId), e(s.userId, session.user.id)),
  });

  if (!currentSkill) throw new Error("Skill not found");
  if (currentSkill.level === 0) throw new Error("Skill is locked");

  // Log the session
  await db.insert(xpSession).values({
    userId: session.user.id,
    skillId: data.skillId,
    xpGained: data.xpGained,
    duration: data.duration ?? null,
    note: data.note ?? null,
  });

  // Update skill XP and recalculate level
  const newXp = currentSkill.currentXp + data.xpGained;
  const oldLevel = currentSkill.level;
  const newLevel = calculateLevel(newXp);

  await db
    .update(skill)
    .set({
      currentXp: newXp,
      level: newLevel,
      updatedAt: new Date(),
    })
    .where(eq(skill.id, data.skillId));

  // Check if any downstream skills got unlocked
  let unlocked: string[] = [];
  if (newLevel > oldLevel) {
    unlocked = await checkAndUnlockDependents(data.skillId, newLevel);
  }

  revalidatePath(`/skills/${currentSkill.categoryId}`);

  return {
    newXp,
    oldLevel,
    newLevel,
    leveledUp: newLevel > oldLevel,
    unlocked,
  };
}

async function checkAndUnlockDependents(
  prerequisiteId: string,
  prerequisiteLevel: number
): Promise<string[]> {
  // Find skills that depend on this prerequisite
  const dependents = await db.query.skillPrerequisite.findMany({
    where: (sp, { eq }) => eq(sp.prerequisiteId, prerequisiteId),
    with: { skill: true },
  });

  const unlocked: string[] = [];
  for (const dep of dependents) {
    if (dep.skill.level !== 0) continue; // Already unlocked
    if (prerequisiteLevel < dep.requiredLevel) continue;

    // Check ALL prerequisites for this skill
    const allPrereqs = await db.query.skillPrerequisite.findMany({
      where: (sp, { eq }) => eq(sp.skillId, dep.skillId),
      with: { prerequisite: true },
    });

    const allMet = allPrereqs.every(
      (p) => p.prerequisite.level >= p.requiredLevel
    );

    if (allMet) {
      await db
        .update(skill)
        .set({ level: 1, updatedAt: new Date() })
        .where(eq(skill.id, dep.skillId));
      unlocked.push(dep.skill.name);
    }
  }

  return unlocked;
}
