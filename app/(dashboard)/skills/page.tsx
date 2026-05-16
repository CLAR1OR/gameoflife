import { requireSession } from "@/lib/auth-server";
import { getCategoriesByUser, getActivatedTemplateIds } from "@/modules/skills/queries";
import { getCategoryIdsWithHabits } from "@/modules/habits/queries";
import { getAvailableTemplates } from "@/lib/skill-templates";
import { SkillsView } from "./skills-view";

export default async function SkillsPage() {
  const session = await requireSession();
  const categories = await getCategoriesByUser(session.user.id);
  const activatedTemplateIds = await getActivatedTemplateIds(session.user.id);
  const allTemplates = getAvailableTemplates();
  const categoryIdsWithHabits = await getCategoryIdsWithHabits(session.user.id);

  const availableTemplates = allTemplates.filter(
    (t) => !activatedTemplateIds.includes(t.id)
  );

  const decorate = (c: (typeof categories)[number]) => ({
    ...c,
    hasHabit: categoryIdsWithHabits.has(c.id),
  });

  const active = categories.filter((c) => c.status === "active").map(decorate);
  const background = categories
    .filter((c) => c.status === "background")
    .map(decorate);
  const inactive = categories
    .filter((c) => c.status === "inactive")
    .map(decorate);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Skills</h1>
      <SkillsView
        active={active}
        background={background}
        inactive={inactive}
        availableTemplates={availableTemplates}
      />
    </div>
  );
}
