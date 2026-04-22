import { db } from "@/lib/db";
import {
  achievement,
  financeAccount,
  financeTransaction,
  financeRecurring,
} from "@/lib/db/schema";
import { and, count, eq, isNull } from "drizzle-orm";
import { getNetWorth } from "@/modules/finance/queries";

// Finance-specific trigger types (also declared in the schema enum)
const FINANCE_TRIGGER_TYPES = [
  "finance_accounts",
  "finance_transactions",
  "finance_net_worth",
  "finance_recurrings",
  "finance_checkins",
] as const;

type FinanceTriggerType = (typeof FINANCE_TRIGGER_TYPES)[number];

type FinanceAchievementSpec = {
  name: string;
  description: string;
  icon: string;
  triggerType: FinanceTriggerType;
  triggerCount: number;
  sortOrder: number;
};

// Net-worth thresholds are stored as signed integer CENTS to match the rest
// of the money pipeline. Comparisons use `getNetWorth(userId)` which also
// returns cents.
export const FINANCE_ACHIEVEMENTS: FinanceAchievementSpec[] = [
  // Accounts
  { name: "First Account", description: "Opened your first account", icon: "🏦", triggerType: "finance_accounts", triggerCount: 1, sortOrder: 10 },
  { name: "Diversified", description: "Track 3 separate accounts", icon: "🗂️", triggerType: "finance_accounts", triggerCount: 3, sortOrder: 11 },
  { name: "Portfolio", description: "Track 6 separate accounts", icon: "📚", triggerType: "finance_accounts", triggerCount: 6, sortOrder: 12 },

  // Transactions
  { name: "First Transaction", description: "Logged your first transaction", icon: "💸", triggerType: "finance_transactions", triggerCount: 1, sortOrder: 20 },
  { name: "Engaged", description: "Logged 100 transactions", icon: "📊", triggerType: "finance_transactions", triggerCount: 100, sortOrder: 21 },
  { name: "Obsessed", description: "Logged 1,000 transactions", icon: "📈", triggerType: "finance_transactions", triggerCount: 1000, sortOrder: 22 },

  // Net worth (threshold in cents → displayed as whole-unit figures)
  { name: "Four Figures", description: "Net worth reaches 1,000", icon: "💵", triggerType: "finance_net_worth", triggerCount: 100_000, sortOrder: 30 },
  { name: "Five Figures", description: "Net worth reaches 10,000", icon: "💰", triggerType: "finance_net_worth", triggerCount: 1_000_000, sortOrder: 31 },
  { name: "Six Figures", description: "Net worth reaches 100,000", icon: "🏆", triggerType: "finance_net_worth", triggerCount: 10_000_000, sortOrder: 32 },
  { name: "Millionaire", description: "Net worth reaches 1,000,000", icon: "👑", triggerType: "finance_net_worth", triggerCount: 100_000_000, sortOrder: 33 },

  // Recurring
  { name: "Set and Forget", description: "Set up your first recurring transaction", icon: "🔁", triggerType: "finance_recurrings", triggerCount: 1, sortOrder: 40 },
  { name: "Autopilot", description: "Run 5 active recurring transactions", icon: "🛩️", triggerType: "finance_recurrings", triggerCount: 5, sortOrder: 41 },

  // Check-ins (tracked via userSettings.generalXp, which is exactly the
  // lifetime count of finance check-ins)
  { name: "On Top of It", description: "Complete 10 account check-ins", icon: "✅", triggerType: "finance_checkins", triggerCount: 10, sortOrder: 50 },
  { name: "Disciplined", description: "Complete 50 account check-ins", icon: "🎯", triggerType: "finance_checkins", triggerCount: 50, sortOrder: 51 },
];

export async function ensureFinanceAchievementsSeeded(userId: string): Promise<void> {
  const existing = await db.query.achievement.findMany({
    where: (a, { and: an, eq: e, inArray: i }) =>
      an(
        e(a.userId, userId),
        i(a.triggerType, [...FINANCE_TRIGGER_TYPES])
      ),
    columns: { triggerType: true, triggerCount: true },
  });
  const existingKeys = new Set(
    existing.map((e) => `${e.triggerType}:${e.triggerCount}`)
  );
  const toInsert = FINANCE_ACHIEVEMENTS.filter(
    (a) => !existingKeys.has(`${a.triggerType}:${a.triggerCount}`)
  );
  if (toInsert.length === 0) return;

  await db.insert(achievement).values(
    toInsert.map((a) => ({
      userId,
      categoryId: null,
      source: "custom" as const,
      name: a.name,
      description: a.description,
      icon: a.icon,
      triggerType: a.triggerType,
      triggerCount: a.triggerCount,
      sortOrder: a.sortOrder,
    }))
  );
}

/**
 * Re-evaluate every finance achievement for this user. Unlocks those whose
 * trigger is now satisfied and un-unlocks any that no longer are (e.g., after
 * a reset or transaction delete). Returns names that newly unlocked.
 */
export async function checkFinanceAchievements(
  userId: string
): Promise<string[]> {
  await ensureFinanceAchievementsSeeded(userId);

  const [accountRows, txRows, recRows, netWorth, settings] = await Promise.all([
    db
      .select({ c: count() })
      .from(financeAccount)
      .where(
        and(eq(financeAccount.userId, userId), isNull(financeAccount.archivedAt))
      ),
    db
      .select({ c: count() })
      .from(financeTransaction)
      .where(eq(financeTransaction.userId, userId)),
    db
      .select({ c: count() })
      .from(financeRecurring)
      .where(
        and(eq(financeRecurring.userId, userId), eq(financeRecurring.active, true))
      ),
    getNetWorth(userId),
    db.query.userSettings.findFirst({
      where: (s, { eq: e }) => e(s.userId, userId),
    }),
  ]);

  const values: Record<FinanceTriggerType, number> = {
    finance_accounts: Number(accountRows[0]?.c ?? 0),
    finance_transactions: Number(txRows[0]?.c ?? 0),
    finance_recurrings: Number(recRows[0]?.c ?? 0),
    finance_net_worth: netWorth,
    finance_checkins: settings?.generalXp ?? 0,
  };

  const rows = await db.query.achievement.findMany({
    where: (a, { and: an, eq: e, inArray: i }) =>
      an(
        e(a.userId, userId),
        i(a.triggerType, [...FINANCE_TRIGGER_TYPES])
      ),
  });

  const newlyUnlocked: string[] = [];
  for (const a of rows) {
    if (a.triggerCount == null) continue;
    const value = values[a.triggerType as FinanceTriggerType] ?? 0;
    const shouldBeUnlocked = value >= a.triggerCount;
    if (shouldBeUnlocked && !a.isUnlocked) {
      await db
        .update(achievement)
        .set({ isUnlocked: true, unlockedAt: new Date() })
        .where(eq(achievement.id, a.id));
      newlyUnlocked.push(a.name);
    } else if (!shouldBeUnlocked && a.isUnlocked) {
      await db
        .update(achievement)
        .set({ isUnlocked: false, unlockedAt: null })
        .where(eq(achievement.id, a.id));
    }
  }
  return newlyUnlocked;
}
