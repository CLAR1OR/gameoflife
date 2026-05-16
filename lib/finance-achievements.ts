import { db } from "@/lib/db";
import {
  financeAccount,
  financeTransaction,
  financeRecurring,
} from "@/lib/db/schema";
import { and, count, eq, isNull } from "drizzle-orm";
import { getNetWorth } from "@/modules/finance/queries";
import {
  seedAchievements,
  evaluateAchievements,
  type AchievementSpec,
} from "./achievement-engine";

const FINANCE_TRIGGERS = [
  "finance_accounts",
  "finance_transactions",
  "finance_net_worth",
  "finance_recurrings",
  "finance_checkins",
] as const;

type FinanceTrigger = (typeof FINANCE_TRIGGERS)[number];

// Net-worth thresholds are stored as signed integer CENTS to match the rest
// of the money pipeline. Comparisons use `getNetWorth(userId)` which also
// returns cents.
export const FINANCE_ACHIEVEMENTS: AchievementSpec<FinanceTrigger>[] = [
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

export async function ensureFinanceAchievementsSeeded(
  userId: string
): Promise<void> {
  await seedAchievements(userId, FINANCE_TRIGGERS, FINANCE_ACHIEVEMENTS);
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
        and(
          eq(financeAccount.userId, userId),
          isNull(financeAccount.archivedAt)
        )
      ),
    db
      .select({ c: count() })
      .from(financeTransaction)
      .where(eq(financeTransaction.userId, userId)),
    db
      .select({ c: count() })
      .from(financeRecurring)
      .where(
        and(
          eq(financeRecurring.userId, userId),
          eq(financeRecurring.active, true)
        )
      ),
    getNetWorth(userId),
    db.query.userSettings.findFirst({
      where: (s, { eq: e }) => e(s.userId, userId),
    }),
  ]);

  return evaluateAchievements(userId, FINANCE_TRIGGERS, {
    finance_accounts: Number(accountRows[0]?.c ?? 0),
    finance_transactions: Number(txRows[0]?.c ?? 0),
    finance_recurrings: Number(recRows[0]?.c ?? 0),
    finance_net_worth: netWorth,
    finance_checkins: settings?.generalXp ?? 0,
  });
}
