import { db } from "@/lib/db";
import { DEFAULT_CURRENCY } from "@/lib/money";

export type UserSettings = {
  netWorth: number;
  features: Record<string, boolean>;
  currency: string;
};

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const row = await db.query.userSettings.findFirst({
    where: (s, { eq: e }) => e(s.userId, userId),
  });
  return {
    netWorth: row?.netWorth ?? 0,
    features: row?.features ?? {},
    currency: row?.currency ?? DEFAULT_CURRENCY,
  };
}
