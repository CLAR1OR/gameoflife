"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  toggleHabitCompletion,
  deleteHabit,
  setHabitPaused,
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
  const [expanded, setExpanded] = useState(false);
  const today = todayISO();
  const doneToday = habit.completedDates.includes(today);
  const isPaused = habit.paused;

  async function handleToggle(date: string) {
    if (isPaused) return;
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

  async function handleTogglePause() {
    try {
      await setHabitPaused(habit.id, !isPaused);
      toast.success(isPaused ? `Resumed "${habit.name}"` : `Paused "${habit.name}"`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  const completedSet = new Set(habit.completedDates);

  return (
    <>
      <div
        className={`group rounded-xl border transition-colors ${
          isPaused
            ? "border-border/40 bg-muted/20 opacity-60"
            : "border-border/60 bg-card hover:border-border"
        }`}
      >
        {/* Main row */}
        <div className="flex items-center gap-3 p-3">
          {/* Today's big checkbox */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggle(today);
            }}
            disabled={loading || isPaused}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 text-xl transition-all ${
              isPaused
                ? "border-border/30 cursor-not-allowed"
                : doneToday
                  ? "border-glow bg-glow/20 glow-green"
                  : "border-border/50 hover:border-glow/40 hover:bg-glow/5"
            }`}
            title={
              isPaused
                ? "Paused"
                : doneToday
                  ? "Mark as not done today"
                  : "Mark as done today"
            }
          >
            <span className={doneToday && !isPaused ? "" : "opacity-40 grayscale"}>
              {habit.icon}
            </span>
          </button>

          {/* Clickable body — toggles expand */}
          <button
            type="button"
            onClick={() => setExpanded((s) => !s)}
            className="flex-1 min-w-0 text-left cursor-pointer"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`font-medium leading-tight ${
                  doneToday && !isPaused ? "text-glow" : ""
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
              {habit.description && (
                <span className="text-[10px] text-muted-foreground/60 font-mono">
                  {expanded ? "▾" : "▸"}
                </span>
              )}
            </div>
            {habit.currentStreak > 0 && !isPaused && (
              <span className="text-xs text-xp font-mono mt-0.5 block">
                🔥 {habit.currentStreak} day
                {habit.currentStreak === 1 ? "" : "s"}
              </span>
            )}
          </button>

          {/* Last 7 days dots */}
          {!isPaused && (
            <div className="hidden sm:flex items-center gap-2">
              {dateRange.slice(-7).map((d) => {
                const isToday = d === today;
                const done = completedSet.has(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(d);
                    }}
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
          )}

          {/* Actions on hover */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleTogglePause}
              title={isPaused ? "Resume habit" : "Pause habit"}
            >
              {isPaused ? "Resume" : "Pause"}
            </Button>
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

        {/* Expanded description */}
        {expanded && habit.description && (
          <div className="px-4 pb-4 pt-1 border-t border-border/30 mx-3 mt-0">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap pt-3">
              {habit.description}
            </p>
          </div>
        )}
        {expanded && !habit.description && (
          <div className="px-4 pb-3 pt-1 border-t border-border/30 mx-3 mt-0">
            <p className="text-xs text-muted-foreground/60 italic pt-3">
              No description yet —{" "}
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="underline hover:text-foreground"
              >
                add one
              </button>
            </p>
          </div>
        )}
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
