"use client";

import { useState } from "react";
import { AchievementDialog } from "./achievement-dialog";
import type { Achievement } from "@/modules/skills/types";

export function AchievementTile({ achievement }: { achievement: Achievement }) {
  const [open, setOpen] = useState(false);
  const unlocked = achievement.isUnlocked;

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

        {/* Hover overlay — name + description */}
        <div className="absolute inset-0 flex flex-col justify-end p-2.5 opacity-0 group-hover:opacity-100 bg-gradient-to-t from-black/95 via-black/70 to-black/20 transition-opacity">
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
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
