"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  uploadPlacePhoto,
  clearPlacePhoto,
  uploadVisitPhoto,
  clearVisitPhoto,
} from "@/modules/places/actions";
import { toast } from "sonner";

/** Generic photo uploader — switches between place / visit modes via the
 * `target` prop. Wraps any visual children with hover-overlay buttons. */
export function PlacePhotoUpload({
  target,
  id,
  hasPhoto,
  children,
}: {
  target: "place" | "visit";
  id: string;
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
      if (target === "place") {
        await uploadPlacePhoto(id, fd);
      } else {
        await uploadVisitPhoto(id, fd);
      }
      toast.success("Photo updated");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemove() {
    if (!confirm("Remove this photo?")) return;
    setBusy(true);
    try {
      if (target === "place") {
        await clearPlacePhoto(id);
      } else {
        await clearVisitPhoto(id);
      }
      toast.success("Photo removed");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  return (
    <div className="relative group inline-block">
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
      <div className="absolute inset-x-0 bottom-1 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="h-6 text-[10px] px-2 bg-card/95 backdrop-blur-sm"
        >
          {busy ? "…" : hasPhoto ? "✎ photo" : "+ photo"}
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
