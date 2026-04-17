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

type MilestoneDraft = { name: string; xpReward: number };

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
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([
    { name: "", xpReward: 25 },
  ]);
  const [loading, setLoading] = useState(false);

  function togglePrereq(id: string) {
    setSelectedPrereqs((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function updateMilestone(
    index: number,
    field: keyof MilestoneDraft,
    value: string | number
  ) {
    setMilestones((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  }

  function addMilestoneRow() {
    setMilestones((prev) => [...prev, { name: "", xpReward: 25 }]);
  }

  function removeMilestoneRow(index: number) {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const validMilestones = milestones.filter((m) => m.name.trim());

    setLoading(true);
    await createSkill({
      categoryId,
      name: name.trim(),
      description: description.trim() || undefined,
      prerequisiteIds: selectedPrereqs.length > 0 ? selectedPrereqs : undefined,
      milestones: validMilestones.length > 0 ? validMilestones : undefined,
    });
    setLoading(false);
    setName("");
    setDescription("");
    setSelectedPrereqs([]);
    setMilestones([{ name: "", xpReward: 25 }]);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:!max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Skill</DialogTitle>
            <DialogDescription>
              Define a skill and its milestones. Completing milestones earns XP.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="skill-name">Skill Name</Label>
              <Input
                id="skill-name"
                placeholder="e.g., French"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="skill-desc">Description (optional)</Label>
              <Input
                id="skill-desc"
                placeholder="e.g., Learning French language"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {existingSkills.length > 0 && (
              <div className="space-y-2">
                <Label>Prerequisites (optional)</Label>
                <div className="flex flex-wrap gap-2">
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Milestones</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={addMilestoneRow}
                >
                  + Add milestone
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Concrete things to check off. Each one grants XP when completed.
              </p>
              <div className="space-y-2">
                {milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      placeholder="e.g., Read 1 easy book"
                      value={m.name}
                      onChange={(e) =>
                        updateMilestone(i, "name", e.target.value)
                      }
                      className="flex-1"
                    />
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="1"
                        max="500"
                        value={m.xpReward}
                        onChange={(e) =>
                          updateMilestone(
                            i,
                            "xpReward",
                            parseInt(e.target.value) || 25
                          )
                        }
                        className="w-16 text-center"
                      />
                      <span className="text-xs text-muted-foreground">XP</span>
                    </div>
                    {milestones.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeMilestoneRow(i)}
                      >
                        &times;
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
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
