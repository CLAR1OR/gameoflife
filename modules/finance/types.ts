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

export type MonthSummary = {
  yearMonth: string;
  income: number;
  expense: number;
  net: number;
  count: number;
};

export type CategoryTotal = {
  category: string;
  total: number;
  count: number;
};

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

export type NetWorthSnapshot = {
  takenOn: string;
  netWorth: number;
};

export type FinanceBudget = {
  id: string;
  category: string;
  /** Monthly spending limit, in currency cents. */
  targetCents: number;
};

/** Filter shape for the dedicated transactions history page. */
export type TransactionFilter = {
  /** Restrict to a single account (or transferToAccount). */
  accountId?: string | null;
  /** Restrict to a transaction type. */
  type?: TransactionType | null;
  /** Restrict to a specific category. */
  category?: string | null;
  /** Inclusive lower bound YYYY-MM-DD. */
  fromDate?: string | null;
  /** Inclusive upper bound YYYY-MM-DD. */
  toDate?: string | null;
  /** Case-insensitive match on note + category. */
  search?: string | null;
  /** Sort order. */
  sort?: "date_desc" | "date_asc" | "amount_desc" | "amount_asc";
};
