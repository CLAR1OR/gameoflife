import { requireSession } from "@/lib/auth-server";
import {
  getBudgets,
  getCategoryBreakdown,
  getCategorySuggestions,
} from "@/modules/finance/queries";
import { getUserSettings } from "@/modules/settings/queries";
import { todayISO } from "@/lib/date";
import { FinanceTabs } from "@/components/finance/finance-tabs";
import { BudgetsManager } from "@/components/finance/budgets-manager";

export default async function BudgetsPage() {
  const session = await requireSession();
  const userId = session.user.id;
  const today = todayISO();
  const yearMonth = today.slice(0, 7);

  const [settings, budgets, expenseBreakdown, categorySuggestions] =
    await Promise.all([
      getUserSettings(userId),
      getBudgets(userId),
      getCategoryBreakdown(userId, yearMonth, "expense"),
      getCategorySuggestions(userId, 100),
    ]);

  // Build the actual-spend map for this month, keyed by category.
  const actualByCategory: Record<string, number> = {};
  for (const c of expenseBreakdown) actualByCategory[c.category] = c.total;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          🎯 Budgets
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set a monthly spending cap per category. Stay under it to keep
          the bar green; over → red on the Overview.
        </p>
      </div>

      <FinanceTabs />

      <BudgetsManager
        budgets={budgets}
        actualByCategory={actualByCategory}
        categorySuggestions={categorySuggestions}
        currency={settings.currency}
        yearMonth={yearMonth}
      />
    </div>
  );
}
