"use server";

import { db } from "@/lib/db";
import { quest, questTask, achievement } from "@/lib/db/schema";
import { and, asc, count, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { MAX_SIDE_QUESTS } from "./types";
import { checkAccountLevelAchievements } from "@/lib/account-achievements";
import { getQuestTemplate } from "@/lib/quest-templates";

export type QuestAutoAchievementSpec = {
  enabled: boolean;
  icon?: string;
  name?: string;
  description?: string;
};

// =====================
// CRUD
// =====================

export async function createQuest(data: {
  type: "main" | "side";
  name: string;
  description?: string;
  icon?: string;
  xpReward?: number;
  dueAt?: Date | null;
  tasks?: string[];
  status?: "active" | "backlog";
  autoAchievement?: QuestAutoAchievementSpec;
}) {
  const session = await requireSession();

  const status = data.status ?? "active";

  // Slot validation only applies to active quests; backlog has no cap.
  if (status === "active") {
    const activeOfType = await db.query.quest.findMany({
      where: (q, { and: a, eq: e }) =>
        a(e(q.userId, session.user.id), e(q.status, "active"), e(q.type, data.type)),
    });

    if (data.type === "main" && activeOfType.length >= 1) {
      throw new Error(
        "You already have an active main quest. Complete it, abandon it, or move it to the backlog first."
      );
    }
    if (data.type === "side" && activeOfType.length >= MAX_SIDE_QUESTS) {
      throw new Error(
        `You already have ${MAX_SIDE_QUESTS} active side quests. Move one to the backlog or finish it first.`
      );
    }
  }

  const peers = await db.query.quest.findMany({
    where: (q, { and: a, eq: e }) =>
      a(e(q.userId, session.user.id), e(q.status, status), e(q.type, data.type)),
  });

  const [row] = await db
    .insert(quest)
    .values({
      userId: session.user.id,
      type: data.type,
      name: data.name,
      description: data.description ?? null,
      icon: data.icon ?? (data.type === "main" ? "⚔️" : "📜"),
      xpReward: data.xpReward ?? (data.type === "main" ? 100 : 25),
      status,
      dueAt: data.dueAt ?? null,
      sortOrder: peers.length,
    })
    .returning();

  if (data.tasks && data.tasks.length > 0) {
    await db.insert(questTask).values(
      data.tasks
        .map((name, i) => ({
          questId: row.id,
          userId: session.user.id,
          name: name.trim(),
          sortOrder: i,
        }))
        .filter((t) => t.name.length > 0)
    );
  }

  // Create per-quest achievement if requested
  if (data.autoAchievement?.enabled) {
    await db.insert(achievement).values({
      userId: session.user.id,
      categoryId: null,
      source: "custom",
      name: data.autoAchievement.name ?? `Completed: ${data.name}`,
      description:
        data.autoAchievement.description ??
        `Completed the ${data.type} quest "${data.name}"`,
      icon: data.autoAchievement.icon ?? (data.type === "main" ? "👑" : "🎯"),
      triggerType: "quest_completed",
      triggerQuestId: row.id,
    });
  }

  // Lazy-seed the generic quest count achievements on first quest creation
  await seedGenericQuestAchievements(session.user.id);

  revalidatePath("/quests");
  revalidatePath("/achievements");
  return row;
}

export async function updateQuest(
  id: string,
  data: {
    name?: string;
    description?: string | null;
    icon?: string;
    xpReward?: number;
    dueAt?: Date | null;
  }
) {
  const session = await requireSession();
  await db
    .update(quest)
    .set(data)
    .where(and(eq(quest.id, id), eq(quest.userId, session.user.id)));

  revalidatePath("/quests");
  revalidatePath("/");
}

// =====================
// TASKS (checklist)
// =====================

export type QuestTaskTrigger =
  | { type: "manual" }
  | { type: "habit_count"; habitId: string; count: number }
  | { type: "milestone"; milestoneId: string }
  | { type: "book"; bookId: string };

export async function addQuestTask(
  questId: string,
  name: string,
  trigger: QuestTaskTrigger = { type: "manual" }
) {
  const session = await requireSession();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Task name is required");
  // Confirm the quest belongs to the user — avoid writing a task for someone
  // else's quest via a crafted ID.
  const q = await db.query.quest.findFirst({
    where: (row, { and: a, eq: e }) =>
      a(e(row.id, questId), e(row.userId, session.user.id)),
  });
  if (!q) throw new Error("Quest not found");

  const [{ c }] = await db
    .select({ c: count() })
    .from(questTask)
    .where(eq(questTask.questId, questId));

  const baseValues = {
    questId,
    userId: session.user.id,
    name: trimmed,
    sortOrder: Number(c),
  };

  if (trigger.type === "habit_count") {
    await db.insert(questTask).values({
      ...baseValues,
      triggerType: "habit_count",
      triggerHabitId: trigger.habitId,
      triggerCount: Math.max(1, trigger.count),
    });
  } else if (trigger.type === "milestone") {
    await db.insert(questTask).values({
      ...baseValues,
      triggerType: "milestone",
      triggerMilestoneId: trigger.milestoneId,
    });
  } else if (trigger.type === "book") {
    await db.insert(questTask).values({
      ...baseValues,
      triggerType: "book",
      triggerBookId: trigger.bookId,
    });
  } else {
    await db.insert(questTask).values(baseValues);
  }

  // Auto-trigger tasks may already be satisfied — evaluate now.
  if (trigger.type !== "manual") {
    const { evaluateQuestTaskTriggers } = await import(
      "@/lib/quest-task-triggers"
    );
    await evaluateQuestTaskTriggers(session.user.id);
  }

  revalidatePath("/quests");
  revalidatePath("/");
}

export async function toggleQuestTask(taskId: string) {
  const session = await requireSession();
  const task = await db.query.questTask.findFirst({
    where: (t, { and: a, eq: e }) =>
      a(e(t.id, taskId), e(t.userId, session.user.id)),
  });
  if (!task) throw new Error("Task not found");

  await db
    .update(questTask)
    .set({
      completed: !task.completed,
      completedAt: !task.completed ? new Date() : null,
    })
    .where(eq(questTask.id, taskId));

  revalidatePath("/quests");
  revalidatePath("/");
}

export async function deleteQuestTask(taskId: string) {
  const session = await requireSession();
  await db
    .delete(questTask)
    .where(and(eq(questTask.id, taskId), eq(questTask.userId, session.user.id)));
  revalidatePath("/quests");
  revalidatePath("/");
}

export type TriggerPickerOptions = {
  habits: { id: string; name: string; icon: string }[];
  milestones: { id: string; name: string; skillName: string; categoryName: string }[];
  books: { id: string; title: string; authors: string }[];
};

/** Snapshot of items the user can pick from when adding an auto-trigger
 * task. Used by the in-quest task picker. */
export async function getQuestTaskTriggerOptions(): Promise<TriggerPickerOptions> {
  const session = await requireSession();
  const { habit, milestone, skill, skillCategory, book } = await import(
    "@/lib/db/schema"
  );

  const habits = await db
    .select({ id: habit.id, name: habit.name, icon: habit.icon })
    .from(habit)
    .where(and(eq(habit.userId, session.user.id), eq(habit.archived, false)))
    .orderBy(asc(habit.name));

  const milestones = await db
    .select({
      id: milestone.id,
      name: milestone.name,
      skillName: skill.name,
      categoryName: skillCategory.name,
    })
    .from(milestone)
    .innerJoin(skill, eq(milestone.skillId, skill.id))
    .innerJoin(skillCategory, eq(skill.categoryId, skillCategory.id))
    .where(
      and(
        eq(milestone.userId, session.user.id),
        eq(milestone.completed, false)
      )
    )
    .orderBy(asc(skillCategory.name), asc(skill.name), asc(milestone.name));

  const books = await db
    .select({ id: book.id, title: book.title, authors: book.authors })
    .from(book)
    .where(and(eq(book.userId, session.user.id)))
    .orderBy(asc(book.title));

  return { habits, milestones, books };
}

export async function renameQuestTask(taskId: string, name: string) {
  const session = await requireSession();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Task name is required");
  await db
    .update(questTask)
    .set({ name: trimmed })
    .where(and(eq(questTask.id, taskId), eq(questTask.userId, session.user.id)));
  revalidatePath("/quests");
  revalidatePath("/");
}

export async function completeQuest(id: string) {
  const session = await requireSession();
  const row = await db.query.quest.findFirst({
    where: (q, { and: a, eq: e }) =>
      a(e(q.id, id), e(q.userId, session.user.id)),
  });
  if (!row) throw new Error("Quest not found");
  if (row.status !== "active") throw new Error("Quest is not active");

  await db
    .update(quest)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(quest.id, id));

  const newlyUnlocked = await checkQuestAchievements(session.user.id, id);
  const levelAchievements = await checkAccountLevelAchievements(
    session.user.id
  );

  revalidatePath("/quests");
  revalidatePath("/");
  revalidatePath("/achievements");
  return {
    xp: row.xpReward,
    newAchievements: [...newlyUnlocked, ...levelAchievements],
  };
}

