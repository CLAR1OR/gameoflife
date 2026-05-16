"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  uploadFriendPhoto,
  clearFriendPhoto,
} from "@/modules/friends/actions";
import { toast } from "sonner";

/**
 * Photo controls that live next to the friend's avatar.
 * Wraps the avatar passed as `children` and overlays "change" / "remove"
 * buttons. Uploads via FormData to the uploadFriendPhoto server action.
 */
export function FriendPhotoUpload({
  friendId,
  hasPhoto,
  children,
}: {
  friendId: string;
  hasPhoto: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      await uploadFriendPhoto(friendId, fd);
      toast.success("Photo updated");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemove() {
    if (!confirm("Remove this friend's photo?")) return;
    setBusy(true);
    try {
      await clearFriendPhoto(friendId);
      toast.success("Photo removed");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  return (
    <div className="relative shrink-0 group">
      {children}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
        disabled={busy}
        className="hidden"
      />
      <div className="absolute inset-x-0 -bottom-1 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="h-6 text-[10px] px-2 bg-card/95 backdrop-blur-sm"
          title={hasPhoto ? "Change photo" : "Upload photo"}
        >
          {busy ? "…" : hasPhoto ? "✎" : "+ photo"}
        </Button>
        {hasPhoto && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRemove}
            disabled={busy}
            className="h-6 w-6 p-0 text-[10px] bg-card/95 backdrop-blur-sm text-destructive"
            title="Remove photo"
          >
            ✕
          </Button>
        )}
      </div>
    </div>
  );
}
