"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  addQuestTask,
  toggleQuestTask,
  deleteQuestTask,
} from "@/modules/quests/actions";
import { toast } from "sonner";
import type { QuestTask } from "@/modules/quests/types";

export function QuestChecklist({
  questId,
  tasks,
  compact = false,
}: {
  questId: string;
  tasks: QuestTask[];
  compact?: boolean;
}) {
  const [newTask, setNewTask] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newTask.trim();
    if (!trimmed) return;
    setAdding(true);
    try {
      await addQuestTask(questId, trimmed);
      setNewTask("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setAdding(false);
  }

  async function handleToggle(id: string) {
    setBusyId(id);
    try {
      await toggleQuestTask(id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusyId(null);
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await deleteQuestTask(id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusyId(null);
  }

  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      {tasks.map((t) => (
        <div
          key={t.id}
          className={`group flex items-center gap-2 rounded-md border border-border/60 bg-card/40 px-2 py-1 transition-colors ${
            t.completed ? "opacity-60" : ""
          }`}
        >
          <button
            type="button"
            onClick={() => handleToggle(t.id)}
            disabled={busyId === t.id}
            className={`h-4 w-4 rounded border shrink-0 flex items-center justify-center text-[10px] transition-colors ${
              t.completed
                ? "border-xp bg-xp/20 text-xp"
                : "border-border hover:border-foreground"
            }`}
            aria-label={t.completed ? "Mark incomplete" : "Mark complete"}
          >
            {t.completed ? "✓" : ""}
          </button>
          <span
            className={`flex-1 text-xs min-w-0 ${
              t.completed
                ? "line-through text-muted-foreground"
                : "text-foreground"
            }`}
          >
            {t.name}
          </span>
          <button
            type="button"
            onClick={() => handleDelete(t.id)}
            disabled={busyId === t.id}
            className="text-[10px] text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            aria-label="Remove task"
          >
            ✕
          </button>
        </div>
      ))}
      <form onSubmit={handleAdd} className="flex gap-1.5 items-center">
        <Input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="+ add a task…"
          disabled={adding}
          className="h-7 text-xs"
        />
      </form>
    </div>
  );
}
