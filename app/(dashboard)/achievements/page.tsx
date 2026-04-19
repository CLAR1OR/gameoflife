import { requireSession } from "@/lib/auth-server";
import {
  getAchievementsByUser,
  getCategoriesByUser,
} from "@/modules/skills/queries";
import { AchievementsView } from "./achievements-view";

export default async function AchievementsPage() {
  const session = await requireSession();
  const achievements = await getAchievementsByUser(session.user.id);
  const categories = await getCategoriesByUser(session.user.id);

  return (
    <AchievementsView achievements={achievements} categories={categories} />
  );
}
