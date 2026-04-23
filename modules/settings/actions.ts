"use server";

import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import type { FeatureKey } from "./features";
import { isSupportedCurrency } from "@/lib/money";

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

export async function updateCurrency(code: string) {
  const session = await requireSession();
  if (!isSupportedCurrency(code)) throw new Error("Unsupported currency");

  const existing = await db.query.userSettings.findFirst({
    where: (s, { eq: e }) => e(s.userId, session.user.id),
  });
  if (existing) {
    await db
      .update(userSettings)
      .set({ currency: code, updatedAt: new Date() })
      .where(eq(userSettings.userId, session.user.id));
  } else {
    await db.insert(userSettings).values({
      userId: session.user.id,
      currency: code,
    });
  }
  revalidatePath("/");
  revalidatePath("/account");
  revalidatePath("/finance");
  return { currency: code };
}

export async function updateYearlyBookGoal(value: number) {
  const session = await requireSession();
  const safe = Math.max(0, Math.round(Number.isFinite(value) ? value : 0));

  const existing = await db.query.userSettings.findFirst({
    where: (s, { eq: e }) => e(s.userId, session.user.id),
  });
  if (existing) {
    await db
      .update(userSettings)
      .set({ yearlyBookGoal: safe, updatedAt: new Date() })
      .where(eq(userSettings.userId, session.user.id));
  } else {
    await db
      .insert(userSettings)
      .values({ userId: session.user.id, yearlyBookGoal: safe });
  }

  revalidatePath("/books");
  revalidatePath("/");
  return { yearlyBookGoal: safe };
}

export async function setFeatureEnabled(key: FeatureKey, enabled: boolean) {
  const session = await requireSession();

  const existing = await db.query.userSettings.findFirst({
    where: (s, { eq: e }) => e(s.userId, session.user.id),
  });

  const nextFeatures: Record<string, boolean> = {
    ...(existing?.features ?? {}),
    [key]: enabled,
  };

  if (existing) {
    await db
      .update(userSettings)
      .set({ features: nextFeatures, updatedAt: new Date() })
      .where(eq(userSettings.userId, session.user.id));
  } else {
    await db.insert(userSettings).values({
      userId: session.user.id,
      features: nextFeatures,
    });
  }

  revalidatePath("/");
  revalidatePath("/account");
  return { key, enabled };
}
