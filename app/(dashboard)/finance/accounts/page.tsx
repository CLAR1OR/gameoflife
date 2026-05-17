import { requireSession } from "@/lib/auth-server";
import {
  getRecentTransactions,
  getAccounts,
  getNetWorth,
  getNetWorthSnapshots,
} from "@/modules/finance/queries";
import { recordNetWorthSnapshotIfNeeded } from "@/modules/finance/actions";
import { getUserSettings } from "@/modules/settings/queries";
import { todayISO } from "@/lib/date";
import { AccountsSection } from "@/components/finance/accounts-section";
import { NetWorthSparkline } from "@/components/finance/net-worth-sparkline";
import { TransactionList } from "@/components/finance/transaction-list";
import { FinanceTabs } from "@/components/finance/finance-tabs";

export default async function FinanceAccountsPage() {
  const session = await requireSession();
  const userId = session.user.id;
  const today = todayISO();

  // Keep the daily snapshot loop running even when the user lands here
  // directly (not via /finance).
  await recordNetWorthSnapshotIfNeeded(userId, today);

  const [settings, accounts, netWorth, snapshots, transactions] =
    await Promise.all([
      getUserSettings(userId),
      getAccounts(userId),
      getNetWorth(userId),
      getNetWorthSnapshots(userId, 30),
      getRecentTransactions(userId, 50),
    ]);

  const currency = settings.currency;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          💰 Finance
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage accounts, check balances, log transactions.
        </p>
      </div>

      <FinanceTabs />

      {/* Settings first — accounts list + add/edit/check-in lives here. */}
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

      {/* Recent activity at the bottom — scroll past it from the top
          rather than scrolling past it to reach the settings. */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
          Recent activity
        </h2>
        <TransactionList
          transactions={transactions}
          accounts={accounts}
          currency={currency}
        />
      </section>
    </div>
  );
}
