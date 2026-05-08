import Link from "next/link";
import type { UpcomingBirthday } from "@/modules/friends/queries";

function dayLabel(daysUntil: number): {
  label: string;
  cls: string;
  pulse: boolean;
} {
  if (daysUntil === 0)
    return {
      label: "today 🎉",
      cls: "text-xp border-xp/40 bg-xp/10",
      pulse: true,
    };
  if (daysUntil === 1)
    return {
      label: "tomorrow",
      cls: "text-warning border-warning/40 bg-warning/10",
      pulse: false,
    };
  if (daysUntil <= 7)
    return {
      label: `in ${daysUntil}d`,
      cls: "text-warning border-warning/40 bg-warning/10",
      pulse: false,
    };
  return {
    label: `in ${daysUntil}d`,
    cls: "text-muted-foreground border-border",
    pulse: false,
  };
}

export function DashboardBirthdays({
  birthdays,
}: {
  birthdays: UpcomingBirthday[];
}) {
  if (birthdays.length === 0) return null;

  return (
    <section className="rounded-xl border border-xp/30 bg-xp/5 p-4 space-y-2">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-base">🎂</span>
          <h2 className="text-xs font-mono uppercase tracking-wider text-xp">
            Upcoming birthdays · {birthdays.length}
          </h2>
        </div>
        <Link
          href="/friends"
          className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          Open friends →
        </Link>
      </div>
      <ul className="space-y-1.5">
        {birthdays.slice(0, 5).map((b) => {
          const initials = b.name
            .split(/\s+/)
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
          const due = dayLabel(b.daysUntil);
          return (
            <li key={b.friendId}>
              <Link
                href={`/friends/${b.friendId}`}
                className="flex items-center gap-3 rounded-md border border-border/60 bg-card/60 px-3 py-2 hover:border-xp/40 transition-colors"
              >
                {b.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.photoUrl}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full border border-border bg-muted/40 flex items-center justify-center text-[11px] font-bold text-xp shrink-0">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium leading-tight line-clamp-1">
                    {b.name}
                    {b.turningAge != null && (
                      <span className="text-muted-foreground/60 ml-2 text-xs font-mono">
                        turns {b.turningAge}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    🎂 {b.label}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider border rounded px-1.5 py-0.5 shrink-0 ${due.cls} ${due.pulse ? "animate-pulse" : ""}`}
                >
                  {due.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
