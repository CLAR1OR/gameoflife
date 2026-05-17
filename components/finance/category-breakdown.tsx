import { formatMoney } from "@/lib/money";
import type {
  CategoryTotal,
  FinanceBudget,
} from "@/modules/finance/queries";

const BAR_COLORS = [
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-indigo-500",
];

export function CategoryBreakdown({
  categories,
  total,
  currency,
  budgets,
  label = "Expenses by category",
}: {
  categories: CategoryTotal[];
  total: number;
  currency: string;
  /** Optional monthly budgets by category. When provided, expense rows
   *  whose category has a budget show actual/target and a colored
   *  status bar (green under, amber near, red over). */
  budgets?: FinanceBudget[];
  label?: string;
}) {
  const budgetByCat = new Map<string, number>();
  for (const b of budgets ?? []) budgetByCat.set(b.category, b.targetCents);

  if (categories.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-5">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-2">
          {label}
        </div>
        <p className="text-xs text-muted-foreground/70">
          No data for this month yet.
        </p>
      </div>
    );
  }

  const max = Math.max(...categories.map((c) => c.total));

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-baseline justify-between mb-3 gap-2">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
          {label}
        </div>
        <div className="text-[10px] text-muted-foreground/60 font-mono">
          {categories.length} categories · {formatMoney(total, currency)}
        </div>
      </div>
      <div className="space-y-2">
        {categories.map((c, i) => {
          const budget = budgetByCat.get(c.category);
          const hasBudget = budget != null && budget > 0;
          const budgetPct = hasBudget
            ? Math.min(100, (c.total / budget) * 100)
            : null;
          const overBudget = hasBudget && c.total > budget;
          const nearBudget =
            hasBudget && !overBudget && c.total / budget >= 0.8;
          // When a budget exists the bar width tracks budget usage (capped
          // at 100% so the bar doesn't shoot off), otherwise relative to
          // the largest category in the list.
          const barPct = hasBudget
            ? budgetPct ?? 0
            : max > 0
              ? (c.total / max) * 100
              : 0;
          const sharePct = total > 0 ? (c.total / total) * 100 : 0;
          const baseColor = BAR_COLORS[i % BAR_COLORS.length];
          const barColor = hasBudget
            ? overBudget
              ? "bg-destructive"
              : nearBudget
                ? "bg-amber-500"
                : "bg-emerald-500"
            : baseColor;
          return (
            <div key={c.category} className="group">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span
                    className={`inline-block w-2 h-2 rounded-sm shrink-0 ${barColor}`}
                    aria-hidden
                  />
                  <span className="text-sm truncate">{c.category}</span>
                  <span className="text-[10px] font-mono text-muted-foreground/60">
                    {c.count}×
                  </span>
                </div>
                <div className="text-sm font-mono shrink-0">
                  {formatMoney(c.total, currency)}
                  {hasBudget ? (
                    <span
                      className={`text-[10px] font-mono ml-2 ${
                        overBudget
                          ? "text-destructive"
                          : nearBudget
                            ? "text-amber-500"
                            : "text-emerald-500"
                      }`}
                    >
                      / {formatMoney(budget, currency)}
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/60 ml-2">
                      {sharePct.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                <div
                  className={`${barColor} h-full rounded-full transition-[width] duration-300`}
                  style={{ width: `${barPct}%` }}
                />
              </div>
              {hasBudget && overBudget && (
                <div className="text-[10px] font-mono text-destructive mt-0.5">
                  ⚠ over by {formatMoney(c.total - budget, currency)} (
                  {((c.total / budget - 1) * 100).toFixed(0)}%)
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
