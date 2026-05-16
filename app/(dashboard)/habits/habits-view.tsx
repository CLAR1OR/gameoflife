"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { HabitRow } from "@/components/habits/habit-row";
import { IrregularHabitRow } from "@/components/habits/irregular-habit-row";
import { HabitDialog } from "@/components/habits/habit-dialog";
import { YearHeatmap } from "@/components/habits/year-heatmap";
import { reorderHabits } from "@/modules/habits/actions";
import { toast } from "sonner";
import { calcDailyStreak, lastNDates, todayISO } from "@/lib/date";
import { useRouter } from "next/navigation";
import type { HabitWithLink } from "@/modules/habits/types";
import type { SubskillGroup } from "@/components/habits/types";
import type { OverallHabitStats } from "@/modules/habits/queries";

const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"] as const;

type Filter = "all" | "todo" | "done" | "linked" | "unlinked";

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
  yearCounts,
}: {
  habits: HabitWithLink[];
  subskillGroups: SubskillGroup[];
  overallStats: OverallHabitStats;
  totalAccountXp: number;
  yearCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [newOpen, setNewOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const today = todayISO();
  const dateRange = useMemo(() => lastNDates(7), []);

  const archived = habits.filter((h) => h.archived);
  const live = habits.filter((h) => !h.archived);
  const active = live.filter((h) => !h.paused);
  const paused = live.filter((h) => h.paused);

  // Apply search + filter only to ACTIVE habits (paused/archived render as-is).
  function applyFilters(list: HabitWithLink[]): HabitWithLink[] {
    let out = list;
    const q = search.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          (h.description?.toLowerCase().includes(q) ?? false) ||
          (h.skillName?.toLowerCase().includes(q) ?? false) ||
          (h.categoryName?.toLowerCase().includes(q) ?? false)
      );
    }
    if (filter === "todo") {
      out = out.filter((h) =>
        h.kind === "irregular" ? h.todayCount === 0 : !h.completedDates.includes(today)
      );
    } else if (filter === "done") {
      out = out.filter((h) =>
        h.kind === "irregular" ? h.todayCount > 0 : h.completedDates.includes(today)
      );
    } else if (filter === "linked") {
      out = out.filter((h) => !!h.skillName);
    } else if (filter === "unlinked") {
      out = out.filter((h) => !h.skillName);
    }
    return out;
  }

  const dailyActive = active.filter((h) => h.kind === "daily");
  const irregularActive = active.filter((h) => h.kind === "irregular");
  const filteredDaily = applyFilters(dailyActive);
  const filteredIrregular = applyFilters(irregularActive);

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

  const filtersActive = filter !== "all" || search.trim().length > 0;

  // ---- Reorder ----
  // Move within the union of (daily + irregular + paused) — the canonical
  // sortOrder is global so swapping with the row immediately above/below in
  // the same kind suffices for UX.
  async function moveWithinList(list: HabitWithLink[], index: number, dir: -1 | 1) {
    const swapIdx = index + dir;
    if (swapIdx < 0 || swapIdx >= list.length) return;
    const newList = [...list];
    [newList[index], newList[swapIdx]] = [newList[swapIdx], newList[index]];
    // Build the full ordered set by replacing the original list within
    // `live`. Other lists keep their existing order.
    const liveIds = live.map((h) => h.id);
    const subset = new Set(list.map((h) => h.id));
    const newIds: string[] = [];
    let cursor = 0;
    for (const id of liveIds) {
      if (subset.has(id)) {
        newIds.push(newList[cursor].id);
        cursor++;
      } else {
        newIds.push(id);
      }
    }
    try {
      await reorderHabits(newIds);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Habits</h1>
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

      {/* Year heatmap (always show when any history exists) */}
      {overallStats.totalCompletions > 0 && (
        <YearHeatmap counts={yearCounts} />
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

      {/* Filter / search row */}
      {live.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
            All
          </FilterPill>
          <FilterPill
            active={filter === "todo"}
            onClick={() => setFilter("todo")}
          >
            ⏳ To do today
          </FilterPill>
          <FilterPill
            active={filter === "done"}
            onClick={() => setFilter("done")}
          >
            ✓ Done today
          </FilterPill>
          <FilterPill
            active={filter === "linked"}
            onClick={() => setFilter("linked")}
          >
            🔗 Linked
          </FilterPill>
          <FilterPill
            active={filter === "unlinked"}
            onClick={() => setFilter("unlinked")}
          >
            ◯ Unlinked
          </FilterPill>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search habits…"
            className="h-7 text-xs flex-1 min-w-[160px]"
          />
          {filtersActive && (
            <button
              type="button"
              onClick={() => {
                setFilter("all");
                setSearch("");
              }}
              className="text-[11px] font-mono text-muted-foreground hover:text-foreground"
            >
              clear
            </button>
          )}
        </div>
      )}

      {/* Daily habits section */}
      {filteredDaily.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
            ✅ Daily
            <span className="text-muted-foreground/60 ml-2 normal-case tracking-normal">
              {filteredDaily.length}
              {filtersActive && ` of ${dailyActive.length}`}
            </span>
          </h2>
          {/* 7-day date header — mirror of the row's column structure so
              the labels line up perfectly with each row's dots. */}
          {!filtersActive && (
            <div className="hidden sm:flex items-center gap-3 px-3">
              {/* Checkbox-column spacer (matches row's h-11 w-11 button) */}
              <div className="h-11 w-11 shrink-0" />
              {/* Body-column spacer (matches row's flex-1 body) */}
              <div className="flex-1 min-w-0" />
              {/* Dots strip — same gap-2 + w-6 cells as the row's dots */}
              <div className="flex items-center gap-2">
                {dateRange.slice(-7).map((d) => {
                  const { weekday, day } = dateInfo(d);
                  const isToday = d === today;
                  return (
                    <div
                      key={d}
                      className={`flex w-5 flex-col items-center gap-0.5 font-mono ${
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
              {/* Actions-column spacer (matches row's sm:w-[15rem] actions) */}
              <div className="w-[15rem] shrink-0" />
            </div>
          )}
          <div className="space-y-2">
            {filteredDaily.map((h, i) => (
              <HabitRow
                key={h.id}
                habit={h}
                dateRange={dateRange}
                subskillGroups={subskillGroups}
                onMoveUp={
                  !filtersActive && i > 0
                    ? () => moveWithinList(filteredDaily, i, -1)
                    : undefined
                }
                onMoveDown={
                  !filtersActive && i < filteredDaily.length - 1
                    ? () => moveWithinList(filteredDaily, i, 1)
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* Irregular habits section */}
      {filteredIrregular.length > 0 && (
        <section className="space-y-2 pt-2">
          <h2 className="text-xs font-mono uppercase tracking-wider text-glow-purple">
            🔁 Irregular
            <span className="text-muted-foreground/60 ml-2 normal-case tracking-normal">
              {filteredIrregular.length}
              {filtersActive && ` of ${irregularActive.length}`}
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Tap to log anytime. No streak — just a running count.
          </p>
          <div className="space-y-2">
            {filteredIrregular.map((h, i) => (
              <IrregularHabitRow
                key={h.id}
                habit={h}
                subskillGroups={subskillGroups}
                onMoveUp={
                  !filtersActive && i > 0
                    ? () => moveWithinList(filteredIrregular, i, -1)
                    : undefined
                }
                onMoveDown={
                  !filtersActive && i < filteredIrregular.length - 1
                    ? () => moveWithinList(filteredIrregular, i, 1)
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* When filtering, the empty-result message */}
      {filtersActive &&
        filteredDaily.length === 0 &&
        filteredIrregular.length === 0 && (
          <p className="text-sm text-muted-foreground italic text-center py-6">
            No habits match the current filter.
          </p>
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

      {/* Archived */}
      {archived.length > 0 && (
        <section className="space-y-2 pt-4">
          <button
            type="button"
            onClick={() => setShowArchived((s) => !s)}
            className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            🗄 Archived ({archived.length}) {showArchived ? "▾" : "▸"}
          </button>
          {showArchived && (
            <div className="space-y-2">
              {archived.map((h) =>
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
          )}
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

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-mono px-3 py-1 rounded-full border transition-colors ${
        active
          ? "border-glow text-glow bg-glow/10"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
