import { requireSession } from "@/lib/auth-server";
import {
  getHabitsWithStatus,
  getSubskillsGrouped,
  getOverallHabitStats,
  getTotalAccountXp,
} from "@/modules/habits/queries";
import { HabitsView } from "./habits-view";

export default async function HabitsPage() {
  const session = await requireSession();
  const habits = await getHabitsWithStatus(session.user.id, 30);
  const subskillGroups = await getSubskillsGrouped(session.user.id);
  const overallStats = await getOverallHabitStats(session.user.id);
  const totalAccountXp = await getTotalAccountXp(session.user.id);

  return (
    <HabitsView
      habits={habits}
      subskillGroups={subskillGroups}
      overallStats={overallStats}
      totalAccountXp={totalAccountXp}
    />
  );
}
