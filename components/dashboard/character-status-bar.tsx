import { getLevelProgress, type LevelProgress } from "@/lib/level";
import { NetWorthRow } from "./net-worth-row";
import { BookStatusRow } from "./book-status-row";

const TIER_CLASSES: Record<LevelProgress["tier"]["accent"], {
  ring: string;
  text: string;
  bar: string;
  glow: string;
  bg: string;
}> = {
  emerald: {
    ring: "ring-emerald-500/30",
    text: "text-emerald-400",
    bar: "bg-emerald-500",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.25)]",
    bg: "from-emerald-500/10",
  },
  blue: {
    ring: "ring-blue-500/30",
    text: "text-blue-400",
    bar: "bg-blue-500",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.25)]",
    bg: "from-blue-500/10",
  },
  purple: {
    ring: "ring-purple-500/30",
    text: "text-purple-400",
    bar: "bg-purple-500",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.25)]",
    bg: "from-purple-500/10",
  },
  pink: {
    ring: "ring-pink-500/30",
    text: "text-pink-400",
    bar: "bg-pink-500",
    glow: "shadow-[0_0_20px_rgba(236,72,153,0.25)]",
    bg: "from-pink-500/10",
  },
  xp: {
    ring: "ring-yellow-500/30",
    text: "text-yellow-400",
    bar: "bg-yellow-500",
    glow: "shadow-[0_0_24px_rgba(250,204,21,0.3)]",
    bg: "from-yellow-500/15",
  },
  orange: {
    ring: "ring-orange-500/40",
    text: "text-orange-400",
    bar: "bg-orange-500",
    glow: "shadow-[0_0_24px_rgba(249,115,22,0.3)]",
    bg: "from-orange-500/15",
  },
  legend: {
    ring: "ring-red-500/40",
    text: "text-red-400",
    bar: "bg-gradient-to-r from-yellow-400 via-red-500 to-purple-500",
    glow: "shadow-[0_0_32px_rgba(239,68,68,0.4)]",
    bg: "from-red-500/15",
  },
};

export function CharacterStatusBar({
  name,
  totalXp,
  netWorth,
  currency,
  staleAccountCount = 0,
  totalAccounts = 0,
  totalBooksRead = 0,
  booksReadThisYear = 0,
  yearlyBookGoal = 0,
  showNetWorth = true,
  showBooks = true,
}: {
  name: string;
  totalXp: number;
  netWorth: number;
  currency: string;
  staleAccountCount?: number;
  totalAccounts?: number;
  totalBooksRead?: number;
  booksReadThisYear?: number;
  yearlyBookGoal?: number;
  showNetWorth?: boolean;
  showBooks?: boolean;
}) {
  const progress = getLevelProgress(totalXp);
  const classes = TIER_CLASSES[progress.tier.accent];

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-card p-5 ring-1 ${classes.ring} ${classes.glow}`}
    >
      {/* Accent gradient background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${classes.bg} via-transparent to-transparent pointer-events-none`}
      />

      <div className="relative flex items-center gap-5 flex-wrap">
        {/* Avatar box with level inside */}
        <div
          className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border-2 bg-background/60 font-mono ${classes.text}`}
          style={{ borderColor: "currentColor" }}
          title={`${name} — ${progress.tier.name}`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-widest opacity-70 leading-none">
            Lv
          </span>
          <span className="text-3xl font-bold leading-none mt-0.5">
            {progress.level}
          </span>
        </div>

        {/* Name + tier + XP bar */}
        <div className="flex-1 min-w-[200px] space-y-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
            <span
              className={`text-sm font-mono uppercase tracking-wider ${classes.text}`}
            >
              {progress.tier.name}
            </span>
          </div>
          <div className="space-y-1">
            <div className="relative h-3 rounded-full bg-muted/50 overflow-hidden border border-border/50">
              <div
                className={`absolute left-0 top-0 bottom-0 rounded-full ${classes.bar} transition-all`}
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] font-mono text-muted-foreground">
              <span>
                <span className={classes.text}>
                  {progress.xpIntoLevel.toLocaleString()}
                </span>
                {" / "}
                {progress.xpNeededForLevel.toLocaleString()} XP
              </span>
              <span>{progress.xpToNext.toLocaleString()} to next</span>
            </div>
          </div>
        </div>

        {/* Right column: top-anchored stack */}
        {(showNetWorth || showBooks) && (
          <div className="shrink-0 self-stretch flex flex-col items-end gap-2 min-w-[140px]">
            {showNetWorth && (
              <NetWorthRow
                initial={netWorth}
                currency={currency}
                staleAccountCount={staleAccountCount}
                totalAccounts={totalAccounts}
              />
            )}
            {showBooks && (
              <BookStatusRow
                totalRead={totalBooksRead}
                yearRead={booksReadThisYear}
                yearlyGoal={yearlyBookGoal}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
