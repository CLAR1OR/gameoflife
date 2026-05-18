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
import { assignTag, unassignTag } from "@/modules/friends/actions";
import { TagChip } from "./tag-chip";
import { TagManagerDialog } from "./friend-tags-section";
import { toast } from "sonner";
import type { FriendTag } from "@/modules/friends/types";

/**
 * Trigger button + assign-tags dialog + manage-tags dialog as one unit.
 * Used in the friend detail page hero, where tag chips are already
 * visible so the dedicated tags section is redundant. Wraps the same
 * picker + manager UI that lived inside FriendTagsSection.
 */
export function FriendTagsButton({
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
    <>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
        title="Assign or manage tags"
      >
        🏷️ {friendTags.length === 0 ? "+ add tag" : "tags"}
      </button>

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
    </>
  );
}
