import { requireSession } from "@/lib/auth-server";
import { getCategoriesByUser, getActivatedTemplateIds } from "@/modules/skills/queries";
import { getAvailableTemplates } from "@/lib/skill-templates";
import { SkillsView } from "./skills-view";

export default async function SkillsPage() {
  const session = await requireSession();
  const categories = await getCategoriesByUser(session.user.id);
  const activatedTemplateIds = await getActivatedTemplateIds(session.user.id);
  const allTemplates = getAvailableTemplates();

  const availableTemplates = allTemplates.filter(
    (t) => !activatedTemplateIds.includes(t.id)
  );

  const active = categories.filter((c) => c.status === "active");
  const background = categories.filter((c) => c.status === "background");
  const inactive = categories.filter((c) => c.status === "inactive");

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Skills</h1>
      <SkillsView
        active={active}
        background={background}
        inactive={inactive}
        availableTemplates={availableTemplates}
      />
    </div>
  );
}
