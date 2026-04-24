"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  toggleHabitCompletion,
  logIrregularHabit,
} from "@/modules/habits/actions";
import { todayISO } from "@/lib/date";
import { toast } from "sonner";
import { celebrate } from "@/lib/celebrate";
import type { HabitWithLink } from "@/modules/habits/types";

export function DashboardHabitRow({ habit }: { habit: HabitWithLink }) {
  const [loading, setLoading] = useState(false);
  const today = todayISO();
  const isIrregular = habit.kind === "irregular";
  const doneToday = habit.completedDates.includes(today);

  async function handleClick() {
    if (habit.paused) return;
    setLoading(true);
    try {
      if (isIrregular) {
        const result = await logIrregularHabit(habit.id);
        toast.success(`+1 ${habit.name}`, {
          description: habit.skillName
            ? `+${habit.xpPerCompletion} XP → ${habit.skillName}`
            : `+${habit.xpPerCompletion} XP`,
        });
        if (result.newAchievements.length > 0) {
          celebrate(result.newAchievements);
        }
      } else {
        const result = await toggleHabitCompletion(habit.id, today);
        if (result.completed) {
          toast.success(`✓ ${habit.name}`, {
            description: habit.skillName
              ? `+${habit.xpPerCompletion} XP → ${habit.skillName}`
              : `+${habit.xpPerCompletion} XP`,
          });
        } else {
          toast.info(`Unchecked: ${habit.name}`);
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setLoading(false);
  }

  const highlighted = isIrregular ? habit.todayCount > 0 : doneToday;
  const accentBorder = isIrregular
    ? "border-glow-purple/40 bg-glow-purple/10"
    : "border-glow/40 bg-glow/10 glow-green";
  const accentText = isIrregular ? "text-glow-purple" : "text-glow";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || habit.paused}
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all w-full ${
        habit.paused
          ? "border-border/30 bg-muted/10 opacity-50 cursor-not-allowed"
          : highlighted
            ? accentBorder
            : "border-border/60 bg-card hover:border-glow/40 hover:bg-glow/5"
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 text-lg ${
          highlighted
            ? isIrregular
              ? "border-glow-purple bg-glow-purple/20"
              : "border-glow bg-glow/20"
            : "border-border/50"
        }`}
      >
        <span className={highlighted ? "" : "opacity-40 grayscale"}>
          {habit.icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={`text-sm font-medium truncate ${
            highlighted ? accentText : ""
          }`}
        >
          {habit.name}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {isIrregular ? (
            <span
              className={`text-[10px] font-mono ${
                habit.todayCount > 0 ? "text-glow-purple" : "text-muted-foreground"
              }`}
            >
              Today: {habit.todayCount}× · {habit.totalCompletions} all-time
            </span>
          ) : (
            habit.currentStreak > 0 && (
              <span className="text-[10px] text-xp font-mono">
                🔥 {habit.currentStreak}
              </span>
            )
          )}
          {habit.skillName && (
            <Badge
              variant="outline"
              className="border-glow-purple/30 text-glow-purple text-[9px] font-mono px-1 py-0"
            >
              {habit.skillName}
            </Badge>
          )}
        </div>
      </div>
      {isIrregular && !habit.paused && (
        <span className={`text-xs font-mono ${accentText}`}>+1</span>
      )}
    </button>
  );
}
