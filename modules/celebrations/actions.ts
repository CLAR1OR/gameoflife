"use server";

import { db } from "@/lib/db";
import { achievement } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { requireSession } from "@/lib/auth-server";

export type CelebrationPayload = {
  name: string;
  icon: string;
  description: string | null;
  triggerType: string;
};

/** Fetch full achievement records for the given names owned by the session
 * user. Keeps the client-side celebrate() API tiny (just pass names back
 * from the existing action responses) while letting the modal render icons
 * and descriptions. */
export async function getAchievementsForCelebration(
  names: string[]
): Promise<CelebrationPayload[]> {
  if (names.length === 0) return [];
  const session = await requireSession();
  const rows = await db
    .select()
    .from(achievement)
    .where(
      and(
        eq(achievement.userId, session.user.id),
        inArray(achievement.name, names)
      )
    );
  const byName = new Map(rows.map((r) => [r.name, r]));
  return names
    .map((n) => byName.get(n))
    .filter((r): r is (typeof rows)[number] => !!r)
    .map((r) => ({
      name: r.name,
      icon: r.icon,
      description: r.description,
      triggerType: r.triggerType,
    }));
}
