"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logInteraction } from "@/modules/friends/actions";
import { FRIEND_INTERACTION_XP } from "@/modules/friends/constants";
import { celebrate } from "@/lib/celebrate";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const KIND_LABELS = [
  { kind: "message", icon: "💬", label: "Message" },
  { kind: "call", icon: "📞", label: "Call" },
  { kind: "meet", icon: "🤝", label: "Met up" },
  { kind: "letter", icon: "💌", label: "Letter" },
  { kind: "event", icon: "🎉", label: "Event" },
  { kind: "trip", icon: "✈️", label: "Trip" },
] as const;

type Kind = (typeof KIND_LABELS)[number]["kind"];

export function CheckInButton({
  friendId,
  size = "sm",
  variant = "default",
}: {
  friendId: string;
  size?: "sm" | "default";
  variant?: "default" | "outline" | "ghost";
}) {
  const router = useRouter();
  const [stage, setStage] = useState<"closed" | "kind" | "notes">("closed");
  const [kind, setKind] = useState<Kind>("message");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);

  function reset() {
    setStage("closed");
    setNotes("");
    setDate(new Date().toISOString().slice(0, 10));
  }

  async function save(quick: boolean) {
    setBusy(true);
    try {
      const res = await logInteraction({
        friendId,
        occurredOn: date,
        kind,
        notes: notes.trim() || null,
      });
      toast.success(`Logged · +${res.xpAwarded} XP`);
      if (res.newAchievements.length > 0) celebrate(res.newAchievements);
      reset();
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
    void quick;
  }

  if (stage === "closed") {
    return (
      <Button
        size={size}
        variant={variant}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setStage("kind");
        }}
        className={
          variant === "default"
            ? "bg-glow/15 hover:bg-glow/25 text-glow border border-glow/40"
            : ""
        }
      >
        ✓ Check in (+{FRIEND_INTERACTION_XP})
      </Button>
    );
  }

  if (stage === "kind") {
    return (
      <div
        className="flex flex-wrap gap-1 items-center"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {KIND_LABELS.map((k) => (
          <Button
            key={k.kind}
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setKind(k.kind);
              setStage("notes");
            }}
            disabled={busy}
            className="h-7 text-[11px]"
            title={k.label}
          >
            {k.icon} {k.label}
          </Button>
        ))}
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            reset();
          }}
          className="h-7 text-[11px] text-muted-foreground"
        >
          cancel
        </Button>
      </div>
    );
  }

  // stage === "notes"
  const kindMeta = KIND_LABELS.find((k) => k.kind === kind)!;
  return (
    <div
      className="rounded-md border border-glow/30 bg-glow/5 p-3 space-y-2 w-full max-w-md"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-glow">
          {kindMeta.icon} {kindMeta.label} · check-in
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setStage("kind");
          }}
          className="text-[10px] font-mono text-muted-foreground hover:text-foreground"
        >
          change
        </button>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
        <Label className="text-[10px]">Date</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="h-7 text-xs"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        placeholder="Notes (optional) — what did you talk about, where, anything to remember…"
        rows={3}
        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs resize-y placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      <div className="flex justify-between gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            reset();
          }}
          disabled={busy}
          className="h-7 text-xs text-muted-foreground"
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            save(false);
          }}
          disabled={busy}
          className="h-7 text-xs bg-glow/15 hover:bg-glow/25 text-glow border border-glow/40"
        >
          {busy ? "Saving…" : `Save · +${FRIEND_INTERACTION_XP} XP`}
        </Button>
      </div>
    </div>
  );
}
