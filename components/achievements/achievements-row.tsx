"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AchievementTile } from "./achievement-tile";
import { NewAchievementDialog } from "./new-achievement-dialog";
import type { Achievement } from "@/modules/skills/types";

export function AchievementsRow({
  categoryId,
  achievements,
}: {
  categoryId: string;
  achievements: Achievement[];
}) {
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const unlocked = achievements.filter((a) => a.isUnlocked).length;

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold uppercase tracking-wide">
            🏆 Achievements
          </h2>
          {achievements.length > 0 && (
            <span className="text-xs text-muted-foreground font-mono">
              {unlocked}/{achievements.length}
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setNewDialogOpen(true)}
        >
          + New Achievement
        </Button>
      </div>

      {achievements.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No achievements yet. Create one to track meaningful milestones.
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {achievements.map((a) => (
            <AchievementTile key={a.id} achievement={a} />
          ))}
        </div>
      )}

      <NewAchievementDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        categoryId={categoryId}
      />
    </section>
  );
}
