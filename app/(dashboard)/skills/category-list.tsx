"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryDialog } from "./category-dialog";
import { deleteCategory } from "@/modules/skills/actions";

type CategoryWithCount = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  skillCount: number;
};

export function CategoryList({
  categories,
}: {
  categories: CategoryWithCount[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<CategoryWithCount | null>(null);

  function handleEdit(category: CategoryWithCount) {
    setEditingCategory(category);
    setDialogOpen(true);
  }

  function handleCreate() {
    setEditingCategory(null);
    setDialogOpen(true);
  }

  async function handleDelete(categoryId: string) {
    if (!confirm("Delete this category and all its skills?")) return;
    await deleteCategory(categoryId);
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Card key={cat.id} className="group relative">
            <Link href={`/skills/${cat.id}`}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{cat.icon ?? "📚"}</span>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{cat.name}</CardTitle>
                    {cat.description && (
                      <CardDescription className="line-clamp-2">
                        {cat.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">
                  {cat.skillCount} {cat.skillCount === 1 ? "skill" : "skills"}
                </Badge>
              </CardContent>
            </Link>
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={(e) => {
                  e.preventDefault();
                  handleEdit(cat);
                }}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete(cat.id);
                }}
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}

        <Card
          className="flex cursor-pointer items-center justify-center border-dashed hover:border-primary/50 hover:bg-accent/50 transition-colors min-h-[140px]"
          onClick={handleCreate}
        >
          <div className="text-center text-muted-foreground">
            <span className="text-3xl block mb-1">+</span>
            <span className="text-sm">New Category</span>
          </div>
        </Card>
      </div>

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editingCategory}
      />
    </>
  );
}
