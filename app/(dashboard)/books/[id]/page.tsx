import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth-server";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { skill, skillCategory, quest } from "@/lib/db/schema";
import { getBookById, getReadHistory } from "@/modules/books/queries";
import { BookDetailButton } from "@/components/books/book-detail-button";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const b = await getBookById(id, session.user.id);
  if (!b) notFound();

  const history = await getReadHistory(id, session.user.id);

  let linkedSkill: {
    id: string;
    name: string;
    categoryId: string;
    categoryName: string;
    categoryIcon: string | null;
  } | null = null;
  if (b.skillId) {
    const row = await db
      .select({
        id: skill.id,
        name: skill.name,
        categoryId: skillCategory.id,
        categoryName: skillCategory.name,
        categoryIcon: skillCategory.icon,
      })
      .from(skill)
      .innerJoin(skillCategory, eq(skill.categoryId, skillCategory.id))
      .where(and(eq(skill.id, b.skillId), eq(skill.userId, session.user.id)));
    linkedSkill = row[0] ?? null;
  }

  let linkedQuest: { id: string; name: string; status: string; type: string } | null = null;
  if (b.questId) {
    const row = await db
      .select({
        id: quest.id,
        name: quest.name,
        status: quest.status,
        type: quest.type,
      })
      .from(quest)
      .where(and(eq(quest.id, b.questId), eq(quest.userId, session.user.id)));
    linkedQuest = row[0] ?? null;
  }

  const totalReads = history.length;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/books"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Back to library
        </Link>
      </div>

      <div className="flex gap-6 flex-wrap md:flex-nowrap">
        <div className="shrink-0">
          {b.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={b.coverUrl}
              alt={b.title}
              className="w-44 md:w-56 rounded-lg border border-border shadow-lg"
            />
          ) : (
            <div className="w-44 h-64 md:w-56 md:h-80 flex items-center justify-center bg-muted/30 rounded-lg border border-border text-6xl">
              📖
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <h1 className="text-3xl font-bold leading-tight">{b.title}</h1>
            <p className="text-lg text-muted-foreground mt-1">{b.authors}</p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-mono text-muted-foreground">
            {b.year && (
              <span className="rounded border border-border px-2 py-0.5">
                {b.year}
              </span>
            )}
            {b.pages && (
              <span className="rounded border border-border px-2 py-0.5">
                {b.pages} pages
              </span>
            )}
            {b.isbn && (
              <span className="rounded border border-border px-2 py-0.5">
                ISBN {b.isbn}
              </span>
            )}
            <span
              className={`rounded px-2 py-0.5 border ${
                b.status === "read"
                  ? "border-xp/40 text-xp bg-xp/10"
                  : b.status === "reading"
                    ? "border-glow/40 text-glow bg-glow/10"
                    : "border-border text-muted-foreground"
              }`}
            >
              {b.status === "read"
                ? "✓ Read"
                : b.status === "reading"
                  ? "📗 Reading"
                  : "📖 Want"}
            </span>
            {b.rating && (
              <span className="text-xp">
                {"★".repeat(b.rating)}
                <span className="text-muted-foreground/30">
                  {"★".repeat(5 - b.rating)}
                </span>
              </span>
            )}
            {totalReads > 1 && (
              <span className="rounded border border-glow-purple/40 text-glow-purple bg-glow-purple/10 px-2 py-0.5">
                Read {totalReads}×
              </span>
            )}
          </div>

          {(linkedSkill || linkedQuest) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {linkedSkill && (
                <Link
                  href={`/skills/${linkedSkill.categoryId}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-glow/40 bg-glow/10 text-glow px-3 py-1 text-xs hover:bg-glow/20 transition-colors"
                >
                  {linkedSkill.categoryIcon && (
                    <span>{linkedSkill.categoryIcon}</span>
                  )}
                  <span className="font-mono">
                    {linkedSkill.categoryName} › {linkedSkill.name}
                  </span>
                </Link>
              )}
              {linkedQuest && (
                <Link
                  href="/quests"
                  className="inline-flex items-center gap-1.5 rounded-full border border-glow-purple/40 bg-glow-purple/10 text-glow-purple px-3 py-1 text-xs hover:bg-glow-purple/20 transition-colors"
                >
                  <span>{linkedQuest.type === "main" ? "⚔" : "•"}</span>
                  <span className="font-mono truncate max-w-[24ch]">
                    {linkedQuest.name}
                  </span>
                  <span className="text-[10px] uppercase opacity-70">
                    {linkedQuest.status}
                  </span>
                </Link>
              )}
            </div>
          )}

          <div>
            <BookDetailButton book={b} />
          </div>

          {b.description && (
            <div className="rounded-lg border border-border/60 bg-card/40 p-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                Description
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {b.description}
              </p>
            </div>
          )}

          {b.notes && (
            <div className="rounded-lg border border-glow/30 bg-glow/5 p-4">
              <div className="text-[10px] font-mono uppercase tracking-wider text-glow mb-2">
                Your notes
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {b.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
            📅 Read history ({history.length})
          </h2>
          <ul className="space-y-2">
            {history.map((r, idx) => (
              <li
                key={r.id}
                className="rounded-lg border border-border bg-card p-3 flex gap-3 items-start"
              >
                <span className="text-xs font-mono text-muted-foreground shrink-0 w-6">
                  #{history.length - idx}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-mono">
                      {r.finishedAt
                        ? new Date(
                            typeof r.finishedAt === "number"
                              ? r.finishedAt * 1000
                              : r.finishedAt
                          ).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "—"}
                    </span>
                    {r.rating && (
                      <span className="text-xp text-xs">
                        {"★".repeat(r.rating)}
                      </span>
                    )}
                    {r.startedAt && (
                      <span className="text-[10px] font-mono text-muted-foreground">
                        started{" "}
                        {new Date(
                          typeof r.startedAt === "number"
                            ? r.startedAt * 1000
                            : r.startedAt
                        ).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  {r.notes && (
                    <p className="text-sm text-muted-foreground italic mt-2 whitespace-pre-wrap">
                      &ldquo;{r.notes}&rdquo;
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