export async function abandonQuest(id: string) {
  const session = await requireSession();
  await db
    .update(quest)
    .set({ status: "abandoned", completedAt: new Date() })
    .where(and(eq(quest.id, id), eq(quest.userId, session.user.id)));

  revalidatePath("/quests");
}

export async function restoreQuest(id: string) {
  const session = await requireSession();
  const row = await db.query.quest.findFirst({
    where: (q, { and: a, eq: e }) =>
      a(e(q.id, id), e(q.userId, session.user.id)),
  });
  if (!row) throw new Error("Quest not found");
  if (row.status === "active") return;

  // Check slot availability before restoring
  const activeOfType = await db.query.quest.findMany({
    where: (q, { and: a, eq: e }) =>
      a(e(q.userId, session.user.id), e(q.status, "active"), e(q.type, row.type)),
  });
  if (row.type === "main" && activeOfType.length >= 1) {
    throw new Error("You already have an active main quest");
  }
  if (row.type === "side" && activeOfType.length >= MAX_SIDE_QUESTS) {
    throw new Error("No free side-quest slot");
  }

  await db
    .update(quest)
    .set({ status: "active", completedAt: null })
    .where(eq(quest.id, id));

  // If it was previously completed, we need to re-lock the quest-completed
  // achievement since completion is no longer true.
  await checkQuestAchievements(session.user.id, id);
  await checkAccountLevelAchievements(session.user.id);

  revalidatePath("/quests");
  revalidatePath("/achievements");
  revalidatePath("/");
}

