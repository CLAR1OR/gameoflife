"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  completeQuest,
  abandonQuest,
  deleteQuest,
} from "@/modules/quests/actions";
import { toast } from "sonner";
import { celebrate } from "@/lib/celebrate";
import type { QuestWithTasks } from "@/modules/quests/types";
import { QuestDialog } from "./quest-dialog";
import { QuestChecklist } from "./quest-checklist";

function formatDueDate(due: Date | number): {
  label: string;
  overdue: boolean;
  soon: boolean;
} {
  const d = typeof due === "number" ? new Date(due * 1000) : due;
  const diffMs = d.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const overdue = diffMs < 0;
  const soon = !overdue && diffDays <= 3;
  let label: string;
  if (overdue) {
    const days = Math.abs(diffDays);
    label = days === 0 ? "due today" : `${days}d overdue`;
  } else if (diffDays === 0) {
    label = "due today";
  } else if (diffDays === 1) {
    label = "due tomorrow";
  } else if (diffDays <= 14) {
    label = `due in ${diffDays}d`;
  } else {
    label = `due ${d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })}`;
  }
  return { label, overdue, soon };
}

export function QuestSlot({
  quest,
  variant,
}: {
  quest: QuestWithTasks;
  variant: "main" | "side";
}) {
  const [expanded, setExpanded] = useState(variant === "main");
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const accent = variant === "main" ? "xp" : "glow";
  const accentBorder =
    variant === "main"
      ? "border-xp/40 hover:border-xp/60"
      : "border-glow/30 hover:border-glow/60";
  const accentGlow = variant === "main" ? "glow-gold" : "glow-green";

  const due = quest.dueAt ? formatDueDate(quest.dueAt) : null;
  const hasTasks = quest.progress.total > 0;

  async function handleComplete() {
    setLoading(true);
    try {
      const result = await completeQuest(quest.id);
      toast.success(`Quest complete! +${result.xp} XP`, {
        description: `"${quest.name}"`,
      });
      if (result.newAchievements.length > 0) {
        celebrate(result.newAchievements);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setLoading(false);
  }

  async function handleAbandon() {
    if (!confirm(`Abandon "${quest.name}"? You won't get XP.`)) return;
    setLoading(true);
    try {
      await abandonQuest(quest.id);
      toast.info(`Abandoned "${quest.name}"`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete "${quest.name}"? This cannot be undone.`)) return;
    try {
      await deleteQuest(quest.id);
      toast.success(`Deleted`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  function DueBadge() {
    if (!due) return null;
    const cls = due.overdue
      ? "border-destructive/50 text-destructive bg-destructive/10"
      : due.soon
        ? "border-yellow-500/40 text-yellow-400 bg-yellow-500/10"
        : "border-border text-muted-foreground bg-black/20";
    return (
      <Badge
        variant="outline"
        className={`text-[10px] font-mono ${cls}`}
      >
        ⏳ {due.label}
      </Badge>
    );
  }

  if (variant === "main") {
    return (
      <>
        <div
          className={`group relative rounded-2xl border-2 bg-card ${accentBorder} ${accentGlow} transition-all overflow-hidden`}
        >
          <div className="p-5 space-y-3">
            <div className="flex items-start gap-4">
              <div className="text-5xl shrink-0 drop-shadow-lg">
                {quest.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge
                    variant="outline"
                    className="border-xp/40 text-xp bg-black/20 text-[10px] font-mono"
                  >
                    ⚔️ MAIN QUEST
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-xp/40 text-xp bg-black/20 text-[10px] font-mono"
                  >
                    +{quest.xpReward} XP
                  </Badge>
                  <DueBadge />
                </div>
                <h3 className="text-2xl font-bold text-foreground leading-tight">
                  {quest.name}
                </h3>
                {quest.description && (
                  <button
                    type="button"
                    onClick={() => setExpanded((s) => !s)}
                    className="text-xs text-muted-foreground hover:text-foreground mt-2 flex items-center gap-1 transition-colors"
                  >
                    <span>{expanded ? "▾" : "▸"}</span>
                    <span>{expanded ? "Hide details" : "Show details"}</span>
                  </button>
                )}
                {expanded && quest.description && (
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap mt-2">
                    {quest.description}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={handleComplete}
                  disabled={loading}
                  className="bg-xp/20 hover:bg-xp/30 text-xp border border-xp/40"
                >
                  ✓ Complete
                </Button>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setEditOpen(true)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground"
                    onClick={handleAbandon}
                  >
                    Abandon
                  </Button>
                </div>
              </div>
            </div>

            {hasTasks && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-xp">
                  <span>
                    {quest.progress.done} / {quest.progress.total} tasks done
                  </span>
                  <span>{quest.progress.pct}%</span>
                </div>
                <Progress value={quest.progress.pct} className="h-1.5 xp-bar" />
              </div>
            )}

            <QuestChecklist questId={quest.id} tasks={quest.tasks} />
          </div>
        </div>
        <QuestDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          quest={quest}
        />
      </>
    );
  }

  // Side quest
  return (
    <>
      <div
        className={`group relative rounded-xl border bg-card ${accentBorder} transition-all h-full flex flex-col`}
      >
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="text-3xl drop-shadow-md">{quest.icon}</div>
            <Badge
              variant="outline"
              className="border-glow/40 text-glow bg-black/20 text-[9px] font-mono px-1.5 py-0 shrink-0"
            >
              +{quest.xpReward}
            </Badge>
          </div>
          <h3 className="text-sm font-bold text-foreground leading-tight mb-1">
            {quest.name}
          </h3>
          {due && (
            <div className="mb-1">
              <DueBadge />
            </div>
          )}
          {hasTasks && (
            <div className="mt-1.5 mb-1 space-y-0.5">
              <div className="flex items-center justify-between text-[9px] font-mono text-glow/80">
                <span>
                  {quest.progress.done}/{quest.progress.total}
                </span>
                <span>{quest.progress.pct}%</span>
              </div>
              <Progress value={quest.progress.pct} className="h-1 xp-bar" />
            </div>
          )}
          {(quest.description || hasTasks) && (
            <>
              <button
                type="button"
                onClick={() => setExpanded((s) => !s)}
                className="text-[10px] text-muted-foreground hover:text-foreground mt-1 flex items-center gap-1 transition-colors"
              >
                <span>{expanded ? "▾" : "▸"}</span>
                <span>{expanded ? "hide" : "details"}</span>
              </button>
              {expanded && (
                <div className="mt-2 flex-1 space-y-2">
                  {quest.description && (
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {quest.description}
                    </p>
                  )}
                  <QuestChecklist
                    questId={quest.id}
                    tasks={quest.tasks}
                    compact
                  />
                </div>
              )}
            </>
          )}
          {!quest.description && !hasTasks && !expanded && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                + add tasks
              </button>
            </div>
          )}
          {!quest.description && !hasTasks && expanded && (
            <div className="mt-2">
              <QuestChecklist
                questId={quest.id}
                tasks={quest.tasks}
                compact
              />
            </div>
          )}
        </div>
        <div className="px-4 pb-3 flex gap-1">
          <Button
            size="sm"
            onClick={handleComplete}
            disabled={loading}
            className="flex-1 h-7 text-xs bg-glow/20 hover:bg-glow/30 text-glow border border-glow/40"
          >
            ✓ Done
          </Button>
        </div>
        {/* Hover actions */}
        <div className="absolute top-2 right-2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[10px] bg-black/40"
            onClick={() => setEditOpen(true)}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[10px] bg-black/40 text-muted-foreground"
            onClick={handleAbandon}
          >
            Abandon
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-[10px] bg-black/40 text-destructive"
            onClick={handleDelete}
          >
            Del
          </Button>
        </div>
      </div>
      <QuestDialog open={editOpen} onOpenChange={setEditOpen} quest={quest} />
    </>
  );
}

export function EmptyQuestSlot({
  variant,
  onClick,
}: {
  variant: "main" | "side";
  onClick: () => void;
}) {
  if (variant === "main") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group w-full rounded-2xl border-2 border-dashed border-border bg-muted/10 hover:border-xp/40 hover:bg-xp/5 transition-all"
      >
        <div className="p-8 flex items-center justify-center gap-3 text-muted-foreground">
          <span className="text-4xl opacity-40 group-hover:opacity-80 transition-opacity">
            ⚔️
          </span>
          <div className="text-left">
            <div className="font-mono text-xs uppercase tracking-wider opacity-70">
              No Main Quest
            </div>
            <div className="text-sm mt-0.5">
              Click to set your primary focus
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group aspect-square w-full rounded-xl border-2 border-dashed border-border bg-muted/10 hover:border-glow/40 hover:bg-glow/5 transition-all flex flex-col items-center justify-center gap-2"
    >
      <span className="text-4xl text-muted-foreground/30 group-hover:text-glow/60 transition-colors">
        ?
      </span>
      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/50">
        Empty Slot
      </span>
    </button>
  );
}
