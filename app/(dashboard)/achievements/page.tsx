import { requireSession } from "@/lib/auth-server";
import {
  getAchievementsByUser,
  getCategoriesByUser,
} from "@/modules/skills/queries";
import {
  getAchievementProgress,
  getPerHabitProgress,
} from "@/lib/achievement-progress";
import { AchievementsView } from "./achievements-view";

export default async function AchievementsPage() {
  const session = await requireSession();
  const [achievements, categories, progress, perHabit] = await Promise.all([
    getAchievementsByUser(session.user.id),
    getCategoriesByUser(session.user.id),
    getAchievementProgress(session.user.id),
    getPerHabitProgress(session.user.id),
  ]);

  return (
    <AchievementsView
      achievements={achievements}
      categories={categories}
      progress={progress}
      perHabit={perHabit}
    />
  );
}
