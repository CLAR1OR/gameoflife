"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { HabitRow } from "@/components/habits/habit-row";
import { HabitDialog } from "@/components/habits/habit-dialog";
import { seedDefaultHabits } from "@/modules/habits/actions";
import { calcDailyStreak, lastNDates, todayISO } from "@/lib/date";
import { toast } from "sonner";
import type { HabitWithLink } from "@/modules/habits/types";
import type { SubskillGroup } from "@/components/habits/types";

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"] as const;

function formatFriendlyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function dateInfo(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    weekday: WEEKDAY_LETTERS[date.getDay()],
    day: d,
  };
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

  const active = habits.filter((h) => !h.paused);
  const paused = habits.filter((h) => h.paused);

  const doneToday = active.filter((h) => h.completedDates.includes(today)).length;
  const todayPct = active.length === 0 ? 0 : (doneToday / active.length) * 100;

  // Daily streak: consecutive days where at least one habit was completed
  const dailyStreak = useMemo(
    () => calcDailyStreak(active.map((h) => h.completedDates)),
    [active]
  );

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
      {active.length > 0 && (
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                Today
              </div>
              <div className="text-3xl font-mono text-glow mt-1">
                {doneToday}
                <span className="text-muted-foreground">/{active.length}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                Daily streak
              </div>
              <div className="text-3xl font-mono text-xp mt-1">
                🔥 {dailyStreak}
              </div>
              <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                {dailyStreak === 1 ? "day" : "days"} with ≥1 habit done
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

      {/* 7-day date header */}
      {active.length > 0 && (
        <div className="flex items-center gap-3 pl-[calc(2.75rem+0.75rem)]">
          {/* spacer matches HabitRow: checkbox (h-11 w-11 = 2.75rem) + gap-3 */}
          <div className="flex-1" />
          <div className="hidden sm:flex items-center gap-2 pr-[calc(4rem+0.25rem)]">
            {/* spacer reserves room for edit/delete hover buttons */}
            {dateRange.slice(-7).map((d) => {
              const { weekday, day } = dateInfo(d);
              const isToday = d === today;
              return (
                <div
                  key={d}
                  className={`flex w-6 flex-col items-center gap-0.5 font-mono ${
                    isToday ? "text-glow" : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`text-[10px] uppercase tracking-wider leading-none ${
                      isToday ? "font-bold" : "opacity-60"
                    }`}
                  >
                    {weekday}
                  </span>
                  <span
                    className={`text-[11px] leading-none ${
                      isToday ? "font-bold" : ""
                    }`}
                  >
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active habits */}
      <div className="space-y-2">
        {active.map((h) => (
          <HabitRow
            key={h.id}
            habit={h}
            dateRange={dateRange}
            subskillGroups={subskillGroups}
          />
        ))}
      </div>

      {/* Paused habits */}
      {paused.length > 0 && (
        <section className="space-y-2 pt-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            ⏸ Paused ({paused.length})
          </h2>
          <div className="space-y-2">
            {paused.map((h) => (
              <HabitRow
                key={h.id}
                habit={h}
                dateRange={dateRange}
                subskillGroups={subskillGroups}
              />
            ))}
          </div>
        </section>
      )}

      <HabitDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        subskillGroups={subskillGroups}
      />
    </div>
  );
}
