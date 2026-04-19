import { requireSession } from "@/lib/auth-server";
import {
  getHabitsWithStatus,
  getSubskillsGrouped,
} from "@/modules/habits/queries";
import { HabitsView } from "./habits-view";

export default async function HabitsPage() {
  const session = await requireSession();
  const habits = await getHabitsWithStatus(session.user.id, 30);
  const subskillGroups = await getSubskillsGrouped(session.user.id);

  return <HabitsView habits={habits} subskillGroups={subskillGroups} />;
}
