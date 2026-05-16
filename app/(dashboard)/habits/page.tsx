import { requireSession } from "@/lib/auth-server";
import {
  getHabitsWithStatus,
  getSubskillsGrouped,
  getOverallHabitStats,
  getTotalAccountXp,
  getYearCompletionMap,
} from "@/modules/habits/queries";
import { HabitsView } from "./habits-view";

export default async function HabitsPage() {
  const session = await requireSession();
  const [habits, subskillGroups, overallStats, totalAccountXp, yearMap] =
    await Promise.all([
      getHabitsWithStatus(session.user.id, 30, { includeArchived: true }),
      getSubskillsGrouped(session.user.id),
      getOverallHabitStats(session.user.id),
      getTotalAccountXp(session.user.id),
      getYearCompletionMap(session.user.id, 371),
    ]);

  const yearCounts: Record<string, number> = {};
  for (const [date, n] of yearMap.entries()) yearCounts[date] = n;

  return (
    <HabitsView
      habits={habits}
      subskillGroups={subskillGroups}
      overallStats={overallStats}
      totalAccountXp={totalAccountXp}
      yearCounts={yearCounts}
    />
  );
}