/** Move an active quest into the backlog (no slot cost, no XP, no completion). */
export async function moveQuestToBacklog(id: string) {
  const session = await requireSession();
  const row = await db.query.quest.findFirst({
    where: (q, { and: a, eq: e }) =>
      a(e(q.id, id), e(q.userId, session.user.id)),
  });
  if (!row) throw new Error("Quest not found");
  if (row.status === "backlog") return;

  await db
    .update(quest)
    .set({ status: "backlog", completedAt: null })
    .where(eq(quest.id, id));

  revalidatePath("/quests");
  revalidatePath("/");
}

/** Pull a backlog quest into the active board. */
export async function activateBacklogQuest(id: string) {
  const session = await requireSession();
  const row = await db.query.quest.findFirst({
    where: (q, { and: a, eq: e }) =>
      a(e(q.id, id), e(q.userId, session.user.id)),
  });
  if (!row) throw new Error("Quest not found");
  if (row.status === "active") return;

  const activeOfType = await db.query.quest.findMany({
    where: (q, { and: a, eq: e }) =>
      a(e(q.userId, session.user.id), e(q.status, "active"), e(q.type, row.type)),
  });
  if (row.type === "main" && activeOfType.length >= 1) {
    throw new Error(
      "You already have an active main quest. Move it to the backlog first."
    );
  }
  if (row.type === "side" && activeOfType.length >= MAX_SIDE_QUESTS) {
    throw new Error("No free side-quest slot. Free one up in the active board.");
  }

  await db
    .update(quest)
    .set({ status: "active", completedAt: null })
    .where(eq(quest.id, id));

  revalidatePath("/quests");
  revalidatePath("/");
}

/** Promote a side quest to the main quest (or vice-versa). Slot rules apply
 * to whichever side it's moving INTO. */
export async function changeQuestType(
  id: string,
  newType: "main" | "side"
) {
  const session = await requireSession();
  const row = await db.query.quest.findFirst({
    where: (q, { and: a, eq: e }) =>
      a(e(q.id, id), e(q.userId, session.user.id)),
  });
  if (!row) throw new Error("Quest not found");
  if (row.type === newType) return;

  // Only enforce slot caps when the quest is active.
  if (row.status === "active") {
    const activeOfNewType = await db.query.quest.findMany({
      where: (q, { and: a, eq: e }) =>
        a(
          e(q.userId, session.user.id),
          e(q.status, "active"),
          e(q.type, newType)
        ),
    });
    if (newType === "main" && activeOfNewType.length >= 1) {
      throw new Error(
        "You already have an active main quest. Demote it to side first, or move it to the backlog."
      );
    }
    if (newType === "side" && activeOfNewType.length >= MAX_SIDE_QUESTS) {
      throw new Error(
        `Side-quest slots are full (${MAX_SIDE_QUESTS}/${MAX_SIDE_QUESTS}). Free one up first.`
      );
    }
  }

  await db
    .update(quest)
    .set({ type: newType })
    .where(eq(quest.id, id));

  revalidatePath("/quests");
  revalidatePath("/");
}

