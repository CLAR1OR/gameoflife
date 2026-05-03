"use server";

import { db } from "@/lib/db";
import { skillCategory, skill, skillPrerequisite, milestone, xpSession, achievement } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { calculateLevel } from "@/lib/xp";
import { getTemplate } from "@/lib/skill-templates";
import { checkAccountLevelAchievements } from "@/lib/account-achievements";
import { evaluateQuestTaskTriggers } from "@/lib/quest-task-triggers";

const TOTAL_STAGES = 6;

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
      status: "background",
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

export async function setSkillStatus(
  categoryId: string,
  status: "active" | "background" | "inactive"
) {
  const session = await requireSession();

  // Enforce max 3 active skills
  if (status === "active") {
    const activeCount = await db.query.skillCategory.findMany({
      where: (cat, { and: a, eq: e }) =>
        a(e(cat.userId, session.user.id), e(cat.status, "active")),
    });
    if (activeCount.length >= 3) {
      throw new Error("You can have at most 3 active skills. Move one to background first.");
    }
  }

  await db
    .update(skillCategory)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(skillCategory.id, categoryId),
        eq(skillCategory.userId, session.user.id)
      )
    );

  revalidatePath("/skills");
  revalidatePath("/");
}

export async function activateTemplate(templateId: string) {
  const session = await requireSession();
  const template = getTemplate(templateId);
  if (!template) throw new Error("Template not found");

  // Check if user already has this template
  const existing = await db.query.skillCategory.findFirst({
    where: (cat, { and: a, eq: e }) =>
      a(e(cat.userId, session.user.id), e(cat.templateId, templateId)),
  });
  if (existing) throw new Error("You already have this skill");

  // Create the category
  const [category] = await db
    .insert(skillCategory)
    .values({
      userId: session.user.id,
      name: template.name,
      description: template.description,
      icon: template.icon,
      coverImage: template.coverImage,
      status: "inactive",
      templateId: template.id,
    })
    .returning();

  // Create all subskills
  const skillMap = new Map<string, string>(); // name → id
  for (const sub of template.subskills) {
    const hasPrereqs = sub.prerequisiteNames && sub.prerequisiteNames.length > 0;
    const [newSkill] = await db
      .insert(skill)
      .values({
        categoryId: category.id,
        userId: session.user.id,
        name: sub.name,
        description: sub.description ?? null,
        level: hasPrereqs ? 0 : 1,
      })
      .returning();
    skillMap.set(sub.name, newSkill.id);
  }

  // Create prerequisites
  for (const sub of template.subskills) {
    if (!sub.prerequisiteNames?.length) continue;
    const skillId = skillMap.get(sub.name)!;
    for (const prereqName of sub.prerequisiteNames) {
      const prereqId = skillMap.get(prereqName);
      if (prereqId) {
        await db.insert(skillPrerequisite).values({
          skillId,
          prerequisiteId: prereqId,
          requiredLevel: 1,
        });
      }
    }
  }

  // Create milestones
  for (const sub of template.subskills) {
    const skillId = skillMap.get(sub.name)!;
    if (sub.milestones.length > 0) {
      await db.insert(milestone).values(
        sub.milestones.map((m, i) => ({
          skillId,
          userId: session.user.id,
          name: m.name,
          xpReward: m.xpReward,
          sortOrder: i,
        }))
      );
    }
  }

  // Create template achievements
  if (template.achievements?.length) {
    await db.insert(achievement).values(
      template.achievements.map((a, i) => {
        let triggerSkillId: string | null = null;
        if (a.trigger.type === "subskill_mastered") {
          triggerSkillId = skillMap.get(a.trigger.subskillName) ?? null;
        }
        return {
          userId: session.user.id,
          categoryId: category.id,
          source: "template" as const,
          name: a.name,
          description: a.description ?? null,
          icon: a.icon,
          triggerType: a.trigger.type,
          triggerSkillId,
          triggerStage:
            a.trigger.type === "stage_reached" ? a.trigger.stage : null,
          sortOrder: i,
        };
      })
    );
  }

  revalidatePath("/skills");
  revalidatePath("/achievements");
  return category;
}

