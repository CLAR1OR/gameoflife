"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function go(kind: (typeof KIND_LABELS)[number]["kind"]) {
    setBusy(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await logInteraction({
        friendId,
        occurredOn: today,
        kind,
      });
      toast.success(
        `Logged · +${res.xpAwarded} XP`
      );
      if (res.newAchievements.length > 0) celebrate(res.newAchievements);
      setOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setBusy(false);
  }

  if (!open) {
    return (
      <Button
        size={size}
        variant={variant}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
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

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {KIND_LABELS.map((k) => (
        <Button
          key={k.kind}
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void go(k.kind);
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
          setOpen(false);
        }}
        className="h-7 text-[11px] text-muted-foreground"
      >
        cancel
      </Button>
    </div>
  );
}
