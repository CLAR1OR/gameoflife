import { formatMoney } from "@/lib/money";
import type { CategoryTotal } from "@/modules/finance/queries";

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
  label = "Expenses by category",
}: {
  categories: CategoryTotal[];
  total: number;
  currency: string;
  label?: string;
}) {
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
          const barPct = max > 0 ? (c.total / max) * 100 : 0;
          const sharePct = total > 0 ? (c.total / total) * 100 : 0;
          const color = BAR_COLORS[i % BAR_COLORS.length];
          return (
            <div key={c.category} className="group">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span
                    className={`inline-block w-2 h-2 rounded-sm shrink-0 ${color}`}
                    aria-hidden
                  />
                  <span className="text-sm truncate">{c.category}</span>
                  <span className="text-[10px] font-mono text-muted-foreground/60">
                    {c.count}×
                  </span>
                </div>
                <div className="text-sm font-mono shrink-0">
                  {formatMoney(c.total, currency)}
                  <span className="text-[10px] text-muted-foreground/60 ml-2">
                    {sharePct.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                <div
                  className={`${color} h-full rounded-full transition-[width] duration-300`}
                  style={{ width: `${barPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
