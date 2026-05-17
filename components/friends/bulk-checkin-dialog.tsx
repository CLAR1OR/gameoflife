"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logBulkInteraction } from "@/modules/friends/actions";
import { toast } from "sonner";
import { celebrate } from "@/lib/celebrate";
import type { FriendCardData } from "@/modules/friends/types";

type Kind =
  | "meet"
  | "event"
  | "trip"
  | "call"
  | "message"
  | "letter"
  | "other";

const KIND_OPTIONS: { value: Kind; label: string }[] = [
  { value: "meet", label: "🤝 Meet" },
  { value: "event", label: "🎉 Event" },
  { value: "trip", label: "✈️ Trip" },
  { value: "call", label: "📞 Call" },
  { value: "message", label: "💬 Message" },
  { value: "letter", label: "💌 Letter" },
  { value: "other", label: "· Other" },
];

/**
 * Multi-friend check-in dialog. Tick everyone who was at an event, set
 * date + kind + optional notes, submit once — the action records a
 * separate interaction row per friend so per-friend stats and "due to
 * reach out" timers all update normally.
 */
export function BulkCheckinDialog({
  open,
  onOpenChange,
  friends,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friends: FriendCardData[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [kind, setKind] = useState<Kind>("meet");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  // Reset state every time the dialog opens.
  useEffect(() => {
    if (open) {
      setSelected(new Set());
      setKind("meet");
      setDate(new Date().toISOString().slice(0, 10));
      setNotes("");
      setSearch("");
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.nickname?.toLowerCase().includes(q) ?? false)
    );
  }, [friends, search]);

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setSelected((s) => {
      const next = new Set(s);
      for (const f of filtered) next.add(f.id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  async function submit() {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const result = await logBulkInteraction({
        friendIds: Array.from(selected),
        occurredOn: date,
        kind,
        notes: notes || null,
      });
      toast.success(
        `Logged ${result.count} check-in${result.count === 1 ? "" : "s"}`,
        { description: `+${result.xpAwarded} XP` }
      );
      if (result.newAchievements.length > 0) {
        celebrate(result.newAchievements);
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:!max-w-lg">
        <DialogHeader>
          <DialogTitle>🎉 Bulk check-in</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px]">Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">Kind</Label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as Kind)}
                className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                {KIND_OPTIONS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px]">Notes (optional)</Label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Birthday dinner at the pub…"
              className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs resize-y"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <Label className="text-[10px]">
                Who was there{" "}
                <span className="text-glow-purple">({selected.size})</span>
              </Label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllVisible}
                  className="text-[10px] font-mono text-muted-foreground hover:text-foreground"
                >
                  select all
                </button>
                {selected.size > 0 && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-[10px] font-mono text-muted-foreground hover:text-foreground"
                  >
                    clear
                  </button>
                )}
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="h-7 text-xs w-28"
                />
              </div>
            </div>
            <div className="max-h-[40vh] overflow-y-auto rounded-md border border-border/60 p-1 grid grid-cols-1 sm:grid-cols-2 gap-1">
              {filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-3 col-span-full">
                  No friends match.
                </p>
              ) : (
                filtered.map((f) => {
                  const isSelected = selected.has(f.id);
                  const initials = f.name
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => toggle(f.id)}
                      className={`flex items-center gap-2 rounded-md p-1.5 text-left transition-colors min-w-0 ${
                        isSelected
                          ? "bg-glow-purple/15 ring-1 ring-glow-purple"
                          : "hover:bg-accent"
                      }`}
                    >
                      {f.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.photoUrl}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover shrink-0 border border-border"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full flex items-center justify-center bg-glow-purple/15 text-[10px] font-bold text-glow-purple shrink-0">
                          {initials}
                        </div>
                      )}
                      <span className="text-xs font-medium line-clamp-1 flex-1 min-w-0">
                        {f.name}
                      </span>
                      {isSelected && (
                        <span className="text-glow-purple text-xs shrink-0">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy || selected.size === 0}>
            {busy
              ? "…"
              : selected.size === 0
                ? "Pick at least one friend"
                : `Log check-in for ${selected.size}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
