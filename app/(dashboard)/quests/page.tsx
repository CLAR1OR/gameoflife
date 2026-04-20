import { requireSession } from "@/lib/auth-server";
import {
  getActiveQuests,
  getArchivedQuests,
  getQuestStats,
} from "@/modules/quests/queries";
import { QuestsView } from "./quests-view";

export default async function QuestsPage() {
  const session = await requireSession();
  const active = await getActiveQuests(session.user.id);
  const archive = await getArchivedQuests(session.user.id);
  const stats = await getQuestStats(session.user.id);

  return <QuestsView active={active} archive={archive} stats={stats} />;
}
