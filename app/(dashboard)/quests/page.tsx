import { requireSession } from "@/lib/auth-server";
import {
  getActiveQuests,
  getArchivedQuests,
  getBacklogQuests,
  getActivatedQuestTemplateIds,
  getQuestStats,
} from "@/modules/quests/queries";
import { QUEST_TEMPLATES } from "@/lib/quest-templates";
import { QuestsView } from "./quests-view";

export default async function QuestsPage() {
  const session = await requireSession();
  const [active, archive, backlog, stats, activatedIds] = await Promise.all([
    getActiveQuests(session.user.id),
    getArchivedQuests(session.user.id),
    getBacklogQuests(session.user.id),
    getQuestStats(session.user.id),
    getActivatedQuestTemplateIds(session.user.id),
  ]);

  const templates = QUEST_TEMPLATES.filter((t) => !activatedIds.has(t.id));

  return (
    <QuestsView
      active={active}
      backlog={backlog}
      archive={archive}
      stats={stats}
      templates={templates}
    />
  );
}
