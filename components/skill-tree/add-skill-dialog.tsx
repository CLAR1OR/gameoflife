"use client";

import { useState } from "react";
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
import { createSkill } from "@/modules/skills/actions";
import type { Skill } from "@/modules/skills/types";

export function AddSkillDialog({
  open,
  onOpenChange,
  categoryId,
  existingSkills,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  existingSkills: Skill[];
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPrereqs, setSelectedPrereqs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function togglePrereq(id: string) {
    setSelectedPrereqs((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    await createSkill({
      categoryId,
      name: name.trim(),
      description: description.trim() || undefined,
      prerequisiteIds: selectedPrereqs.length > 0 ? selectedPrereqs : undefined,
    });
    setLoading(false);
    setName("");
    setDescription("");
    setSelectedPrereqs([]);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Skill</DialogTitle>
            <DialogDescription>
              Add a new skill to this tree. Optionally select prerequisites.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="skill-name">Skill Name</Label>
              <Input
                id="skill-name"
                placeholder="e.g., TypeScript"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-desc">Description (optional)</Label>
              <Input
                id="skill-desc"
                placeholder="e.g., Typed JavaScript"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            {existingSkills.length > 0 && (
              <div className="space-y-2">
                <Label>Prerequisites (optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Select skills that must be leveled up before unlocking this
                  one.
                </p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {existingSkills.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => togglePrereq(s.id)}
                      className={`rounded-md border px-3 py-1.5 text-xs transition-colors ${
                        selectedPrereqs.includes(s.id)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted hover:bg-accent"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Adding..." : "Add Skill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
