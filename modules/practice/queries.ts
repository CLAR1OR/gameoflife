import { db } from "@/lib/db";
import { practiceRoutine, practiceBlock, skill } from "@/lib/db/schema";
import { and, asc, eq, max } from "drizzle-orm";
import type { PracticeFocus } from "@/lib/practice-routines";

export type PracticeBlock = {
  id: string;
  routineId: string;
  name: string;
  focus: PracticeFocus;
  weight: number;
  minLevel: number;
  notes: string | null;
  sortOrder: number;
};

export type PracticeRoutine = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  blocks: PracticeBlock[];
  /** The user's highest subskill level in the category — used to gate blocks. */
  highestSubskillLevel: number;
};

/** All routines for a category, blocks attached, plus the user's highest
 * subskill level (so the UI can grey out blocks they haven't unlocked). */
export async function getRoutinesForCategory(
  userId: string,
  categoryId: string
): Promise<PracticeRoutine[]> {
  const routines = await db
    .select()
    .from(practiceRoutine)
    .where(
      and(
        eq(practiceRoutine.userId, userId),
        eq(practiceRoutine.categoryId, categoryId)
      )
    )
    .orderBy(asc(practiceRoutine.sortOrder), asc(practiceRoutine.createdAt));

  if (routines.length === 0) return [];

  const ids = routines.map((r) => r.id);
  const blocks = await db
    .select()
    .from(practiceBlock)
    .where(eq(practiceBlock.userId, userId))
    .orderBy(asc(practiceBlock.sortOrder), asc(practiceBlock.createdAt));

  const byRoutine = new Map<string, PracticeBlock[]>();
  for (const b of blocks) {
    if (!ids.includes(b.routineId)) continue;
    const list = byRoutine.get(b.routineId) ?? [];
    list.push({
      id: b.id,
      routineId: b.routineId,
      name: b.name,
      focus: b.focus as PracticeFocus,
      weight: b.weight,
      minLevel: b.minLevel,
      notes: b.notes,
      sortOrder: b.sortOrder,
    });
    byRoutine.set(b.routineId, list);
  }

  // Compute the highest subskill level once.
  const [{ lvl }] = await db
    .select({ lvl: max(skill.level) })
    .from(skill)
    .where(and(eq(skill.userId, userId), eq(skill.categoryId, categoryId)));
  const highestSubskillLevel = Number(lvl ?? 0);

  return routines.map((r) => ({
    id: r.id,
    categoryId: r.categoryId,
    name: r.name,
    description: r.description,
    blocks: byRoutine.get(r.id) ?? [],
    highestSubskillLevel,
  }));
}
