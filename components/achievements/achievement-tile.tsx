"use client";

import { useState } from "react";
import { AchievementDialog } from "./achievement-dialog";
import { formatProgressNumber, unitForTrigger } from "./modules";
import type { Achievement } from "@/modules/skills/types";

export function AchievementTile({
  achievement,
  progress,
}: {
  achievement: Achievement;
  /** Current value of the user's triggerType stat. Used to render a progress
   * bar + label on locked tiles. Null/undefined → no progress UI. */
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
    ? Math.min(100, ((progress as number) / (achievement.triggerCount as number)) * 100)
    : 0;
  const unit = hasProgress ? unitForTrigger(achievement.triggerType) : "";

  // Background gradient based on state
  const background = unlocked
    ? "radial-gradient(circle at 50% 40%, rgba(0,255,136,0.18) 0%, rgba(250,204,21,0.08) 50%, #0a0b14 100%)"
    : "radial-gradient(circle at 50% 50%, #1a1b35 0%, #0a0b14 100%)";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group relative aspect-square w-full overflow-hidden rounded-xl border transition-all hover:scale-[1.03] ${
          unlocked
            ? "border-glow/40 hover:border-glow/70 glow-green"
            : hasProgress && pct >= 50
              ? "border-glow/30 hover:border-glow/60"
              : "border-border/40 hover:border-border"
        }`}
        style={{ background }}
      >
        {/* Large icon — fills the square */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`text-6xl leading-none drop-shadow-lg transition-all ${
              unlocked
                ? ""
                : "grayscale brightness-50 opacity-40 group-hover:opacity-60"
            }`}
          >
            {achievement.icon}
          </span>
        </div>

        {/* Locked progress overlay — slim bar + label at the bottom */}
        {hasProgress && (
          <div className="absolute bottom-0 left-0 right-0 px-2 pb-1.5 pt-3 bg-gradient-to-t from-black/85 to-transparent group-hover:opacity-0 transition-opacity">
            <div className="flex items-baseline justify-between gap-1 mb-0.5">
              <span className="text-[9px] font-mono text-glow/80 tabular-nums truncate">
                {formatProgressNumber(progress as number)}
                <span className="text-muted-foreground/70">
                  /{formatProgressNumber(achievement.triggerCount as number)}
                  {unit}
                </span>
              </span>
              <span className="text-[9px] font-mono text-glow/60 tabular-nums shrink-0">
                {pct.toFixed(0)}%
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-glow/70 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Hover overlay — name + description */}
        <div className="absolute inset-0 flex flex-col justify-end p-2.5 opacity-0 group-hover:opacity-100 touch:opacity-100 bg-gradient-to-t from-black/95 via-black/70 to-black/20 transition-opacity">
          <span
            className={`text-xs font-bold leading-tight drop-shadow-lg ${
              unlocked ? "text-glow" : "text-white"
            }`}
          >
            {achievement.name}
          </span>
          {achievement.description && (
            <span className="text-[10px] text-white/70 leading-snug mt-0.5 line-clamp-3">
              {achievement.description}
            </span>
          )}
          {hasProgress && (
            <span className="text-[10px] font-mono text-glow/90 mt-1 tabular-nums">
              {formatProgressNumber(progress as number)}/
              {formatProgressNumber(achievement.triggerCount as number)}
              {unit} · {pct.toFixed(0)}%
            </span>
          )}
        </div>

        {/* Unlocked checkmark (always visible corner indicator) */}
        {unlocked && (
          <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-glow text-[10px] font-bold text-background">
            ✓
          </div>
        )}
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
