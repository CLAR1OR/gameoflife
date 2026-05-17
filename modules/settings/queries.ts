import { db } from "@/lib/db";
import { DEFAULT_CURRENCY } from "@/lib/money";
import { DEFAULT_THEME, type ThemeId } from "@/lib/themes";

export type UserSettings = {
  netWorth: number;
  features: Record<string, boolean>;
  currency: string;
  yearlyBookGoal: number;
  theme: ThemeId;
  /** Null = user hasn't completed the welcome wizard yet. */
  onboardedAt: Date | null;
  /** Subdirectory name under /public/skill-covers/ used as the active
   *  source of skill-card cover images. */
  skillCoverPack: string;
};

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const row = await db.query.userSettings.findFirst({
    where: (s, { eq: e }) => e(s.userId, userId),
  });
  return {
    netWorth: row?.netWorth ?? 0,
    features: row?.features ?? {},
    currency: row?.currency ?? DEFAULT_CURRENCY,
    yearlyBookGoal: row?.yearlyBookGoal ?? 0,
    theme: (row?.theme as ThemeId | undefined) ?? DEFAULT_THEME,
    onboardedAt: row?.onboardedAt ?? null,
    skillCoverPack: row?.skillCoverPack ?? "default",
  };
}
