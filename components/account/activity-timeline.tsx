import Link from "next/link";
import type { TimelineEvent } from "@/modules/activity/queries";

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDayLabel(key: string, today: string, yesterday: string): string {
  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() === new Date().getFullYear()
        ? undefined
        : "numeric",
  });
}

const KIND_STYLE: Record<
  TimelineEvent["kind"],
  { label: string; color: string }
> = {
  milestone: { label: "Milestone", color: "text-glow border-glow/40" },
  quest: { label: "Quest", color: "text-glow-purple border-glow-purple/40" },
  book: { label: "Book", color: "text-xp border-xp/40" },
  achievement: { label: "🏆", color: "text-xp border-xp/40" },
  place: { label: "Place", color: "text-glow border-glow/40" },
  friend: { label: "Friend", color: "text-glow-purple border-glow-purple/40" },
};

export function ActivityTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-5 text-center text-sm text-muted-foreground">
        No activity yet. Complete a milestone, finish a book, or unlock an
        achievement — it&apos;ll show up here.
      </div>
    );
  }

  const now = new Date();
  const todayKey = dayKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = dayKey(yesterday);

  const groups: { key: string; label: string; events: TimelineEvent[] }[] = [];
  const seen = new Map<string, TimelineEvent[]>();
  for (const e of events) {
    const k = dayKey(e.at);
    if (!seen.has(k)) {
      const group: TimelineEvent[] = [];
      seen.set(k, group);
      groups.push({
        key: k,
        label: formatDayLabel(k, todayKey, yesterdayKey),
        events: group,
      });
    }
    seen.get(k)!.push(e);
  }

  return (
    <div className="rounded-xl border bg-card divide-y divide-border/60">
      {groups.map((g) => (
        <div key={g.key} className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {g.label}
            </h3>
            <div className="flex-1 h-px bg-border/40" />
            <span className="text-[10px] font-mono text-muted-foreground/70">
              {g.events.length}{" "}
              {g.events.length === 1 ? "event" : "events"}
            </span>
          </div>
          <ul className="space-y-1.5">
            {g.events.map((e, idx) => {
              const style = KIND_STYLE[e.kind];
              const body = (
                <div className="flex items-start gap-3 rounded-md border border-border/60 bg-card/40 px-3 py-2 hover:border-glow/30 transition-colors">
                  <span className="text-xl shrink-0 leading-none pt-0.5">
                    {e.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium line-clamp-1">
                        {e.title}
                      </span>
                      <span
                        className={`text-[9px] font-mono uppercase tracking-wider border rounded px-1.5 py-0 ${style.color}`}
                      >
                        {style.label}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {e.subtitle}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {e.xp != null && e.xp > 0 && (
                      <div className="text-[11px] font-mono text-xp">
                        +{e.xp} XP
                      </div>
                    )}
                    <div className="text-[10px] font-mono text-muted-foreground/60">
                      {e.at.toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              );
              return (
                <li key={`${e.kind}-${idx}-${e.at.getTime()}`}>
                  {e.href ? (
                    <Link href={e.href} className="block">
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
