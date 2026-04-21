"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { completeQuest } from "@/modules/quests/actions";
import { toast } from "sonner";
import type { Quest } from "@/modules/quests/types";

// =====================
// Main Quest — compact banner
// =====================
export function DashboardMainQuest({ quest }: { quest: Quest }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleComplete() {
    setLoading(true);
    try {
      const result = await completeQuest(quest.id);
      toast.success(`Quest complete! +${result.xp} XP`, {
        description: `"${quest.name}"`,
      });
      if (result.newAchievements.length > 0) {
        toast.success(
          `🏆 Achievement unlocked: ${result.newAchievements.join(", ")}!`,
          { duration: 6000 }
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setLoading(false);
  }

  return (
    <div className="rounded-xl border-2 border-xp/40 bg-card glow-gold overflow-hidden">
      <div className="p-3 flex items-start gap-3">
        <div className="text-3xl shrink-0 drop-shadow-lg">{quest.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <Badge
              variant="outline"
              className="border-xp/40 text-xp bg-black/20 text-[9px] font-mono px-1.5 py-0"
            >
              ⚔️ MAIN
            </Badge>
            <Badge
              variant="outline"
              className="border-xp/40 text-xp bg-black/20 text-[9px] font-mono px-1.5 py-0"
            >
              +{quest.xpReward} XP
            </Badge>
          </div>
          <h3 className="text-sm font-bold leading-tight">{quest.name}</h3>
          {quest.description && (
            <button
              type="button"
              onClick={() => setExpanded((s) => !s)}
              className="text-[10px] text-muted-foreground hover:text-foreground mt-1 flex items-center gap-1 transition-colors"
            >
              <span>{expanded ? "▾" : "▸"}</span>
              <span>{expanded ? "Hide" : "Details"}</span>
            </button>
          )}
          {expanded && quest.description && (
            <p className="text-xs text-foreground/80 whitespace-pre-wrap mt-1.5">
              {quest.description}
            </p>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleComplete}
          disabled={loading}
          className="h-7 px-2 text-xs bg-xp/20 hover:bg-xp/30 text-xp border border-xp/40 shrink-0"
        >
          ✓ Done
        </Button>
      </div>
    </div>
  );
}

export function DashboardEmptyMainQuest() {
  return (
    <Link href="/quests" className="block">
      <div className="rounded-xl border-2 border-dashed border-border bg-muted/10 hover:border-xp/40 hover:bg-xp/5 transition-all p-4 flex items-center justify-center gap-3 text-muted-foreground">
        <span className="text-2xl opacity-40">⚔️</span>
        <div className="text-left">
          <div className="font-mono text-[10px] uppercase tracking-wider opacity-70">
            No Main Quest
          </div>
          <div className="text-xs mt-0.5">Click to set your primary goal</div>
        </div>
      </div>
    </Link>
  );
}

// =====================
// Side Quest — compact square tile
// =====================
export function DashboardSideQuest({ quest }: { quest: Quest }) {
  const [loading, setLoading] = useState(false);

  async function handleComplete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      const result = await completeQuest(quest.id);
      toast.success(`+${result.xp} XP · "${quest.name}"`);
      if (result.newAchievements.length > 0) {
        toast.success(
          `🏆 ${result.newAchievements.join(", ")}!`,
          { duration: 5000 }
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setLoading(false);
  }

  return (
    <Link
      href="/quests"
      className="group block rounded-lg border bg-card border-glow/30 hover:border-glow/60 transition-all p-2 relative"
      title={quest.name}
    >
      <div className="flex items-start justify-between gap-1 mb-1">
        <span className="text-xl drop-shadow-md">{quest.icon}</span>
        <span className="text-[9px] font-mono text-glow/80">
          +{quest.xpReward}
        </span>
      </div>
      <div className="text-[11px] font-medium leading-tight line-clamp-2 mb-1.5 min-h-[1.5em]">
        {quest.name}
      </div>
      <Button
        size="sm"
        onClick={handleComplete}
        disabled={loading}
        className="w-full h-6 text-[10px] bg-glow/20 hover:bg-glow/30 text-glow border border-glow/40 px-1"
      >
        ✓ Done
      </Button>
    </Link>
  );
}

export function DashboardEmptySideQuest() {
  return (
    <Link
      href="/quests"
      className="block aspect-square rounded-lg border border-dashed border-border bg-muted/10 hover:border-glow/40 hover:bg-glow/5 transition-all flex flex-col items-center justify-center gap-1"
    >
      <span className="text-2xl text-muted-foreground/30">?</span>
      <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/50">
        Empty
      </span>
    </Link>
  );
}
