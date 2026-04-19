"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  toggleHabitCompletion,
  deleteHabit,
} from "@/modules/habits/actions";
import { todayISO } from "@/lib/date";
import { toast } from "sonner";
import type { HabitWithLink } from "@/modules/habits/types";
import { HabitDialog } from "./habit-dialog";
import type { SubskillGroup } from "./types";

export function HabitRow({
  habit,
  dateRange,
  subskillGroups,
}: {
  habit: HabitWithLink;
  dateRange: string[];
  subskillGroups: SubskillGroup[];
}) {
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const today = todayISO();
  const doneToday = habit.completedDates.includes(today);

  async function handleToggle(date: string) {
    setLoading(true);
    try {
      const result = await toggleHabitCompletion(habit.id, date);
      if (date === today) {
        if (result.completed) {
          toast.success(`✓ ${habit.name}`, {
            description: habit.skillName
              ? `+${habit.xpPerCompletion} XP → ${habit.skillName}`
              : undefined,
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

  async function handleDelete() {
    if (!confirm(`Delete "${habit.name}"? All completion history will be lost.`))
      return;
    try {
      await deleteHabit(habit.id);
      toast.success(`Deleted "${habit.name}"`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  const completedSet = new Set(habit.completedDates);

  return (
    <>
      <div className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 hover:border-border transition-colors">
        {/* Today's big checkbox */}
        <button
          type="button"
          onClick={() => handleToggle(today)}
          disabled={loading}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 text-xl transition-all ${
            doneToday
              ? "border-glow bg-glow/20 glow-green"
              : "border-border/50 hover:border-glow/40 hover:bg-glow/5"
          }`}
          title={doneToday ? "Mark as not done today" : "Mark as done today"}
        >
          <span className={doneToday ? "" : "opacity-30 grayscale"}>
            {habit.icon}
          </span>
        </button>

        {/* Name + linked skill */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-medium leading-tight ${
                doneToday ? "text-glow" : ""
              }`}
            >
              {habit.name}
            </span>
            {habit.skillName && (
              <Badge
                variant="outline"
                className="border-glow-purple/30 text-glow-purple text-[10px] font-mono px-1.5 py-0"
              >
                {habit.categoryIcon ?? "⚔️"} {habit.skillName} · +
                {habit.xpPerCompletion} XP
              </Badge>
            )}
          </div>
          {habit.currentStreak > 0 && (
            <span className="text-xs text-xp font-mono mt-0.5 block">
              🔥 {habit.currentStreak} day
              {habit.currentStreak === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {/* Last 7 days dots */}
        <div className="hidden sm:flex items-center gap-1">
          {dateRange.slice(-7).map((d) => {
            const isToday = d === today;
            const done = completedSet.has(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => handleToggle(d)}
                disabled={loading}
                title={d}
                className={`h-5 w-5 rounded-full transition-all hover:scale-125 ${
                  done
                    ? "bg-glow shadow-[0_0_6px_rgba(0,255,136,0.6)]"
                    : isToday
                      ? "bg-glow/10 border border-glow/40"
                      : "bg-muted/40 hover:bg-muted"
                }`}
              />
            );
          })}
        </div>

        {/* Actions on hover */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setEditOpen(true)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-destructive"
            onClick={handleDelete}
          >
            Del
          </Button>
        </div>
      </div>

      <HabitDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        habit={habit}
        subskillGroups={subskillGroups}
      />
    </>
  );
}
