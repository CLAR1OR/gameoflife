"use server";

import { db } from "@/lib/db";
import {
  practiceRoutine,
  practiceBlock,
  skillCategory,
} from "@/lib/db/schema";
import { and, count, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { getPracticeRoutinesForTemplate } from "@/lib/practice-routines";
import type { PracticeFocus } from "@/lib/practice-routines";

async function ownsCategory(userId: string, categoryId: string) {
  const cat = await db.query.skillCategory.findFirst({
    where: (c, { and: a, eq: e }) =>
      a(e(c.id, categoryId), e(c.userId, userId)),
  });
  if (!cat) throw new Error("Skill not found");
  return cat;
}

async function ownsRoutine(userId: string, routineId: string) {
  const r = await db.query.practiceRoutine.findFirst({
    where: (row, { and: a, eq: e }) =>
      a(e(row.id, routineId), e(row.userId, userId)),
  });
  if (!r) throw new Error("Routine not found");
  return r;
}

export async function createRoutine(data: {
  categoryId: string;
  name: string;
  description?: string;
}) {
  const session = await requireSession();
  await ownsCategory(session.user.id, data.categoryId);

  const peers = await db.query.practiceRoutine.findMany({
    where: (r, { and: a, eq: e }) =>
      a(e(r.userId, session.user.id), e(r.categoryId, data.categoryId)),
  });

  const [row] = await db
    .insert(practiceRoutine)
    .values({
      userId: session.user.id,
      categoryId: data.categoryId,
      name: data.name.trim() || "New routine",
      description: data.description?.trim() || null,
      sortOrder: peers.length,
    })
    .returning();

  revalidatePath(`/skills/${data.categoryId}`);
  return row;
}

export async function updateRoutine(
  id: string,
  data: { name?: string; description?: string | null }
) {
  const session = await requireSession();
  const r = await ownsRoutine(session.user.id, id);

  const updates: Partial<{ name: string; description: string | null }> = {};
  if (data.name !== undefined) updates.name = data.name.trim() || r.name;
  if (data.description !== undefined)
    updates.description = data.description?.trim() ? data.description.trim() : null;

  await db
    .update(practiceRoutine)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(practiceRoutine.id, id));

  revalidatePath(`/skills/${r.categoryId}`);
}

export async function deleteRoutine(id: string) {
  const session = await requireSession();
  const r = await ownsRoutine(session.user.id, id);
  await db.delete(practiceRoutine).where(eq(practiceRoutine.id, id));
  revalidatePath(`/skills/${r.categoryId}`);
}

export async function addBlock(
  routineId: string,
  data: {
    name: string;
    focus?: PracticeFocus;
    weight?: number;
    minLevel?: number;
    notes?: string | null;
  }
) {
  const session = await requireSession();
  const r = await ownsRoutine(session.user.id, routineId);

  const [{ c }] = await db
    .select({ c: count() })
    .from(practiceBlock)
    .where(eq(practiceBlock.routineId, routineId));

  await db.insert(practiceBlock).values({
    routineId,
    userId: session.user.id,
    name: data.name.trim() || "New block",
    focus: data.focus ?? "general",
    weight: Math.max(1, Math.round(data.weight ?? 10)),
    minLevel: Math.max(1, Math.min(6, Math.round(data.minLevel ?? 1))),
    notes: data.notes?.trim() || null,
    sortOrder: Number(c),
  });

  revalidatePath(`/skills/${r.categoryId}`);
}

export async function updateBlock(
  blockId: string,
  data: {
    name?: string;
    focus?: PracticeFocus;
    weight?: number;
    minLevel?: number;
    notes?: string | null;
  }
) {
  const session = await requireSession();
  const block = await db.query.practiceBlock.findFirst({
    where: (b, { and: a, eq: e }) =>
      a(e(b.id, blockId), e(b.userId, session.user.id)),
  });
  if (!block) throw new Error("Block not found");

  const r = await ownsRoutine(session.user.id, block.routineId);

  const updates: Partial<{
    name: string;
    focus: PracticeFocus;
    weight: number;
    minLevel: number;
    notes: string | null;
  }> = {};
  if (data.name !== undefined) updates.name = data.name.trim() || block.name;
  if (data.focus !== undefined) updates.focus = data.focus;
  if (data.weight !== undefined)
    updates.weight = Math.max(1, Math.round(data.weight));
  if (data.minLevel !== undefined)
    updates.minLevel = Math.max(1, Math.min(6, Math.round(data.minLevel)));
  if (data.notes !== undefined)
    updates.notes = data.notes?.trim() ? data.notes.trim() : null;

  await db
    .update(practiceBlock)
    .set(updates)
    .where(eq(practiceBlock.id, blockId));

  // Bump routine updatedAt for activity tracking
  await db
    .update(practiceRoutine)
    .set({ updatedAt: new Date() })
    .where(eq(practiceRoutine.id, r.id));

  revalidatePath(`/skills/${r.categoryId}`);
}