// =====================
// SUBSKILL ACTIONS
// =====================

export async function createSkill(data: {
  categoryId: string;
  name: string;
  description?: string;
  prerequisiteIds?: string[];
  milestones?: { name: string; xpReward: number }[];
}) {
  const session = await requireSession();
  const hasPrereqs = data.prerequisiteIds && data.prerequisiteIds.length > 0;

  const [newSkill] = await db
    .insert(skill)
    .values({
      categoryId: data.categoryId,
      userId: session.user.id,
      name: data.name,
      description: data.description ?? null,
      level: hasPrereqs ? 0 : 1,
    })
    .returning();

  if (hasPrereqs) {
    await db.insert(skillPrerequisite).values(
      data.prerequisiteIds!.map((prereqId) => ({
        skillId: newSkill.id,
        prerequisiteId: prereqId,
        requiredLevel: 1,
      }))
    );
  }

  // Create milestones
  if (data.milestones?.length) {
    await db.insert(milestone).values(
      data.milestones.map((m, i) => ({
        skillId: newSkill.id,
        userId: session.user.id,
        name: m.name,
        xpReward: m.xpReward,
        sortOrder: i,
      }))
    );
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
// MILESTONE ACTIONS
// =====================

export async function addMilestone(data: {
  skillId: string;
  name: string;
  xpReward: number;
}) {
  const session = await requireSession();

  // Verify skill belongs to user
  const sk = await db.query.skill.findFirst({
    where: (s, { and: a, eq: e }) =>
      a(e(s.id, data.skillId), e(s.userId, session.user.id)),
  });
  if (!sk) throw new Error("Skill not found");

  // Get current max sort order
  const existing = await db.query.milestone.findMany({
    where: (m, { eq: e }) => e(m.skillId, data.skillId),
  });

  const [ms] = await db
    .insert(milestone)
    .values({
      skillId: data.skillId,
      userId: session.user.id,
      name: data.name,
      xpReward: data.xpReward,
      sortOrder: existing.length,
    })
    .returning();

  revalidatePath(`/skills/${sk.categoryId}`);
  return ms;
}

export async function completeMilestone(milestoneId: string) {
  const session = await requireSession();

  const ms = await db.query.milestone.findFirst({
    where: (m, { and: a, eq: e }) =>
      a(e(m.id, milestoneId), e(m.userId, session.user.id)),
    with: { skill: true },
  });

  if (!ms) throw new Error("Milestone not found");
  if (ms.completed) return { leveledUp: false, unlocked: [] as string[], newLevel: ms.skill.level, newXp: ms.skill.currentXp };
  if (ms.skill.level === 0) throw new Error("Skill is locked");

  // Mark milestone completed
  await db
    .update(milestone)
    .set({ completed: true, completedAt: new Date() })
    .where(eq(milestone.id, milestoneId));

  // Grant XP to the skill
  const newXp = ms.skill.currentXp + ms.xpReward;
  const oldLevel = ms.skill.level;
  const newLevel = calculateLevel(newXp);

  await db
    .update(skill)
    .set({ currentXp: newXp, level: newLevel, updatedAt: new Date() })
    .where(eq(skill.id, ms.skill.id));

  // Log the XP session for activity feed
  await db.insert(xpSession).values({
    userId: session.user.id,
    skillId: ms.skill.id,
    milestoneId: milestoneId,
    xpGained: ms.xpReward,
    note: ms.name,
  });

  // Check if any downstream skills got unlocked
  let unlocked: string[] = [];
  if (newLevel > oldLevel) {
    unlocked = await checkAndUnlockDependents(ms.skill.id, newLevel);
  }

  // Check if any achievements newly unlocked
  const newAchievements = await checkCategoryAchievements(
    ms.skill.categoryId,
    session.user.id
  );
  const levelAchievements = await checkAccountLevelAchievements(
    session.user.id
  );
  await evaluateQuestTaskTriggers(session.user.id);

  revalidatePath(`/skills/${ms.skill.categoryId}`);
  revalidatePath("/achievements");
  revalidatePath("/quests");
  revalidatePath("/");

  return {
    newXp,
    oldLevel,
    newLevel,
    leveledUp: newLevel > oldLevel,
    unlocked,
    newAchievements: [...newAchievements, ...levelAchievements],
    milestoneName: ms.name,
    xpGained: ms.xpReward,
  };
}

export async function uncompleteMilestone(milestoneId: string) {
  const session = await requireSession();

  const ms = await db.query.milestone.findFirst({
    where: (m, { and: a, eq: e }) =>
      a(e(m.id, milestoneId), e(m.userId, session.user.id)),
    with: { skill: true },
  });

  if (!ms) throw new Error("Milestone not found");
  if (!ms.completed) return;

  // Unmark milestone
  await db
    .update(milestone)
    .set({ completed: false, completedAt: null })
    .where(eq(milestone.id, milestoneId));

  // Remove XP
  const newXp = Math.max(0, ms.skill.currentXp - ms.xpReward);
  const newLevel = calculateLevel(newXp);

  await db
    .update(skill)
    .set({ currentXp: newXp, level: newLevel, updatedAt: new Date() })
    .where(eq(skill.id, ms.skill.id));

  // Remove the xp session log for this milestone
  await db
    .delete(xpSession)
    .where(eq(xpSession.milestoneId, milestoneId));

  // Re-check achievements (may need to re-lock)
  await checkCategoryAchievements(ms.skill.categoryId, session.user.id);
  await checkAccountLevelAchievements(session.user.id);

  revalidatePath(`/skills/${ms.skill.categoryId}`);
  revalidatePath("/achievements");
  revalidatePath("/");
}

export async function deleteMilestone(milestoneId: string) {
  const session = await requireSession();

  const ms = await db.query.milestone.findFirst({
    where: (m, { and: a, eq: e }) =>
      a(e(m.id, milestoneId), e(m.userId, session.user.id)),
    with: { skill: true },
  });

  if (!ms) throw new Error("Milestone not found");

  // If it was completed, remove the XP
  if (ms.completed) {
    const newXp = Math.max(0, ms.skill.currentXp - ms.xpReward);
    const newLevel = calculateLevel(newXp);
    await db
      .update(skill)
      .set({ currentXp: newXp, level: newLevel, updatedAt: new Date() })
      .where(eq(skill.id, ms.skill.id));
  }

  await db.delete(milestone).where(eq(milestone.id, milestoneId));

  revalidatePath(`/skills/${ms.skill.categoryId}`);
}

// =====================
// ACHIEVEMENT ACTIONS
// =====================

export async function createCustomAchievement(data: {
  name: string;
  description?: string;
  icon?: string;
  categoryId?: string;
}) {
  const session = await requireSession();
  const [created] = await db
    .insert(achievement)
    .values({
      userId: session.user.id,
      categoryId: data.categoryId ?? null,
      source: "custom",
      name: data.name,
      description: data.description ?? null,
      icon: data.icon ?? "🏆",
      triggerType: "manual",
    })
    .returning();

  revalidatePath("/achievements");
  if (data.categoryId) revalidatePath(`/skills/${data.categoryId}`);
  return created;
}

export async function markAchievementManual(id: string) {
  const session = await requireSession();
  const existing = await db.query.achievement.findFirst({
    where: (a, { and: _and, eq: _eq }) =>
      _and(_eq(a.id, id), _eq(a.userId, session.user.id)),
  });
  if (!existing) throw new Error("Achievement not found");
  if (existing.triggerType !== "manual") {
    throw new Error("This achievement is unlocked automatically");
  }

  await db
    .update(achievement)
    .set({ isUnlocked: true, unlockedAt: new Date() })
    .where(eq(achievement.id, id));

  revalidatePath("/achievements");
  if (existing.categoryId) revalidatePath(`/skills/${existing.categoryId}`);
}

export async function unmarkAchievementManual(id: string) {
  const session = await requireSession();
  const existing = await db.query.achievement.findFirst({
    where: (a, { and: _and, eq: _eq }) =>
      _and(_eq(a.id, id), _eq(a.userId, session.user.id)),
  });
  if (!existing) throw new Error("Achievement not found");
  if (existing.triggerType !== "manual") {
    throw new Error("This achievement is unlocked automatically");
  }

  await db
    .update(achievement)
    .set({ isUnlocked: false, unlockedAt: null })
    .where(eq(achievement.id, id));

  revalidatePath("/achievements");
  if (existing.categoryId) revalidatePath(`/skills/${existing.categoryId}`);
}

export async function updateAchievementIcon(id: string, icon: string) {
  const session = await requireSession();
  const [updated] = await db
    .update(achievement)
    .set({ icon })
    .where(
      and(
        eq(achievement.id, id),
        eq(achievement.userId, session.user.id)
      )
    )
    .returning();

  if (updated) {
    revalidatePath("/achievements");
    if (updated.categoryId) revalidatePath(`/skills/${updated.categoryId}`);
  }
}

export async function deleteAchievement(id: string) {
  const session = await requireSession();
  const existing = await db.query.achievement.findFirst({
    where: (a, { and: _and, eq: _eq }) =>
      _and(_eq(a.id, id), _eq(a.userId, session.user.id)),
  });
  if (!existing) throw new Error("Achievement not found");
  if (existing.source !== "custom") {
    throw new Error("Only custom achievements can be deleted");
  }

  await db.delete(achievement).where(eq(achievement.id, id));

  revalidatePath("/achievements");
  if (existing.categoryId) revalidatePath(`/skills/${existing.categoryId}`);
}

// =====================
// INTERNAL HELPERS
// =====================

async function checkAndUnlockDependents(
  prerequisiteId: string,
  prerequisiteLevel: number
): Promise<string[]> {
  const dependents = await db.query.skillPrerequisite.findMany({
    where: (sp, { eq }) => eq(sp.prerequisiteId, prerequisiteId),
    with: { skill: true },
  });

  const unlocked: string[] = [];
  for (const dep of dependents) {
    if (dep.skill.level !== 0) continue;
    if (prerequisiteLevel < dep.requiredLevel) continue;

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

/**
 * Evaluate every auto-trigger achievement in a category and update its
 * `isUnlocked` state based on current skill/milestone state.
 * Returns names of achievements that newly unlocked (for toast messages).
 */
async function checkCategoryAchievements(
  categoryId: string,
  userId: string
): Promise<string[]> {
  const achievements = await db.query.achievement.findMany({
    where: (a, { and: _and, eq: _eq }) =>
      _and(_eq(a.categoryId, categoryId), _eq(a.userId, userId)),
  });

  const skills = await db.query.skill.findMany({
    where: (s, { and: _and, eq: _eq }) =>
      _and(_eq(s.categoryId, categoryId), _eq(s.userId, userId)),
  });

  if (skills.length === 0) return [];

  // Aggregate totals for stage calculation
  const totalMilestones = await db.query.milestone.findMany({
    where: (m, { inArray }) =>
      inArray(m.skillId, skills.map((s) => s.id)),
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

  const newlyUnlocked: string[] = [];
  for (const a of achievements) {
    if (a.triggerType === "manual") continue; // manual only — skip auto eval

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
      newlyUnlocked.push(a.name);
    } else if (!shouldBeUnlocked && a.isUnlocked) {
      // Revert if conditions no longer hold (e.g., milestone unchecked)
      await db
        .update(achievement)
        .set({ isUnlocked: false, unlockedAt: null })
        .where(eq(achievement.id, a.id));
    }
  }

  return newlyUnlocked;
}
