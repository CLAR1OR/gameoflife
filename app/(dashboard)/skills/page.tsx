import { requireSession } from "@/lib/auth-server";
import { getCategoriesByUser } from "@/modules/skills/queries";
import { CategoryList } from "./category-list";

export default async function SkillsPage() {
  const session = await requireSession();
  const categories = await getCategoriesByUser(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Skills</h1>
      </div>
      <CategoryList categories={categories} />
    </div>
  );
}
