"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  logIrregularHabit,
  undoLastIrregularLog,
  deleteHabit,
  setHabitPaused,
  setHabitArchived,
} from "@/modules/habits/actions";
import { toast } from "sonner";
import { celebrate } from "@/lib/celebrate";
import type { HabitWithLink } from "@/modules/habits/types";
import { HabitDialog } from "./habit-dialog";
import type { SubskillGroup } from "./types";

export function IrregularHabitRow({
  habit,
  subskillGroups,
  onMoveUp,
  onMoveDown,
}: {
  habit: HabitWithLink;
  subskillGroups: SubskillGroup[];
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const isPaused = habit.paused;

  async function handleLog() {
    if (isPaused) return;
    setLoading(true);
    try {
      const result = await logIrregularHabit(habit.id);
      toast.success(`+1 ${habit.name}`, {
        description: habit.skillName
          ? `+${habit.xpPerCompletion} XP → ${habit.skillName}`
          : `+${habit.xpPerCompletion} XP`,
      });
      if (result.newAchievements.length > 0) {
        celebrate(result.newAchievements);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setLoading(false);
  }

  async function handleUndo() {
    setLoading(true);
    try {
      const result = await undoLastIrregularLog(habit.id);
      if (result.removed) {
        toast.info(`Removed last log of "${habit.name}"`);
      } else {
        toast.info("Nothing logged today");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setLoading(false);
  }

  async function handleTogglePause() {
    try {
      await setHabitPaused(habit.id, !isPaused);
      toast.success(
        isPaused ? `Resumed "${habit.name}"` : `Paused "${habit.name}"`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
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

  return (
    <>
      <div
        className={`group rounded-xl border transition-colors ${
          isPaused
            ? "border-border/40 bg-muted/20 opacity-60"
            : "border-glow-purple/30 bg-card hover:border-glow-purple/60"
        }`}
      >
        <div className="flex items-center gap-3 p-3">
          {/* Large +1 button */}
          <button
            type="button"
            onClick={handleLog}
            disabled={loading || isPaused}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 text-xl transition-all ${
              isPaused
                ? "border-border/30 cursor-not-allowed"
                : "border-glow-purple/50 bg-glow-purple/10 hover:bg-glow-purple/20 hover:scale-105 active:scale-95"
            }`}
            title={isPaused ? "Paused" : "Tap to log +1"}
          >
            <span className={isPaused ? "opacity-40 grayscale" : ""}>
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
              <span className="font-medium leading-tight">{habit.name}</span>
              <Badge
                variant="outline"
                className="border-glow-purple/30 text-glow-purple text-[10px] font-mono px-1.5 py-0"
              >
                🔁 IRREGULAR
              </Badge>
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
            {!isPaused && (
              <div className="flex items-center gap-3 mt-0.5">
                {habit.todayCount > 0 && (
                  <span className="text-xs text-glow-purple font-mono">
                    Today: {habit.todayCount}×
                  </span>
                )}
                <span className="text-xs text-muted-foreground font-mono">
                  All time: {habit.totalCompletions}
                </span>
              </div>
            )}
          </button>

          {/* Actions */}
          <div className="flex gap-1">
            {habit.todayCount > 0 && !isPaused && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={handleUndo}
                disabled={loading}
                title="Undo last log today"
              >
                Undo
              </Button>
            )}
            <div className="flex gap-0.5 items-center opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity">
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
                onClick={async () => {
                  try {
                    await setHabitArchived(habit.id, !habit.archived);
                    toast.success(
                      habit.archived
                        ? `Restored "${habit.name}"`
                        : `Archived "${habit.name}"`
                    );
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Failed");
                  }
                }}
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
        </div>

        {/* Expanded: description + stats */}
        {expanded && (
          <div className="border-t border-border/30 mx-3 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 px-4 pt-3 pb-4">
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
            <div className="md:border-l md:border-border/30 md:pl-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-2">
                Stats
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                <div>
                  <div className="text-muted-foreground">Today</div>
                  <div className="font-mono text-base text-glow-purple">
                    {habit.todayCount}×
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">All time</div>
                  <div className="font-mono text-base text-foreground">
                    {habit.totalCompletions}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">XP earned</div>
                  <div className="font-mono text-base text-xp">
                    {habit.totalCompletions * habit.xpPerCompletion}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Last 7 days</div>
                  <div className="font-mono text-base text-foreground">
                    {habit.completedDates.length}
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
