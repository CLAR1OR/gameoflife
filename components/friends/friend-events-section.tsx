"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addEvent,
  updateEvent,
  deleteEvent,
} from "@/modules/friends/actions";
import { toast } from "sonner";
import type { FriendEvent } from "@/modules/friends/types";

const EVENT_KINDS: { value: FriendEvent["kind"]; label: string; icon: string }[] = [
  { value: "milestone", label: "Milestone", icon: "✨" },
  { value: "moved", label: "Moved", icon: "📦" },
  { value: "job", label: "New job", icon: "💼" },
  { value: "married", label: "Married", icon: "💍" },
  { value: "child", label: "Had a child", icon: "👶" },
  { value: "loss", label: "Loss", icon: "🕯️" },
  { value: "health", label: "Health", icon: "🩺" },
  { value: "achievement", label: "Achievement", icon: "🏆" },
  { value: "other", label: "Other", icon: "·" },
];

function iconFor(kind: FriendEvent["kind"]): string {
  return EVENT_KINDS.find((k) => k.value === kind)?.icon ?? "·";
}

export function FriendEventsSection({
  friendId,
  events,
}: {
  friendId: string;
  events: FriendEvent[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [kind, setKind] = useState<FriendEvent["kind"]>("milestone");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      await addEvent({
        friendId,
        occurredOn: date,
        kind,
        title,
        notes: notes || null,
      });
      setTitle("");
      setNotes("");
      setKind("milestone");
      setDate(new Date().toISOString().slice(0, 10));
      setAdding(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    try {
      await deleteEvent(id);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono uppercase tracking-wider text-xp">
          🌱 Life events
        </h2>
        <button
          type="button"
          onClick={() => setAdding((s) => !s)}
          className="text-[11px] font-mono text-muted-foreground hover:text-foreground"
        >
          {adding ? "cancel" : "+ add"}
        </button>
      </div>

      {events.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground/70 italic">
          No events yet. Log meaningful things in their life — moves, jobs,
          weddings, births, losses — to keep context next time you talk.
        </p>
      )}

      {events.length > 0 && (
        <ul className="space-y-1.5">
          {events.map((ev) =>
            editingId === ev.id ? (
              <EditEventRow
                key={ev.id}
                event={ev}
                onDone={() => {
                  setEditingId(null);
                  router.refresh();
                }}
              />
            ) : (
              <li
                key={ev.id}
                className="rounded-md border border-border/60 bg-card/40 px-3 py-2 flex items-start gap-3 group"
              >
                <span className="text-base shrink-0 leading-none pt-0.5">
                  {iconFor(ev.kind)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium">{ev.title}</span>
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {ev.occurredOn}
                    </span>
                  </div>
                  {ev.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">
                      {ev.notes}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => setEditingId(ev.id)}
                    className="text-[10px] font-mono text-muted-foreground hover:text-foreground"
                  >
                    edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(ev.id)}
                    className="text-[10px] font-mono text-muted-foreground/40 hover:text-destructive"
                  >
                    ✕
                  </button>
                </div>
              </li>
            )
          )}
        </ul>
      )}

      {adding && (
        <form
          onSubmit={handleAdd}
          className="rounded-md border border-xp/30 bg-xp/5 p-3 space-y-2"
        >
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px]">Type</Label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as FriendEvent["kind"])}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                {EVENT_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.icon} {k.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-[10px]">Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Got married in Lisbon"
            className="h-8 text-xs"
            autoFocus
          />
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs resize-y"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              disabled={busy || !title.trim()}
              className="h-7 text-xs"
            >
              {busy ? "…" : "Add event"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

function EditEventRow({
  event: ev,
  onDone,
}: {
  event: FriendEvent;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(ev.title);
  const [notes, setNotes] = useState(ev.notes ?? "");
  const [kind, setKind] = useState<FriendEvent["kind"]>(ev.kind);
  const [date, setDate] = useState(ev.occurredOn);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await updateEvent(ev.id, { title, kind, occurredOn: date, notes });
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  return (
    <li className="rounded-md border border-xp/40 bg-xp/5 p-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as FriendEvent["kind"])}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
        >
          {EVENT_KINDS.map((k) => (
            <option key={k.value} value={k.value}>
              {k.icon} {k.label}
            </option>
          ))}
        </select>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-8 text-xs"
        />
      </div>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="h-8 text-xs"
      />
      <textarea
        rows={2}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs resize-y"
      />
      <div className="flex justify-end gap-1">
        <Button size="sm" variant="ghost" onClick={onDone} className="h-7 text-xs">
          Cancel
        </Button>
        <Button size="sm" onClick={save} disabled={busy} className="h-7 text-xs">
          Save
        </Button>
      </div>
    </li>
  );
}
