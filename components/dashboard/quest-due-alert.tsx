import Link from "next/link";
import { Progress } from "@/components/ui/progress";
import type { DueQuestEntry } from "@/modules/quests/queries";

function formatDueLabel(days: number): {
  label: string;
  cls: string;
  pulse: boolean;
} {
  if (days < 0) {
    const abs = Math.abs(days);
    return {
      label: abs === 1 ? "1d overdue" : `${abs}d overdue`,
      cls: "text-destructive border-destructive/40 bg-destructive/10",
      pulse: true,
    };
  }
  if (days === 0)
    return {
      label: "due today",
      cls: "text-warning border-warning/40 bg-warning/10",
      pulse: true,
    };
  if (days === 1)
    return {
      label: "due tomorrow",
      cls: "text-warning border-warning/40 bg-warning/10",
      pulse: false,
    };
  return {
    label: `due in ${days}d`,
    cls: "text-muted-foreground border-border bg-muted/20",
    pulse: false,
  };
}

export function QuestDueAlert({ quests }: { quests: DueQuestEntry[] }) {
  if (quests.length === 0) return null;

  const overdueCount = quests.filter((q) => q.daysUntilDue < 0).length;
  const todayCount = quests.filter((q) => q.daysUntilDue === 0).length;
  const upcomingCount = quests.length - overdueCount - todayCount;

  // Choose the section's accent — destructive if anything's overdue, warning
  // if anything's due today/tomorrow, otherwise just a quiet info border.
  const hasOverdue = overdueCount > 0;
  const hasUrgent = hasOverdue || todayCount > 0;
  const sectionCls = hasOverdue
    ? "border-destructive/40 bg-destructive/5"
    : hasUrgent
      ? "border-warning/40 bg-warning/5"
      : "border-border bg-card";

  const headlineParts: string[] = [];
  if (overdueCount > 0)
    headlineParts.push(
      `${overdueCount} overdue`
    );
  if (todayCount > 0) headlineParts.push(`${todayCount} due today`);
  if (upcomingCount > 0) headlineParts.push(`${upcomingCount} due soon`);

  return (
    <section className={`rounded-xl border ${sectionCls} p-4 space-y-2`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={`text-base ${hasOverdue ? "animate-pulse" : ""}`}>
            {hasOverdue ? "⚠️" : "🔔"}
          </span>
          <h2 className="text-xs font-mono uppercase tracking-wider">
            Quests · {headlineParts.join(" · ")}
          </h2>
        </div>
        <Link
          href="/quests"
          className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          Open quests →
        </Link>
      </div>
      <ul className="space-y-1.5">
        {quests.map((q) => {
          const due = formatDueLabel(q.daysUntilDue);
          return (
            <li key={q.id}>
              <Link
                href="/quests"
                className="flex items-center gap-3 rounded-md border border-border/60 bg-card/60 px-3 py-2 hover:border-glow/40 transition-colors"
              >
                <span className="text-xl shrink-0 leading-none">{q.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[9px] font-mono uppercase tracking-wider border rounded px-1.5 py-0 ${
                        q.type === "main"
                          ? "border-xp/40 text-xp"
                          : "border-glow/40 text-glow"
                      }`}
                    >
                      {q.type === "main" ? "⚔️ MAIN" : "📜 SIDE"}
                    </span>
                    <span className="text-sm font-medium line-clamp-1">
                      {q.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {q.progressPct > 0 ? (
                      <>
                        <Progress
                          value={q.progressPct}
                          className="h-1 xp-bar flex-1 max-w-[160px]"
                        />
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {q.progressPct}%
                        </span>
                      </>
                    ) : (
                      <span className="text-[10px] font-mono text-muted-foreground/60">
                        no progress yet
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider border rounded px-2 py-0.5 shrink-0 ${due.cls} ${
                    due.pulse ? "animate-pulse" : ""
                  }`}
                >
                  ⏳ {due.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
