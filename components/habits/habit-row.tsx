"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  toggleHabitCompletion,
  deleteHabit,
  setHabitPaused,
  setHabitArchived,
  reorderHabits,
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
  onMoveUp,
  onMoveDown,
}: {
  habit: HabitWithLink;
  dateRange: string[];
  subskillGroups: SubskillGroup[];
  /** Called when the user clicks ▲ on this row. */
  onMoveUp?: () => void;
  /** Called when the user clicks ▼ on this row. */
  onMoveDown?: () => void;
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

  async function handleArchive() {
    try {
      await setHabitArchived(habit.id, !habit.archived);
      toast.success(
        habit.archived
          ? `Restored "${habit.name}"`
          : `Archived "${habit.name}" — history kept`
      );
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

  const target = habit.targetPerWeek ?? 7;
  const flexible = target < 7;
  const weekProgressPct = flexible
    ? Math.min(100, (habit.thisWeekCount / target) * 100)
    : 0;
  // Keep `reorderHabits` import alive — used at parent level via callbacks.
  void reorderHabits;

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
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {habit.currentStreak > 0 && !isPaused && (
                <span className="text-xs text-xp font-mono">
                  🔥 {habit.currentStreak} {habit.streakUnit}
                  {habit.currentStreak === 1 ? "" : "s"}
                </span>
              )}
              {flexible && !isPaused && (
                <span
                  className={`text-xs font-mono ${
                    habit.thisWeekCount >= target
                      ? "text-glow"
                      : "text-muted-foreground"
                  }`}
                  title={`${habit.thisWeekCount}/${target} completions this week`}
                >
                  📅 {habit.thisWeekCount}/{target} this week
                </span>
              )}
            </div>
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

          {/* Actions on hover. Fixed width on sm+ so the row layout (and
              the date-header strip above) stays aligned regardless of which
              optional buttons render. `justify-end` keeps the rightmost
              button anchored to the right edge. */}
          <div className="flex sm:w-[15rem] gap-0.5 items-center justify-end opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity">
            {onMoveUp && (
              <button
                type="button"
                onClick={onMoveUp}
                className="h-6 w-6 text-xs text-muted-foreground hover:text-foreground"
                title="Move up"
              >
                ▲
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                onClick={onMoveDown}
                className="h-6 w-6 text-xs text-muted-foreground hover:text-foreground"
                title="Move down"
              >
                ▼
              </button>
            )}
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
              className="h-7 px-2 text-xs"
              onClick={handleArchive}
              title={
                habit.archived ? "Restore from archive" : "Archive (keeps history)"
              }
            >
              {habit.archived ? "Restore" : "Archive"}
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

        {flexible && !isPaused && (
          <div className="px-3 pb-2 -mt-1">
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted/40">
              <div
                className="h-full rounded-full bg-glow/70 transition-all"
                style={{ width: `${weekProgressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Expanded: description + stats */}
        {expanded && (
          <div className="border-t border-border/30 mx-3 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 px-4 pt-3 pb-4">
            {/* Description */}
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-1">
                About
              </div>
              {habit.description ? (
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                  {habit.description}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground/60 italic">
                  No description yet —{" "}
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="underline hover:text-foreground"
                  >
                    add one
                  </button>
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="md:border-l md:border-border/30 md:pl-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-2">
                Stats
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div>
                  <div className="text-muted-foreground">Total</div>
                  <div className="font-mono text-base text-foreground">
                    {habit.totalCompletions}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Current</div>
                  <div className="font-mono text-base text-xp">
                    🔥 {habit.currentStreak}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Best</div>
                  <div className="font-mono text-base text-foreground">
                    {habit.bestStreak}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">XP earned</div>
                  <div className="font-mono text-base text-xp">
                    {habit.totalCompletions * habit.xpPerCompletion}
                  </div>
                </div>
              </div>
            </div>
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
