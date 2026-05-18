"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateFriend } from "@/modules/friends/actions";
import { toast } from "sonner";

export function FriendInlineTextSection({
  friendId,
  field,
  label,
  initialValue,
  rows = 6,
  placeholder,
}: {
  friendId: string;
  field: "notes" | "howWeMet";
  label: string;
  initialValue: string | null;
  rows?: number;
  placeholder?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue ?? "");
  const [savedValue, setSavedValue] = useState(initialValue ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(initialValue ?? "");
    setSavedValue(initialValue ?? "");
  }, [initialValue]);

  async function save() {
    if (value === savedValue) return;
    setStatus("saving");
    try {
      const patch =
        field === "notes"
          ? { notes: value || null }
          : { howWeMet: value || null };
      await updateFriend(friendId, patch);
      setSavedValue(value);
      setStatus("saved");
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setStatus("idle"), 1500);
      router.refresh();
    } catch (e) {
      setStatus("idle");
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  const dirty = value !== savedValue;

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
          {label}
        </h2>
        <span className="text-[10px] font-mono text-muted-foreground">
          {status === "saving"
            ? "saving…"
            : dirty
              ? "unsaved — click away to save"
              : status === "saved"
                ? "saved ✓"
                : ""}
        </span>
      </div>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        placeholder={placeholder}
        className="w-full rounded-md border border-border/60 bg-card/40 hover:border-border focus:border-glow/60 focus:bg-card transition-colors px-3 py-2 text-sm leading-relaxed resize-y outline-none whitespace-pre-wrap"
      />
    </section>
  );
}
