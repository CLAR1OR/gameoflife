"use client";

import { useMemo, useState } from "react";

/**
 * GitHub-style heatmap of habit completions over the past ~53 weeks.
 * Each column = a calendar week (Mon→Sun); each cell = one day. Cell
 * intensity scales with completion count for that day (relative to the
 * busiest day in the window).
 */
export function YearHeatmap({
  counts,
  weeks = 53,
  accent = "glow",
  title = "🔥 Activity",
  unit = "completions",
}: {
  /** Map of YYYY-MM-DD → count for that day. Missing = 0. */
  counts: Record<string, number>;
  /** How many trailing weeks to render. 53 covers ~12 months + the partial
   *  current week. */
  weeks?: number;
  /** Tailwind color token used for the heatmap cells: "glow" (green) or
   *  "glow-purple" (purple). Defaults to green. */
  accent?: "glow" | "glow-purple";
  /** Section title shown in the heatmap's header. */
  title?: string;
  /** Singular/plural word for the hover tooltip (e.g. "completions",
   *  "interactions"). */
  unit?: string;
}) {
  const [hover, setHover] = useState<{ date: string; n: number } | null>(null);

  // Build grid: 7 rows (Mon..Sun) × `weeks` columns ending in the current week.
  const { grid, max, monthLabels, total } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Find Monday of the current week.
    const dow = (today.getDay() + 6) % 7;
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - dow);

    const cols: { date: string; n: number; month: number }[][] = [];
    let max = 0;
    let total = 0;
    const monthLabels: { col: number; label: string }[] = [];
    let prevMonth = -1;

    for (let c = weeks - 1; c >= 0; c--) {
      const monday = new Date(thisMonday);
      monday.setDate(thisMonday.getDate() - c * 7);
      const col: { date: string; n: number; month: number }[] = [];
      for (let r = 0; r < 7; r++) {
        const day = new Date(monday);
        day.setDate(monday.getDate() + r);
        const yyyy = day.getFullYear();
        const mm = String(day.getMonth() + 1).padStart(2, "0");
        const dd = String(day.getDate()).padStart(2, "0");
        const iso = `${yyyy}-${mm}-${dd}`;
        const future = day.getTime() > today.getTime();
        const n = future ? -1 : counts[iso] ?? 0;
        if (!future) {
          if (n > max) max = n;
          total += n;
        }
        col.push({ date: iso, n, month: day.getMonth() });
      }
      cols.push(col);

      // Label this column with the month name iff the row-0 cell's month
      // changed from the previous column.
      const colMonth = col[0].month;
      if (colMonth !== prevMonth) {
        monthLabels.push({
          col: weeks - 1 - c,
          label: new Date(
            today.getFullYear(),
            colMonth,
            1
          ).toLocaleDateString(undefined, { month: "short" }),
        });
        prevMonth = colMonth;
      }
    }
    return { grid: cols, max, monthLabels, total };
  }, [counts, weeks]);

  function intensityFor(n: number): string {
    if (n < 0) return "bg-transparent";
    if (n === 0 || max === 0) return "bg-muted/30";
    const ratio = Math.min(1, n / max);
    if (accent === "glow-purple") {
      if (ratio < 0.25) return "bg-glow-purple/25";
      if (ratio < 0.5) return "bg-glow-purple/50";
      if (ratio < 0.75) return "bg-glow-purple/75";
      return "bg-glow-purple";
    }
    if (ratio < 0.25) return "bg-glow/25";
    if (ratio < 0.5) return "bg-glow/50";
    if (ratio < 0.75) return "bg-glow/75";
    return "bg-glow";
  }
  const titleColor =
    accent === "glow-purple" ? "text-glow-purple" : "text-glow";
  const legendCells =
    accent === "glow-purple"
      ? ["bg-glow-purple/25", "bg-glow-purple/50", "bg-glow-purple/75", "bg-glow-purple"]
      : ["bg-glow/25", "bg-glow/50", "bg-glow/75", "bg-glow"];

  function fmtDate(iso: string) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-2">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h2 className={`text-xs font-mono uppercase tracking-wider ${titleColor}`}>
          {title} ({weeks} weeks)
        </h2>
        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
          {hover ? (
            <span className="text-foreground">
              {fmtDate(hover.date)} · {hover.n} {unit.replace(/s$/, "")}
              {hover.n === 1 ? "" : unit.endsWith("s") ? "s" : ""}
            </span>
          ) : (
            <span>
              {total.toLocaleString()} {unit} · peak {max}/day
            </span>
          )}
          <div className="flex items-center gap-1">
            <span>less</span>
            <span className="h-2.5 w-2.5 rounded-sm bg-muted/30 border border-border/40" />
            {legendCells.map((c) => (
              <span key={c} className={`h-2.5 w-2.5 rounded-sm ${c}`} />
            ))}
            <span>more</span>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-0.5">
          {/* Month label row */}
          <div className="flex gap-0.5 pl-6 h-3">
            {grid.map((_, ci) => {
              const label = monthLabels.find((m) => m.col === ci)?.label;
              return (
                <div
                  key={ci}
                  className="w-2.5 text-[9px] font-mono text-muted-foreground"
                >
                  {label ?? ""}
                </div>
              );
            })}
          </div>
          {/* 7 rows × N cols grid */}
          <div className="flex gap-0.5">
            {/* Day-of-week labels */}
            <div className="flex flex-col gap-0.5 w-5 text-[8px] font-mono text-muted-foreground/60 leading-[10px] pr-1">
              <span>Mon</span>
              <span className="opacity-0">·</span>
              <span>Wed</span>
              <span className="opacity-0">·</span>
              <span>Fri</span>
              <span className="opacity-0">·</span>
              <span>Sun</span>
            </div>
            {grid.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-0.5">
                {col.map((cell) => (
                  <div
                    key={cell.date}
                    onMouseEnter={() =>
                      cell.n >= 0 && setHover({ date: cell.date, n: cell.n })
                    }
                    onMouseLeave={() => setHover(null)}
                    className={`h-2.5 w-2.5 rounded-sm ${intensityFor(cell.n)} ${
                      cell.n >= 0
                        ? `border border-border/30 hover:ring-1 cursor-default ${
                            accent === "glow-purple"
                              ? "hover:ring-glow-purple/40"
                              : "hover:ring-glow/40"
                          }`
                        : ""
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
