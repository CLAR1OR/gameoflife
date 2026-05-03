"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  addQuestTask,
  toggleQuestTask,
  deleteQuestTask,
  getQuestTaskTriggerOptions,
  type QuestTaskTrigger,
  type TriggerPickerOptions,
} from "@/modules/quests/actions";
import { toast } from "sonner";
import type { QuestTask } from "@/modules/quests/types";

type TriggerKind = "manual" | "habit_count" | "milestone" | "book";

const TRIGGER_BADGE: Record<
  Exclude<TriggerKind, "manual">,
  { label: string; cls: string; icon: string }
> = {
  habit_count: {
    label: "auto · habit",
    cls: "border-glow/40 text-glow",
    icon: "🔁",
  },
  milestone: {
    label: "auto · milestone",
    cls: "border-glow/40 text-glow",
    icon: "🎯",
  },
  book: { label: "auto · book", cls: "border-xp/40 text-xp", icon: "📚" },
};

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

  const [triggerKind, setTriggerKind] = useState<TriggerKind>("manual");
  const [habitId, setHabitId] = useState("");
  const [habitCount, setHabitCount] = useState("10");
  const [milestoneId, setMilestoneId] = useState("");
  const [bookId, setBookId] = useState("");

  const [options, setOptions] = useState<TriggerPickerOptions | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!showAdvanced || options) return;
    let cancelled = false;
    (async () => {
      try {
        const opts = await getQuestTaskTriggerOptions();
        if (!cancelled) setOptions(opts);
      } catch {
        // non-fatal
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showAdvanced, options]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newTask.trim();
    if (!trimmed) return;

    let trigger: QuestTaskTrigger = { type: "manual" };
    if (triggerKind === "habit_count") {
      if (!habitId) {
        toast.error("Pick a habit");
        return;
      }
      const c = parseInt(habitCount, 10);
      if (!Number.isFinite(c) || c < 1) {
        toast.error("Count must be ≥ 1");
        return;
      }
      trigger = { type: "habit_count", habitId, count: c };
    } else if (triggerKind === "milestone") {
      if (!milestoneId) {
        toast.error("Pick a milestone");
        return;
      }
      trigger = { type: "milestone", milestoneId };
    } else if (triggerKind === "book") {
      if (!bookId) {
        toast.error("Pick a book");
        return;
      }
      trigger = { type: "book", bookId };
    }

    setAdding(true);
    try {
      await addQuestTask(questId, trimmed, trigger);
      setNewTask("");
      setTriggerKind("manual");
      setHabitId("");
      setMilestoneId("");
      setBookId("");
      if (triggerKind !== "manual") setShowAdvanced(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setAdding(false);
  }

  async function handleToggle(id: string, isAuto: boolean) {
    if (isAuto) {
      toast.info("This task auto-checks based on its trigger.");
      return;
    }
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
      {tasks.map((t) => {
        const isAuto = t.triggerType !== "manual";
        const badge = isAuto
          ? TRIGGER_BADGE[t.triggerType as Exclude<TriggerKind, "manual">]
          : null;
        return (
          <div
            key={t.id}
            className={`group flex items-center gap-2 rounded-md border border-border/60 bg-card/40 px-2 py-1 transition-colors ${
              t.completed ? "opacity-60" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => handleToggle(t.id, isAuto)}
              disabled={busyId === t.id}
              className={`h-4 w-4 rounded border shrink-0 flex items-center justify-center text-[10px] transition-colors ${
                t.completed
                  ? "border-xp bg-xp/20 text-xp"
                  : isAuto
                    ? "border-border/60 cursor-default"
                    : "border-border hover:border-foreground"
              }`}
              aria-label={t.completed ? "Mark incomplete" : "Mark complete"}
              title={isAuto ? "Auto-checked by trigger" : undefined}
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
            {badge && (
              <span
                className={`text-[9px] font-mono uppercase tracking-wider border rounded px-1 py-0 shrink-0 ${badge.cls}`}
                title="Auto-completion trigger"
              >
                {badge.icon} {badge.label}
              </span>
            )}
            {t.triggerType === "habit_count" && t.triggerCount && (
              <span className="text-[9px] font-mono text-muted-foreground shrink-0">
                ≥{t.triggerCount}
              </span>
            )}
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
        );
      })}
      <form onSubmit={handleAdd} className="space-y-1">
        <div className="flex gap-1.5 items-center">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="+ add a task…"
            disabled={adding}
            className="h-7 text-xs"
          />
          <button
            type="button"
            onClick={() => setShowAdvanced((s) => !s)}
            className={`text-[10px] font-mono shrink-0 px-1.5 h-7 rounded border transition-colors ${
              showAdvanced || triggerKind !== "manual"
                ? "border-glow/40 text-glow bg-glow/5"
                : "border-border/60 text-muted-foreground hover:text-foreground"
            }`}
            title="Auto-trigger options"
          >
            🔗
          </button>
        </div>
        {showAdvanced && (
          <div className="rounded-md border border-glow/30 bg-card/40 p-2 space-y-2">
            <div className="flex gap-1 flex-wrap">
              {(
                [
                  { k: "manual", label: "Manual" },
                  { k: "habit_count", label: "Habit count" },
                  { k: "milestone", label: "Milestone" },
                  { k: "book", label: "Book finished" },
                ] as { k: TriggerKind; label: string }[]
              ).map((o) => (
                <button
                  key={o.k}
                  type="button"
                  onClick={() => setTriggerKind(o.k)}
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                    triggerKind === o.k
                      ? "border-glow text-glow bg-glow/10"
                      : "border-border/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {triggerKind === "habit_count" && (
              <div className="flex gap-1 items-center">
                <select
                  value={habitId}
                  onChange={(e) => setHabitId(e.target.value)}
                  className="flex-1 h-7 text-xs rounded-md border border-input bg-background px-2"
                >
                  <option value="">— pick a habit —</option>
                  {options?.habits.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.icon} {h.name}
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min="1"
                  value={habitCount}
                  onChange={(e) => setHabitCount(e.target.value)}
                  className="h-7 text-xs w-20"
                  placeholder="count"
                />
              </div>
            )}
            {triggerKind === "milestone" && (
              <select
                value={milestoneId}
                onChange={(e) => setMilestoneId(e.target.value)}
                className="w-full h-7 text-xs rounded-md border border-input bg-background px-2"
              >
                <option value="">— pick a milestone —</option>
                {options?.milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.categoryName} › {m.skillName} › {m.name}
                  </option>
                ))}
              </select>
            )}
            {triggerKind === "book" && (
              <select
                value={bookId}
                onChange={(e) => setBookId(e.target.value)}
                className="w-full h-7 text-xs rounded-md border border-input bg-background px-2"
              >
                <option value="">— pick a book —</option>
                {options?.books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} — {b.authors}
                  </option>
                ))}
              </select>
            )}
            <p className="text-[10px] text-muted-foreground">
              {triggerKind === "manual"
                ? "Just a plain checkbox."
                : triggerKind === "habit_count"
                  ? "Auto-completes when this habit reaches the count, un-completes if it drops back."
                  : triggerKind === "milestone"
                    ? "Auto-completes when the milestone is marked done."
                    : "Auto-completes when the book is marked read."}
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
