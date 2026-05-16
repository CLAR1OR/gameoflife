"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteQuest, restoreQuest } from "@/modules/quests/actions";
import { toast } from "sonner";
import type { QuestWithTasks } from "@/modules/quests/types";

function formatDate(ts: Date | number): string {
  const d = typeof ts === "number" ? new Date(ts * 1000) : ts;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ArchivedRow({ quest: q }: { quest: QuestWithTasks }) {
  const [expanded, setExpanded] = useState(false);
  const completed = q.status === "completed";

  async function handleRestore() {
    try {
      await restoreQuest(q.id);
      toast.success(`Restored "${q.name}"`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handleDelete() {
    if (!confirm(`Permanently delete "${q.name}"?`)) return;
    try {
      await deleteQuest(q.id);
      toast.success("Deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div
      className={`group rounded-lg border ${
        completed ? "border-border/40" : "border-border/30"
      } bg-muted/10 transition-colors hover:bg-muted/20`}
    >
      <div className="flex items-center gap-3 p-3">
        <span className="text-xl opacity-60">{q.icon}</span>
        <button
          type="button"
          onClick={() => setExpanded((s) => !s)}
          className="flex-1 min-w-0 text-left"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground line-through decoration-muted-foreground/40">
              {q.name}
            </span>
            <Badge
              variant="outline"
              className={
                completed
                  ? "border-glow/30 text-glow/70 text-[9px] font-mono px-1.5 py-0"
                  : "border-destructive/30 text-destructive/70 text-[9px] font-mono px-1.5 py-0"
              }
            >
              {completed ? `✓ +${q.xpReward} XP` : "abandoned"}
            </Badge>
            <Badge
              variant="outline"
              className="text-[9px] font-mono px-1.5 py-0 text-muted-foreground/70"
            >
              {q.type === "main" ? "main" : "side"}
            </Badge>
            {q.description && (
              <span className="text-[10px] text-muted-foreground/50">
                {expanded ? "▾" : "▸"}
              </span>
            )}
          </div>
          {q.completedAt && (
            <span className="text-[10px] text-muted-foreground/60 font-mono block mt-0.5">
              {formatDate(q.completedAt)}
            </span>
          )}
        </button>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleRestore}
          >
            Restore
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-destructive"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>
      {expanded && q.description && (
        <div className="px-4 pb-3 border-t border-border/20 mx-3">
          <p className="text-xs text-muted-foreground whitespace-pre-wrap pt-2">
            {q.description}
          </p>
        </div>
      )}
    </div>
  );
}

export function QuestArchive({ quests }: { quests: QuestWithTasks[] }) {
  if (quests.length === 0) return null;
  const completed = quests.filter((q) => q.status === "completed").length;
  const abandoned = quests.filter((q) => q.status === "abandoned").length;

  return (
    <section className="space-y-3 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
          📚 Archive
        </h2>
        <div className="flex gap-2">
          <Badge
            variant="outline"
            className="border-glow/30 text-glow/70 text-[10px] font-mono"
          >
            ✓ {completed} completed
          </Badge>
          {abandoned > 0 && (
            <Badge
              variant="outline"
              className="border-destructive/30 text-destructive/70 text-[10px] font-mono"
            >
              ✗ {abandoned} abandoned
            </Badge>
          )}
        </div>
      </div>
      <div className="space-y-2">
        {quests.map((q) => (
          <ArchivedRow key={q.id} quest={q} />
        ))}
      </div>
    </section>
  );
}
