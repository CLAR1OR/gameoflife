import { db } from "@/lib/db";
import {
  financeTransaction,
  financeAccount,
  financeRecurring,
  financeNetWorthSnapshot,
} from "@/lib/db/schema";
import { and, asc, desc, eq, gte, isNull, lte, sum } from "drizzle-orm";
import { isAccountStale } from "./shared";

export type AccountType =
  | "cash"
  | "bank"
  | "investment"
  | "crypto"
  | "debt"
  | "other";

export type FinanceAccount = {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  icon: string | null;
  sortOrder: number;
  archivedAt: Date | null;
  lastCheckedAt: Date | null;
};

// Re-export client-safe helpers so server callers can keep a single import.
export { CHECKIN_STALE_DAYS, isAccountStale } from "./shared";

export async function getAccounts(userId: string): Promise<FinanceAccount[]> {
  const rows = await db
    .select()
    .from(financeAccount)
    .where(and(eq(financeAccount.userId, userId), isNull(financeAccount.archivedAt)))
    .orderBy(asc(financeAccount.sortOrder), asc(financeAccount.createdAt));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    balance: r.balance,
    icon: r.icon,
    sortOrder: r.sortOrder,
    archivedAt: r.archivedAt,
    lastCheckedAt: r.lastCheckedAt,
  }));
}

export async function getStaleAccountCount(userId: string): Promise<number> {
  const accounts = await getAccounts(userId);
  return accounts.filter((a) => isAccountStale(a)).length;
}

/** Cheap-ish summary for the dashboard badge: total + stale count in one pass. */
export async function getAccountAttention(userId: string): Promise<{
  totalAccounts: number;
  staleAccountCount: number;
}> {
  const accounts = await getAccounts(userId);
  return {
    totalAccounts: accounts.length,
    staleAccountCount: accounts.filter((a) => isAccountStale(a)).length,
  };
}

export async function getNetWorth(userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sum(financeAccount.balance) })
    .from(financeAccount)
    .where(and(eq(financeAccount.userId, userId), isNull(financeAccount.archivedAt)));
  const accountSum = Number(row?.total ?? 0);
  if (accountSum !== 0) return accountSum;

  // Fallback: legacy manual net worth if no accounts exist yet
  const accountCount = await db
    .select({ id: financeAccount.id })
    .from(financeAccount)
    .where(and(eq(financeAccount.userId, userId), isNull(financeAccount.archivedAt)))
    .limit(1);
  if (accountCount.length === 0) {
    const settings = await db.query.userSettings.findFirst({
      where: (s, { eq: e }) => e(s.userId, userId),
    });
    return settings?.netWorth ?? 0;
  }
  return accountSum;
}

export type TransactionType = "income" | "expense" | "transfer";

export type FinanceTransaction = {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string | null;
  occurredOn: string;
  accountId: string | null;
  transferToAccountId: string | null;
  createdAt: Date;
};

export async function getRecentTransactions(
  userId: string,
  limit = 50
): Promise<FinanceTransaction[]> {
  const rows = await db
    .select()
    .from(financeTransaction)
    .where(eq(financeTransaction.userId, userId))
    .orderBy(desc(financeTransaction.occurredOn), desc(financeTransaction.createdAt))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    amount: r.amount,
    category: r.category,
    note: r.note,
    occurredOn: r.occurredOn,
    accountId: r.accountId,
    transferToAccountId: r.transferToAccountId,
    createdAt: r.createdAt,
  }));
}

export type MonthSummary = {
  yearMonth: string;
  income: number;
  expense: number;
  net: number;
  count: number;
};

export async function getMonthSummary(
  userId: string,
  yearMonth: string
): Promise<MonthSummary> {
  const start = `${yearMonth}-01`;
  const [y, m] = yearMonth.split("-").map(Number);
  const nextYm = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const endExclusive = `${nextYm}-01`;

  const rows = await db
    .select()
    .from(financeTransaction)
    .where(
      and(
        eq(financeTransaction.userId, userId),
        gte(financeTransaction.occurredOn, start),
        lte(financeTransaction.occurredOn, endExclusive)
      )
    );

  let income = 0;
  let expense = 0;
  let counted = 0;
  for (const r of rows) {
    if (r.occurredOn >= endExclusive) continue;
    if (r.type === "income") income += r.amount;
    else if (r.type === "expense") expense += r.amount;
    // transfers don't affect income/expense totals
    counted += 1;
  }

  return {
    yearMonth,
    income,
    expense,
    net: income - expense,
    count: counted,
  };
}

export async function getCategorySuggestions(
  userId: string,
  limit = 20
): Promise<string[]> {
  const rows = await db
    .selectDistinct({ category: financeTransaction.category })
    .from(financeTransaction)
    .where(eq(financeTransaction.userId, userId))
    .limit(limit);
  return rows.map((r) => r.category).filter(Boolean);
}

export type CategoryTotal = {
  category: string;
  total: number;
  count: number;
};

export async function getCategoryBreakdown(
  userId: string,
  yearMonth: string,
  kind: "expense" | "income" = "expense"
): Promise<CategoryTotal[]> {
  const start = `${yearMonth}-01`;
  const [y, m] = yearMonth.split("-").map(Number);
  const nextYm = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const endExclusive = `${nextYm}-01`;

  const rows = await db
    .select({
      category: financeTransaction.category,
      amount: financeTransaction.amount,
    })
    .from(financeTransaction)
    .where(
      and(
        eq(financeTransaction.userId, userId),
        eq(financeTransaction.type, kind),
        gte(financeTransaction.occurredOn, start),
        lte(financeTransaction.occurredOn, endExclusive)
      )
    );

  const byCategory = new Map<string, { total: number; count: number }>();
  for (const r of rows) {
    const existing = byCategory.get(r.category) ?? { total: 0, count: 0 };
    existing.total += r.amount;
    existing.count += 1;
    byCategory.set(r.category, existing);
  }

  return Array.from(byCategory.entries())
    .map(([category, v]) => ({ category, total: v.total, count: v.count }))
    .sort((a, b) => b.total - a.total);
}

export type FinanceRecurring = {
  id: string;
  accountId: string | null;
  type: "income" | "expense";
  amount: number;
  category: string;
  note: string | null;
  cadence: "monthly" | "yearly";
  nextDueOn: string;
  active: boolean;
};

export async function getRecurrings(
  userId: string
): Promise<FinanceRecurring[]> {
  const rows = await db
    .select()
    .from(financeRecurring)
    .where(eq(financeRecurring.userId, userId))
    .orderBy(asc(financeRecurring.nextDueOn));
  return rows.map((r) => ({
    id: r.id,
    accountId: r.accountId,
    type: r.type,
    amount: r.amount,
    category: r.category,
    note: r.note,
    cadence: r.cadence,
    nextDueOn: r.nextDueOn,
    active: r.active,
  }));
}

export type NetWorthSnapshot = {
  takenOn: string;
  netWorth: number;
};

export async function getNetWorthSnapshots(
  userId: string,
  days = 30
): Promise<NetWorthSnapshot[]> {
  const now = new Date();
  now.setDate(now.getDate() - days);
  const cutoff = now.toISOString().slice(0, 10);
  const rows = await db
    .select({ takenOn: financeNetWorthSnapshot.takenOn, netWorth: financeNetWorthSnapshot.netWorth })
    .from(financeNetWorthSnapshot)
    .where(
      and(
        eq(financeNetWorthSnapshot.userId, userId),
        gte(financeNetWorthSnapshot.takenOn, cutoff)
      )
    )
    .orderBy(asc(financeNetWorthSnapshot.takenOn));
  return rows;
}
