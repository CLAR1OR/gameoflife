"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  createRoutine,
  updateRoutine,
  deleteRoutine,
  addBlock,
  updateBlock,
  deleteBlock,
  moveBlock,
  resetRoutineToTemplate,
  reseedMissingTemplateRoutines,
} from "@/modules/practice/actions";
import { toast } from "sonner";
import {
  FOCUS_LABEL,
  FOCUS_OPTIONS,
  type PracticeFocus,
} from "@/lib/practice-routines";
import type {
  PracticeRoutine,
  PracticeBlock,
} from "@/modules/practice/queries";
import { PracticeTimer, type TimerBlock } from "./practice-timer";

const PRESET_DURATIONS = [25, 50, 75] as const;

const FOCUS_TINT: Record<PracticeFocus, string> = {
  warmup: "border-glow/40 text-glow",
  technique: "border-glow/40 text-glow",
  repertoire: "border-xp/40 text-xp",
  "sight-read": "border-glow-purple/40 text-glow-purple",
  theory: "border-glow-purple/40 text-glow-purple",
  improv: "border-warning/40 text-warning",
  review: "border-border text-muted-foreground",
  general: "border-border text-muted-foreground",
};

function buildTimerBlocks(
  routine: PracticeRoutine,
  totalMinutes: number
): TimerBlock[] {
  const lvl = routine.highestSubskillLevel;
  const unlocked = routine.blocks.filter((b) => b.minLevel <= lvl);
  const minutes = distributeMinutes(unlocked, totalMinutes);
  return unlocked.map((b, i) => ({
    id: b.id,
    name: b.name,
    focus: b.focus,
    minutes: minutes[i],
  }));
}

function distributeMinutes(
  blocks: { weight: number }[],
  totalMinutes: number
): number[] {
  const totalWeight = blocks.reduce((s, b) => s + b.weight, 0);
  if (totalWeight === 0) return blocks.map(() => 0);
  // Round to whole minutes; use largest-remainder so the totals add up exactly.
  const exact = blocks.map((b) => (b.weight / totalWeight) * totalMinutes);
  const rounded = exact.map((v) => Math.floor(v));
  let remaining = totalMinutes - rounded.reduce((s, v) => s + v, 0);
  const remainders = exact
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remainders.length && remaining > 0; k++) {
    rounded[remainders[k].i]++;
    remaining--;
  }
  return rounded;
}

