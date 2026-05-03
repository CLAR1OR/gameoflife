import Link from "next/link";
import type {
  LinkedHabitForCategory,
} from "@/modules/links/queries";
import type { Book } from "@/modules/books/types";

export function LinkedItemsPanel({
  habits,
  books,
  stats,
}: {
  habits: LinkedHabitForCategory[];
  books: Book[];
  stats: {
    habitCompletions: number;
    booksRead: number;
    habitsLinked: number;
    booksLinked: number;
  };
}) {
  if (habits.length === 0 && books.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          🔗 Contributing to this skill
        </h2>
        <div className="rounded-xl border border-dashed bg-muted/20 p-5 text-sm text-muted-foreground">
          Link a habit or a book to a subskill in this tree to feed XP into it.
          Habits do this from the habits page; books do it from a book&apos;s
          detail dialog.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
          🔗 Contributing to this skill
        </h2>
        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
          <span>
            {stats.habitsLinked} habits ·{" "}
            {stats.habitCompletions.toLocaleString()} check-offs
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span>
            {stats.booksLinked} books · {stats.booksRead} read
          </span>
        </div>
      </div>

      {habits.length > 0 && (
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Habits
          </div>
          <ul className="space-y-1.5">
            {habits.map((h) => (
              <li
                key={h.id}
                className="flex items-center gap-3 rounded-md border border-border/60 bg-card/40 px-3 py-2 text-sm"
              >
                <span className="text-lg shrink-0 leading-none">{h.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium leading-tight line-clamp-1">
                    {h.name}
                    {h.archived && (
                      <span className="ml-2 text-[10px] font-mono text-muted-foreground/60 uppercase">
                        archived
                      </span>
                    )}
                    {h.paused && !h.archived && (
                      <span className="ml-2 text-[10px] font-mono text-muted-foreground/60 uppercase">
                        paused
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    →{" "}
                    <Link
                      href="/habits"
                      className="hover:text-glow transition-colors"
                    >
                      {h.skillName}
                    </Link>{" "}
                    · +{h.xpPerCompletion} XP per check-off
                  </div>
                </div>
                <span className="text-[10px] font-mono text-glow shrink-0">
                  {h.totalCompletions.toLocaleString()}×
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {books.length > 0 && (
        <div className="rounded-xl border bg-card p-4 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
            Books
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2">
            {books.map((b) => (
              <Link
                key={b.id}
                href={`/books/${b.id}`}
                className={`group block rounded-md border overflow-hidden aspect-[2/3] relative transition-all ${
                  b.status === "read"
                    ? "border-xp/40 hover:border-xp/70"
                    : b.status === "reading"
                      ? "border-glow/40 hover:border-glow/70"
                      : "border-border opacity-60 hover:opacity-100"
                }`}
                title={`${b.title} — ${b.authors}`}
              >
                {b.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.coverUrl}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-2xl bg-muted/30">
                    📖
                  </div>
                )}
                {b.status === "read" && (
                  <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-xp/80 text-[10px] flex items-center justify-center text-background">
                    ✓
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
