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
import { seedRoutinesForCategory } from "@/modules/practice/actions";
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

  const [skills, achievements, linkedHabits, linkedBooks, contribution] =
    await Promise.all([
      getSkillsByCategory(categoryId, session.user.id),
      getAchievementsByCategory(categoryId, session.user.id),
      getLinkedHabitsForCategory(session.user.id, categoryId),
      getLinkedBooksForCategory(session.user.id, categoryId),
      getCategoryContributionStats(session.user.id, categoryId),
    ]);

  // Lazy-seed default deliberate-practice routines for users who activated
  // this skill template before the practice feature shipped.
  let routines = await getRoutinesForCategory(session.user.id, categoryId);
  if (routines.length === 0 && category.templateId) {
    await seedRoutinesForCategory(
      session.user.id,
      categoryId,
      category.templateId
    );
    routines = await getRoutinesForCategory(session.user.id, categoryId);
  }

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
        skillName={category.name}
        coverImage={category.coverImage}
        templateId={category.templateId}
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
      <DeliberatePractice routines={routines} categoryId={category.id} />
    </div>
  );
}
