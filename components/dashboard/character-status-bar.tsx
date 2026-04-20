import { getLevelProgress, type LevelProgress } from "@/lib/level";

const TIER_CLASSES: Record<LevelProgress["tier"]["accent"], {
  ring: string;
  text: string;
  bar: string;
  glow: string;
  bg: string;
  stroke: string;
}> = {
  emerald: {
    ring: "ring-emerald-500/30",
    text: "text-emerald-400",
    bar: "bg-emerald-500",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.25)]",
    bg: "from-emerald-500/10",
    stroke: "#10b981",
  },
  blue: {
    ring: "ring-blue-500/30",
    text: "text-blue-400",
    bar: "bg-blue-500",
    glow: "shadow-[0_0_20px_rgba(59,130,246,0.25)]",
    bg: "from-blue-500/10",
    stroke: "#3b82f6",
  },
  purple: {
    ring: "ring-purple-500/30",
    text: "text-purple-400",
    bar: "bg-purple-500",
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.25)]",
    bg: "from-purple-500/10",
    stroke: "#a855f7",
  },
  pink: {
    ring: "ring-pink-500/30",
    text: "text-pink-400",
    bar: "bg-pink-500",
    glow: "shadow-[0_0_20px_rgba(236,72,153,0.25)]",
    bg: "from-pink-500/10",
    stroke: "#ec4899",
  },
  xp: {
    ring: "ring-yellow-500/30",
    text: "text-yellow-400",
    bar: "bg-yellow-500",
    glow: "shadow-[0_0_24px_rgba(250,204,21,0.3)]",
    bg: "from-yellow-500/15",
    stroke: "#facc15",
  },
  orange: {
    ring: "ring-orange-500/40",
    text: "text-orange-400",
    bar: "bg-orange-500",
    glow: "shadow-[0_0_24px_rgba(249,115,22,0.3)]",
    bg: "from-orange-500/15",
    stroke: "#f97316",
  },
  legend: {
    ring: "ring-red-500/40",
    text: "text-red-400",
    bar: "bg-gradient-to-r from-yellow-400 via-red-500 to-purple-500",
    glow: "shadow-[0_0_32px_rgba(239,68,68,0.4)]",
    bg: "from-red-500/15",
    stroke: "#ef4444",
  },
};

function WeeklyGoalRing({
  current,
  goal,
  stroke,
}: {
  current: number;
  goal: number;
  stroke: string;
}) {
  const size = 72;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, current / Math.max(1, goal));
  const offset = circumference * (1 - pct);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeOpacity={0.15}
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted-foreground"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 500ms ease",
            filter: `drop-shadow(0 0 4px ${stroke}66)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center font-mono leading-none">
        <span className="text-sm font-bold" style={{ color: stroke }}>
          {current.toLocaleString()}
        </span>
        <span className="text-[9px] text-muted-foreground mt-0.5">
          / {goal.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

export function CharacterStatusBar({
  name,
  totalXp,
  weeklyXp,
  weeklyGoal,
  achievementsUnlocked,
  achievementsTotal,
}: {
  name: string;
  totalXp: number;
  weeklyXp: number;
  weeklyGoal: number;
  achievementsUnlocked: number;
  achievementsTotal: number;
}) {
  const progress = getLevelProgress(totalXp);
  const classes = TIER_CLASSES[progress.tier.accent];
  const achievementPct =
    achievementsTotal === 0
      ? 0
      : (achievementsUnlocked / achievementsTotal) * 100;

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

        {/* Right-side widgets */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Achievements */}
          <div className="flex flex-col items-end gap-0.5 text-right">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
              🏆 Achievements
            </div>
            <div
              className={`text-lg font-mono font-bold ${classes.text}`}
              title={`${achievementsUnlocked} of ${achievementsTotal} unlocked`}
            >
              {achievementsUnlocked}
              <span className="text-muted-foreground text-sm">
                /{achievementsTotal}
              </span>
            </div>
            <div className="text-[10px] font-mono text-muted-foreground/70">
              {achievementPct.toFixed(0)}%
            </div>
          </div>

          {/* Weekly goal ring */}
          <div className="flex flex-col items-center gap-1">
            <WeeklyGoalRing
              current={weeklyXp}
              goal={weeklyGoal}
              stroke={classes.stroke}
            />
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
              Weekly XP
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
