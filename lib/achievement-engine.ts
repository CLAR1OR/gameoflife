import { db } from "@/lib/db";
import { achievement } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Generic seed + evaluate primitives for the achievement system.
 *
 * Each "module" of achievements (places, friends, finance, ...) owns a
 * fixed list of `AchievementSpec`s keyed by `triggerType`. Seeding inserts
 * any specs that aren't already in the user's table; evaluation reads the
 * user's current stats and flips `isUnlocked` accordingly.
 *
 * The generic parameter `T` is the union of trigger types the caller
 * cares about, so the `stats` map is type-checked.
 */
export type AchievementSpec<T extends string> = {
  name: string;
  description: string;
  icon: string;
  triggerType: T;
  triggerCount: number;
  sortOrder?: number;
};

export async function seedAchievements<T extends string>(
  userId: string,
  triggerTypes: readonly T[],
  specs: readonly AchievementSpec<T>[]
): Promise<void> {
  const existing = await db
    .select({
      triggerType: achievement.triggerType,
      triggerCount: achievement.triggerCount,
    })
    .from(achievement)
    .where(
      and(
        eq(achievement.userId, userId),
        // Cast: drizzle's inArray is strict on the column's enum literal
        // union; the engine is generic so we widen to any-array. The runtime
        // values still come from the schema's enum (specs are typed by T).
        inArray(
          achievement.triggerType,
          triggerTypes as unknown as readonly (typeof achievement.triggerType._.data)[]
        )
      )
    );
  const existingKeys = new Set(
    existing.map((e) => `${e.triggerType}:${e.triggerCount}`)
  );
  const toInsert = specs.filter(
    (s) => !existingKeys.has(`${s.triggerType}:${s.triggerCount}`)
  );
  if (toInsert.length === 0) return;
  type TriggerType = typeof achievement.triggerType._.data;
  await db.insert(achievement).values(
    toInsert.map((s) => ({
      userId,
      categoryId: null,
      source: "custom" as const,
      name: s.name,
      description: s.description,
      icon: s.icon,
      triggerType: s.triggerType as TriggerType,
      triggerCount: s.triggerCount,
      sortOrder: s.sortOrder ?? 0,
    }))
  );
}

/**
 * Evaluate every achievement in `triggerTypes` for `userId`, flipping
 * isUnlocked based on `stats`. Returns the names that newly unlocked.
 */
export async function evaluateAchievements<T extends string>(
  userId: string,
  triggerTypes: readonly T[],
  stats: Record<T, number>
): Promise<string[]> {
  const rows = await db
    .select()
    .from(achievement)
    .where(
      and(
        eq(achievement.userId, userId),
        // Cast: drizzle's inArray is strict on the column's enum literal
        // union; the engine is generic so we widen to any-array. The runtime
        // values still come from the schema's enum (specs are typed by T).
        inArray(
          achievement.triggerType,
          triggerTypes as unknown as readonly (typeof achievement.triggerType._.data)[]
        )
      )
    );

  const newlyUnlocked: string[] = [];
  for (const a of rows) {
    if (a.triggerCount == null) continue;
    const value = stats[a.triggerType as T] ?? 0;
    const should = value >= a.triggerCount;
    if (should && !a.isUnlocked) {
      await db
        .update(achievement)
        .set({ isUnlocked: true, unlockedAt: new Date() })
        .where(eq(achievement.id, a.id));
      newlyUnlocked.push(a.name);
    } else if (!should && a.isUnlocked) {
      await db
        .update(achievement)
        .set({ isUnlocked: false, unlockedAt: null })
        .where(eq(achievement.id, a.id));
    }
  }
  if (newlyUnlocked.length > 0) revalidatePath("/achievements");
  return newlyUnlocked;
}
