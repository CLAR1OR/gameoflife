import { requireSession } from "@/lib/auth-server";
import { getCategoriesByUser, getActivatedTemplateIds } from "@/modules/skills/queries";
import { getCategoryIdsWithHabits } from "@/modules/habits/queries";
import { getUserSettings } from "@/modules/settings/queries";
import { getAvailableTemplates } from "@/lib/skill-templates";
import { getSkillCoverPack, resolveSkillCover } from "@/lib/skill-covers";
import { SkillsView } from "./skills-view";

export default async function SkillsPage() {
  const session = await requireSession();
  const [categories, activatedTemplateIds, categoryIdsWithHabits, settings] =
    await Promise.all([
      getCategoriesByUser(session.user.id),
      getActivatedTemplateIds(session.user.id),
      getCategoryIdsWithHabits(session.user.id),
      getUserSettings(session.user.id),
    ]);
  const allTemplates = getAvailableTemplates();

  const availableTemplates = allTemplates.filter(
    (t) => !activatedTemplateIds.includes(t.id)
  );

  const pack = getSkillCoverPack(settings.skillCoverPack);

  // Decorate each activated category with its resolved cover (user
  // upload → pack image → fallback gradient) and habit-link badge.
  const decorate = (c: (typeof categories)[number]) => ({
    ...c,
    hasHabit: categoryIdsWithHabits.has(c.id),
    resolvedCover: resolveSkillCover(c, pack),
  });

  // Resolve covers for the template gallery too, so picking from a pack
  // with images shows the actual art.
  const templatesWithCovers = availableTemplates.map((t) => ({
    ...t,
    resolvedCover: resolveSkillCover(
      { coverImage: t.coverImage, coverKey: t.coverKey ?? null },
      pack
    ),
  }));

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
        availableTemplates={templatesWithCovers}
      />
    </div>
  );
}
