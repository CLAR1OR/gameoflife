import { db } from "@/lib/db";
import {
  financeTransaction,
  financeAccount,
  financeRecurring,
  financeNetWorthSnapshot,
  financeBudget,
} from "@/lib/db/schema";
import { and, asc, desc, eq, gte, isNull, like, lte, or, sum } from "drizzle-orm";
import { isAccountStale } from "./shared";
import type {
  AccountType,
  FinanceAccount,
  TransactionType,
  FinanceTransaction,
  MonthSummary,
  CategoryTotal,
  FinanceRecurring,
  NetWorthSnapshot,
  FinanceBudget,
  TransactionFilter,
} from "./types";
export type {
  AccountType,
  FinanceAccount,
  TransactionType,
  FinanceTransaction,
  MonthSummary,
  CategoryTotal,
  FinanceRecurring,
  NetWorthSnapshot,
  FinanceBudget,
  TransactionFilter,
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

// =====================
// BUDGETS
// =====================

export async function getBudgets(userId: string): Promise<FinanceBudget[]> {
  const rows = await db
    .select({
      id: financeBudget.id,
      category: financeBudget.category,
      targetCents: financeBudget.targetCents,
    })
    .from(financeBudget)
    .where(eq(financeBudget.userId, userId))
    .orderBy(asc(financeBudget.category));
  return rows;
}

// =====================
// FILTERED TRANSACTIONS (history page)
// =====================

/** Cheap totals for the filtered set — count, income sum, expense sum. */
export type FilteredTransactionsResult = {
  rows: FinanceTransaction[];
  count: number;
  incomeTotal: number;
  expenseTotal: number;
  transferTotal: number;
};

export async function getTransactionsFiltered(
  userId: string,
  filter: TransactionFilter
): Promise<FilteredTransactionsResult> {
  const clauses = [eq(financeTransaction.userId, userId)];
  if (filter.accountId) {
    // A transaction can be on either side of a transfer — count it if
    // either accountId or transferToAccountId matches.
    const accountClause = or(
      eq(financeTransaction.accountId, filter.accountId),
      eq(financeTransaction.transferToAccountId, filter.accountId)
    );
    if (accountClause) clauses.push(accountClause);
  }
  if (filter.type) clauses.push(eq(financeTransaction.type, filter.type));
  if (filter.category)
    clauses.push(eq(financeTransaction.category, filter.category));
  if (filter.fromDate)
    clauses.push(gte(financeTransaction.occurredOn, filter.fromDate));
  if (filter.toDate)
    clauses.push(lte(financeTransaction.occurredOn, filter.toDate));
  if (filter.search) {
    const needle = `%${filter.search.toLowerCase()}%`;
    const searchClause = or(
      like(financeTransaction.note, needle),
      like(financeTransaction.category, needle)
    );
    if (searchClause) clauses.push(searchClause);
  }

  const orderBy =
    filter.sort === "date_asc"
      ? [asc(financeTransaction.occurredOn), asc(financeTransaction.createdAt)]
      : filter.sort === "amount_desc"
        ? [desc(financeTransaction.amount), desc(financeTransaction.occurredOn)]
        : filter.sort === "amount_asc"
          ? [asc(financeTransaction.amount), desc(financeTransaction.occurredOn)]
          : [
              desc(financeTransaction.occurredOn),
              desc(financeTransaction.createdAt),
            ];

  const rows = await db
    .select()
    .from(financeTransaction)
    .where(and(...clauses))
    .orderBy(...orderBy);

  let incomeTotal = 0;
  let expenseTotal = 0;
  let transferTotal = 0;
  for (const r of rows) {
    if (r.type === "income") incomeTotal += r.amount;
    else if (r.type === "expense") expenseTotal += r.amount;
    else if (r.type === "transfer") transferTotal += r.amount;
  }

  return {
    rows: rows.map((r) => ({
      id: r.id,
      type: r.type,
      amount: r.amount,
      category: r.category,
      note: r.note,
      occurredOn: r.occurredOn,
      accountId: r.accountId,
      transferToAccountId: r.transferToAccountId,
      createdAt: r.createdAt,
    })),
    count: rows.length,
    incomeTotal,
    expenseTotal,
    transferTotal,
  };
}
