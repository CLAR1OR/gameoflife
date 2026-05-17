import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth-server";
import {
  getCategoryById,
  getSkillsByCategory,
  getAchievementsByCategory,
} from "@/modules/skills/queries";
import {
  getLinkedHabitsForCategory,
  getLinkedBooksForCategory,
  getCategoryContributionStats,
} from "@/modules/links/queries";
import { getRoutinesForCategory } from "@/modules/practice/queries";
import {
  seedRoutinesForCategory,
  markPracticeRoutinesSeeded,
} from "@/modules/practice/actions";
import { getUserSettings } from "@/modules/settings/queries";
import { getSkillCoverPack, resolveSkillCover } from "@/lib/skill-covers";
import { SkillTreeView } from "@/components/skill-tree/skill-tree-view";
import { SkillStageHeader } from "@/components/skill-tree/skill-stage-header";
import { AchievementsRow } from "@/components/achievements/achievements-row";
import { LinkedItemsPanel } from "@/components/skill-tree/linked-items-panel";
import { DeliberatePractice } from "@/components/skill-tree/deliberate-practice";

export default async function SkillTreePage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const session = await requireSession();
  const category = await getCategoryById(categoryId, session.user.id);

  if (!category) notFound();

  const [
    skills,
    achievements,
    linkedHabits,
    linkedBooks,
    contribution,
    settings,
  ] = await Promise.all([
    getSkillsByCategory(categoryId, session.user.id),
    getAchievementsByCategory(categoryId, session.user.id),
    getLinkedHabitsForCategory(session.user.id, categoryId),
    getLinkedBooksForCategory(session.user.id, categoryId),
    getCategoryContributionStats(session.user.id, categoryId),
    getUserSettings(session.user.id),
  ]);

  const pack = getSkillCoverPack(settings.skillCoverPack);
  const resolvedCover = resolveSkillCover(
    {
      coverImage: category.coverImage,
      coverKey: category.coverKey,
    },
    pack
  );

  // First-visit lazy-seed: if this category has a template but hasn't
  // been seeded yet, run the additive seed once. This catches both fresh
  // activations (no routines yet → seed them) and skills the user
  // activated before this feature shipped (some routines may exist; seed
  // adds any new template routines that ship later). After the first
  // visit we mark practiceRoutinesSeeded so deletions stay sticky and
  // future re-adds have to go through the "↺ Re-add" button.
  if (category.templateId && !category.practiceRoutinesSeeded) {
    await seedRoutinesForCategory(
      session.user.id,
      categoryId,
      category.templateId
    );
    await markPracticeRoutinesSeeded(categoryId);
  }
  const routines = await getRoutinesForCategory(session.user.id, categoryId);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/skills"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to skills
        </Link>
      </div>
      <SkillStageHeader
        categoryId={category.id}
        skillName={category.name}
        resolvedCover={resolvedCover}
        hasCustomCover={category.coverImage?.startsWith("/skills/") ?? false}
        icon={category.icon}
        subskills={skills}
      />
      <SkillTreeView categoryId={category.id} skills={skills} />
      <AchievementsRow
        categoryId={category.id}
        achievements={achievements}
      />
      <LinkedItemsPanel
        habits={linkedHabits}
        books={linkedBooks}
        stats={contribution}
      />
      <DeliberatePractice
        routines={routines}
        categoryId={category.id}
        hasTemplate={!!category.templateId}
      />
    </div>
  );
}
