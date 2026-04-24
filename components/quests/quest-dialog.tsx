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
import { createQuest, updateQuest } from "@/modules/quests/actions";
import { toast } from "sonner";
import type { Quest } from "@/modules/quests/types";

const ICONS = [
  "📜", "⚔️", "🗡️", "🛡️", "🏰", "🗺️", "🧭", "🔮",
  "💎", "👑", "🔥", "⭐", "🎯", "🏆", "🚀", "🌟",
  "📚", "✍️", "🧠", "💪", "🏃", "🎨", "🎸", "🧘",
];

function dateToInput(d: Date | number | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "number" ? new Date(d * 1000) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function inputToDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function QuestDialog({
  open,
  onOpenChange,
  quest,
  defaultType = "side",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quest?: Quest;
  defaultType?: "main" | "side";
}) {
  const isEditing = !!quest;

  const [type, setType] = useState<"main" | "side">(defaultType);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("📜");
  const [xpReward, setXpReward] = useState("25");
  const [dueAt, setDueAt] = useState("");
  const [initialTasks, setInitialTasks] = useState("");
  const [createAchievement, setCreateAchievement] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (quest) {
      setType(quest.type);
      setName(quest.name);
      setDescription(quest.description ?? "");
      setIcon(quest.icon);
      setXpReward(String(quest.xpReward));
      setDueAt(dateToInput(quest.dueAt));
      setInitialTasks("");
      setCreateAchievement(false);
    } else {
      setType(defaultType);
      setName("");
      setDescription("");
      setIcon(defaultType === "main" ? "⚔️" : "📜");
      setXpReward(defaultType === "main" ? "100" : "25");
      setDueAt("");
      setInitialTasks("");
      setCreateAchievement(false);
    }
  }, [quest, open, defaultType]);

  useEffect(() => {
    if (isEditing) return;
    setIcon(type === "main" ? "⚔️" : "📜");
    setXpReward(type === "main" ? "100" : "25");
  }, [type, isEditing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const base = {
        name: name.trim(),
        description: description.trim() || null,
        icon,
        xpReward: parseInt(xpReward) || 25,
        dueAt: inputToDate(dueAt),
      };
      if (isEditing) {
        await updateQuest(quest.id, base);
        toast.success("Quest updated");
      } else {
        const tasks = initialTasks
          .split("\n")
          .map((t) => t.trim())
          .filter((t) => t.length > 0);
        await createQuest({
          ...base,
          description: base.description ?? undefined,
          type,
          tasks: tasks.length > 0 ? tasks : undefined,
          autoAchievement: createAchievement
            ? { enabled: true }
            : undefined,
        });
        toast.success(
          `${type === "main" ? "Main" : "Side"} quest accepted!`
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
              {isEditing ? "Edit Quest" : "New Quest"}
            </DialogTitle>
            <DialogDescription>
              Something specific you want to accomplish. Completion grants XP to
              your general account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {!isEditing && (
              <div className="space-y-2">
                <Label>Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType("main")}
                    className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                      type === "main"
                        ? "border-xp/50 bg-xp/10 text-xp"
                        : "border-border bg-muted/40 hover:bg-accent"
                    }`}
                  >
                    ⚔️ Main Quest
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("side")}
                    className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                      type === "side"
                        ? "border-glow/50 bg-glow/10 text-glow"
                        : "border-border bg-muted/40 hover:bg-accent"
                    }`}
                  >
                    📜 Side Quest
                  </button>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="quest-name">Name</Label>
              <Input
                id="quest-name"
                placeholder={
                  type === "main"
                    ? "e.g., Ship the MVP"
                    : "e.g., Read 3 books this month"
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quest-desc">Description (optional)</Label>
              <textarea
                id="quest-desc"
                rows={3}
                placeholder="What does done look like? Why does this matter?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="quest-xp">XP Reward</Label>
                <Input
                  id="quest-xp"
                  type="number"
                  min="5"
                  max="1000"
                  value={xpReward}
                  onChange={(e) => setXpReward(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quest-due">Due date (optional)</Label>
                <Input
                  id="quest-due"
                  type="date"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                />
              </div>
            </div>
            {!isEditing && (
              <div className="space-y-2">
                <Label htmlFor="quest-tasks">
                  Checklist (optional) —{" "}
                  <span className="text-muted-foreground font-mono text-[10px]">
                    one per line
                  </span>
                </Label>
                <textarea
                  id="quest-tasks"
                  rows={4}
                  placeholder="e.g.&#10;Draft the outline&#10;Review with a friend&#10;Ship it"
                  value={initialTasks}
                  onChange={(e) => setInitialTasks(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  Break the quest into subtasks. You can add more later.
                </p>
              </div>
            )}
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
            {!isEditing && (
              <div className="space-y-2">
                <Label>Auto-create achievement</Label>
                <button
                  type="button"
                  onClick={() => setCreateAchievement((s) => !s)}
                  className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors text-left ${
                    createAchievement
                      ? "border-glow/40 bg-glow/10 text-glow"
                      : "border-border bg-muted/40 hover:bg-accent"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    🏆 Achievement for completing this quest
                  </span>
                  <span
                    className={`h-4 w-4 rounded border flex items-center justify-center text-[10px] ${
                      createAchievement
                        ? "border-glow bg-glow text-background"
                        : "border-border"
                    }`}
                  >
                    {createAchievement ? "✓" : ""}
                  </span>
                </button>
                <p className="text-xs text-muted-foreground">
                  Unlocks automatically when you mark this quest complete.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Accept Quest"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
