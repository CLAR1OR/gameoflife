"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { HabitRow } from "@/components/habits/habit-row";
import { IrregularHabitRow } from "@/components/habits/irregular-habit-row";
import { HabitDialog } from "@/components/habits/habit-dialog";
import { calcDailyStreak, lastNDates, todayISO } from "@/lib/date";
import type { HabitWithLink } from "@/modules/habits/types";
import type { SubskillGroup } from "@/components/habits/types";
import type { OverallHabitStats } from "@/modules/habits/queries";

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
  overallStats,
  totalAccountXp,
}: {
  habits: HabitWithLink[];
  subskillGroups: SubskillGroup[];
  overallStats: OverallHabitStats;
  totalAccountXp: number;
}) {
  const [newOpen, setNewOpen] = useState(false);

  const today = todayISO();
  const dateRange = useMemo(() => lastNDates(7), []);

  const active = habits.filter((h) => !h.paused);
  const paused = habits.filter((h) => h.paused);
  const dailyActive = active.filter((h) => h.kind === "daily");
  const irregularActive = active.filter((h) => h.kind === "irregular");

  const doneToday = dailyActive.filter((h) =>
    h.completedDates.includes(today)
  ).length;
  const todayPct =
    dailyActive.length === 0 ? 0 : (doneToday / dailyActive.length) * 100;

  // Daily streak: consecutive days where at least one *daily* habit was completed
  const dailyStreak = useMemo(
    () => calcDailyStreak(dailyActive.map((h) => h.completedDates)),
    [dailyActive]
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
      {dailyActive.length > 0 && (
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                Today
              </div>
              <div className="text-3xl font-mono text-glow mt-1">
                {doneToday}
                <span className="text-muted-foreground">
                  /{dailyActive.length}
                </span>
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
              Daily actions that build momentum. Each completion can give XP
              to a linked skill, or to your general account XP.
            </p>
          </div>
          <div className="flex justify-center">
            <Button onClick={() => setNewOpen(true)}>+ New Habit</Button>
          </div>
        </div>
      )}

      {/* Daily habits section */}
      {dailyActive.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
            ✅ Daily
          </h2>
          {/* 7-day date header */}
          <div className="flex items-center gap-3 pl-[calc(2.75rem+0.75rem)]">
            <div className="flex-1" />
            <div className="hidden sm:flex items-center gap-2 pr-[calc(4rem+0.25rem)]">
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
          <div className="space-y-2">
            {dailyActive.map((h) => (
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

      {/* Irregular habits section */}
      {irregularActive.length > 0 && (
        <section className="space-y-2 pt-2">
          <h2 className="text-xs font-mono uppercase tracking-wider text-glow-purple">
            🔁 Irregular
          </h2>
          <p className="text-xs text-muted-foreground">
            Tap to log anytime. No streak — just a running count.
          </p>
          <div className="space-y-2">
            {irregularActive.map((h) => (
              <IrregularHabitRow
                key={h.id}
                habit={h}
                subskillGroups={subskillGroups}
              />
            ))}
          </div>
        </section>
      )}

      {/* Paused habits */}
      {paused.length > 0 && (
        <section className="space-y-2 pt-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            ⏸ Paused ({paused.length})
          </h2>
          <div className="space-y-2">
            {paused.map((h) =>
              h.kind === "irregular" ? (
                <IrregularHabitRow
                  key={h.id}
                  habit={h}
                  subskillGroups={subskillGroups}
                />
              ) : (
                <HabitRow
                  key={h.id}
                  habit={h}
                  dateRange={dateRange}
                  subskillGroups={subskillGroups}
                />
              )
            )}
          </div>
        </section>
      )}

      {/* Overall statistics */}
      {overallStats.totalCompletions > 0 && (
        <section className="pt-6">
          <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
            📊 Overall Statistics
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard
              label="Total Account XP"
              value={totalAccountXp.toLocaleString()}
              accent="xp"
            />
            <StatCard
              label="Habit XP"
              value={overallStats.totalXpFromHabits.toLocaleString()}
              accent="glow"
              sub={`${overallStats.xpToSkills} → skills, ${overallStats.generalXp} general`}
            />
            <StatCard
              label="Total completions"
              value={overallStats.totalCompletions.toLocaleString()}
              accent="glow-purple"
            />
            <StatCard
              label="Best daily streak"
              value={`🔥 ${overallStats.bestDailyStreak}`}
              accent="xp"
            />
            <StatCard
              label="Avg / day (30d)"
              value={overallStats.avgCompletionsPerDay.toString()}
              accent="glow"
              sub={`${overallStats.last30DaysCompletions} in last 30 days`}
            />
            <StatCard
              label="Active habits"
              value={overallStats.activeHabits.toString()}
              accent="glow-purple"
              sub={
                overallStats.pausedHabits > 0
                  ? `${overallStats.pausedHabits} paused`
                  : undefined
              }
            />
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

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: "glow" | "glow-purple" | "xp";
}) {
  const accentClass =
    accent === "glow"
      ? "text-glow border-glow/20"
      : accent === "glow-purple"
        ? "text-glow-purple border-glow-purple/20"
        : "text-xp border-xp/20";
  return (
    <div className={`rounded-xl border bg-card p-3 ${accentClass}`}>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
        {label}
      </div>
      <div className="text-xl font-mono mt-1">{value}</div>
      {sub && (
        <div className="text-[10px] text-muted-foreground/70 font-mono mt-0.5 truncate">
          {sub}
        </div>
      )}
    </div>
  );
}
