"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuestSlot, EmptyQuestSlot } from "@/components/quests/quest-slot";
import { QuestDialog } from "@/components/quests/quest-dialog";
import { QuestArchive } from "@/components/quests/quest-archive";
import { MAX_SIDE_QUESTS, type QuestStats, type Quest } from "@/modules/quests/types";

export function QuestsView({
  active,
  archive,
  stats,
}: {
  active: { main: Quest | null; side: Quest[] };
  archive: Quest[];
  stats: QuestStats;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"main" | "side">("side");

  function openNew(type: "main" | "side") {
    setDialogType(type);
    setDialogOpen(true);
  }

  const sideSlots = Array.from({ length: MAX_SIDE_QUESTS }, (_, i) => active.side[i] ?? null);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            One-shot goals — main quest for your primary focus, side quests for
            everything else.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant="outline"
            className="border-xp/30 text-xp/70 font-mono text-xs"
          >
            ⚔️ {stats.mainCompleted} main
          </Badge>
          <Badge
            variant="outline"
            className="border-glow/30 text-glow/70 font-mono text-xs"
          >
            📜 {stats.sideCompleted} side
          </Badge>
          <Badge
            variant="outline"
            className="border-xp/30 text-xp/70 font-mono text-xs"
          >
            ⚡ {stats.totalXpFromQuests.toLocaleString()} XP
          </Badge>
        </div>
      </div>

      {/* Main quest */}
      <section>
        <h2 className="text-xs font-mono uppercase tracking-wider text-xp/70 mb-3">
          ⚔️ Main Quest
        </h2>
        {active.main ? (
          <QuestSlot quest={active.main} variant="main" />
        ) : (
          <EmptyQuestSlot variant="main" onClick={() => openNew("main")} />
        )}
      </section>

      {/* Side quests */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-glow/70">
            📜 Side Quests{" "}
            <span className="text-muted-foreground">
              ({active.side.length}/{MAX_SIDE_QUESTS})
            </span>
          </h2>
          {active.side.length < MAX_SIDE_QUESTS && (
            <Button size="sm" variant="outline" onClick={() => openNew("side")}>
              + New Side Quest
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {sideSlots.map((q, i) =>
            q ? (
              <QuestSlot key={q.id} quest={q} variant="side" />
            ) : (
              <EmptyQuestSlot
                key={`empty-${i}`}
                variant="side"
                onClick={() => openNew("side")}
              />
            )
          )}
        </div>
      </section>

      {/* Archive */}
      <QuestArchive quests={archive} />

      <QuestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultType={dialogType}
      />
    </div>
  );
}
