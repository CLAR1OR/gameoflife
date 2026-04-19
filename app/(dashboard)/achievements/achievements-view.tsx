"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AchievementTile } from "@/components/achievements/achievement-tile";
import { NewAchievementDialog } from "@/components/achievements/new-achievement-dialog";
import type { Achievement } from "@/modules/skills/types";

type CategoryLite = {
  id: string;
  name: string;
  icon: string | null;
};

export function AchievementsView({
  achievements,
  categories,
}: {
  achievements: Achievement[];
  categories: CategoryLite[];
}) {
  const [newDialogOpen, setNewDialogOpen] = useState(false);

  const total = achievements.length;
  const unlocked = achievements.filter((a) => a.isUnlocked).length;
  const pct = total === 0 ? 0 : (unlocked / total) * 100;

  const byCategory = new Map<string, Achievement[]>();
  const custom: Achievement[] = [];
  for (const a of achievements) {
    if (a.source === "custom" && !a.categoryId) {
      custom.push(a);
    } else if (a.categoryId) {
      const list = byCategory.get(a.categoryId) ?? [];
      list.push(a);
      byCategory.set(a.categoryId, list);
    } else {
      custom.push(a);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-4">Achievements</h1>
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                Total Progress
              </div>
              <div className="text-3xl font-mono text-glow mt-1">
                {unlocked}
                <span className="text-muted-foreground">/{total}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                Completion
              </div>
              <div className="text-3xl font-mono text-xp mt-1">
                {pct.toFixed(0)}%
              </div>
            </div>
          </div>
          <Progress value={pct} className="h-2 xp-bar" />
        </div>
      </div>

      {/* Sections per category */}
      {categories.map((cat) => {
        const list = byCategory.get(cat.id);
        if (!list || list.length === 0) return null;
        const catUnlocked = list.filter((a) => a.isUnlocked).length;
        return (
          <section key={cat.id}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-lg font-semibold uppercase tracking-wide flex items-center gap-2">
                <span className="text-xl">{cat.icon ?? "📚"}</span>
                {cat.name}
              </h2>
              <span className="text-xs text-muted-foreground font-mono">
                {catUnlocked}/{list.length}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {list.map((a) => (
                <AchievementTile key={a.id} achievement={a} />
              ))}
            </div>
          </section>
        );
      })}

      {/* Custom / unscoped */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold uppercase tracking-wide">
            🎯 Custom
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setNewDialogOpen(true)}
          >
            + New Achievement
          </Button>
        </div>
        {custom.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing custom yet. Create your own achievements — things you want
            to do but that aren&apos;t tied to any specific skill.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {custom.map((a) => (
              <AchievementTile key={a.id} achievement={a} />
            ))}
          </div>
        )}
      </section>

      <NewAchievementDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
      />
    </div>
  );
}
