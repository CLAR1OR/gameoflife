"use server";

import { db } from "@/lib/db";
import {
  skillCategory,
  skill,
  book,
  quest,
  habit,
  achievement,
  place,
  friend,
} from "@/lib/db/schema";
import { and, eq, like, or } from "drizzle-orm";
import { requireSession } from "@/lib/auth-server";

export type SearchHit = {
  id: string;
  kind:
    | "category"
    | "subskill"
    | "book"
    | "quest"
    | "habit"
    | "achievement"
    | "place"
    | "friend";
  title: string;
  subtitle: string;
  icon: string;
  href: string;
  sortKey: number; // lower = better match
};

function lc(s: string): string {
  return s.toLowerCase();
}

function scoreMatch(haystack: string, needle: string): number {
  const h = lc(haystack);
  const n = lc(needle);
  if (h === n) return 0;
  if (h.startsWith(n)) return 1;
  const idx = h.indexOf(n);
  if (idx === 0) return 1;
  if (idx > 0) return 2 + idx; // later matches score worse
  return 100;
}

export async function globalSearch(rawQuery: string): Promise<SearchHit[]> {
  const session = await requireSession();
  const userId = session.user.id;

  const q = rawQuery.trim();
  if (q.length < 1) return [];

  const needle = `%${q}%`;
  const hits: SearchHit[] = [];

  // Skill categories
  const cats = await db
    .select()
    .from(skillCategory)
    .where(and(eq(skillCategory.userId, userId), like(skillCategory.name, needle)))
    .limit(10);
  for (const c of cats) {
    hits.push({
      id: c.id,
      kind: "category",
      title: c.name,
      subtitle: c.status === "active" ? "Active skill" : "Skill",
      icon: c.icon ?? "🌳",
      href: `/skills/${c.id}`,
      sortKey: scoreMatch(c.name, q),
    });
  }

  // Subskills — join for category path
  const subs = await db
    .select({
      id: skill.id,
      name: skill.name,
      categoryId: skillCategory.id,
      categoryName: skillCategory.name,
      categoryIcon: skillCategory.icon,
      level: skill.level,
    })
    .from(skill)
    .innerJoin(skillCategory, eq(skill.categoryId, skillCategory.id))
    .where(and(eq(skill.userId, userId), like(skill.name, needle)))
    .limit(10);
  for (const s of subs) {
    hits.push({
      id: s.id,
      kind: "subskill",
      title: s.name,
      subtitle: `${s.categoryName} · Lv ${s.level}`,
      icon: s.categoryIcon ?? "🎯",
      href: `/skills/${s.categoryId}`,
      sortKey: scoreMatch(s.name, q) + 0.5,
    });
  }

  // Books
  const books = await db
    .select()
    .from(book)
    .where(
      and(
        eq(book.userId, userId),
        or(like(book.title, needle), like(book.authors, needle))
      )
    )
    .limit(10);
  for (const b of books) {
    hits.push({
      id: b.id,
      kind: "book",
      title: b.title,
      subtitle: `${b.authors} · ${
        b.status === "read" ? "Read" : b.status === "reading" ? "Reading" : "Want"
      }`,
      icon: "📚",
      href: `/books/${b.id}`,
      sortKey: Math.min(scoreMatch(b.title, q), scoreMatch(b.authors, q) + 0.3),
    });
  }

  // Quests
  const quests = await db
    .select()
    .from(quest)
    .where(
      and(
        eq(quest.userId, userId),
        or(like(quest.name, needle), like(quest.description, needle))
      )
    )
    .limit(10);
  for (const x of quests) {
    const statusLabel =
      x.status === "active"
        ? x.type === "main"
          ? "Active main quest"
          : "Active side quest"
        : x.status === "completed"
          ? "Completed quest"
          : "Abandoned quest";
    hits.push({
      id: x.id,
      kind: "quest",
      title: x.name,
      subtitle: statusLabel,
      icon: x.icon,
      href: "/quests",
      sortKey: scoreMatch(x.name, q) + (x.status === "active" ? 0 : 0.4),
    });
  }

  // Habits
  const habits = await db
    .select()
    .from(habit)
    .where(and(eq(habit.userId, userId), like(habit.name, needle)))
    .limit(10);
  for (const h of habits) {
    const statusLabel = h.archived
      ? "Archived habit"
      : h.paused
        ? "Paused habit"
        : h.kind === "irregular"
          ? "Irregular habit"
          : "Daily habit";
    hits.push({
      id: h.id,
      kind: "habit",
      title: h.name,
      subtitle: statusLabel,
      icon: h.icon,
      href: "/habits",
      sortKey: scoreMatch(h.name, q) + (h.archived ? 0.5 : 0),
    });
  }

  // Achievements
  const achievements = await db
    .select()
    .from(achievement)
    .where(
      and(
        eq(achievement.userId, userId),
        or(
          like(achievement.name, needle),
          like(achievement.description, needle)
        )
      )
    )
    .limit(10);
  for (const a of achievements) {
    hits.push({
      id: a.id,
      kind: "achievement",
      title: a.name,
      subtitle: `${a.isUnlocked ? "✓ Unlocked" : "🔒 Locked"}${
        a.description ? " · " + a.description : ""
      }`,
      icon: a.icon,
      href: "/achievements",
      sortKey: scoreMatch(a.name, q) + (a.isUnlocked ? 0 : 0.3),
    });
  }

  // Places — name + countryName
  const places = await db
    .select()
    .from(place)
    .where(
      and(
        eq(place.userId, userId),
        or(like(place.name, needle), like(place.countryName, needle))
      )
    )
    .limit(10);
  for (const p of places) {
    hits.push({
      id: p.id,
      kind: "place",
      title: p.name,
      subtitle: [p.countryName, p.region].filter(Boolean).join(" · ") || p.type,
      icon: "🗺️",
      href: `/places/${p.id}`,
      sortKey: Math.min(
        scoreMatch(p.name, q),
        p.countryName ? scoreMatch(p.countryName, q) + 0.3 : 100
      ),
    });
  }

  // Friends — name, nickname, howWeMet
  const friends = await db
    .select()
    .from(friend)
    .where(
      and(
        eq(friend.userId, userId),
        eq(friend.archived, false),
        or(
          like(friend.name, needle),
          like(friend.nickname, needle),
          like(friend.howWeMet, needle)
        )
      )
    )
    .limit(10);
  for (const f of friends) {
    hits.push({
      id: f.id,
      kind: "friend",
      title: f.name,
      subtitle: f.nickname ? `“${f.nickname}”` : "Friend",
      icon: "🫂",
      href: `/friends/${f.id}`,
      sortKey: Math.min(
        scoreMatch(f.name, q),
        f.nickname ? scoreMatch(f.nickname, q) + 0.2 : 100
      ),
    });
  }

  hits.sort((a, b) => a.sortKey - b.sortKey);
  return hits.slice(0, 20);
}
