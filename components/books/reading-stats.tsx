import type { MonthBucket, YearBucket } from "@/modules/books/queries";

function MonthlyChart({ data }: { data: MonthBucket[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const barH = 120;
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-3">
        Last 12 months
      </div>
      <div className="flex items-end justify-between gap-1" style={{ height: barH }}>
        {data.map((b) => {
          const h = (b.count / max) * (barH - 24);
          return (
            <div
              key={b.key}
              className="flex-1 flex flex-col items-center justify-end gap-1"
              title={`${b.label}: ${b.count} book${b.count === 1 ? "" : "s"}${b.pages ? ` · ${b.pages} pp` : ""}`}
            >
              {b.count > 0 && (
                <span className="text-[9px] font-mono text-glow">
                  {b.count}
                </span>
              )}
              <div
                className={`w-full rounded-t-sm transition-all ${
                  b.count > 0 ? "bg-glow/60 hover:bg-glow" : "bg-muted/40"
                }`}
                style={{ height: Math.max(2, h) }}
              />
              <span className="text-[9px] font-mono text-muted-foreground uppercase">
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function YearlyChart({ data }: { data: YearBucket[] }) {
  if (data.length === 0) return null;
  const max = Math.max(1, ...data.map((d) => d.count));
  const barH = 120;
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-3">
        Books per year
      </div>
      <div
        className="flex items-end justify-between gap-1 overflow-x-auto"
        style={{ height: barH }}
      >
        {data.map((y) => {
          const h = (y.count / max) * (barH - 24);
          return (
            <div
              key={y.year}
              className="flex-1 min-w-[24px] flex flex-col items-center justify-end gap-1"
              title={`${y.year}: ${y.count} book${y.count === 1 ? "" : "s"}${y.pages ? ` · ${y.pages.toLocaleString()} pp` : ""}`}
            >
              {y.count > 0 && (
                <span className="text-[9px] font-mono text-glow-purple">
                  {y.count}
                </span>
              )}
              <div
                className="w-full rounded-t-sm bg-glow-purple/60 hover:bg-glow-purple transition-all"
                style={{ height: Math.max(2, h) }}
              />
              <span className="text-[9px] font-mono text-muted-foreground">
                {String(y.year).slice(-2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RatingDistribution({ dist }: { dist: number[] }) {
  const total = dist.reduce((s, v) => s + v, 0);
  if (total === 0) return null;
  const max = Math.max(1, ...dist);
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-3">
        Ratings given
      </div>
      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((stars) => {
          const n = dist[stars - 1];
          const pct = (n / max) * 100;
          return (
            <div key={stars} className="flex items-center gap-2 text-xs">
              <span className="w-16 text-xp font-mono">
                {"★".repeat(stars)}
              </span>
              <div className="flex-1 h-4 rounded-sm bg-muted/40 overflow-hidden">
                <div
                  className="h-full bg-xp/60 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-10 text-right font-mono text-muted-foreground">
                {n}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReadingStats({
  months,
  years,
  ratings,
}: {
  months: MonthBucket[];
  years: YearBucket[];
  ratings: number[];
}) {
  const total = years.reduce((s, y) => s + y.count, 0);
  if (total === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
        📊 Reading Stats
      </h2>
      <div className="grid gap-3 md:grid-cols-2">
        <MonthlyChart data={months} />
        <YearlyChart data={years} />
        <div className="md:col-span-2">
          <RatingDistribution dist={ratings} />
        </div>
      </div>
    </section>
  );
}
