import { db } from "@/lib/db";
import {
  milestone,
  skill,
  skillCategory,
  quest,
  habit,
  habitCompletion,
  achievement,
  book,
  bookRead,
  xpSession,
  place,
  placeVisit,
  friend,
  friendInteraction,
} from "@/lib/db/schema";
import { and, eq, gte, desc, isNotNull } from "drizzle-orm";
import { XP_PER_BOOK } from "@/modules/books/types";

type TimelineKind =
  | "milestone"
  | "quest"
  | "book"
  | "achievement"
  | "place"
  | "friend";

export type TimelineEvent = {
  kind: TimelineKind;
  at: Date;
  title: string;
  subtitle: string;
  icon: string;
  xp: number | null;
  href?: string;
};

function ts(d: Date | number | null | undefined): Date | null {
  if (!d) return null;
  return typeof d === "number" ? new Date(d * 1000) : d;
}

/**
 * Unified activity feed across modules. Newest first, capped to `limit`
 * "major" events (milestones, quest/book finishes, achievement unlocks).
 * Daily habit completions are intentionally excluded (too noisy — visible on
 * the habits page); a separate query surfaces the per-day roll-up.
 */
export async function getTimeline(
  userId: string,
  limit = 60
): Promise<TimelineEvent[]> {
  const events: TimelineEvent[] = [];

  // Milestone completions (join skill + category for context)
  const milestones = await db
    .select({
      m: milestone,
      skillName: skill.name,
      categoryId: skillCategory.id,
      categoryName: skillCategory.name,
      categoryIcon: skillCategory.icon,
    })
    .from(milestone)
    .innerJoin(skill, eq(milestone.skillId, skill.id))
    .innerJoin(skillCategory, eq(skill.categoryId, skillCategory.id))
    .where(
      and(
        eq(milestone.userId, userId),
        eq(milestone.completed, true),
        isNotNull(milestone.completedAt)
      )
    )
    .orderBy(desc(milestone.completedAt))
    .limit(limit);
  for (const row of milestones) {
    const at = ts(row.m.completedAt);
    if (!at) continue;
    events.push({
      kind: "milestone",
      at,
      title: row.m.name,
      subtitle: `${row.categoryName} › ${row.skillName}`,
      icon: row.categoryIcon ?? "🎯",
      xp: row.m.xpReward,
      href: `/skills/${row.categoryId}`,
    });
  }

  // Quest completions
  const quests = await db
    .select()
    .from(quest)
    .where(
      and(
        eq(quest.userId, userId),
        eq(quest.status, "completed"),
        isNotNull(quest.completedAt)
      )
    )
    .orderBy(desc(quest.completedAt))
    .limit(limit);
  for (const q of quests) {
    const at = ts(q.completedAt);
    if (!at) continue;
    events.push({
      kind: "quest",
      at,
      title: q.name,
      subtitle: q.type === "main" ? "Main quest completed" : "Side quest completed",
      icon: q.icon,
      xp: q.xpReward,
      href: "/quests",
    });
  }

  // Book reads
  const reads = await db
    .select({
      r: bookRead,
      title: book.title,
      authors: book.authors,
    })
    .from(bookRead)
    .innerJoin(book, eq(bookRead.bookId, book.id))
    .where(eq(bookRead.userId, userId))
    .orderBy(desc(bookRead.finishedAt))
    .limit(limit);
  for (const row of reads) {
    const at = ts(row.r.finishedAt);
    if (!at) continue;
    events.push({
      kind: "book",
      at,
      title: row.title,
      subtitle: `Finished · ${row.authors}`,
      icon: "📚",
      xp: XP_PER_BOOK,
      href: `/books/${row.r.bookId}`,
    });
  }

  // Achievement unlocks
  const achievements = await db
    .select()
    .from(achievement)
    .where(
      and(
        eq(achievement.userId, userId),
        eq(achievement.isUnlocked, true),
        isNotNull(achievement.unlockedAt)
      )
    )
    .orderBy(desc(achievement.unlockedAt))
    .limit(limit);
  for (const a of achievements) {
    const at = ts(a.unlockedAt);
    if (!at) continue;
    events.push({
      kind: "achievement",
      at,
      title: a.name,
      subtitle: a.description ?? "Achievement unlocked",
      icon: a.icon,
      xp: null,
      href: "/achievements",
    });
  }

  // Place visits
  const visits = await db
    .select({ v: placeVisit, p: place })
    .from(placeVisit)
    .innerJoin(place, eq(placeVisit.placeId, place.id))
    .where(eq(placeVisit.userId, userId))
    .orderBy(desc(placeVisit.startedOn))
    .limit(limit);
  for (const row of visits) {
    const [y, m, d] = row.v.startedOn.split("-").map(Number);
    if (!y) continue;
    events.push({
      kind: "place",
      at: new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0),
      title: row.p.name,
      subtitle: row.p.countryName
        ? `Visit · ${row.p.countryName}`
        : "Place visited",
      icon: "🗺️",
      xp: null,
      href: `/places/${row.p.id}`,
    });
  }

  // Friend interactions
  const ints = await db
    .select({ i: friendInteraction, f: friend })
    .from(friendInteraction)
    .innerJoin(friend, eq(friendInteraction.friendId, friend.id))
    .where(eq(friendInteraction.userId, userId))
    .orderBy(desc(friendInteraction.occurredOn))
    .limit(limit);
  const friendKindIcon: Record<string, string> = {
    message: "💬",
    call: "📞",
    meet: "🤝",
    letter: "💌",
    event: "🎉",
    trip: "✈️",
    other: "🫂",
  };
  for (const row of ints) {
    const [y, m, d] = row.i.occurredOn.split("-").map(Number);
    if (!y) continue;
    events.push({
      kind: "friend",
      at: new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0),
      title: row.f.name,
      subtitle: `${row.i.kind.charAt(0).toUpperCase() + row.i.kind.slice(1)} · check-in`,
      icon: friendKindIcon[row.i.kind] ?? "🫂",
      xp: row.i.xpAwarded > 0 ? row.i.xpAwarded : null,
      href: `/friends/${row.f.id}`,
    });
  }

  events.sort((a, b) => b.at.getTime() - a.at.getTime());
  return events.slice(0, limit);
}

