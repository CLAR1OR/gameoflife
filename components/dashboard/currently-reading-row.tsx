import Link from "next/link";
import type { Book } from "@/modules/books/types";

export function CurrentlyReadingRow({ books }: { books: Book[] }) {
  if (books.length === 0) {
    return (
      <Link
        href="/books"
        className="group inline-flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-accent/40"
        title="Open your library"
      >
        <span className="text-xl leading-none opacity-50">📚</span>
        <span className="text-xs font-mono text-muted-foreground group-hover:text-foreground">
          No active reads
        </span>
      </Link>
    );
  }

  const visible = books.slice(0, 3);
  const extra = books.length - visible.length;
  const primary = books[0];

  return (
    <Link
      href="/books"
      className="group inline-flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-accent/40 max-w-full"
      title={
        books.length === 1
          ? `Reading: ${primary.title}`
          : `Reading ${books.length} books`
      }
    >
      <div className="flex -space-x-2 shrink-0">
        {visible.map((b, i) =>
          b.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={b.id}
              src={b.coverUrl}
              alt=""
              className="h-8 w-5 object-cover rounded-sm border border-border shadow-sm"
              style={{ zIndex: 10 - i }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.visibility =
                  "hidden";
              }}
            />
          ) : (
            <div
              key={b.id}
              className="h-8 w-5 rounded-sm bg-muted border border-border flex items-center justify-center text-[8px]"
              style={{ zIndex: 10 - i }}
            >
              📖
            </div>
          )
        )}
      </div>
      <div className="min-w-0 flex flex-col items-start">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground leading-none">
          Reading
        </span>
        <span className="text-xs text-foreground leading-tight truncate max-w-[120px] group-hover:text-glow transition-colors">
          {primary.title}
          {extra > 0 && (
            <span className="text-muted-foreground"> +{extra}</span>
          )}
        </span>
      </div>
    </Link>
  );
}
