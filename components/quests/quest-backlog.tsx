"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  activateBacklogQuest,
  changeQuestType,
  deleteQuest,
} from "@/modules/quests/actions";
import { toast } from "sonner";
import type { QuestWithTasks } from "@/modules/quests/types";
import { QuestDialog } from "./quest-dialog";

function BacklogRow({ quest: q }: { quest: QuestWithTasks }) {
  const [editOpen, setEditOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function activate() {
    setBusy(true);
    try {
      await activateBacklogQuest(q.id);
      toast.success(`"${q.name}" is now active`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  async function flipType() {
    setBusy(true);
    try {
      await changeQuestType(q.id, q.type === "main" ? "side" : "main");
      toast.success(
        q.type === "main"
          ? "Demoted to side quest"
          : "Promoted to main quest"
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  async function remove() {
    if (!confirm(`Delete "${q.name}" from your backlog?`)) return;
    try {
      await deleteQuest(q.id);
      toast.success("Removed from backlog");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  const accent =
    q.type === "main"
      ? "border-xp/30 hover:border-xp/50"
      : "border-glow/30 hover:border-glow/50";

  return (
    <>
      <div
        className={`group rounded-lg border bg-card/60 ${accent} transition-colors p-3 flex items-start gap-3`}
      >
        <span className="text-2xl shrink-0 leading-none mt-0.5">
          {q.icon}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <Badge
              variant="outline"
              className={
                q.type === "main"
                  ? "border-xp/40 text-xp text-[9px] font-mono px-1.5 py-0"
                  : "border-glow/40 text-glow text-[9px] font-mono px-1.5 py-0"
              }
            >
              {q.type === "main" ? "⚔️ MAIN" : "📜 SIDE"}
            </Badge>
            <Badge
              variant="outline"
              className="text-[9px] font-mono text-muted-foreground px-1.5 py-0"
            >
              +{q.xpReward} XP
            </Badge>
            {q.progress.total > 0 && (
              <span className="text-[10px] font-mono text-muted-foreground">
                {q.progress.done}/{q.progress.total} tasks
              </span>
            )}
          </div>
          <div className="text-sm font-medium leading-tight">{q.name}</div>
          {q.description && (
            <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {q.description}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={activate}
            disabled={busy}
            className="h-7 text-xs"
          >
            ↑ Activate
          </Button>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[10px]"
              onClick={() => setEditOpen(true)}
              disabled={busy}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[10px] text-muted-foreground"
              onClick={flipType}
              disabled={busy}
              title={q.type === "main" ? "Demote to side" : "Promote to main"}
            >
              {q.type === "main" ? "→ side" : "→ main"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[10px] text-destructive"
              onClick={remove}
              disabled={busy}
            >
              Del
            </Button>
          </div>
        </div>
      </div>
      <QuestDialog open={editOpen} onOpenChange={setEditOpen} quest={q} />
    </>
  );
}

export function QuestBacklog({ quests }: { quests: QuestWithTasks[] }) {
  if (quests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        Nothing on the back burner. Add ideas to keep them in mind, or pick
        from a template below.
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {quests.map((q) => (
        <BacklogRow key={q.id} quest={q} />
      ))}
    </div>
  );
}
