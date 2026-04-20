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
import { createHabit, updateHabit } from "@/modules/habits/actions";
import { toast } from "sonner";
import type { Habit } from "@/modules/habits/types";
import type { SubskillGroup } from "./types";

const ICONS = [
  "✅", "⏰", "🧘", "🎹", "🎸", "🇷🇺", "🇫🇷", "🇪🇸",
  "👥", "❄️", "🚫", "📚", "✍️", "🏃", "🏋️", "💧",
  "🥗", "😴", "☀️", "🌙", "🧠", "💻", "🎯", "🔥",
];

export function HabitDialog({
  open,
  onOpenChange,
  habit,
  subskillGroups,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit?: Habit;
  subskillGroups: SubskillGroup[];
}) {
  const isEditing = !!habit;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("✅");
  const [skillId, setSkillId] = useState<string | null>(null);
  const [xpPerCompletion, setXpPerCompletion] = useState("1");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setDescription(habit.description ?? "");
      setIcon(habit.icon);
      setSkillId(habit.skillId);
      setXpPerCompletion(String(habit.xpPerCompletion));
    } else {
      setName("");
      setDescription("");
      setIcon("✅");
      setSkillId(null);
      setXpPerCompletion("1");
    }
  }, [habit, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const data = {
        name: name.trim(),
        description: description.trim() || null,
        icon,
        skillId,
        xpPerCompletion: parseInt(xpPerCompletion) || 1,
      };
      if (isEditing) {
        await updateHabit(habit.id, data);
        toast.success("Habit updated");
      } else {
        await createHabit({ ...data, description: data.description ?? undefined });
        toast.success("Habit created");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Habit" : "New Habit"}
            </DialogTitle>
            <DialogDescription>
              Something to check off each day. Link to a skill and completions
              give it XP.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="habit-name">Name</Label>
              <Input
                id="habit-name"
                placeholder="e.g., Morning meditation"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="habit-desc">Description (optional)</Label>
              <textarea
                id="habit-desc"
                rows={3}
                placeholder="What does this habit mean? How should you do it?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            <div className="space-y-2">
              <Label htmlFor="habit-skill">Link to skill (optional)</Label>
              <select
                id="habit-skill"
                value={skillId ?? ""}
                onChange={(e) => setSkillId(e.target.value || null)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— Not linked —</option>
                {subskillGroups.map((g) => (
                  <optgroup
                    key={g.categoryId}
                    label={`${g.categoryIcon ?? ""} ${g.categoryName}`}
                  >
                    {g.subskills.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {subskillGroups.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Activate a skill first to link habits to subskills.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="habit-xp">XP per completion</Label>
              <Input
                id="habit-xp"
                type="number"
                min="1"
                max="25"
                value={xpPerCompletion}
                onChange={(e) => setXpPerCompletion(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Only applies if linked to a skill.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create Habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
