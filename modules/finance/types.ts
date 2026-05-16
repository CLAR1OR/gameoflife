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
