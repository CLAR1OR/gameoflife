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
import { Label } from "@/components/ui/label";
import {
  markAchievementManual,
  unmarkAchievementManual,
  updateAchievementIcon,
  deleteAchievement,
} from "@/modules/skills/actions";
import { toast } from "sonner";
import type { Achievement } from "@/modules/skills/types";

const ICON_CHOICES = [
  "🏆", "🥇", "🥈", "🥉", "🎖️", "🏅", "👑", "⭐",
  "💎", "🔥", "⚔️", "🛡️", "🎯", "🚀", "💪", "🧠",
  "📚", "✍️", "🎨", "🎵", "🎸", "🎹", "🍳", "🧂",
  "🧭", "🏕️", "🌲", "🔪", "🥋", "🧘", "💬", "📖",
];

function describeTrigger(a: Achievement): string {
  switch (a.triggerType) {
    case "manual":
      return "Mark manually when achieved";
    case "subskill_mastered":
      return "Unlocks when a specific subskill is mastered";
    case "stage_reached":
      return `Unlocks when skill reaches stage ${a.triggerStage ?? "?"}`;
    case "all_mastered":
      return "Unlocks when every subskill is mastered";
    default:
      return "";
  }
}

export function AchievementDialog({
  achievement,
  open,
  onOpenChange,
}: {
  achievement: Achievement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isManual = achievement.triggerType === "manual";
  const isCustom = achievement.source === "custom";

  async function handleToggle() {
    setLoading(true);
    try {
      if (achievement.isUnlocked) {
        await unmarkAchievementManual(achievement.id);
        toast.success(`Unmarked: ${achievement.name}`);
      } else {
        await markAchievementManual(achievement.id);
        toast.success(`Achievement unlocked: ${achievement.name}! 🏆`);
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setLoading(false);
  }

  async function handleIconChange(icon: string) {
    setLoading(true);
    try {
      await updateAchievementIcon(achievement.id, icon);
      setIconPickerOpen(false);
      toast.success("Icon updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm("Delete this achievement?")) return;
    setLoading(true);
    try {
      await deleteAchievement(achievement.id);
      toast.success("Achievement deleted");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIconPickerOpen((s) => !s)}
              className={`flex h-14 w-14 items-center justify-center rounded-lg text-4xl transition-all ${
                achievement.isUnlocked ? "" : "grayscale opacity-40"
              } hover:bg-accent border border-border`}
              title="Click to change icon"
            >
              {achievement.icon}
            </button>
            <div className="flex-1">
              <DialogTitle>{achievement.name}</DialogTitle>
              {achievement.description && (
                <DialogDescription className="mt-0.5">
                  {achievement.description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {iconPickerOpen && (
          <div className="space-y-2 pt-2">
            <Label className="text-xs text-muted-foreground">
              Pick a new icon
            </Label>
            <div className="grid grid-cols-8 gap-1">
              {ICON_CHOICES.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleIconChange(emoji)}
                  className={`flex h-9 w-9 items-center justify-center rounded-md text-lg transition-colors ${
                    achievement.icon === emoji
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-accent"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2 text-sm pt-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <span
              className={
                achievement.isUnlocked ? "text-glow font-semibold" : ""
              }
            >
              {achievement.isUnlocked ? "✓ Unlocked" : "Locked"}
            </span>
          </div>
          {achievement.unlockedAt && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Unlocked on</span>
              <span>
                {new Date(achievement.unlockedAt).toLocaleDateString()}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Trigger</span>
            <span className="text-xs">{describeTrigger(achievement)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Source</span>
            <span className="text-xs capitalize">{achievement.source}</span>
          </div>
        </div>

        <DialogFooter className="!justify-between gap-2">
          {isCustom ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={loading}
              className="text-destructive hover:text-destructive"
            >
              Delete
            </Button>
          ) : (
            <span />
          )}
          {isManual && (
            <Button
              onClick={handleToggle}
              disabled={loading}
              variant={achievement.isUnlocked ? "outline" : "default"}
            >
              {achievement.isUnlocked ? "Unmark" : "Mark as achieved"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
