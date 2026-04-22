import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth-server";
import { getReadingListWithBooks } from "@/modules/books/queries";
import { BookCard } from "@/components/books/book-card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default async function ChallengePage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  const { listId } = await params;
  const session = await requireSession();
  const data = await getReadingListWithBooks(listId, session.user.id);
  if (!data) notFound();

  const { list, books } = data;
  const read = books.filter((b) => b.status === "read").length;
  const total = books.length;
  const pct = total === 0 ? 0 : (read / total) * 100;
  const complete = total > 0 && read === total;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/books/challenges"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← All challenges
        </Link>
      </div>

      {/* Header banner */}
      <div
        className={`rounded-2xl border p-6 ${
          complete
            ? "border-xp/40 glow-gold"
            : "border-glow/30"
        }`}
      >
        <div className="flex items-start gap-4 flex-wrap">
          <span className="text-5xl drop-shadow-lg">{list.icon}</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{list.name}</h1>
            {list.description && (
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                {list.description}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap mt-3">
              <Badge
                variant="outline"
                className={
                  complete
                    ? "border-xp/40 text-xp font-mono"
                    : "border-glow/40 text-glow font-mono"
                }
              >
                {read} / {total} read
              </Badge>
              {complete && (
                <Badge
                  variant="outline"
                  className="border-xp/40 text-xp font-mono"
                >
                  ✓ Complete
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-1">
          <Progress value={pct} className="h-2 xp-bar" />
          <div className="text-[11px] font-mono text-muted-foreground text-right">
            {pct.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Books grid */}
      {books.length === 0 ? (
        <p className="text-sm text-muted-foreground">No books in this challenge.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {books.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      )}
    </div>
  );
}
