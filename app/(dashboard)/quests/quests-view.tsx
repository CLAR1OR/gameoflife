"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuestSlot, EmptyQuestSlot } from "@/components/quests/quest-slot";
import { QuestDialog } from "@/components/quests/quest-dialog";
import { QuestArchive } from "@/components/quests/quest-archive";
import { QuestBacklog } from "@/components/quests/quest-backlog";
import { QuestTemplatesGallery } from "@/components/quests/quest-templates-gallery";
import {
  MAX_SIDE_QUESTS,
  type QuestStats,
  type QuestWithTasks,
} from "@/modules/quests/types";
import type { QuestTemplate } from "@/lib/quest-templates";

export function QuestsView({
  active,
  backlog,
  archive,
  stats,
  templates,
}: {
  active: { main: QuestWithTasks | null; side: QuestWithTasks[] };
  backlog: QuestWithTasks[];
  archive: QuestWithTasks[];
  stats: QuestStats;
  templates: QuestTemplate[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"main" | "side">("side");
  const [dialogStatus, setDialogStatus] = useState<"active" | "backlog">(
    "active"
  );
  const [showTemplates, setShowTemplates] = useState(false);

  function openNew(type: "main" | "side", status: "active" | "backlog" = "active") {
    setDialogType(type);
    setDialogStatus(status);
    setDialogOpen(true);
  }

  const sideSlots = Array.from(
    { length: MAX_SIDE_QUESTS },
    (_, i) => active.side[i] ?? null
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            One-shot goals — main quest for your primary focus, side quests for
            everything else, backlog for ideas you&apos;ll get to.
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

      {/* Backlog */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            🗂️ Backlog{" "}
            <span className="text-muted-foreground/60">({backlog.length})</span>
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => openNew("side", "backlog")}
          >
            + Add to backlog
          </Button>
        </div>
        <QuestBacklog quests={backlog} />
      </section>

      {/* Templates / ideas */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-glow-purple/80">
            💡 Quest Ideas{" "}
            <span className="text-muted-foreground/60">
              ({templates.length} available)
            </span>
          </h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowTemplates((s) => !s)}
            className="text-xs"
          >
            {showTemplates ? "▾ Hide" : "▸ Browse"}
          </Button>
        </div>
        {showTemplates && (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              Curated quest ideas. Click &ldquo;Add to backlog&rdquo; to keep one
              in mind without committing yet — promote it to active when
              you&apos;re ready.
            </p>
            <QuestTemplatesGallery templates={templates} />
          </>
        )}
      </section>

      {/* Archive */}
      <QuestArchive quests={archive} />

      <QuestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultType={dialogType}
        defaultStatus={dialogStatus}
      />
    </div>
  );
}
