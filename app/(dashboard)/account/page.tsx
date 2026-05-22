import { requireSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { habit, habitCompletion, skill } from "@/lib/db/schema";
import { and, count, eq } from "drizzle-orm";
import { getCategoriesByUser } from "@/modules/skills/queries";
import { getTotalAccountXp } from "@/modules/habits/queries";
import { getQuestStats } from "@/modules/quests/queries";
import { getAchievementCounts } from "@/lib/account-achievements";
import { getUserSettings } from "@/modules/settings/queries";
import { getNetWorth, getAccountAttention } from "@/modules/finance/queries";
import {
  getBookStats,
  getBooksReadThisYear,
} from "@/modules/books/queries";
import { isFeatureEnabled } from "@/modules/settings/features";
import { formatMoney } from "@/lib/money";
import { getLevelProgress } from "@/lib/level";
import { CharacterStatusBar } from "@/components/dashboard/character-status-bar";
import { Badge } from "@/components/ui/badge";
import { FeatureToggles } from "@/components/account/feature-toggles";
import { CurrencyPicker } from "@/components/account/currency-picker";
import { ThemePicker } from "@/components/account/theme-picker";
import {
  SkillCoverPackPicker,
  type PackOption,
} from "@/components/account/skill-cover-pack-picker";
import { listSkillCoverPacks } from "@/lib/skill-covers";
import { ResetFinanceButton } from "@/components/account/reset-finance-button";
import { BackupSection } from "@/components/account/backup-section";
import { IntegrationsSection } from "@/components/account/integrations-section";
import { getIntegrationStatuses } from "@/modules/integrations/queries";
import { ActivityTimeline } from "@/components/account/activity-timeline";
import {
  XpBarChart,
  HabitHeatmap,
  ActivitySummaryCards,
} from "@/components/account/analytics-charts";
import {
  getTimeline,
  getDailyXp,
  getHabitHeatmap,
  getActivitySummary,
} from "@/modules/activity/queries";
import { SignOutButton } from "./sign-out-button";

function formatDate(d: Date | number | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "number" ? new Date(d * 1000) : d;
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function daysSince(d: Date | number | null | undefined): number | null {
  if (!d) return null;
  const date = typeof d === "number" ? new Date(d * 1000) : d;
  const diff = Date.now() - date.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: "glow" | "glow-purple" | "xp" | "neutral";
}) {
  const accentClass =
    accent === "glow"
      ? "text-glow border-glow/20"
      : accent === "glow-purple"
        ? "text-glow-purple border-glow-purple/20"
        : accent === "xp"
          ? "text-xp border-xp/20"
          : "text-foreground border-border/60";
  return (
    <div className={`rounded-xl border bg-card p-4 ${accentClass}`}>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
        {label}
      </div>
      <div className="text-2xl font-mono mt-1">{value}</div>
      {sub && (
        <div className="text-[10px] text-muted-foreground/70 font-mono mt-0.5">
          {sub}
        </div>
      )}
    </div>
  );
}

export default async function AccountPage() {
  const session = await requireSession();
  const userId = session.user.id;

  const [
    totalAccountXp,
    categories,
    questStats,
    achievementCounts,
    settings,
    netWorth,
    accountAttention,
    totalSubskillsResult,
    totalHabitsResult,
    habitCompletionsResult,
    bookStats,
    booksThisYear,
    timeline,
    dailyXp,
    habitHeatmap,
    activitySummary,
    integrationStatuses,
  ] = await Promise.all([
    getTotalAccountXp(userId),
    getCategoriesByUser(userId),
    getQuestStats(userId),
    getAchievementCounts(userId),
    getUserSettings(userId),
    getNetWorth(userId),
    getAccountAttention(userId),
    db.select({ c: count() }).from(skill).where(eq(skill.userId, userId)),
    db
      .select({ c: count() })
      .from(habit)
      .where(and(eq(habit.userId, userId), eq(habit.archived, false))),
    db
      .select({ c: count() })
      .from(habitCompletion)
      .where(eq(habitCompletion.userId, userId)),
    getBookStats(userId),
    getBooksReadThisYear(userId),
    getTimeline(userId, 60),
    getDailyXp(userId, 30),
    getHabitHeatmap(userId, 365),
    getActivitySummary(userId, 30),
    getIntegrationStatuses(userId),
  ]);

  const level = getLevelProgress(totalAccountXp);
  const activeSkills = categories.filter((c) => c.status === "active");
  const backgroundSkills = categories.filter((c) => c.status === "background");

  // Count mastered subskills (level 4) via a direct query
  const [masteredRow] = await db
    .select({ c: count() })
    .from(skill)
    .where(and(eq(skill.userId, userId), eq(skill.level, 4)));

  const joined = session.user.createdAt
    ? new Date(session.user.createdAt as unknown as string | Date)
    : null;
  const daysAdventuring = daysSince(joined);

  // List cover packs available on disk + build small preview strips.
  const packs: PackOption[] = listSkillCoverPacks().map((p) => {
    const sampleUrls: string[] = [];
    const it = p.images.entries();
    for (let i = 0; i < 4; i++) {
      const next = it.next();
      if (next.done) break;
      const [stem, ext] = next.value;
      sampleUrls.push(`/skill-covers/${p.name}/${stem}.${ext}`);
    }
    return {
      name: p.name,
      imageCount: p.images.size,
      sampleUrls,
    };
  });

  return (
    <div className="space-y-8">
      {/* Character Status Bar */}
      <CharacterStatusBar
        name={session.user.name}
        totalXp={totalAccountXp}
        netWorth={netWorth}
        currency={settings.currency}
        staleAccountCount={accountAttention.staleAccountCount}
        totalAccounts={accountAttention.totalAccounts}
        totalBooksRead={bookStats.read}
        booksReadThisYear={booksThisYear}
        yearlyBookGoal={settings.yearlyBookGoal}
        showNetWorth={isFeatureEnabled(settings.features, "statusBarNetWorth")}
        showBooks={isFeatureEnabled(settings.features, "statusBarBooks")}
      />

      {/* Identity */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
          Identity
        </h2>
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-0.5">
                Name
              </div>
              <div className="font-medium">{session.user.name}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-0.5">
                Email
              </div>
              <div className="font-mono text-sm break-all">
                {session.user.email}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-0.5">
                Adventurer since
              </div>
              <div className="font-medium">
                {formatDate(joined)}
                {daysAdventuring !== null && (
                  <span className="text-muted-foreground text-xs font-mono ml-2">
                    ({daysAdventuring} day
                    {daysAdventuring === 1 ? "" : "s"})
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap pt-2">
            <Badge variant="outline" className="text-xs font-mono">
              Level {level.level}
            </Badge>
            <Badge
              variant="outline"
              className="text-xs font-mono uppercase tracking-wider"
            >
              {level.tier.name}
            </Badge>
            <Badge variant="outline" className="text-xs font-mono">
              {totalAccountXp.toLocaleString()} XP
            </Badge>
          </div>
        </div>
      </section>

      {/* Stats grid */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
          Stats
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <StatCard
            label="Skills"
            value={categories.length}
            sub={`${activeSkills.length} active · ${backgroundSkills.length} bg`}
            accent="glow"
          />
          <StatCard
            label="Subskills"
            value={totalSubskillsResult[0].c}
            sub={`${masteredRow.c} mastered`}
            accent="glow-purple"
          />
          <StatCard
            label="Achievements"
            value={`${achievementCounts.unlocked}/${achievementCounts.total}`}
            sub={`${
              achievementCounts.total === 0
                ? 0
                : Math.round(
                    (achievementCounts.unlocked / achievementCounts.total) *
                      100
                  )
            }% unlocked`}
            accent="xp"
          />
          <StatCard
            label="Quests completed"
            value={questStats.mainCompleted + questStats.sideCompleted}
            sub={`${questStats.mainCompleted} main · ${questStats.sideCompleted} side`}
            accent="glow"
          />
          <StatCard
            label="Active habits"
            value={totalHabitsResult[0].c}
            accent="glow-purple"
          />
          <StatCard
            label="Habit check-offs"
            value={habitCompletionsResult[0].c}
            sub="all time"
            accent="glow"
          />
          <StatCard
            label="Quest XP earned"
            value={questStats.totalXpFromQuests.toLocaleString()}
            accent="xp"
          />
          <StatCard
            label="Net worth"
            value={formatMoney(netWorth, settings.currency)}
            sub="sum of accounts"
            accent="neutral"
          />
        </div>
      </section>

      {/* Analytics */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
          Analytics
        </h2>
        <div className="space-y-3">
          <ActivitySummaryCards summary={activitySummary} days={30} />
          <XpBarChart buckets={dailyXp} />
          <HabitHeatmap days={habitHeatmap} />
        </div>
      </section>

      {/* Theme */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
          Theme
        </h2>
        <ThemePicker initial={settings.theme} />
        <p className="text-[11px] text-muted-foreground/70 mt-2">
          Picks the colour palette for the entire app. Switches instantly.
        </p>
      </section>

      {/* Skill cover pack */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
          Skill cover pack
        </h2>
        <SkillCoverPackPicker packs={packs} initial={settings.skillCoverPack} />
      </section>

      {/* Preferences */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
          Preferences
        </h2>
        <CurrencyPicker initial={settings.currency} />
      </section>

      {/* Optional features */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
          Optional Features
        </h2>
        <FeatureToggles initial={settings.features} />
        <p className="text-[11px] text-muted-foreground/70 mt-2">
          Toggle dashboard modules and status-bar widgets. Changes apply
          immediately.
        </p>
      </section>

      {/* Integrations */}
      <section id="integrations" className="scroll-mt-20">
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
          Integrations
        </h2>
        <IntegrationsSection statuses={integrationStatuses} />
      </section>

      {/* Backup & migration */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
          Backup &amp; migration
        </h2>
        <BackupSection userEmail={session.user.email} />
      </section>

      {/* Activity timeline — moved below the settings so options are
          reachable without scrolling past the timeline. */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
          Recent activity
        </h2>
        <ActivityTimeline events={timeline} />
      </section>

      {/* Danger zone */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-3">
          Danger zone
        </h2>
        <div className="rounded-xl border bg-card divide-y divide-border/60">
          <div className="flex items-center justify-between gap-4 flex-wrap p-5">
            <div>
              <div className="text-sm font-medium">Reset finance data</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Wipe all accounts, transactions, recurring rules, and
                net-worth history. Earned XP stays.
              </div>
            </div>
            <ResetFinanceButton />
          </div>
          <div className="flex items-center justify-between gap-4 flex-wrap p-5">
            <div>
              <div className="text-sm font-medium">Sign out</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                End your current session on this device.
              </div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </section>
    </div>
  );
}