export async function deleteBlock(blockId: string) {
  const session = await requireSession();
  const block = await db.query.practiceBlock.findFirst({
    where: (b, { and: a, eq: e }) =>
      a(e(b.id, blockId), e(b.userId, session.user.id)),
  });
  if (!block) throw new Error("Block not found");
  const r = await ownsRoutine(session.user.id, block.routineId);

  await db.delete(practiceBlock).where(eq(practiceBlock.id, blockId));
  revalidatePath(`/skills/${r.categoryId}`);
}

export async function moveBlock(blockId: string, direction: "up" | "down") {
  const session = await requireSession();
  const block = await db.query.practiceBlock.findFirst({
    where: (b, { and: a, eq: e }) =>
      a(e(b.id, blockId), e(b.userId, session.user.id)),
  });
  if (!block) throw new Error("Block not found");
  const r = await ownsRoutine(session.user.id, block.routineId);

  const peers = await db.query.practiceBlock.findMany({
    where: (b, { eq: e }) => e(b.routineId, block.routineId),
    orderBy: (b, { asc: a }) => [a(b.sortOrder), a(b.createdAt)],
  });
  const idx = peers.findIndex((p) => p.id === blockId);
  if (idx < 0) return;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= peers.length) return;
  const swap = peers[swapIdx];

  await db
    .update(practiceBlock)
    .set({ sortOrder: swap.sortOrder })
    .where(eq(practiceBlock.id, blockId));
  await db
    .update(practiceBlock)
    .set({ sortOrder: block.sortOrder })
    .where(eq(practiceBlock.id, swap.id));

  revalidatePath(`/skills/${r.categoryId}`);
}

/** Reset a routine back to its template defaults (drops all blocks, then
 * re-clones from the seed). Only works for routines that originally came
 * from a template. */
export async function resetRoutineToTemplate(routineId: string) {
  const session = await requireSession();
  const r = await ownsRoutine(session.user.id, routineId);
  if (!r.templateId) throw new Error("This routine has no template to reset to");

  // Find the corresponding category to learn the template id of the skill,
  // then look up the routine seed by *category template id + routine name*.
  const cat = await db.query.skillCategory.findFirst({
    where: (c, { eq: e }) => e(c.id, r.categoryId),
  });
  if (!cat?.templateId) throw new Error("Skill has no template");
  const seeds = getPracticeRoutinesForTemplate(cat.templateId);
  const seed = seeds.find((s) => s.name === r.templateId);
  if (!seed) throw new Error("Template routine not found");

  await db.delete(practiceBlock).where(eq(practiceBlock.routineId, routineId));
  await db.insert(practiceBlock).values(
    seed.blocks.map((b, i) => ({
      routineId,
      userId: session.user.id,
      name: b.name,
      focus: b.focus,
      weight: b.weight,
      minLevel: b.minLevel,
      notes: b.notes,
      sortOrder: i,
    }))
  );
  await db
    .update(practiceRoutine)
    .set({
      name: seed.name,
      description: seed.description,
      updatedAt: new Date(),
    })
    .where(eq(practiceRoutine.id, routineId));

  revalidatePath(`/skills/${r.categoryId}`);
}

/**
 * Seed the user's category with the template's default routines.
 * Called from `activateTemplate`. Idempotent — skips if routines already
 * exist for the category.
 */
export async function seedRoutinesForCategory(
  userId: string,
  categoryId: string,
  templateId: string
) {
  const seeds = getPracticeRoutinesForTemplate(templateId);
  if (seeds.length === 0) return;

  const existing = await db
    .select({ id: practiceRoutine.id })
    .from(practiceRoutine)
    .where(
      and(
        eq(practiceRoutine.userId, userId),
        eq(practiceRoutine.categoryId, categoryId)
      )
    );
  if (existing.length > 0) return;

  for (let i = 0; i < seeds.length; i++) {
    const seed = seeds[i];
    const [routine] = await db
      .insert(practiceRoutine)
      .values({
        userId,
        categoryId,
        // Use the seed's name as the templateId so resetRoutineToTemplate
        // can find the original blueprint later.
        templateId: seed.name,
        name: seed.name,
        description: seed.description,
        sortOrder: i,
      })
      .returning();
    if (seed.blocks.length === 0) continue;
    await db.insert(practiceBlock).values(
      seed.blocks.map((b, idx) => ({
        routineId: routine.id,
        userId,
        name: b.name,
        focus: b.focus,
        weight: b.weight,
        minLevel: b.minLevel,
        notes: b.notes,
        sortOrder: idx,
      }))
    );
  }

  // Best-effort revalidation; the caller (activateTemplate) revalidates too.
  revalidatePath(`/skills/${categoryId}`);
  // Avoid the unused-import lint warning for skillCategory.
  void skillCategory;
}
