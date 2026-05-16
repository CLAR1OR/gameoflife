"use client";

import { useState } from "react";
import { AchievementDialog } from "./achievement-dialog";
import { formatProgressNumber, unitForTrigger } from "./modules";
import type { Achievement } from "@/modules/skills/types";

/**
 * Steam-style achievement row: icon left, name + description center,
 * unlock-date or progress bar on the right. Designed for the "List" view
 * — denser than tiles and easier to scan when you have many achievements.
 */
export function AchievementRow({
  achievement,
  progress,
}: {
  achievement: Achievement;
  progress?: number | null;
}) {
  const [open, setOpen] = useState(false);
  const unlocked = achievement.isUnlocked;
  const hasProgress =
    !unlocked &&
    progress != null &&
    achievement.triggerCount != null &&
    achievement.triggerCount > 0;
  const pct = hasProgress
    ? Math.min(
        100,
        ((progress as number) / (achievement.triggerCount as number)) * 100
      )
    : 0;
  const unit = hasProgress ? unitForTrigger(achievement.triggerType) : "";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group flex w-full items-center gap-3 rounded-md border bg-card/40 px-3 py-2 text-left transition-colors ${
          unlocked
            ? "border-glow/30 hover:border-glow/60"
            : hasProgress && pct >= 50
              ? "border-glow/20 hover:border-glow/40"
              : "border-border/60 hover:border-border"
        }`}
      >
        <div
          className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-md border ${
            unlocked
              ? "border-glow/40 bg-glow/5"
              : "border-border/60 bg-muted/20"
          }`}
        >
          <span
            className={`text-3xl leading-none ${
              unlocked ? "" : "grayscale brightness-50 opacity-50"
            }`}
          >
            {achievement.icon}
          </span>
          {unlocked && (
            <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-glow text-[9px] font-bold text-background">
              ✓
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div
            className={`text-sm font-semibold leading-tight ${
              unlocked ? "text-foreground" : "text-foreground/70"
            }`}
          >
            {achievement.name}
          </div>
          {achievement.description && (
            <div className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
              {achievement.description}
            </div>
          )}
        </div>

        <div className="shrink-0 text-right min-w-[110px]">
          {unlocked ? (
            <>
              <div className="text-[10px] font-mono uppercase tracking-wider text-glow/80">
                Unlocked
              </div>
              <div className="text-[11px] font-mono text-muted-foreground tabular-nums">
                {achievement.unlockedAt
                  ? new Date(achievement.unlockedAt).toLocaleDateString(
                      undefined,
                      { year: "numeric", month: "short", day: "numeric" }
                    )
                  : "—"}
              </div>
            </>
          ) : hasProgress ? (
            <div className="w-[150px]">
              <div className="flex items-baseline justify-between gap-2 mb-1">
                <span className="text-[10px] font-mono text-glow/80 tabular-nums">
                  {formatProgressNumber(progress as number)}
                  <span className="text-muted-foreground/70">
                    /{formatProgressNumber(achievement.triggerCount as number)}
                    {unit}
                  </span>
                </span>
                <span className="text-[10px] font-mono text-glow/60 tabular-nums">
                  {pct.toFixed(0)}%
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-glow/70 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60">
              Locked
            </div>
          )}
        </div>
      </button>
      <AchievementDialog
        achievement={achievement}
        progress={progress ?? null}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
