import { requireSession } from "@/lib/auth-server";
import {
  getAccounts,
  getCategorySuggestions,
  getTransactionsFiltered,
  type TransactionFilter,
} from "@/modules/finance/queries";
import { getUserSettings } from "@/modules/settings/queries";
import { FinanceTabs } from "@/components/finance/finance-tabs";
import { TransactionsFilterBar } from "@/components/finance/transactions-filter-bar";
import { TransactionList } from "@/components/finance/transaction-list";
import { formatMoney } from "@/lib/money";

function isValidIsoDate(s: string | undefined): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isValidType(
  s: string | undefined
): s is "income" | "expense" | "transfer" {
  return s === "income" || s === "expense" || s === "transfer";
}

function isValidSort(
  s: string | undefined
): s is "date_desc" | "date_asc" | "amount_desc" | "amount_asc" {
  return (
    s === "date_desc" ||
    s === "date_asc" ||
    s === "amount_desc" ||
    s === "amount_asc"
  );
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    account?: string;
    type?: string;
    category?: string;
    from?: string;
    to?: string;
    q?: string;
    sort?: string;
  }>;
}) {
  const session = await requireSession();
  const userId = session.user.id;

  const sp = await searchParams;

  const filter: TransactionFilter = {
    accountId: sp.account || null,
    type: isValidType(sp.type) ? sp.type : null,
    category: sp.category || null,
    fromDate: isValidIsoDate(sp.from) ? sp.from : null,
    toDate: isValidIsoDate(sp.to) ? sp.to : null,
    search: sp.q?.trim() || null,
    sort: isValidSort(sp.sort) ? sp.sort : "date_desc",
  };

  const [settings, accounts, categorySuggestions, result] = await Promise.all([
    getUserSettings(userId),
    getAccounts(userId),
    getCategorySuggestions(userId, 100),
    getTransactionsFiltered(userId, filter),
  ]);

  const currency = settings.currency;
  const net = result.incomeTotal - result.expenseTotal;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          📃 Transactions
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Full history. Filter by account, type, category, date, or text.
        </p>
      </div>

      <FinanceTabs />

      <TransactionsFilterBar
        accounts={accounts}
        categorySuggestions={categorySuggestions}
        initial={filter}
      />

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatBox label="Count" value={result.count.toString()} />
        <StatBox
          label="Income"
          value={`+${formatMoney(result.incomeTotal, currency)}`}
          accent="glow"
        />
        <StatBox
          label="Expenses"
          value={`−${formatMoney(result.expenseTotal, currency)}`}
          accent="red"
        />
        <StatBox
          label="Net"
          value={`${net >= 0 ? "+" : "−"}${formatMoney(Math.abs(net), currency)}`}
          accent={net >= 0 ? "glow" : "red"}
        />
      </section>

      <TransactionList
        transactions={result.rows}
        accounts={accounts}
        currency={currency}
      />
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "glow" | "red";
}) {
  const color =
    accent === "glow"
      ? "text-glow border-glow/20"
      : accent === "red"
        ? "text-destructive border-destructive/20"
        : "text-foreground border-border";
  return (
    <div className={`rounded-lg border bg-card p-2.5 ${color}`}>
      <div className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground">
        {label}
      </div>
      <div className="text-base font-mono mt-0.5 tabular-nums truncate">
        {value}
      </div>
    </div>
  );
}
