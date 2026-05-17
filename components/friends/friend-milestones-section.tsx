"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addFriendMilestone,
  toggleFriendMilestone,
  updateFriendMilestone,
  deleteFriendMilestone,
  reseedFriendMilestones,
} from "@/modules/friends/actions";
import {
  FRIEND_STAGES,
  friendStageFromCount,
  nextFriendStage,
} from "@/modules/friends/milestone-templates";
import { toast } from "sonner";
import type { FriendMilestone } from "@/modules/friends/types";

/**
 * The friendship-level section on the friend detail page. Stage badge at
 * the top, progress bar to the next stage, then the checkable milestone
 * list. Each row tap-toggles its completion; custom milestones can be
 * added inline. Every milestone (template or custom) is deletable so a
 * relationship that doesn't fit some prompts can shed them.
 */
export function FriendMilestonesSection({
  friendId,
  milestones: initial,
}: {
  friendId: string;
  milestones: FriendMilestone[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [milestones, setMilestones] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const completed = useMemo(
    () => milestones.filter((m) => m.completed).length,
    [milestones]
  );
  const total = milestones.length;
  const stage = friendStageFromCount(completed);
  const next = nextFriendStage(stage);
  const toNext = next ? Math.max(0, next.min - completed) : 0;
  const pctToNext = next
    ? Math.min(
        100,
        ((completed - stage.min) / Math.max(1, next.min - stage.min)) * 100
      )
    : 100;

  async function handleToggle(m: FriendMilestone) {
    // Optimistic flip so the bar moves immediately.
    setMilestones((cur) =>
      cur.map((x) =>
        x.id === m.id
          ? {
              ...x,
              completed: !x.completed,
              completedAt: !x.completed ? new Date() : null,
            }
          : x
      )
    );
    try {
      await toggleFriendMilestone(m.id);
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
      // Revert if the server rejects.
      setMilestones((cur) =>
        cur.map((x) =>
          x.id === m.id
            ? { ...x, completed: m.completed, completedAt: m.completedAt }
            : x
        )
      );
    }
  }

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      const created = await addFriendMilestone({ friendId, name });
      setMilestones((cur) => [...cur, created]);
      setNewName("");
      setAdding(false);
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  async function handleSaveEdit(m: FriendMilestone) {
    const name = editName.trim();
    if (!name) return;
    try {
      await updateFriendMilestone(m.id, { name });
      setMilestones((cur) =>
        cur.map((x) => (x.id === m.id ? { ...x, name } : x))
      );
      setEditingId(null);
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handleDelete(m: FriendMilestone) {
    if (!confirm(`Remove "${m.name}" from this friend?`)) return;
    try {
      await deleteFriendMilestone(m.id);
      setMilestones((cur) => cur.filter((x) => x.id !== m.id));
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handleReseed() {
    setBusy(true);
    try {
      await reseedFriendMilestones(friendId);
      toast.success("Re-seeded universal milestones");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  const stageColorClass = stageBadgeClass(stage.color);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
          🤝 Friendship · {stage.name}
        </h2>
        <button
          type="button"
          onClick={handleReseed}
          disabled={busy}
          className="text-[10px] font-mono text-muted-foreground hover:text-foreground"
          title="Re-add any universal milestones that were deleted"
        >
          re-seed
        </button>
      </div>

      {/* Stage banner */}
      <div
        className={`rounded-xl border p-4 space-y-2 ${stageColorClass}`}
      >
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <div>
            <div className="text-2xl font-bold leading-tight">
              {stage.icon} {stage.name}
            </div>
            <div className="text-[11px] font-mono opacity-80 mt-0.5">
              {completed} / {total} milestones completed
            </div>
          </div>
          {next && (
            <div className="text-right text-[11px] font-mono opacity-80">
              <div>
                Next: <span className="opacity-100">{next.name}</span>
              </div>
              <div>
                {toNext} more milestone{toNext === 1 ? "" : "s"}
              </div>
            </div>
          )}
        </div>
        <div className="h-1.5 w-full rounded-full bg-black/40 overflow-hidden">
          <div
            className="h-full rounded-full bg-current/60 transition-[width]"
            style={{ width: `${next ? pctToNext : 100}%`, opacity: 0.6 }}
          />
        </div>
        {!next && (
          <p className="text-[11px] font-mono opacity-80">
            🌟 Top tier — every universal milestone hit. Add custom ones
            below to keep growing.
          </p>
        )}
      </div>

      {/* Milestone list */}
      <ul className="space-y-1">
        {milestones.map((m) => {
          const isEditing = editingId === m.id;
          return (
            <li
              key={m.id}
              className={`group flex items-center gap-2 rounded-md border px-3 py-2 transition-colors ${
                m.completed
                  ? "border-glow/40 bg-glow/5"
                  : "border-border/60 bg-card/40 hover:border-border"
              }`}
            >
              <button
                type="button"
                onClick={() => handleToggle(m)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                  m.completed
                    ? "border-glow bg-glow text-background"
                    : "border-border/60 hover:border-glow/50"
                }`}
                title={m.completed ? "Uncheck" : "Mark as completed"}
              >
                {m.completed && (
                  <span className="text-[11px] font-bold leading-none">✓</span>
                )}
              </button>
              {isEditing ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit(m);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  className="h-7 text-xs flex-1"
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(m.id);
                    setEditName(m.name);
                  }}
                  className={`flex-1 text-left text-sm leading-tight ${
                    m.completed ? "text-glow" : ""
                  }`}
                  title="Click to edit name"
                >
                  {m.name}
                </button>
              )}
              {!m.templateKey && (
                <span className="text-[9px] font-mono text-muted-foreground/60 shrink-0">
                  CUSTOM
                </span>
              )}
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleSaveEdit(m)}
                    className="h-7 px-2 text-xs"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                    className="h-7 px-2 text-xs"
                  >
                    ✕
                  </Button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDelete(m)}
                  className="text-[10px] font-mono text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity shrink-0"
                  title="Remove from this friend"
                >
                  ✕
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* Add custom row */}
      {adding ? (
        <div className="rounded-md border border-glow/30 bg-glow/5 p-2 flex items-center gap-2">
          <Input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") {
                setAdding(false);
                setNewName("");
              }
            }}
            placeholder="A custom milestone…"
            className="h-8 text-xs flex-1"
          />
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={busy || !newName.trim()}
            className="h-8 text-xs"
          >
            Add
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setAdding(false);
              setNewName("");
            }}
            className="h-8 text-xs"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-xs font-mono text-muted-foreground hover:text-foreground"
        >
          + add a custom milestone
        </button>
      )}

      {/* Stage legend, collapsed under a small details. */}
      <details className="text-[11px] text-muted-foreground/70 pt-2">
        <summary className="cursor-pointer hover:text-foreground">
          stage thresholds
        </summary>
        <ul className="mt-1 pl-4 space-y-0.5 font-mono">
          {FRIEND_STAGES.map((s) => (
            <li key={s.key}>
              {s.icon} {s.name} · {s.min}+ milestones
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function stageBadgeClass(color: string): string {
  switch (color) {
    case "glow":
      return "border-glow/40 bg-glow/10 text-glow";
    case "glow-purple":
      return "border-glow-purple/40 bg-glow-purple/10 text-glow-purple";
    case "xp":
      return "border-xp/40 bg-xp/10 text-xp";
    case "destructive":
      return "border-destructive/40 bg-destructive/10 text-destructive";
    default:
      return "border-border bg-muted/30 text-muted-foreground";
  }
}
