"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AchievementTile } from "@/components/achievements/achievement-tile";
import { AchievementRow } from "@/components/achievements/achievement-row";
import { NewAchievementDialog } from "@/components/achievements/new-achievement-dialog";
import {
  ACHIEVEMENT_MODULES,
  moduleForTrigger,
  unitForTrigger,
  formatProgressNumber,
  type AchievementModuleKey,
} from "@/components/achievements/modules";
import type { Achievement } from "@/modules/skills/types";

type CategoryLite = {
  id: string;
  name: string;
  icon: string | null;
};

type Filter = "all" | "unlocked" | "locked" | "close";
type ViewMode = "grid" | "list" | "timeline";

export function AchievementsView({
  achievements,
  categories,
  progress,
  perHabit,
}: {
  achievements: Achievement[];
  categories: CategoryLite[];
  progress: Record<string, number>;
  perHabit: Record<string, { streak: number; total: number }>;
}) {
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<ViewMode>("list");

  // ---- Progress lookup per achievement ----
  function progressFor(a: Achievement): number | null {
    if (a.triggerType === "habit_streak" && a.triggerHabitId) {
      return perHabit[a.triggerHabitId]?.streak ?? 0;
    }
    if (a.triggerType === "habit_total" && a.triggerHabitId) {
      return perHabit[a.triggerHabitId]?.total ?? 0;
    }
    if (
      a.triggerType === "manual" ||
      a.triggerType === "subskill_mastered" ||
      a.triggerType === "stage_reached" ||
      a.triggerType === "all_mastered" ||
      a.triggerType === "quest_completed" ||
      a.triggerType === "reading_list_completed" ||
      a.triggerType === "book_burst" ||
      a.triggerType === "book_rating_streak" ||
      a.triggerType === "book_monthly_streak"
    ) {
      return null;
    }
    return progress[a.triggerType] ?? null;
  }

  function pctFor(a: Achievement): number {
    if (a.isUnlocked) return 100;
    const p = progressFor(a);
    if (p == null || a.triggerCount == null || a.triggerCount <= 0) return 0;
    return Math.min(100, (p / a.triggerCount) * 100);
  }

  // ---- Filtering ----
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return achievements.filter((a) => {
      if (q) {
        const inName = a.name.toLowerCase().includes(q);
        const inDesc = a.description?.toLowerCase().includes(q) ?? false;
        if (!inName && !inDesc) return false;
      }
      if (filter === "unlocked" && !a.isUnlocked) return false;
      if (filter === "locked" && a.isUnlocked) return false;
      if (filter === "close") {
        if (a.isUnlocked) return false;
        const p = pctFor(a);
        if (p < 10) return false;
      }
      return true;
    });
  }, [achievements, filter, search]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Stats summary ----
  const total = achievements.length;
  const unlocked = achievements.filter((a) => a.isUnlocked).length;
  const overallPct = total === 0 ? 0 : (unlocked / total) * 100;

  function AchievementGroup({ list }: { list: Achievement[] }) {
    if (view === "list") {
      return (
        <ul className="space-y-1.5">
          {list.map((a) => (
            <li key={a.id}>
              <AchievementRow achievement={a} progress={progressFor(a)} />
            </li>
          ))}
        </ul>
      );
    }
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {list.map((a) => (
          <AchievementTile
            key={a.id}
            achievement={a}
            progress={progressFor(a)}
          />
        ))}
      </div>
    );
  }

  // ---- Up next: 3 locked, highest progress > 0 ----
  const upNext = useMemo(() => {
    return achievements
      .filter((a) => !a.isUnlocked && progressFor(a) != null)
      .map((a) => ({ a, pct: pctFor(a) }))
      .filter((x) => x.pct > 0 && x.pct < 100)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3);
  }, [achievements, progress, perHabit]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Most-recent unlock ----
  const newestUnlocked = useMemo(() => {
    return achievements
      .filter((a) => a.isUnlocked && a.unlockedAt)
      .sort((a, b) => {
        const ta = new Date(a.unlockedAt as Date).getTime();
        const tb = new Date(b.unlockedAt as Date).getTime();
        return tb - ta;
      })[0];
  }, [achievements]);

  // ---- Group filtered into sections ----
  // 1. Skill categories (by categoryId)
  // 2. Module groups (by triggerType → module)
  // 3. Custom (manual + everything else)
  const byCategory = new Map<string, Achievement[]>();
  const byModule = new Map<AchievementModuleKey, Achievement[]>();
  const customs: Achievement[] = [];

  for (const a of filtered) {
    if (a.categoryId) {
      const list = byCategory.get(a.categoryId) ?? [];
      list.push(a);
      byCategory.set(a.categoryId, list);
      continue;
    }
    const mod = moduleForTrigger(a.triggerType);
    if (mod) {
      const list = byModule.get(mod.key) ?? [];
      list.push(a);
      byModule.set(mod.key, list);
      continue;
    }
    customs.push(a);
  }

  function sectionCountText(list: Achievement[]) {
    const u = list.filter((a) => a.isUnlocked).length;
    return `${u}/${list.length}`;
  }

  // ---- Timeline data ----
  const timeline = useMemo(() => {
    const dated = filtered.filter((a) => a.isUnlocked && a.unlockedAt);
    dated.sort((a, b) => {
      const ta = new Date(a.unlockedAt as Date).getTime();
      const tb = new Date(b.unlockedAt as Date).getTime();
      return tb - ta;
    });
    const groups = new Map<string, Achievement[]>();
    for (const a of dated) {
      const d = new Date(a.unlockedAt as Date);
      const key = d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
      });
      const list = groups.get(key) ?? [];
      list.push(a);
      groups.set(key, list);
    }
    return Array.from(groups.entries());
  }, [filtered]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-end justify-between flex-wrap gap-3 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Achievements</h1>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setView("grid")}
              className={`h-7 px-3 rounded-md text-xs font-mono transition-colors ${
                view === "grid"
                  ? "bg-glow/10 text-glow border border-glow"
                  : "text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              🏆 Grid
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`h-7 px-3 rounded-md text-xs font-mono transition-colors ${
                view === "list"
                  ? "bg-glow/10 text-glow border border-glow"
                  : "text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              📃 List
            </button>
            <button
              type="button"
              onClick={() => setView("timeline")}
              className={`h-7 px-3 rounded-md text-xs font-mono transition-colors ${
                view === "timeline"
                  ? "bg-glow/10 text-glow border border-glow"
                  : "text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              📅 Timeline
            </button>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                Total Progress
              </div>
              <div className="text-3xl font-mono text-glow mt-1">
                {unlocked}
                <span className="text-muted-foreground">/{total}</span>
              </div>
            </div>
            {newestUnlocked && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">{newestUnlocked.icon}</span>
                <div className="text-left">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
                    Newest unlock
                  </div>
                  <div className="text-sm font-medium leading-tight">
                    {newestUnlocked.name}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    {newestUnlocked.unlockedAt &&
                      new Date(
                        newestUnlocked.unlockedAt
                      ).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                Completion
              </div>
              <div className="text-3xl font-mono text-xp mt-1">
                {overallPct.toFixed(0)}%
              </div>
            </div>
          </div>
          <Progress value={overallPct} className="h-2 xp-bar" />
        </div>
      </div>

      {/* Up next */}
      {upNext.length > 0 && view === "grid" && (
        <section>
          <h2 className="text-xs font-mono uppercase tracking-wider text-glow mb-2">
            🎯 Up next
          </h2>
          <div className="grid gap-2 sm:grid-cols-3">
            {upNext.map(({ a, pct }) => (
              <div
                key={a.id}
                className="rounded-lg border border-border/60 bg-card/40 p-3 flex items-center gap-3 hover:border-glow/40 transition-colors"
              >
                <span className="text-3xl shrink-0 grayscale opacity-70">
                  {a.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium line-clamp-1">
                    {a.name}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-0.5 tabular-nums">
                    {formatProgressNumber(progressFor(a) as number)}/
                    {formatProgressNumber(a.triggerCount as number)}
                    {unitForTrigger(a.triggerType)}
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-glow/70"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-mono text-glow tabular-nums shrink-0">
                  {pct.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Filter row */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
          All
        </FilterPill>
        <FilterPill
          active={filter === "unlocked"}
          onClick={() => setFilter("unlocked")}
        >
          ✓ Unlocked
        </FilterPill>
        <FilterPill
          active={filter === "locked"}
          onClick={() => setFilter("locked")}
        >
          🔒 Locked
        </FilterPill>
        <FilterPill
          active={filter === "close"}
          onClick={() => setFilter("close")}
        >
          🎯 Close to unlock
        </FilterPill>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search achievements…"
          className="h-7 text-xs flex-1 min-w-[160px]"
        />
        <span className="text-[10px] font-mono text-muted-foreground">
          {filtered.length} shown
        </span>
      </div>

      {/* Body */}
      {view === "timeline" ? (
        <TimelineView groups={timeline} progressFor={progressFor} />
      ) : (
        <>
          {/* Sections per skill category */}
          {categories.map((cat) => {
            const list = byCategory.get(cat.id);
            if (!list || list.length === 0) return null;
            return (
              <section key={cat.id}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-lg font-semibold uppercase tracking-wide flex items-center gap-2">
                    <span className="text-xl">{cat.icon ?? "📚"}</span>
                    {cat.name}
                  </h2>
                  <span className="text-xs text-muted-foreground font-mono">
                    {sectionCountText(list)}
                  </span>
                </div>
                <AchievementGroup list={list} />
              </section>
            );
          })}

          {/* Sections per module */}
          {ACHIEVEMENT_MODULES.map((mod) => {
            const list = byModule.get(mod.key);
            if (!list || list.length === 0) return null;
            // Sort: locked w/ highest progress first, then unlocked, then by triggerCount.
            const sorted = [...list].sort((a, b) => {
              if (a.isUnlocked !== b.isUnlocked)
                return a.isUnlocked ? 1 : -1;
              return (a.triggerCount ?? 0) - (b.triggerCount ?? 0);
            });
            return (
              <section key={mod.key}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-lg font-semibold uppercase tracking-wide flex items-center gap-2">
                    <span className="text-xl">{mod.icon}</span>
                    {mod.name}
                  </h2>
                  <span className="text-xs text-muted-foreground font-mono">
                    {sectionCountText(list)}
                  </span>
                </div>
                <AchievementGroup list={sorted} />
              </section>
            );
          })}

          {/* Custom (user-created) */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold uppercase tracking-wide flex items-center gap-2">
                <span className="text-xl">🎯</span>
                Custom
                {customs.length > 0 && (
                  <span className="text-xs text-muted-foreground font-mono ml-1 normal-case tracking-normal">
                    {sectionCountText(customs)}
                  </span>
                )}
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setNewDialogOpen(true)}
              >
                + New Achievement
              </Button>
            </div>
            {customs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing custom yet. Create your own achievements — things you
                want to do but that aren&apos;t tied to any specific skill.
              </p>
            ) : (
              <AchievementGroup list={customs} />
            )}
          </section>
        </>
      )}

      <NewAchievementDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
      />
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

function TimelineView({
  groups,
  progressFor,
}: {
  groups: [string, Achievement[]][];
  progressFor: (a: Achievement) => number | null;
}) {
  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic text-center py-12">
        No unlocks match the current filter — try widening the filter to see
        your trophy timeline.
      </p>
    );
  }
  return (
    <div className="space-y-6">
      {groups.map(([label, list]) => (
        <section key={label}>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-sm font-mono uppercase tracking-wider text-glow">
              {label}
            </h2>
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-mono text-muted-foreground">
              {list.length} unlock{list.length === 1 ? "" : "s"}
            </span>
          </div>
          <ul className="space-y-1.5">
            {list.map((a) => (
              <li
                key={a.id}
                className="rounded-md border border-border/60 bg-card/40 px-3 py-2 flex items-center gap-3 hover:border-glow/40 transition-colors"
              >
                <span className="text-2xl shrink-0">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-sm font-medium">{a.name}</span>
                    {a.description && (
                      <span className="text-[11px] text-muted-foreground line-clamp-1">
                        {a.description}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0 tabular-nums">
                  {a.unlockedAt &&
                    new Date(a.unlockedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <span className="hidden">{progressFor.name}</span>
    </div>
  );
}
