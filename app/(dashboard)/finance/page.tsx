import { requireSession } from "@/lib/auth-server";
import {
  getRecentTransactions,
  getMonthSummary,
  getCategorySuggestions,
  getAccounts,
  getNetWorth,
  getRecurrings,
  getNetWorthSnapshots,
  getCategoryBreakdown,
} from "@/modules/finance/queries";
import {
  processDueRecurrings,
  recordNetWorthSnapshotIfNeeded,
} from "@/modules/finance/actions";
import { getUserSettings } from "@/modules/settings/queries";
import { todayISO } from "@/lib/date";
import { formatMoney } from "@/lib/money";
import { AccountsSection } from "@/components/finance/accounts-section";
import { RecurringSection } from "@/components/finance/recurring-section";
import { NetWorthSparkline } from "@/components/finance/net-worth-sparkline";
import { TransactionForm } from "@/components/finance/transaction-form";
import { TransactionList } from "@/components/finance/transaction-list";
import { CategoryBreakdown } from "@/components/finance/category-breakdown";

function currentYearMonth(iso: string): string {
  return iso.slice(0, 7);
}

function formatMonthLabel(yearMonth: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export default async function FinancePage() {
  const session = await requireSession();
  const userId = session.user.id;
  const today = todayISO();
  const yearMonth = currentYearMonth(today);

  // Process anything due first — these run every visit and are idempotent.
  await processDueRecurrings(userId, today);
  await recordNetWorthSnapshotIfNeeded(userId, today);

  const [
    settings,
    accounts,
    netWorth,
    summary,
    transactions,
    categorySuggestions,
    recurrings,
    snapshots,
    expenseBreakdown,
    incomeBreakdown,
  ] = await Promise.all([
    getUserSettings(userId),
    getAccounts(userId),
    getNetWorth(userId),
    getMonthSummary(userId, yearMonth),
    getRecentTransactions(userId, 50),
    getCategorySuggestions(userId),
    getRecurrings(userId),
    getNetWorthSnapshots(userId, 30),
    getCategoryBreakdown(userId, yearMonth, "expense"),
    getCategoryBreakdown(userId, yearMonth, "income"),
  ]);

  const currency = settings.currency;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-mono tracking-tight">
          💰 Finance
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Accounts, transactions, and recurring cash flow.
        </p>
      </div>

      <AccountsSection
        accounts={accounts}
        totalNetWorth={netWorth}
        currency={currency}
      />

      <NetWorthSparkline
        snapshots={snapshots}
        current={netWorth}
        currency={currency}
      />

      <section>
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
          {formatMonthLabel(yearMonth)}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SummaryCard
            label="Income"
            value={summary.income}
            currency={currency}
            prefix="+"
            accent="glow"
          />
          <SummaryCard
            label="Expenses"
            value={summary.expense}
            currency={currency}
            prefix="−"
            accent="red"
          />
          <SummaryCard
            label="Net"
            value={summary.net}
            currency={currency}
            prefix={summary.net >= 0 ? "+" : "−"}
            accent={summary.net >= 0 ? "glow" : "red"}
            absolute
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryBreakdown
          categories={expenseBreakdown}
          total={summary.expense}
          currency={currency}
          label="Expenses by category"
        />
        <CategoryBreakdown
          categories={incomeBreakdown}
          total={summary.income}
          currency={currency}
          label="Income by category"
        />
      </div>

      <RecurringSection
        recurrings={recurrings}
        accounts={accounts}
        today={today}
        currency={currency}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
        <section>
          <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
            Add Transaction
          </h2>
          <TransactionForm
            today={today}
            categorySuggestions={categorySuggestions}
            accounts={accounts}
            currency={currency}
          />
        </section>
        <section>
          <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
            Recent
          </h2>
          <TransactionList
            transactions={transactions}
            accounts={accounts}
            currency={currency}
          />
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  currency,
  prefix,
  accent,
  absolute,
}: {
  label: string;
  value: number;
  currency: string;
  prefix: string;
  accent: "glow" | "red";
  absolute?: boolean;
}) {
  const accentClass =
    accent === "glow" ? "text-glow border-glow/20" : "text-red-400 border-red-500/20";
  const shown = absolute ? Math.abs(value) : value;
  return (
    <div className={`rounded-xl border bg-card p-4 ${accentClass}`}>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
        {label}
      </div>
      <div className="text-2xl font-mono mt-1 font-bold">
        {prefix}
        {formatMoney(shown, currency)}
      </div>
    </div>
  );
}
