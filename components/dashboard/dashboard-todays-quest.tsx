"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { completeMilestone } from "@/modules/skills/actions";
import { toast } from "sonner";
import type { TodaysQuest } from "@/modules/skills/queries";

export function DashboardTodaysQuestRow({ quest }: { quest: TodaysQuest }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleComplete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const result = await completeMilestone(quest.milestoneId);
      setDone(true);
      const xp = result.xpGained ?? quest.xpReward;
      toast.success(`+${xp} XP · "${quest.milestoneName}"`);
      if (result.leveledUp) {
        toast.success(
          `⬆️ ${quest.skillName} is now level ${result.newLevel}!`,
          { duration: 5000 }
        );
      }
      if (result.unlocked.length > 0) {
        toast.success(`🔓 Unlocked: ${result.unlocked.join(", ")}`, {
          duration: 6000,
        });
      }
      if (result.newAchievements && result.newAchievements.length > 0) {
        toast.success(
          `🏆 Achievement unlocked: ${result.newAchievements.join(", ")}!`,
          { duration: 6000 }
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setLoading(false);
  }

  return (
    <Link
      href={`/skills/${quest.categoryId}`}
      className="group block rounded-lg border bg-card border-glow/30 hover:border-glow/60 transition-all p-2.5"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl shrink-0 drop-shadow-md">
          {quest.categoryIcon ?? "📚"}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="text-[10px] font-mono uppercase tracking-wider text-glow/80">
              {quest.categoryName}
            </span>
            <span className="text-muted-foreground/50 text-[10px]">·</span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {quest.skillName}
            </span>
            <Badge
              variant="outline"
              className="border-glow/40 text-glow bg-black/20 text-[9px] font-mono px-1.5 py-0 ml-auto"
            >
              +{quest.xpReward} XP
            </Badge>
          </div>
          <p className="text-sm font-medium leading-tight truncate">
            {quest.milestoneName}
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleComplete}
          disabled={loading || done}
          className="h-7 px-2 text-xs bg-glow/20 hover:bg-glow/30 text-glow border border-glow/40 shrink-0"
        >
          {done ? "✓" : "✓ Done"}
        </Button>
      </div>
    </Link>
  );
}
