"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

function parseYearMonth(s: string): { y: number; m: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(s);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  if (m < 1 || m > 12) return null;
  return { y, m };
}

function formatYearMonth(y: number, m: number): string {
  return `${y}-${String(m).padStart(2, "0")}`;
}

function label(y: number, m: number): string {
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

/**
 * Small ◀ / Month YYYY / ▶ pager. Drives the `ym` search param so the
 * page can swap month-bound stats (summary, breakdowns, recurring) for any
 * historical period.
 */
export function MonthPicker({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const parsed = parseYearMonth(value);
  if (!parsed) return null;
  const { y, m } = parsed;

  function pushYm(nextY: number, nextM: number) {
    const params = new URLSearchParams(search?.toString() ?? "");
    const next = formatYearMonth(nextY, nextM);
    // If picking the current month, drop the param so the URL stays clean.
    const now = new Date();
    if (nextY === now.getFullYear() && nextM === now.getMonth() + 1) {
      params.delete("ym");
    } else {
      params.set("ym", next);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  const prev = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
  const next = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
  const now = new Date();
  const isCurrent = y === now.getFullYear() && m === now.getMonth() + 1;

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => pushYm(prev.y, prev.m)}
        className="h-8 w-8 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
        title={`Previous month — ${label(prev.y, prev.m)}`}
      >
        ◀
      </button>
      <div className="px-3 py-1 rounded-md border border-border bg-card text-sm font-mono min-w-[150px] text-center">
        {label(y, m)}
      </div>
      <button
        type="button"
        disabled={isCurrent}
        onClick={() => pushYm(next.y, next.m)}
        className="h-8 w-8 flex items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title={
          isCurrent
            ? "Already this month"
            : `Next month — ${label(next.y, next.m)}`
        }
      >
        ▶
      </button>
      {!isCurrent && (
        <button
          type="button"
          onClick={() => pushYm(now.getFullYear(), now.getMonth() + 1)}
          className="ml-1 text-[11px] font-mono text-glow hover:text-foreground"
          title="Jump back to this month"
        >
          today
        </button>
      )}
    </div>
  );
}
