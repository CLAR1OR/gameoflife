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
import {
  createHabit,
  updateHabit,
  type AutoAchievementSpec,
} from "@/modules/habits/actions";
import { toast } from "sonner";
import type { Habit } from "@/modules/habits/types";
import type { SubskillGroup } from "./types";

const ICONS = [
  "✅", "⏰", "🧘", "🎹", "🎸", "🇷🇺", "🇫🇷", "🇪🇸",
  "👥", "❄️", "🚫", "📚", "✍️", "🏃", "🏋️", "💧",
  "🥗", "😴", "☀️", "🌙", "🧠", "💻", "🎯", "🔥",
];

const AUTO_ACHIEVEMENT_OPTIONS: {
  id: string;
  label: string;
  spec: AutoAchievementSpec;
  defaultOn?: boolean;
}[] = [
  { id: "streak-7", label: "7-day streak", spec: { kind: "streak", days: 7 }, defaultOn: true },
  { id: "streak-30", label: "30-day streak", spec: { kind: "streak", days: 30 }, defaultOn: true },
  { id: "streak-100", label: "100-day streak", spec: { kind: "streak", days: 100 } },
  { id: "total-50", label: "50 completions", spec: { kind: "total", count: 50 }, defaultOn: true },
  { id: "total-100", label: "100 completions", spec: { kind: "total", count: 100 } },
  { id: "total-365", label: "365 completions", spec: { kind: "total", count: 365 } },
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
  const [kind, setKind] = useState<"daily" | "irregular">("daily");
  const [skillId, setSkillId] = useState<string | null>(null);
  const [xpPerCompletion, setXpPerCompletion] = useState("1");
  const [targetPerWeek, setTargetPerWeek] = useState(7);
  const [selectedAchievements, setSelectedAchievements] = useState<Set<string>>(
    new Set(
      AUTO_ACHIEVEMENT_OPTIONS.filter((o) => o.defaultOn).map((o) => o.id)
    )
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setDescription(habit.description ?? "");
      setIcon(habit.icon);
      setKind(habit.kind);
      setSkillId(habit.skillId);
      setXpPerCompletion(String(habit.xpPerCompletion));
      setTargetPerWeek(habit.targetPerWeek ?? 7);
    } else {
      setName("");
      setDescription("");
      setIcon("✅");
      setKind("daily");
      setSkillId(null);
      setXpPerCompletion("1");
      setTargetPerWeek(7);
      setSelectedAchievements(
        new Set(
          AUTO_ACHIEVEMENT_OPTIONS.filter((o) => o.defaultOn).map((o) => o.id)
        )
      );
    }
  }, [habit, open]);

  function toggleAchievement(id: string) {
    setSelectedAchievements((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const base = {
        name: name.trim(),
        description: description.trim() || null,
        icon,
        kind,
        skillId,
        xpPerCompletion: parseInt(xpPerCompletion) || 1,
        targetPerWeek: kind === "daily" ? targetPerWeek : 7,
      };
      if (isEditing) {
        await updateHabit(habit.id, base);
        toast.success("Habit updated");
      } else {
        const autoAchievements = AUTO_ACHIEVEMENT_OPTIONS.filter((o) =>
          selectedAchievements.has(o.id)
        ).map((o) => o.spec);
        await createHabit({
          ...base,
          description: base.description ?? undefined,
          autoAchievements: autoAchievements.length ? autoAchievements : undefined,
        });
        toast.success(
          autoAchievements.length
            ? `Habit created with ${autoAchievements.length} achievements`
            : "Habit created"
        );
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
              <Label>Kind</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setKind("daily")}
                  className={`rounded-md border px-3 py-2 text-left transition-colors ${
                    kind === "daily"
                      ? "border-glow/50 bg-glow/10 text-glow"
                      : "border-border bg-muted/40 hover:bg-accent"
                  }`}
                >
                  <div className="text-sm font-medium">✅ Daily</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Check off once per day · streak tracked
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setKind("irregular")}
                  className={`rounded-md border px-3 py-2 text-left transition-colors ${
                    kind === "irregular"
                      ? "border-glow-purple/50 bg-glow-purple/10 text-glow-purple"
                      : "border-border bg-muted/40 hover:bg-accent"
                  }`}
                >
                  <div className="text-sm font-medium">🔁 Irregular</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Tap +1 anytime · no streak
                  </div>
                </button>
              </div>
            </div>
            {kind === "daily" && (
              <div className="space-y-2">
                <Label>Target per week</Label>
                <div className="flex gap-1 flex-wrap">
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setTargetPerWeek(n)}
                      className={`h-8 min-w-9 px-2 rounded-md border text-sm font-mono transition-colors ${
                        targetPerWeek === n
                          ? "border-glow bg-glow/10 text-glow"
                          : "border-border bg-muted/40 hover:bg-accent text-muted-foreground"
                      }`}
                      title={
                        n === 7
                          ? "Every day — streak breaks on any miss"
                          : `${n}× per week — streak counts consecutive weeks meeting the target`
                      }
                    >
                      {n === 7 ? "7 (every day)" : `${n}×`}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {targetPerWeek === 7
                    ? "Strict daily — your streak breaks on any missed day."
                    : `Flexible cadence — your streak counts consecutive weeks where you hit at least ${targetPerWeek} completion${targetPerWeek === 1 ? "" : "s"}.`}
                </p>
              </div>
            )}
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
                Goes to the linked skill, or to your general account XP if
                unlinked.
              </p>
            </div>

            {!isEditing && (
              <div className="space-y-2">
                <Label>Auto-create achievements</Label>
                <p className="text-xs text-muted-foreground">
                  Achievements that unlock automatically based on this habit.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {AUTO_ACHIEVEMENT_OPTIONS.filter(
                    (o) => !(kind === "irregular" && o.spec.kind === "streak")
                  ).map((opt) => {
                    const checked = selectedAchievements.has(opt.id);
                    const isStreak = opt.spec.kind === "streak";
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleAchievement(opt.id)}
                        className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs transition-colors text-left ${
                          checked
                            ? "border-glow/40 bg-glow/10 text-glow"
                            : "border-border bg-muted/40 hover:bg-accent"
                        }`}
                      >
                        <span>
                          {isStreak ? "🔥" : "⭐"} {opt.label}
                        </span>
                        <span
                          className={`h-4 w-4 rounded border flex items-center justify-center text-[10px] ${
                            checked
                              ? "border-glow bg-glow text-background"
                              : "border-border"
                          }`}
                        >
                          {checked ? "✓" : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
