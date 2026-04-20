"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { toggleHabitCompletion } from "@/modules/habits/actions";
import { todayISO } from "@/lib/date";
import { toast } from "sonner";
import type { HabitWithLink } from "@/modules/habits/types";

export function DashboardHabitRow({ habit }: { habit: HabitWithLink }) {
  const [loading, setLoading] = useState(false);
  const today = todayISO();
  const doneToday = habit.completedDates.includes(today);

  async function handleToggle() {
    if (habit.paused) return;
    setLoading(true);
    try {
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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading || habit.paused}
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all w-full ${
        habit.paused
          ? "border-border/30 bg-muted/10 opacity-50 cursor-not-allowed"
          : doneToday
            ? "border-glow/40 bg-glow/10 glow-green"
            : "border-border/60 bg-card hover:border-glow/40 hover:bg-glow/5"
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 text-lg ${
          doneToday
            ? "border-glow bg-glow/20"
            : "border-border/50"
        }`}
      >
        <span className={doneToday ? "" : "opacity-40 grayscale"}>
          {habit.icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={`text-sm font-medium truncate ${
            doneToday ? "text-glow" : ""
          }`}
        >
          {habit.name}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {habit.currentStreak > 0 && (
            <span className="text-[10px] text-xp font-mono">
              🔥 {habit.currentStreak}
            </span>
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
    </button>
  );
}