export type DailyXpBucket = { date: string; xp: number };

/**
 * XP earned per day over the last `days` days, summed across every source
 * (skill via xp_session, unlinked habits, completed quests, book reads).
 */
export async function getDailyXp(
  userId: string,
  days = 30
): Promise<DailyXpBucket[]> {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = toLocalDateKey(d);
    buckets.set(key, 0);
  }

  function add(date: Date | null, xp: number) {
    if (!date || xp <= 0) return;
    const key = toLocalDateKey(date);
    if (!buckets.has(key)) return; // outside window
    buckets.set(key, (buckets.get(key) ?? 0) + xp);
  }

  // Skill XP from xp_session log
  const xpRows = await db
    .select({ loggedAt: xpSession.loggedAt, xp: xpSession.xpGained })
    .from(xpSession)
    .where(and(eq(xpSession.userId, userId), gte(xpSession.loggedAt, start)));
  for (const r of xpRows) add(ts(r.loggedAt), r.xp);

  // Unlinked-habit XP: completions in window × xpPerCompletion
  const unlinkedHabits = await db
    .select({ id: habit.id, xpPer: habit.xpPerCompletion })
    .from(habit)
    .where(and(eq(habit.userId, userId)));
  const xpByHabit = new Map(
    unlinkedHabits.map((h) => [h.id, h.xpPer] as const)
  );
  // Need skillId to distinguish — skill-linked habits already logged via xp_session
  const allHabits = await db
    .select({ id: habit.id, skillId: habit.skillId })
    .from(habit)
    .where(eq(habit.userId, userId));
  const unlinkedIds = new Set(
    allHabits.filter((h) => !h.skillId).map((h) => h.id)
  );
  const hc = await db
    .select({ habitId: habitCompletion.habitId, at: habitCompletion.completedAt })
    .from(habitCompletion)
    .where(
      and(
        eq(habitCompletion.userId, userId),
        gte(habitCompletion.completedAt, start)
      )
    );
  for (const r of hc) {
    if (!unlinkedIds.has(r.habitId)) continue;
    const xp = xpByHabit.get(r.habitId) ?? 0;
    add(ts(r.at), xp);
  }

  // Completed quests in window
  const quests = await db
    .select({ completedAt: quest.completedAt, xp: quest.xpReward })
    .from(quest)
    .where(
      and(
        eq(quest.userId, userId),
        eq(quest.status, "completed"),
        gte(quest.completedAt, start)
      )
    );
  for (const q of quests) add(ts(q.completedAt), q.xp);

  // Book reads in window
  const reads = await db
    .select({ finishedAt: bookRead.finishedAt })
    .from(bookRead)
    .where(and(eq(bookRead.userId, userId), gte(bookRead.finishedAt, start)));
  for (const r of reads) add(ts(r.finishedAt), XP_PER_BOOK);

  return Array.from(buckets.entries())
    .map(([date, xp]) => ({ date, xp }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Habit activity heatmap — count of habit completions per day. */
export async function getHabitHeatmap(
  userId: string,
  days = 365
): Promise<{ date: string; count: number }[]> {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const rows = await db
    .select({ date: habitCompletion.date })
    .from(habitCompletion)
    .where(
      and(
        eq(habitCompletion.userId, userId),
        gte(habitCompletion.completedAt, start)
      )
    );

  const map = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    map.set(toLocalDateKey(d), 0);
  }
  for (const r of rows) {
    if (map.has(r.date)) map.set(r.date, (map.get(r.date) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
}

export type ActivitySummary = {
  milestonesCompleted: number;
  habitsLogged: number;
  questsCompleted: number;
  booksFinished: number;
  achievementsUnlocked: number;
};

/** Headline counts for the last `days` days. */
export async function getActivitySummary(
  userId: string,
  days = 30
): Promise<ActivitySummary> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const [ms, hc, qs, br, ach] = await Promise.all([
    db
      .select({ id: milestone.id })
      .from(milestone)
      .where(
        and(
          eq(milestone.userId, userId),
          eq(milestone.completed, true),
          gte(milestone.completedAt, start)
        )
      ),
    db
      .select({ id: habitCompletion.id })
      .from(habitCompletion)
      .where(
        and(
          eq(habitCompletion.userId, userId),
          gte(habitCompletion.completedAt, start)
        )
      ),
    db
      .select({ id: quest.id })
      .from(quest)
      .where(
        and(
          eq(quest.userId, userId),
          eq(quest.status, "completed"),
          gte(quest.completedAt, start)
        )
      ),
    db
      .select({ id: bookRead.id })
      .from(bookRead)
      .where(
        and(eq(bookRead.userId, userId), gte(bookRead.finishedAt, start))
      ),
    db
      .select({ id: achievement.id })
      .from(achievement)
      .where(
        and(
          eq(achievement.userId, userId),
          eq(achievement.isUnlocked, true),
          gte(achievement.unlockedAt, start)
        )
      ),
  ]);

  return {
    milestonesCompleted: ms.length,
    habitsLogged: hc.length,
    questsCompleted: qs.length,
    booksFinished: br.length,
    achievementsUnlocked: ach.length,
  };
}

function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
