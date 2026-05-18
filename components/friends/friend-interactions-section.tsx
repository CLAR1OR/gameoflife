"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteInteraction } from "@/modules/friends/actions";
import { toast } from "sonner";
import type { FriendInteraction } from "@/modules/friends/types";

const KIND_ICON: Record<FriendInteraction["kind"], string> = {
  message: "💬",
  call: "📞",
  meet: "🤝",
  letter: "💌",
  event: "🎉",
  trip: "✈️",
  other: "·",
};

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function prevMonthOf(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function FriendInteractionsSection({
  interactions,
}: {
  interactions: FriendInteraction[];
}) {
  const router = useRouter();

  const groups = useMemo(() => {
    const map = new Map<string, FriendInteraction[]>();
    for (const i of interactions) {
      const key = i.occurredOn.slice(0, 7);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(i);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [interactions]);

  const now = new Date();
  const currentYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastYm = prevMonthOf(currentYm);

  const [openMonths, setOpenMonths] = useState<Set<string>>(
    () => new Set([currentYm, lastYm])
  );

  function toggle(ym: string) {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      if (next.has(ym)) next.delete(ym);
      else next.add(ym);
      return next;
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this interaction?")) return;
    try {
      await deleteInteraction(id);
      toast.success("Deleted");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <section className="space-y-2">
      <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
        📅 Interactions ({interactions.length})
      </h2>
      {interactions.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No interactions logged yet — use the &ldquo;Check in&rdquo; button
          above.
        </p>
      ) : (
        <div className="space-y-2">
          {groups.map(([ym, items]) => {
            const open = openMonths.has(ym);
            return (
              <div
                key={ym}
                className="rounded-md border border-border/40 bg-card/20 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggle(ym)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-card/40 transition-colors"
                >
                  <span>
                    <span className="inline-block w-3">{open ? "▾" : "▸"}</span>{" "}
                    {monthLabel(ym)}
                  </span>
                  <span className="text-muted-foreground/60">
                    {items.length}
                  </span>
                </button>
                {open && (
                  <ul className="space-y-1.5 p-2 border-t border-border/30">
                    {items.map((i) => (
                      <li
                        key={i.id}
                        className="rounded-md border border-border/60 bg-card/40 px-3 py-2 flex items-start gap-3 group"
                      >
                        <span className="text-base shrink-0">
                          {KIND_ICON[i.kind]}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-xs font-medium capitalize">
                              {i.kind}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {i.occurredOn}
                            </span>
                          </div>
                          {i.notes && (
                            <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap">
                              {i.notes}
                            </p>
                          )}
                        </div>
                        {i.xpAwarded > 0 && (
                          <span className="text-[10px] font-mono text-xp shrink-0">
                            +{i.xpAwarded} XP
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(i.id)}
                          className="text-[10px] text-muted-foreground/40 hover:text-destructive opacity-0 group-hover:opacity-100 touch:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
