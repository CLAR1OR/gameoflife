import { getLevelProgress, type LevelProgress } from "@/lib/level";

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
}: {
  name: string;
  totalXp: number;
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
        {/* Avatar + level ring */}
        <div className="relative shrink-0">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-2xl border-2 bg-background/60 text-3xl font-bold font-mono ${classes.text}`}
            style={{ borderColor: "currentColor" }}
          >
            {getInitials(name)}
          </div>
          <div
            className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-background border text-xs font-mono font-bold ${classes.text} border-current`}
          >
            Lv {progress.level}
          </div>
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
          {/* XP bar */}
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

        {/* Right-side slot: placeholder stats grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-right shrink-0">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
            Total XP
          </div>
          <div className={`text-sm font-mono ${classes.text}`}>
            {totalXp.toLocaleString()}
          </div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
            Progress
          </div>
          <div className={`text-sm font-mono ${classes.text}`}>
            {progress.pct.toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
}
