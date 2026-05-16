"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  completeMilestone,
  uncompleteMilestone,
  addMilestone,
  deleteMilestone,
} from "@/modules/skills/actions";
import { getLevelName, xpForNextLevel } from "@/lib/xp";
import { toast } from "sonner";
import { celebrate } from "@/lib/celebrate";
import type { SkillWithPrerequisites } from "@/modules/skills/types";

export function MilestonePanel({ skill }: { skill: SkillWithPrerequisites }) {
  const [newName, setNewName] = useState("");
  const [newXp, setNewXp] = useState("25");
  const [loading, setLoading] = useState<string | null>(null);

  const isLocked = skill.level === 0;
  const completedCount = skill.milestones.filter((m) => m.completed).length;
  const totalCount = skill.milestones.length;
  const progressInfo = xpForNextLevel(skill.currentXp);

  async function handleToggle(milestoneId: string, currentlyCompleted: boolean) {
    setLoading(milestoneId);
    if (currentlyCompleted) {
      await uncompleteMilestone(milestoneId);
    } else {
      const result = await completeMilestone(milestoneId);
      if (result.leveledUp) {
        toast.success(
          `Level up! ${skill.name} is now ${getLevelName(result.newLevel)}!`,
          { description: `${result.newXp} XP total`, duration: 5000 }
        );
      } else {
        toast.success(`+${result.xpGained} XP — ${result.milestoneName}`, {
          description: `${result.newXp} XP total`,
        });
      }
      if (result.unlocked.length > 0) {
        toast.info(`Unlocked: ${result.unlocked.join(", ")}!`, {
          duration: 5000,
        });
      }
      if (result.newAchievements && result.newAchievements.length > 0) {
        celebrate(result.newAchievements);
      }
    }
    setLoading(null);
  }

  async function handleAddMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await addMilestone({
      skillId: skill.id,
      name: newName.trim(),
      xpReward: parseInt(newXp) || 25,
    });
    setNewName("");
    setNewXp("25");
  }

  async function handleDelete(milestoneId: string) {
    if (!confirm("Delete this milestone?")) return;
    await deleteMilestone(milestoneId);
  }

  return (
    <div className="w-80 border-l border-border/50 bg-sidebar p-4 overflow-y-auto">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-glow">{skill.name}</h2>
          {skill.description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {skill.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={
              isLocked ? "bg-muted text-muted-foreground" : undefined
            }
          >
            {getLevelName(skill.level)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {skill.currentXp} XP
          </span>
        </div>

        {!isLocked && progressInfo && (
          <div>
            <Progress value={progressInfo.progress * 100} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {skill.currentXp} / {progressInfo.nextLevelXp} XP to{" "}
              {getLevelName(skill.level + 1)}
            </p>
          </div>
        )}

        <Separator />

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">
              Milestones{" "}
              {totalCount > 0 && (
                <span className="text-muted-foreground font-normal">
                  ({completedCount}/{totalCount})
                </span>
              )}
            </h3>
          </div>

          {isLocked && (
            <p className="text-sm text-muted-foreground italic">
              Unlock this skill by leveling up its prerequisites first.
            </p>
          )}

          {!isLocked && totalCount === 0 && (
            <p className="text-sm text-muted-foreground">
              No milestones yet. Add some below.
            </p>
          )}

          {!isLocked && (
            <div className="space-y-1">
              {skill.milestones.map((m) => (
                <div
                  key={m.id}
                  className="group flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50 transition-colors"
                >
                  <button
                    onClick={() => handleToggle(m.id, m.completed)}
                    disabled={loading === m.id}
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      m.completed
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-border hover:border-primary"
                    }`}
                  >
                    {m.completed && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                      >
                        <path
                          d="M2 5L4 7L8 3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm leading-tight ${
                        m.completed
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {m.name}
                    </span>
                    <span className="text-[10px] text-xp ml-1.5 font-mono">
                      {m.xpReward} XP
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="opacity-0 group-hover:opacity-100 touch:opacity-100 text-muted-foreground hover:text-destructive text-xs transition-opacity"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {!isLocked && (
          <>
            <Separator />
            <form onSubmit={handleAddMilestone} className="space-y-2">
              <h3 className="text-sm font-medium">Add Milestone</h3>
              <Input
                placeholder="e.g., Read 3 easy books"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="text-sm"
              />
              <div className="flex gap-2">
                <div className="flex items-center gap-1 flex-1">
                  <Input
                    type="number"
                    min="1"
                    max="500"
                    value={newXp}
                    onChange={(e) => setNewXp(e.target.value)}
                    className="w-16 text-center text-sm"
                  />
                  <span className="text-xs text-muted-foreground">XP</span>
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newName.trim()}
                  variant="outline"
                >
                  Add
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
