import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getUserSettings(userId: string): Promise<{
  netWorth: number;
}> {
  const row = await db.query.userSettings.findFirst({
    where: (s, { eq: e }) => e(s.userId, userId),
  });
  return {
    netWorth: row?.netWorth ?? 0,
  };
}
