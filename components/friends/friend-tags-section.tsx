"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  assignTag,
  unassignTag,
  createTag,
  updateTag,
  deleteTag,
} from "@/modules/friends/actions";
import { toast } from "sonner";
import {
  TagChip,
  TAG_COLOR_OPTIONS,
  classesForColor,
} from "./tag-chip";
import type { FriendTag } from "@/modules/friends/queries";

export function FriendTagsSection({
  friendId,
  friendTags,
  allTags,
}: {
  friendId: string;
  friendTags: FriendTag[];
  allTags: FriendTag[];
}) {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const assignedIds = new Set(friendTags.map((t) => t.id));

  async function toggle(tagId: string) {
    setBusy(true);
    try {
      if (assignedIds.has(tagId)) {
        await unassignTag(friendId, tagId);
      } else {
        await assignTag(friendId, tagId);
      }
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono uppercase tracking-wider text-glow-purple">
          🏷️ Tags
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="text-[11px] font-mono text-muted-foreground hover:text-foreground"
          >
            + assign
          </button>
          <button
            type="button"
            onClick={() => setManagerOpen(true)}
            className="text-[11px] font-mono text-muted-foreground hover:text-foreground"
          >
            manage
          </button>
        </div>
      </div>
      {friendTags.length === 0 ? (
        <p className="text-xs text-muted-foreground/70 italic">
          No tags yet. Add tags like &ldquo;family&rdquo;, &ldquo;close&rdquo;,
          or &ldquo;work&rdquo; to group friends.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {friendTags.map((t) => (
            <TagChip key={t.id} tag={t} onClick={() => toggle(t.id)} />
          ))}
        </div>
      )}

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign tags</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {allTags.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No tags exist yet. Click &ldquo;manage&rdquo; to create some.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((t) => (
                  <TagChip
                    key={t.id}
                    tag={t}
                    onClick={() => toggle(t.id)}
                    selected={assignedIds.has(t.id)}
                  />
                ))}
              </div>
            )}
            {allTags.length > 0 && (
              <p className="text-[10px] font-mono text-muted-foreground/70">
                Click a tag to toggle it on/off for this friend.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setPickerOpen(false)}
              disabled={busy}
            >
              Done
            </Button>
            <Button
              onClick={() => {
                setPickerOpen(false);
                setManagerOpen(true);
              }}
            >
              Manage tags →
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TagManagerDialog
        open={managerOpen}
        onOpenChange={setManagerOpen}
        tags={allTags}
      />
    </section>
  );
}

export function TagManagerDialog({
  open,
  onOpenChange,
  tags,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  tags: FriendTag[];
}) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("glow");
  const [newCadence, setNewCadence] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    try {
      const cad = newCadence.trim() ? Number(newCadence) : null;
      await createTag({
        name: newName,
        color: newColor,
        defaultCadenceDays:
          cad !== null && Number.isFinite(cad) && cad > 0 ? Math.round(cad) : null,
      });
      setNewName("");
      setNewColor("glow");
      setNewCadence("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete tag "${name}"? It will be removed from every friend.`))
      return;
    try {
      await deleteTag(id);
      toast.success("Tag deleted");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:!max-w-md">
        <DialogHeader>
          <DialogTitle>Manage tags</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <ul className="space-y-1">
            {tags.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No tags yet. Add one below.
              </p>
            ) : (
              tags.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-2 rounded-md border border-border/60 bg-card/40 px-2 py-1.5"
                >
                  {editingId === t.id ? (
                    <EditTagRow
                      tag={t}
                      onDone={() => {
                        setEditingId(null);
                        router.refresh();
                      }}
                    />
                  ) : (
                    <>
                      <TagChip tag={t} />
                      {t.defaultCadenceDays && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          🔔 {t.defaultCadenceDays}d
                        </span>
                      )}
                      <div className="ml-auto flex gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingId(t.id)}
                          className="text-[10px] font-mono text-muted-foreground hover:text-foreground"
                        >
                          edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(t.id, t.name)}
                          className="text-[10px] font-mono text-muted-foreground/40 hover:text-destructive"
                        >
                          ✕
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))
            )}
          </ul>

          <form
            onSubmit={handleCreate}
            className="rounded-md border border-glow-purple/30 bg-glow-purple/5 p-3 space-y-2"
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-glow-purple">
              + Add tag
            </div>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Family / Close / Work / Uni…"
              className="h-8 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[10px]">Color</Label>
                <select
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  {TAG_COLOR_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span
                  className={`inline-block mt-1 rounded-full border px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${classesForColor(
                    newColor
                  )}`}
                >
                  preview
                </span>
              </div>
              <div>
                <Label className="text-[10px]">
                  Default cadence (days)
                </Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={newCadence}
                  onChange={(e) => setNewCadence(e.target.value)}
                  placeholder="optional"
                  className="h-8 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                size="sm"
                disabled={busy || !newName.trim()}
                className="h-7 text-xs"
              >
                {busy ? "…" : "Add"}
              </Button>
            </div>
          </form>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditTagRow({
  tag,
  onDone,
}: {
  tag: FriendTag;
  onDone: () => void;
}) {
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);
  const [cadence, setCadence] = useState(
    tag.defaultCadenceDays?.toString() ?? ""
  );
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      const cad = cadence.trim() ? Number(cadence) : null;
      await updateTag(tag.id, {
        name,
        color,
        defaultCadenceDays:
          cad !== null && Number.isFinite(cad) && cad > 0 ? Math.round(cad) : null,
      });
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-1 flex-1 flex-wrap">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-7 text-xs flex-1 min-w-[80px]"
      />
      <select
        value={color}
        onChange={(e) => setColor(e.target.value)}
        className="h-7 rounded-md border border-input bg-background px-2 text-xs"
      >
        {TAG_COLOR_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Input
        type="number"
        min={1}
        max={365}
        value={cadence}
        onChange={(e) => setCadence(e.target.value)}
        placeholder="cadence"
        className="h-7 text-xs w-20"
      />
      <Button size="sm" onClick={save} disabled={busy} className="h-7 text-xs">
        Save
      </Button>
    </div>
  );
}
