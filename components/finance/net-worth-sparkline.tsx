import type { NetWorthSnapshot } from "@/modules/finance/queries";
import { formatMoney } from "@/lib/money";

type Props = {
  snapshots: NetWorthSnapshot[];
  current: number;
  currency: string;
};

export function NetWorthSparkline({ snapshots, current, currency }: Props) {
  if (snapshots.length < 2) {
    return (
      <div className="rounded-xl border bg-card p-5">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-1">
          Net worth · last 30 days
        </div>
        <p className="text-xs text-muted-foreground/70">
          Building history. Check back tomorrow — one snapshot is taken per day.
        </p>
      </div>
    );
  }

  const values = snapshots.map((s) => s.netWorth);
  const max = Math.max(...values, current);
  const min = Math.min(...values, current);
  const range = Math.max(1, max - min);
  const first = snapshots[0].netWorth;
  const delta = current - first;
  const deltaPct = first !== 0 ? (delta / Math.abs(first)) * 100 : 0;

  const width = 600;
  const height = 80;
  const stepX = snapshots.length > 1 ? width / (snapshots.length - 1) : 0;

  const points = snapshots.map((s, i) => {
    const x = i * stepX;
    const y = height - ((s.netWorth - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const polyline = points.join(" ");
  const lastX = (snapshots.length - 1) * stepX;
  const lastY = height - ((snapshots[snapshots.length - 1].netWorth - min) / range) * height;

  const stroke = delta >= 0 ? "#84cc16" : "#f87171";
  const fill = delta >= 0 ? "rgba(132,204,22,0.15)" : "rgba(248,113,113,0.15)";

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-end justify-between mb-3 gap-3">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
            Net worth · last {snapshots.length} days
          </div>
          <div
            className={`text-xs font-mono mt-1 ${
              delta >= 0 ? "text-glow" : "text-red-400"
            }`}
          >
            {delta >= 0 ? "▲" : "▼"} {formatMoney(delta, currency, { sign: "always" })}
            {Number.isFinite(deltaPct)
              ? ` (${delta >= 0 ? "+" : ""}${deltaPct.toFixed(1)}%)`
              : ""}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
            High / Low
          </div>
          <div className="text-[11px] font-mono text-muted-foreground">
            {formatMoney(max, currency)} / {formatMoney(min, currency)}
          </div>
        </div>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height + 4}`}
        preserveAspectRatio="none"
        className="w-full h-20"
      >
        <polyline
          points={`${polyline} ${lastX.toFixed(1)},${height} 0,${height}`}
          fill={fill}
          stroke="none"
        />
        <polyline
          points={polyline}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle cx={lastX} cy={lastY} r="3" fill={stroke} />
      </svg>
    </div>
  );
}
