import type {
  DailyXpBucket,
  ActivitySummary,
} from "@/modules/activity/queries";

export function XpBarChart({ buckets }: { buckets: DailyXpBucket[] }) {
  if (buckets.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-5 text-center text-sm text-muted-foreground">
        No XP earned in this window yet.
      </div>
    );
  }
  const max = Math.max(1, ...buckets.map((b) => b.xp));
  const total = buckets.reduce((s, b) => s + b.xp, 0);
  const active = buckets.filter((b) => b.xp > 0).length;
  const width = 720;
  const height = 140;
  const padX = 8;
  const padY = 8;
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;
  const gap = 2;
  const barW = Math.max(1, usableW / buckets.length - gap);

  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
            XP earned · last {buckets.length} days
          </div>
          <div className="text-2xl font-mono text-xp mt-1">
            {total.toLocaleString()}
          </div>
        </div>
        <div className="text-right text-[11px] font-mono text-muted-foreground">
          {active} of {buckets.length} active days ·{" "}
          {Math.round((total / buckets.length) * 10) / 10}/day avg
        </div>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-32"
      >
        {buckets.map((b, i) => {
          const h = (b.xp / max) * usableH;
          const x = padX + i * (barW + gap);
          const y = height - padY - h;
          const isToday = i === buckets.length - 1;
          // Theme-tinted: empty cells use a foreground-tinted veil; today
          // pops as --xp (warm), other active days as --glow (primary).
          const fill =
            b.xp === 0
              ? "color-mix(in srgb, currentColor 8%, transparent)"
              : isToday
                ? "var(--xp)"
                : "var(--glow)";
          return (
            <rect
              key={b.date}
              x={x}
              y={y}
              width={barW}
              height={Math.max(1, h)}
              fill={fill}
              rx="1"
            >
              <title>
                {b.date}: {b.xp} XP
              </title>
            </rect>
          );
        })}
      </svg>
      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground/60">
        <span>{buckets[0]?.date ?? ""}</span>
        <span>{buckets[buckets.length - 1]?.date ?? ""}</span>
      </div>
    </div>
  );
}

export function HabitHeatmap({
  days,
}: {
  days: { date: string; count: number }[];
}) {
  if (days.length === 0) return null;

  // Layout: 7-row x N-col grid, oldest → newest. We start the grid so that
  // the first column lines up with the week containing the earliest date.
  const parsed = days.map((d) => {
    const [y, m, dd] = d.date.split("-").map(Number);
    return { ...d, dow: new Date(y, m - 1, dd).getDay() }; // 0 = Sunday
  });
  const firstDow = parsed[0].dow;
  const pre = Array.from({ length: firstDow }, () => null);
  const cells = [...pre, ...parsed];

  const cellSize = 11;
  const gap = 2;
  const cols = Math.ceil(cells.length / 7);
  const width = cols * (cellSize + gap);
  const height = 7 * (cellSize + gap);

  const max = Math.max(1, ...days.map((d) => d.count));
  const total = days.reduce((s, d) => s + d.count, 0);
  const activeDays = days.filter((d) => d.count > 0).length;

  // Theme-tinted heatmap: each step mixes the theme's primary accent with
  // the page background so cells stay legible in light or dark themes.
  function color(count: number): string {
    if (count === 0) return "color-mix(in srgb, currentColor 5%, transparent)";
    const intensity = Math.min(1, count / max);
    const pct =
      intensity < 0.25 ? 25 : intensity < 0.5 ? 45 : intensity < 0.75 ? 70 : 100;
    return `color-mix(in srgb, var(--glow) ${pct}%, transparent)`;
  }

  // Month labels: pick the first cell of each month in the column of its
  // position (row 0 = top).
  const monthLabels: { x: number; label: string }[] = [];
  let lastMonth = -1;
  cells.forEach((c, idx) => {
    if (!c) return;
    const [, mStr] = c.date.split("-");
    const m = Number(mStr);
    if (m !== lastMonth) {
      lastMonth = m;
      const col = Math.floor(idx / 7);
      const x = col * (cellSize + gap);
      const label = new Date(2000, m - 1, 1).toLocaleDateString(undefined, {
        month: "short",
      });
      monthLabels.push({ x, label });
    }
  });

  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
            Habit heatmap · last {days.length} days
          </div>
          <div className="text-xs text-muted-foreground mt-1 font-mono">
            {total.toLocaleString()} check-offs across {activeDays} active days
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground/70">
          <span>less</span>
          {[0, 0.25, 0.5, 0.75, 1].map((i) => (
            <span
              key={i}
              className="inline-block h-2.5 w-2.5 rounded-sm"
              style={{ background: color(i * max) }}
            />
          ))}
          <span>more</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg
          width={width}
          height={height + 16}
          className="block"
        >
          {monthLabels.map((l) => (
            <text
              key={l.x}
              x={l.x}
              y={10}
              fontSize="9"
              fontFamily="monospace"
              fill="var(--muted-foreground)"
            >
              {l.label}
            </text>
          ))}
          <g transform="translate(0,14)">
            {cells.map((c, idx) => {
              if (!c) return null;
              const col = Math.floor(idx / 7);
              const row = idx % 7;
              const x = col * (cellSize + gap);
              const y = row * (cellSize + gap);
              return (
                <rect
                  key={c.date}
                  x={x}
                  y={y}
                  width={cellSize}
                  height={cellSize}
                  rx="2"
                  fill={color(c.count)}
                >
                  <title>
                    {c.date}: {c.count}{" "}
                    {c.count === 1 ? "check-off" : "check-offs"}
                  </title>
                </rect>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}

export function ActivitySummaryCards({
  summary,
  days,
}: {
  summary: ActivitySummary;
  days: number;
}) {
  const items = [
    {
      label: "Milestones",
      value: summary.milestonesCompleted,
      color: "text-glow",
    },
    {
      label: "Habits logged",
      value: summary.habitsLogged,
      color: "text-glow",
    },
    {
      label: "Quests done",
      value: summary.questsCompleted,
      color: "text-glow-purple",
    },
    {
      label: "Books read",
      value: summary.booksFinished,
      color: "text-xp",
    },
    {
      label: "Achievements",
      value: summary.achievementsUnlocked,
      color: "text-xp",
    },
  ];
  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-2">
        Last {days} days · activity
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {items.map((i) => (
          <div
            key={i.label}
            className="rounded-lg border border-border/60 bg-card p-3"
          >
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-mono">
              {i.label}
            </div>
            <div className={`text-xl font-mono mt-0.5 ${i.color}`}>
              {i.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
