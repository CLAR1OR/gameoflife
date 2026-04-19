import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth-server";
import {
  getCategoryById,
  getSkillsByCategory,
  getAchievementsByCategory,
} from "@/modules/skills/queries";
import { SkillTreeView } from "@/components/skill-tree/skill-tree-view";
import { SkillStageHeader } from "@/components/skill-tree/skill-stage-header";
import { AchievementsRow } from "@/components/achievements/achievements-row";

export default async function SkillTreePage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const session = await requireSession();
  const category = await getCategoryById(categoryId, session.user.id);

  if (!category) notFound();

  const skills = await getSkillsByCategory(categoryId, session.user.id);
  const achievements = await getAchievementsByCategory(
    categoryId,
    session.user.id
  );

  return (
    <div>
      <div className="mb-3">
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
    </div>
  );
}
