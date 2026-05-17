"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { uploadSkillCover, resetSkillCover } from "@/modules/skills/actions";
import { toast } from "sonner";

/**
 * Tiny corner button on the skill header that lets the user upload a
 * custom cover image (or reset to the cover-pack/template fallback).
 * Sits on top of the gradient so the action stays discoverable without
 * crowding the layout.
 */
export function SkillCoverUpload({
  categoryId,
  hasCustomCover,
}: {
  categoryId: string;
  hasCustomCover: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      await uploadSkillCover(categoryId, fd);
      toast.success("Cover updated");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  async function handleReset() {
    if (!confirm("Reset to the cover-pack image (or default gradient)?")) {
      return;
    }
    setBusy(true);
    try {
      await resetSkillCover(categoryId);
      toast.success("Reset");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  return (
    <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-60 hover:opacity-100 transition-opacity">
      <Button
        size="sm"
        variant="ghost"
        disabled={busy}
        className="h-7 px-2 text-[11px] bg-black/40 hover:bg-black/60 text-white border border-white/20"
        onClick={() => inputRef.current?.click()}
        title="Upload a custom cover image"
      >
        {busy ? "…" : "📷 Cover"}
      </Button>
      {hasCustomCover && (
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          className="h-7 px-2 text-[11px] bg-black/40 hover:bg-black/60 text-white/80 border border-white/20"
          onClick={handleReset}
          title="Remove custom cover and revert to the pack/default"
        >
          Reset
        </Button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
