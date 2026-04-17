import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth-server";
import { getCategoryById, getSkillsByCategory } from "@/modules/skills/queries";
import { SkillTreeView } from "@/components/skill-tree/skill-tree-view";

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

  return (
    <div className="h-full">
      <div className="mb-2">
        <Link
          href="/skills"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to skills
        </Link>
      </div>
      <SkillTreeView
        categoryId={category.id}
        categoryName={`${category.icon ?? ""} ${category.name}`}
        skills={skills}
      />
    </div>
  );
}
