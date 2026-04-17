"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory, updateCategory } from "@/modules/skills/actions";

const ICONS = ["📚", "💻", "🎵", "🎨", "🏋️", "🍳", "🔬", "📐", "🌍", "🎮", "💼", "🧘"];

type CategoryData = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
} | null;

export function CategoryDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: CategoryData;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📚");
  const [loading, setLoading] = useState(false);

  const isEditing = category !== null;

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description ?? "");
      setIcon(category.icon ?? "📚");
    } else {
      setName("");
      setDescription("");
      setIcon("📚");
    }
  }, [category, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    if (isEditing) {
      await updateCategory(category.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
      });
    } else {
      await createCategory({
        name: name.trim(),
        description: description.trim() || undefined,
        icon,
      });
    }
    setLoading(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Category" : "New Category"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update your skill category."
                : "Create a new skill category to organize your skills."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                placeholder="e.g., Programming"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description (optional)</Label>
              <Input
                id="cat-desc"
                placeholder="e.g., Software development skills"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`flex h-9 w-9 items-center justify-center rounded-md text-lg transition-colors ${
                      icon === emoji
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-accent"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
