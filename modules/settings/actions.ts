"use server";

import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";

export async function updateNetWorth(value: number) {
  const session = await requireSession();
  const safe = Math.round(Number.isFinite(value) ? value : 0);

  const existing = await db.query.userSettings.findFirst({
    where: (s, { eq: e }) => e(s.userId, session.user.id),
  });

  if (existing) {
    await db
      .update(userSettings)
      .set({ netWorth: safe, updatedAt: new Date() })
      .where(eq(userSettings.userId, session.user.id));
  } else {
    await db
      .insert(userSettings)
      .values({ userId: session.user.id, netWorth: safe });
  }

  revalidatePath("/");
  return { netWorth: safe };
}