export function DeliberatePractice({
  routines,
  categoryId,
  hasTemplate,
}: {
  routines: PracticeRoutine[];
  categoryId: string;
  hasTemplate: boolean;
}) {
  const router = useRouter();
  const [activeRoutineId, setActiveRoutineId] = useState<string | null>(
    routines[0]?.id ?? null
  );
  const [duration, setDuration] = useState<number>(50);
  const [editing, setEditing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [runningBlockId, setRunningBlockId] = useState<string | null>(null);

  // Keep activeRoutineId valid when the routine list changes (e.g. after
  // adding or deleting one). Without this, `routines.find(...)` could miss
  // and the picker would silently jump to the first routine.
  useEffect(() => {
    if (
      activeRoutineId &&
      !routines.find((r) => r.id === activeRoutineId)
    ) {
      setActiveRoutineId(routines[0]?.id ?? null);
    } else if (!activeRoutineId && routines.length > 0) {
      setActiveRoutineId(routines[0].id);
    }
  }, [routines, activeRoutineId]);

  if (routines.length === 0) {
    return (
      <CreateFirstRoutine categoryId={categoryId} hasTemplate={hasTemplate} />
    );
  }

  const active =
    routines.find((r) => r.id === activeRoutineId) ?? routines[0];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xs font-mono uppercase tracking-wider text-glow-purple">
          🎯 Deliberate practice
        </h2>
        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
          <span>highest subskill: lvl {active.highestSubskillLevel}</span>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-4">
        {/* Routine tabs */}
        {routines.length > 1 && (
          <div className="flex flex-wrap gap-1">
            {routines.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveRoutineId(r.id)}
                className={`text-xs font-mono px-2 py-1 rounded border transition-colors ${
                  active.id === r.id
                    ? "border-glow text-glow bg-glow/10"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        )}

        {editing ? (
          <RoutineHeaderEditor
            routine={active}
            onDone={() => setEditing(false)}
          />
        ) : (
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="text-base font-bold">{active.name}</div>
              {active.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {active.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing(true)}
                className="h-7 text-xs"
              >
                ✎ Edit
              </Button>
              <CreateRoutineButton categoryId={categoryId} />
              {hasTemplate && (
                <ReaddTemplateButton categoryId={categoryId} />
              )}
            </div>
          </div>
        )}

        {/* Session length picker */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Session
          </span>
          {PRESET_DURATIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setDuration(m)}
              disabled={runningBlockId !== null}
              className={`text-xs font-mono px-3 py-1 rounded-full border transition-colors disabled:opacity-50 ${
                duration === m
                  ? "border-glow text-glow bg-glow/10"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {m} min
            </button>
          ))}
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={5}
              max={240}
              step={5}
              value={duration}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isFinite(n)) setDuration(Math.max(5, Math.min(240, n)));
              }}
              disabled={runningBlockId !== null}
              className="h-7 w-16 text-xs"
            />
            <span className="text-[10px] font-mono text-muted-foreground">
              min
            </span>
          </div>
        </div>

        {/* Session timer */}
        <PracticeTimer
          categoryId={categoryId}
          routineId={active.id}
          blocks={buildTimerBlocks(active, duration)}
          totalMinutes={duration}
          onActiveBlockChange={setRunningBlockId}
          disabled={editing}
        />

        {/* Block list */}
        <BlockList
          routine={active}
          duration={duration}
          editing={editing}
          busyId={busyId}
          setBusyId={setBusyId}
          activeBlockId={runningBlockId}
        />

        {editing && (
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <NewBlockForm routineId={active.id} />
            <div className="flex gap-1">
              {active.blocks.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    if (
                      !confirm(
                        "Reset this routine to its template defaults? Custom blocks will be lost."
                      )
                    )
                      return;
                    try {
                      await resetRoutineToTemplate(active.id);
                      toast.success("Reset to template");
                      router.refresh();
                    } catch (e) {
                      toast.error(
                        e instanceof Error ? e.message : "Failed"
                      );
                    }
                  }}
                  className="h-7 text-xs text-muted-foreground"
                >
                  ↺ Reset to default
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  const wasOnly = routines.length === 1;
                  const msg = wasOnly
                    ? `Delete routine "${active.name}"? This is the last routine for this skill — you can re-add the template default afterwards if it had one.`
                    : `Delete routine "${active.name}"?`;
                  if (!confirm(msg)) return;
                  try {
                    await deleteRoutine(active.id);
                    toast.success("Routine deleted");
                    router.refresh();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Failed");
                  }
                }}
                className="h-7 text-xs text-destructive"
              >
                Delete routine
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function BlockList({
  routine,
  duration,
  editing,
  busyId,
  setBusyId,
  activeBlockId,
}: {
  routine: PracticeRoutine;
  duration: number;
  editing: boolean;
  busyId: string | null;
  setBusyId: (s: string | null) => void;
  activeBlockId: string | null;
}) {
  const lvl = routine.highestSubskillLevel;
  const unlocked = routine.blocks.filter((b) => b.minLevel <= lvl);
  const locked = routine.blocks.filter((b) => b.minLevel > lvl);

  // Distribute the session across unlocked blocks. In edit mode we still
  // show the locked ones so the user can re-weight or delete them.
  const minutes = useMemo(
    () => distributeMinutes(unlocked, duration),
    [unlocked, duration]
  );

  if (routine.blocks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic text-center py-3">
        No blocks yet. Add one below.
      </p>
    );
  }

  const totalUnlockedWeight = unlocked.reduce((s, b) => s + b.weight, 0) || 1;

  // Once the timer is running, mark blocks before the active one as done
  // and after as upcoming. activeIndex is the index of the running block in
  // the unlocked list (or -1 if no block is running / found).
  const activeIndex = activeBlockId
    ? unlocked.findIndex((b) => b.id === activeBlockId)
    : -1;
  const sessionRunning = activeIndex !== -1;

  return (
    <ul className="space-y-2">
      {unlocked.map((b, i) => (
        <BlockRow
          key={b.id}
          block={b}
          minutes={minutes[i]}
          weightPct={Math.round((b.weight / totalUnlockedWeight) * 100)}
          editing={editing}
          isFirst={i === 0}
          isLast={i === unlocked.length - 1 && locked.length === 0}
          busy={busyId === b.id}
          setBusyId={setBusyId}
          sessionState={
            sessionRunning
              ? i < activeIndex
                ? "done"
                : i === activeIndex
                  ? "active"
                  : "upcoming"
              : "idle"
          }
        />
      ))}
      {locked.length > 0 && (
        <>
          <li className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 pt-2">
            Locked — unlocks as your subskills level up
          </li>
          {locked.map((b) => (
            <BlockRow
              key={b.id}
              block={b}
              minutes={0}
              weightPct={0}
              editing={editing}
              locked
              isFirst={false}
              isLast={false}
              busy={busyId === b.id}
              setBusyId={setBusyId}
              sessionState="idle"
            />
          ))}
        </>
      )}
    </ul>
  );
}

