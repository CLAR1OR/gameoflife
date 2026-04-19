"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { HabitRow } from "@/components/habits/habit-row";
import { HabitDialog } from "@/components/habits/habit-dialog";
import { seedDefaultHabits } from "@/modules/habits/actions";
import { lastNDates, todayISO } from "@/lib/date";
import { toast } from "sonner";
import type { HabitWithLink } from "@/modules/habits/types";
import type { SubskillGroup } from "@/components/habits/types";

function formatFriendlyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function HabitsView({
  habits,
  subskillGroups,
}: {
  habits: HabitWithLink[];
  subskillGroups: SubskillGroup[];
}) {
  const [newOpen, setNewOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const today = todayISO();
  const dateRange = useMemo(() => lastNDates(7), []);

  const doneToday = habits.filter((h) => h.completedDates.includes(today)).length;
  const todayPct = habits.length === 0 ? 0 : (doneToday / habits.length) * 100;

  async function handleSeed() {
    setSeeding(true);
    try {
      const result = await seedDefaultHabits();
      if (result.seeded) {
        toast.success("Seeded starter habits — edit to link them to skills");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setSeeding(false);
  }

  const totalCurrentStreak = habits.reduce(
    (sum, h) => sum + h.currentStreak,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Habits</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formatFriendlyDate(today)}
          </p>
        </div>
        <Button onClick={() => setNewOpen(true)}>+ New Habit</Button>
      </div>

      {/* Today's progress */}
      {habits.length > 0 && (
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                Today
              </div>
              <div className="text-3xl font-mono text-glow mt-1">
                {doneToday}
                <span className="text-muted-foreground">/{habits.length}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                Total streak
              </div>
              <div className="text-3xl font-mono text-xp mt-1">
                🔥 {totalCurrentStreak}
              </div>
            </div>
          </div>
          <Progress value={todayPct} className="h-2 xp-bar" />
        </div>
      )}

      {/* Empty state */}
      {habits.length === 0 && (
        <div className="rounded-xl border border-dashed bg-muted/20 p-8 text-center space-y-4">
          <div className="text-5xl">🎯</div>
          <div>
            <p className="font-medium">No habits yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Daily actions that build momentum. Each completion can give XP to
              a skill.
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={handleSeed}
              disabled={seeding}
            >
              {seeding ? "Seeding..." : "Use starter habits"}
            </Button>
            <Button onClick={() => setNewOpen(true)}>+ New Habit</Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Starter habits: Getting up on time, Piano, Meditation, Russian,
            Focusmate Session, Wim Hof practice, No memes
          </p>
        </div>
      )}

      {/* 7-day header row */}
      {habits.length > 0 && (
        <div className="hidden sm:flex items-center justify-end gap-1 pr-32 pl-0 text-[10px] text-muted-foreground font-mono uppercase">
          {dateRange.map((d) => {
            const [, m, day] = d.split("-").map(Number);
            const isToday = d === today;
            return (
              <div
                key={d}
                className={`w-5 text-center ${
                  isToday ? "text-glow font-bold" : ""
                }`}
              >
                {day}/{m}
              </div>
            );
          })}
        </div>
      )}

      {/* Habit list */}
      <div className="space-y-2">
        {habits.map((h) => (
          <HabitRow
            key={h.id}
            habit={h}
            dateRange={dateRange}
            subskillGroups={subskillGroups}
          />
        ))}
      </div>

      <HabitDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        subskillGroups={subskillGroups}
      />
    </div>
  );
}
