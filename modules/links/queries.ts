import { db } from "@/lib/db";
import {
  habit,
  habitCompletion,
  book,
  quest,
  skill,
} from "@/lib/db/schema";
import { and, count, eq, inArray, ne } from "drizzle-orm";
import type { Book } from "@/modules/books/types";

export type LinkedHabitForCategory = {
  id: string;
  name: string;
  icon: string;
  skillName: string;
  skillId: string;
  paused: boolean;
  archived: boolean;
  totalCompletions: number;
  xpPerCompletion: number;
};

export type LinkedQuestForBook = {
  id: string;
  name: string;
  icon: string;
  type: "main" | "side";
  status: string;
};

/** All habits linked to any subskill in this category. */
export async function getLinkedHabitsForCategory(
  userId: string,
  categoryId: string
): Promise<LinkedHabitForCategory[]> {
  const subskills = await db
    .select({ id: skill.id, name: skill.name })
    .from(skill)
    .where(and(eq(skill.userId, userId), eq(skill.categoryId, categoryId)));
  const skillIds = subskills.map((s) => s.id);
  if (skillIds.length === 0) return [];

  const habits = await db
    .select({
      id: habit.id,
      name: habit.name,
      icon: habit.icon,
      skillId: habit.skillId,
      paused: habit.paused,
      archived: habit.archived,
      xpPerCompletion: habit.xpPerCompletion,
    })
    .from(habit)
    .where(
      and(
        eq(habit.userId, userId),
        inArray(habit.skillId, skillIds)
      )
    );

  if (habits.length === 0) return [];

  const habitIds = habits.map((h) => h.id);
  const completionRows = await db
    .select({ habitId: habitCompletion.habitId })
    .from(habitCompletion)
    .where(inArray(habitCompletion.habitId, habitIds));
  const counts = new Map<string, number>();
  for (const r of completionRows) {
    counts.set(r.habitId, (counts.get(r.habitId) ?? 0) + 1);
  }

  const skillNameById = new Map(subskills.map((s) => [s.id, s.name]));
  return habits.map((h) => ({
    id: h.id,
    name: h.name,
    icon: h.icon,
    skillId: h.skillId as string,
    skillName: skillNameById.get(h.skillId as string) ?? "?",
    paused: h.paused,
    archived: h.archived,
    totalCompletions: counts.get(h.id) ?? 0,
    xpPerCompletion: h.xpPerCompletion,
  }));
}

/** Books linked (skillId) to any subskill in this category. */
export async function getLinkedBooksForCategory(
  userId: string,
  categoryId: string
): Promise<Book[]> {
  const subskills = await db
    .select({ id: skill.id })
    .from(skill)
    .where(and(eq(skill.userId, userId), eq(skill.categoryId, categoryId)));
  const skillIds = subskills.map((s) => s.id);
  if (skillIds.length === 0) return [];

  return db
    .select()
    .from(book)
    .where(
      and(
        eq(book.userId, userId),
        inArray(book.skillId, skillIds)
      )
    );
}

/** Books linked to a specific quest via book.questId. */
export async function getLinkedBooksForQuest(
  userId: string,
  questId: string
): Promise<Book[]> {
  return db
    .select()
    .from(book)
    .where(and(eq(book.userId, userId), eq(book.questId, questId)));
}

/** Per-quest stats for the badge on each quest slot — how many linked
 * books have been read so far. */
export async function getLinkedBookCountsForQuests(
  userId: string,
  questIds: string[]
): Promise<Map<string, { total: number; read: number }>> {
  const map = new Map<string, { total: number; read: number }>();
  if (questIds.length === 0) return map;
  const rows = await db
    .select({ questId: book.questId, status: book.status })
    .from(book)
    .where(
      and(
        eq(book.userId, userId),
        inArray(book.questId, questIds)
      )
    );
  for (const r of rows) {
    if (!r.questId) continue;
    const cur = map.get(r.questId) ?? { total: 0, read: 0 };
    cur.total++;
    if (r.status === "read") cur.read++;
    map.set(r.questId, cur);
  }
  return map;
}

/** Quests where the linked book quest counts; used on book detail page —
 * for now we derive from book.questId directly. This helper lives here for
 * future "many quests per book" growth. */
export async function getQuestForBook(
  userId: string,
  bookQuestId: string
): Promise<LinkedQuestForBook | null> {
  const rows = await db
    .select({
      id: quest.id,
      name: quest.name,
      icon: quest.icon,
      type: quest.type,
      status: quest.status,
    })
    .from(quest)
    .where(and(eq(quest.userId, userId), eq(quest.id, bookQuestId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Activity contribution to a category — how many habit completions and
 * book finishes happened linked to this category, all-time. */
export async function getCategoryContributionStats(
  userId: string,
  categoryId: string
): Promise<{
  habitCompletions: number;
  booksRead: number;
  habitsLinked: number;
  booksLinked: number;
}> {
  const subskills = await db
    .select({ id: skill.id })
    .from(skill)
    .where(and(eq(skill.userId, userId), eq(skill.categoryId, categoryId)));
  const skillIds = subskills.map((s) => s.id);
  if (skillIds.length === 0)
    return {
      habitCompletions: 0,
      booksRead: 0,
      habitsLinked: 0,
      booksLinked: 0,
    };

  const linkedHabits = await db
    .select({ id: habit.id })
    .from(habit)
    .where(
      and(eq(habit.userId, userId), inArray(habit.skillId, skillIds))
    );
  const habitIds = linkedHabits.map((h) => h.id);

  let habitCompletions = 0;
  if (habitIds.length > 0) {
    const [{ c }] = await db
      .select({ c: count() })
      .from(habitCompletion)
      .where(inArray(habitCompletion.habitId, habitIds));
    habitCompletions = Number(c);
  }

  const linkedBooks = await db
    .select({ status: book.status })
    .from(book)
    .where(and(eq(book.userId, userId), inArray(book.skillId, skillIds)));

  const booksRead = linkedBooks.filter((b) => b.status === "read").length;

  // silence unused import warning — keep ne() handy for future filters
  void ne;

  return {
    habitCompletions,
    booksRead,
    habitsLinked: linkedHabits.length,
    booksLinked: linkedBooks.length,
  };
}