function BlockRow({
  block: b,
  minutes,
  weightPct,
  editing,
  locked = false,
  isFirst,
  isLast,
  busy,
  setBusyId,
  sessionState,
}: {
  block: PracticeBlock;
  minutes: number;
  weightPct: number;
  editing: boolean;
  locked?: boolean;
  isFirst: boolean;
  isLast: boolean;
  busy: boolean;
  setBusyId: (s: string | null) => void;
  sessionState: "idle" | "done" | "active" | "upcoming";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const tint = FOCUS_TINT[b.focus];

  // Auto-expand the active block during a session so the notes are visible
  // without an extra click.
  useEffect(() => {
    if (sessionState === "active") setOpen(true);
  }, [sessionState]);

  const sessionCls =
    sessionState === "active"
      ? "border-glow ring-1 ring-glow/50 bg-glow/5"
      : sessionState === "done"
        ? "opacity-50"
        : sessionState === "upcoming"
          ? "opacity-80"
          : "";

  async function handleMove(direction: "up" | "down") {
    setBusyId(b.id);
    try {
      await moveBlock(b.id, direction);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusyId(null);
  }

  async function handleDelete() {
    if (!confirm(`Delete block "${b.name}"?`)) return;
    setBusyId(b.id);
    try {
      await deleteBlock(b.id);
      toast.success("Block deleted");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusyId(null);
  }

  return (
    <li
      className={`rounded-md border bg-card/40 transition-colors ${
        locked ? "opacity-50" : "hover:border-glow/30"
      } border-border/60 ${sessionCls}`}
      data-session-state={sessionState}
    >
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center gap-3 p-3 text-left"
      >
        <span
          className={`text-base shrink-0 font-mono w-12 text-right ${
            sessionState === "active"
              ? "text-glow"
              : sessionState === "done"
                ? "text-xp"
                : "text-muted-foreground/60"
          }`}
        >
          {locked
            ? "—"
            : sessionState === "done"
              ? "✓"
              : sessionState === "active"
                ? "▶"
                : `${minutes}m`}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium line-clamp-1">{b.name}</span>
            <span
              className={`text-[9px] font-mono uppercase tracking-wider border rounded px-1.5 py-0 ${tint}`}
            >
              {FOCUS_LABEL[b.focus]}
            </span>
            {b.minLevel > 1 && (
              <span
                className={`text-[9px] font-mono border rounded px-1.5 py-0 ${
                  locked
                    ? "border-warning/40 text-warning"
                    : "border-border text-muted-foreground"
                }`}
              >
                lvl {b.minLevel}+
              </span>
            )}
          </div>
          {!locked && (
            <div className="mt-1 flex items-center gap-2">
              <Progress
                value={weightPct}
                className="h-0.5 xp-bar flex-1 max-w-[200px]"
              />
              <span className="text-[10px] font-mono text-muted-foreground/60">
                {weightPct}%
              </span>
            </div>
          )}
        </div>
        <span
          className={`text-[10px] font-mono text-muted-foreground/40 transition-transform ${
            open ? "rotate-90" : ""
          }`}
        >
          ▸
        </span>
      </button>
      {open && b.notes && !editorOpen && (
        <div className="px-3 pb-3 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
          {b.notes}
        </div>
      )}
      {editing && (
        <div className="px-3 pb-3 flex items-center gap-1 flex-wrap">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditorOpen((s) => !s)}
            disabled={busy}
            className="h-7 text-xs"
          >
            {editorOpen ? "Close editor" : "✎ Edit block"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleMove("up")}
            disabled={busy || isFirst}
            className="h-7 px-2 text-xs"
          >
            ↑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleMove("down")}
            disabled={busy || isLast}
            className="h-7 px-2 text-xs"
          >
            ↓
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={busy}
            className="h-7 text-xs text-destructive"
          >
            Delete
          </Button>
        </div>
      )}
      {editing && editorOpen && (
        <BlockEditor block={b} onDone={() => setEditorOpen(false)} />
      )}
    </li>
  );
}

function BlockEditor({
  block: b,
  onDone,
}: {
  block: PracticeBlock;
  onDone: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(b.name);
  const [focus, setFocus] = useState<PracticeFocus>(b.focus);
  const [weight, setWeight] = useState(String(b.weight));
  const [minLevel, setMinLevel] = useState(String(b.minLevel));
  const [notes, setNotes] = useState(b.notes ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await updateBlock(b.id, {
        name,
        focus,
        weight: Number(weight),
        minLevel: Number(minLevel),
        notes: notes,
      });
      toast.success("Block updated");
      router.refresh();
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  return (
    <div className="px-3 pb-3 space-y-2 border-t border-border/60 pt-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 space-y-1">
          <Label className="text-[10px]">Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Focus</Label>
          <select
            value={focus}
            onChange={(e) => setFocus(e.target.value as PracticeFocus)}
            className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
          >
            {FOCUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[10px]">Weight</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]">Min lvl</Label>
            <Input
              type="number"
              min={1}
              max={6}
              value={minLevel}
              onChange={(e) => setMinLevel(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-[10px]">Notes</Label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs resize-y"
          placeholder="What to actually do during this block…"
        />
      </div>
      <div className="flex justify-end gap-1">
        <Button size="sm" variant="ghost" onClick={onDone} className="h-7 text-xs">
          Cancel
        </Button>
        <Button size="sm" onClick={save} disabled={busy} className="h-7 text-xs">
          {busy ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}

function NewBlockForm({ routineId }: { routineId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await addBlock(routineId, { name });
      setName("");
      toast.success("Block added");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  return (
    <div className="flex gap-1.5 items-center">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="+ new block name…"
        disabled={busy}
        className="h-7 text-xs w-56"
      />
      <Button size="sm" onClick={add} disabled={busy || !name.trim()} className="h-7 text-xs">
        Add
      </Button>
    </div>
  );
}

function RoutineHeaderEditor({
  routine: r,
  onDone,
}: {
  routine: PracticeRoutine;
  onDone: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(r.name);
  const [description, setDescription] = useState(r.description ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await updateRoutine(r.id, { name, description });
      toast.success("Routine updated");
      router.refresh();
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  return (
    <div className="rounded-md border border-border/60 bg-muted/20 p-3 space-y-2">
      <div className="space-y-1">
        <Label className="text-[10px]">Routine name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs" />
      </div>
      <div className="space-y-1">
        <Label className="text-[10px]">Description</Label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs resize-y"
        />
      </div>
      <div className="flex justify-end gap-1">
        <Button size="sm" variant="ghost" onClick={onDone} className="h-7 text-xs">
          Done editing
        </Button>
        <Button size="sm" onClick={save} disabled={busy} className="h-7 text-xs">
          {busy ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}

function CreateRoutineButton({ categoryId }: { categoryId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function add() {
    const name = prompt("Name for the new routine?");
    if (!name?.trim()) return;
    setBusy(true);
    try {
      await createRoutine({ categoryId, name });
      toast.success("Routine created");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }
  return (
    <Button size="sm" variant="ghost" onClick={add} disabled={busy} className="h-7 text-xs">
      + New
    </Button>
  );
}

function ReaddTemplateButton({ categoryId }: { categoryId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function readd() {
    setBusy(true);
    try {
      const res = await reseedMissingTemplateRoutines(categoryId);
      if (!res.hadTemplate) {
        toast.info("This skill has no template defaults to re-add.");
      } else if (res.added === 0) {
        toast.info("All template routines are already present.");
      } else {
        toast.success(
          `Re-added ${res.added} template routine${res.added === 1 ? "" : "s"}`
        );
        router.refresh();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={readd}
      disabled={busy}
      className="h-7 text-xs"
      title="Re-add any missing template routines"
    >
      ↺ Template
    </Button>
  );
}

function CreateFirstRoutine({
  categoryId,
  hasTemplate,
}: {
  categoryId: string;
  hasTemplate: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function add() {
    setBusy(true);
    try {
      await createRoutine({
        categoryId,
        name: "My practice routine",
        description: "Add blocks below to lay out a session.",
      });
      toast.success("Routine created");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }
  async function readd() {
    setBusy(true);
    try {
      const res = await reseedMissingTemplateRoutines(categoryId);
      if (!res.hadTemplate || res.added === 0) {
        toast.info("No template defaults to add for this skill.");
      } else {
        toast.success(
          `Re-added ${res.added} template routine${res.added === 1 ? "" : "s"}`
        );
        router.refresh();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-mono uppercase tracking-wider text-glow-purple">
        🎯 Deliberate practice
      </h2>
      <div className="rounded-xl border border-dashed bg-muted/20 p-5 space-y-3 text-center">
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Build a deliberate-practice routine for this skill. Add blocks
          (warm-up, technique, repertoire…), set their weights, then pick a
          session length to see how to spend each minute.
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Button size="sm" onClick={add} disabled={busy}>
            {busy ? "Working…" : "+ Start a routine"}
          </Button>
          {hasTemplate && (
            <Button
              size="sm"
              variant="outline"
              onClick={readd}
              disabled={busy}
            >
              ↺ Re-add template defaults
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
