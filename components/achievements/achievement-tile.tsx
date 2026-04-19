"use client";

import { useState } from "react";
import { AchievementDialog } from "./achievement-dialog";
import type { Achievement } from "@/modules/skills/types";

export function AchievementTile({ achievement }: { achievement: Achievement }) {
  const [open, setOpen] = useState(false);
  const unlocked = achievement.isUnlocked;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group relative flex h-32 w-full flex-col items-center justify-center gap-1.5 rounded-xl border p-3 transition-all ${
          unlocked
            ? "border-glow/40 bg-glow/5 hover:border-glow/60 hover:bg-glow/10 glow-green"
            : "border-border/60 bg-muted/20 hover:border-border hover:bg-muted/30"
        }`}
      >
        <span
          className={`text-4xl leading-none transition-all ${
            unlocked ? "" : "grayscale opacity-30"
          }`}
        >
          {achievement.icon}
        </span>
        <span
          className={`text-[11px] font-semibold leading-tight text-center line-clamp-2 ${
            unlocked ? "text-glow" : "text-muted-foreground"
          }`}
        >
          {achievement.name}
        </span>
      </button>
      <AchievementDialog
        achievement={achievement}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
