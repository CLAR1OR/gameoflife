import Link from "next/link";
import { requireSession } from "@/lib/auth-server";
import { getCategoriesByUser, getTodaysQuests } from "@/modules/skills/queries";
import {
  getCategoryIdsWithHabits,
  getHabitsWithStatus,
  getTotalAccountXp,
} from "@/modules/habits/queries";
import { getActiveQuests } from "@/modules/quests/queries";
import { MAX_SIDE_QUESTS } from "@/modules/quests/types";
import { todayISO } from "@/lib/date";
import { ensureLevelAchievementsSeeded } from "@/lib/account-achievements";
import { ensureFinanceAchievementsSeeded } from "@/lib/finance-achievements";
import { getUserSettings } from "@/modules/settings/queries";
import { isFeatureEnabled } from "@/modules/settings/features";
import { getNetWorth, getAccountAttention } from "@/modules/finance/queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CharacterStatusBar } from "@/components/dashboard/character-status-bar";
import {
  DashboardFocusTile,
  EmptyFocusTile,
} from "@/components/dashboard/dashboard-focus-tile";
import { DashboardHabitRow } from "@/components/dashboard/dashboard-habit-row";
import {
  DashboardMainQuest,
  DashboardEmptyMainQuest,
  DashboardSideQuest,
  DashboardEmptySideQuest,
} from "@/components/dashboard/dashboard-quest-tiles";
import { DashboardTodaysQuestRow } from "@/components/dashboard/dashboard-todays-quest";

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
  await ensureFinanceAchievementsSeeded(userId);

  const [
    categories,
    categoryIdsWithHabits,
    habits,
    quests,
    totalAccountXp,
    settings,
    netWorth,
    accountAttention,
  ] = await Promise.all([
    getCategoriesByUser(userId),
    getCategoryIdsWithHabits(userId),
    getHabitsWithStatus(userId, 30),
    getActiveQuests(userId),
    getTotalAccountXp(userId),
    getUserSettings(userId),
    getNetWorth(userId),
    getAccountAttention(userId),
  ]);

  const todaysQuestsEnabled = isFeatureEnabled(settings.features, "todaysQuests");
  const todaysQuests = todaysQuestsEnabled ? await getTodaysQuests(userId) : [];

  const today = todayISO();
  const activeSkills = categories
    .filter((c) => c.status === "active")
    .map((c) => ({
      ...c,
      hasHabit: categoryIdsWithHabits.has(c.id),
    }));

  const activeHabits = habits.filter((h) => !h.paused);
  const habitsDoneToday = activeHabits.filter((h) =>
    h.kind === "irregular"
      ? h.todayCount > 0
      : h.completedDates.includes(today)
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
        netWorth={netWorth}
        currency={settings.currency}
        staleAccountCount={accountAttention.staleAccountCount}
        totalAccounts={accountAttention.totalAccounts}
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

      {/* Today's Quests — one suggested next milestone per active skill (opt-in) */}
      {todaysQuestsEnabled && todaysQuests.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-sm font-mono uppercase tracking-wider text-glow">
              🎯 Today&apos;s Quests
            </h2>
            <Badge
              variant="outline"
              className="border-glow/30 text-glow/70 text-[10px] font-mono"
            >
              {todaysQuests.length}
            </Badge>
          </div>
          <div className="space-y-2">
            {todaysQuests.map((q) => (
              <DashboardTodaysQuestRow key={q.milestoneId} quest={q} />
            ))}
          </div>
        </section>
      )}

      {/* Two-column: quests left, habits right */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        {/* Left column: Main + Side quests */}
        <div className="space-y-6">
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
                Manage →
              </Link>
            </div>
            {quests.main ? (
              <DashboardMainQuest quest={quests.main} />
            ) : (
              <DashboardEmptyMainQuest />
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
            <div className="grid grid-cols-5 gap-2">
              {sideSlots.map((q, i) =>
                q ? (
                  <DashboardSideQuest key={q.id} quest={q} />
                ) : (
                  <DashboardEmptySideQuest key={`empty-${i}`} />
                )
              )}
            </div>
          </section>
        </div>

        {/* Right column: Habits list */}
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
              Manage →
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
            <div className="space-y-2">
              {activeHabits.map((h) => (
                <DashboardHabitRow key={h.id} habit={h} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