/** Drop a quest template into the user's backlog. */
export async function activateQuestTemplate(templateId: string) {
  const session = await requireSession();
  const template = getQuestTemplate(templateId);
  if (!template) throw new Error("Template not found");

  // Prevent re-activation if a quest from this template already exists in
  // any state other than abandoned/completed (so we don't spam the backlog
  // when the user is already working on it).
  const existing = await db.query.quest.findFirst({
    where: (q, { and: a, eq: e, or: o }) =>
      a(
        e(q.userId, session.user.id),
        e(q.templateId, templateId),
        o(e(q.status, "active"), e(q.status, "backlog"))
      ),
  });
  if (existing) {
    throw new Error("Already in your backlog or active board");
  }

  const peers = await db.query.quest.findMany({
    where: (q, { and: a, eq: e }) =>
      a(
        e(q.userId, session.user.id),
        e(q.status, "backlog"),
        e(q.type, template.type)
      ),
  });

  const [row] = await db
    .insert(quest)
    .values({
      userId: session.user.id,
      type: template.type,
      name: template.name,
      description: template.description,
      icon: template.icon,
      xpReward: template.xpReward,
      status: "backlog",
      templateId: template.id,
      sortOrder: peers.length,
    })
    .returning();

  if (template.tasks && template.tasks.length > 0) {
    await db.insert(questTask).values(
      template.tasks.map((name, i) => ({
        questId: row.id,
        userId: session.user.id,
        name,
        sortOrder: i,
      }))
    );
  }

  revalidatePath("/quests");
  return row;
}

export async function deleteQuest(id: string) {
  const session = await requireSession();
  await db
    .delete(quest)
    .where(and(eq(quest.id, id), eq(quest.userId, session.user.id)));

  revalidatePath("/quests");
  revalidatePath("/achievements");
}

// =====================
// ACHIEVEMENT HELPERS
// =====================

async function checkQuestAchievements(
  userId: string,
  triggeringQuestId: string
): Promise<string[]> {
  const achievements = await db.query.achievement.findMany({
    where: (a, { and: _and, eq: _eq, or: _or }) =>
      _and(
        _eq(a.userId, userId),
        _or(
          _eq(a.triggerType, "quest_completed"),
          _eq(a.triggerType, "side_quest_count"),
          _eq(a.triggerType, "main_quest_count")
        )
      ),
  });

  // Load quest counts for this user
  const allQuests = await db
    .select()
    .from(quest)
    .where(eq(quest.userId, userId));
  const sideCompleted = allQuests.filter(
    (q) => q.type === "side" && q.status === "completed"
  ).length;
  const mainCompleted = allQuests.filter(
    (q) => q.type === "main" && q.status === "completed"
  ).length;

  const newlyUnlocked: string[] = [];
  for (const a of achievements) {
    let shouldBeUnlocked = false;

    if (a.triggerType === "quest_completed" && a.triggerQuestId) {
      const q = allQuests.find((x) => x.id === a.triggerQuestId);
      shouldBeUnlocked = q?.status === "completed";
      // Highlight the triggering quest specifically
      void triggeringQuestId;
    } else if (
      a.triggerType === "side_quest_count" &&
      a.triggerCount != null
    ) {
      shouldBeUnlocked = sideCompleted >= a.triggerCount;
    } else if (
      a.triggerType === "main_quest_count" &&
      a.triggerCount != null
    ) {
      shouldBeUnlocked = mainCompleted >= a.triggerCount;
    }

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

async function seedGenericQuestAchievements(userId: string) {
  // Only seed if the user has zero quest-count achievements
  const existing = await db.query.achievement.findMany({
    where: (a, { and: _and, eq: _eq, or: _or }) =>
      _and(
        _eq(a.userId, userId),
        _or(
          _eq(a.triggerType, "side_quest_count"),
          _eq(a.triggerType, "main_quest_count")
        )
      ),
  });
  if (existing.length > 0) return;

  await db.insert(achievement).values([
    {
      userId,
      categoryId: null,
      source: "custom",
      name: "First Steps on the Quest",
      description: "Complete your first side quest",
      icon: "🗺️",
      triggerType: "side_quest_count",
      triggerCount: 1,
    },
    {
      userId,
      categoryId: null,
      source: "custom",
      name: "Side Quest Enthusiast",
      description: "Complete 10 side quests",
      icon: "⚔️",
      triggerType: "side_quest_count",
      triggerCount: 10,
    },
    {
      userId,
      categoryId: null,
      source: "custom",
      name: "Side Quest Master",
      description: "Complete 25 side quests",
      icon: "🏆",
      triggerType: "side_quest_count",
      triggerCount: 25,
    },
    {
      userId,
      categoryId: null,
      source: "custom",
      name: "Legendary Adventurer",
      description: "Complete 50 side quests",
      icon: "👑",
      triggerType: "side_quest_count",
      triggerCount: 50,
    },
    {
      userId,
      categoryId: null,
      source: "custom",
      name: "Main Character",
      description: "Complete your first main quest",
      icon: "🌟",
      triggerType: "main_quest_count",
      triggerCount: 1,
    },
    {
      userId,
      categoryId: null,
      source: "custom",
      name: "Hero's Journey",
      description: "Complete 5 main quests",
      icon: "🗡️",
      triggerType: "main_quest_count",
      triggerCount: 5,
    },
  ]);
}
