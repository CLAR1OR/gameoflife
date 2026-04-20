import Link from "next/link";
import { requireSession } from "@/lib/auth-server";
import { getCategoriesByUser } from "@/modules/skills/queries";
import {
  getCategoryIdsWithHabits,
  getHabitsWithStatus,
  getTotalAccountXp,
} from "@/modules/habits/queries";
import { getActiveQuests } from "@/modules/quests/queries";
import { MAX_SIDE_QUESTS } from "@/modules/quests/types";
import { todayISO } from "@/lib/date";
import { ensureLevelAchievementsSeeded } from "@/lib/account-achievements";
import { getUserSettings } from "@/modules/settings/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CharacterStatusBar } from "@/components/dashboard/character-status-bar";
import {
  DashboardFocusTile,
  EmptyFocusTile,
} from "@/components/dashboard/dashboard-focus-tile";
import { DashboardHabitRow } from "@/components/dashboard/dashboard-habit-row";
import { QuestSlot } from "@/components/quests/quest-slot";

const FOCUS_SLOTS = 3;

function formatFriendlyDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default async function DashboardPage() {
  const session = await requireSession();
  const userId = session.user.id;

  await ensureLevelAchievementsSeeded(userId);

  const [
    categories,
    categoryIdsWithHabits,
    habits,
    quests,
    totalAccountXp,
    settings,
  ] = await Promise.all([
    getCategoriesByUser(userId),
    getCategoryIdsWithHabits(userId),
    getHabitsWithStatus(userId, 30),
    getActiveQuests(userId),
    getTotalAccountXp(userId),
    getUserSettings(userId),
  ]);

  const today = todayISO();
  const activeSkills = categories
    .filter((c) => c.status === "active")
    .map((c) => ({
      ...c,
      hasHabit: categoryIdsWithHabits.has(c.id),
    }));

  const activeHabits = habits.filter((h) => !h.paused);
  const habitsDoneToday = activeHabits.filter((h) =>
    h.completedDates.includes(today)
  ).length;

  const focusSlots = Array.from(
    { length: FOCUS_SLOTS },
    (_, i) => activeSkills[i] ?? null
  );
  const sideSlots = Array.from(
    { length: MAX_SIDE_QUESTS },
    (_, i) => quests.side[i] ?? null
  );

  return (
    <div className="space-y-8">
      {/* Character status bar */}
      <CharacterStatusBar
        name={session.user.name}
        totalXp={totalAccountXp}
        netWorth={settings.netWorth}
      />

      {/* Date */}
      <p className="text-sm text-muted-foreground -mt-4 font-mono">
        {formatFriendlyDate(today)}
      </p>

      {/* Current Focus */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-sm font-mono uppercase tracking-wider text-glow">
            ⚔️ Current Focus
          </h2>
          <Badge
            variant="outline"
            className="border-glow/30 text-glow/70 text-[10px] font-mono"
          >
            {activeSkills.length}/{FOCUS_SLOTS}
          </Badge>
          <Link
            href="/skills"
            className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Manage skills →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {focusSlots.map((s, i) =>
            s ? (
              <DashboardFocusTile key={s.id} skill={s} />
            ) : (
              <EmptyFocusTile key={`empty-${i}`} />
            )
          )}
        </div>
      </section>

      {/* Today's Habits */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-sm font-mono uppercase tracking-wider text-glow">
            🔄 Today&apos;s Habits
          </h2>
          {activeHabits.length > 0 && (
            <Badge
              variant="outline"
              className="border-glow/30 text-glow/70 text-[10px] font-mono"
            >
              {habitsDoneToday}/{activeHabits.length}
            </Badge>
          )}
          <Link
            href="/habits"
            className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Manage habits →
          </Link>
        </div>
        {activeHabits.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">
                No active habits yet.
              </p>
              <Link href="/habits">
                <Button size="sm" variant="outline">
                  Create your first habit →
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {activeHabits.map((h) => (
              <DashboardHabitRow key={h.id} habit={h} />
            ))}
          </div>
        )}
      </section>

      {/* Main Quest */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-sm font-mono uppercase tracking-wider text-xp">
            ⚔️ Main Quest
          </h2>
          <Link
            href="/quests"
            className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Manage quests →
          </Link>
        </div>
        {quests.main ? (
          <QuestSlot quest={quests.main} variant="main" />
        ) : (
          <Link href="/quests" className="block">
            <div className="rounded-2xl border-2 border-dashed border-border bg-muted/10 hover:border-xp/40 hover:bg-xp/5 transition-all p-8 flex items-center justify-center gap-3 text-muted-foreground">
              <span className="text-4xl opacity-40">⚔️</span>
              <div className="text-left">
                <div className="font-mono text-xs uppercase tracking-wider opacity-70">
                  No Main Quest
                </div>
                <div className="text-sm mt-0.5">
                  Click to set your primary goal
                </div>
              </div>
            </div>
          </Link>
        )}
      </section>

      {/* Side Quests */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-sm font-mono uppercase tracking-wider text-glow">
            📜 Side Quests
          </h2>
          <Badge
            variant="outline"
            className="border-glow/30 text-glow/70 text-[10px] font-mono"
          >
            {quests.side.length}/{MAX_SIDE_QUESTS}
          </Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {sideSlots.map((q, i) =>
            q ? (
              <QuestSlot key={q.id} quest={q} variant="side" />
            ) : (
              <Link key={`empty-${i}`} href="/quests" className="block">
                <div className="aspect-square w-full rounded-xl border-2 border-dashed border-border bg-muted/10 hover:border-glow/40 hover:bg-glow/5 transition-all flex flex-col items-center justify-center gap-2">
                  <span className="text-4xl text-muted-foreground/30">?</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">
                    Empty Slot
                  </span>
                </div>
              </Link>
            )
          )}
        </div>
      </section>
    </div>
  );
}
