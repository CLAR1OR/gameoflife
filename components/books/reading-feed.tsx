"use client";

import { useState } from "react";
import type { Book } from "@/modules/books/types";
import { BookDetailsDialog } from "./book-details-dialog";

function formatMonth(d: Date | number): string {
  const date = typeof d === "number" ? new Date(d * 1000) : d;
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function formatDay(d: Date | number): string {
  const date = typeof d === "number" ? new Date(d * 1000) : d;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function FeedEntry({ book }: { book: Book }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex gap-3 rounded-lg border border-border/60 bg-card p-3 text-left hover:border-glow/40 transition-colors"
      >
        {book.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverUrl}
            alt=""
            className="h-16 w-11 object-cover rounded shrink-0 border border-border"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
            }}
          />
        ) : (
          <div className="h-16 w-11 flex items-center justify-center bg-muted/30 rounded shrink-0 border border-border text-muted-foreground">
            📖
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-medium leading-tight line-clamp-1">
                {book.title}
              </div>
              <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                {book.authors}
              </div>
            </div>
            {book.finishedAt && (
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                {formatDay(book.finishedAt)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            {book.rating ? (
              <span className="text-[11px] text-yellow-400 tracking-widest">
                {"★".repeat(book.rating)}
                <span className="text-muted-foreground/30">
                  {"★".repeat(5 - book.rating)}
                </span>
              </span>
            ) : (
              <span className="text-[10px] font-mono text-muted-foreground/60">
                unrated
              </span>
            )}
            {book.pages && (
              <span className="text-[10px] font-mono text-muted-foreground">
                {book.pages} pp
              </span>
            )}
          </div>
          {book.notes && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 italic">
              &ldquo;{book.notes}&rdquo;
            </p>
          )}
        </div>
      </button>
      <BookDetailsDialog book={book} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function ReadingFeed({ books }: { books: Book[] }) {
  if (books.length === 0) return null;

  // Group by "Month Year"
  const groups = new Map<string, Book[]>();
  const groupOrder: string[] = [];
  for (const b of books) {
    if (!b.finishedAt) continue;
    const key = formatMonth(b.finishedAt);
    if (!groups.has(key)) {
      groups.set(key, []);
      groupOrder.push(key);
    }
    groups.get(key)!.push(b);
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
        🕮 Recently finished
      </h2>
      <div className="space-y-6">
        {groupOrder.map((month) => {
          const entries = groups.get(month)!;
          return (
            <div key={month} className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {month}
                </h3>
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-[10px] font-mono text-muted-foreground">
                  {entries.length} book{entries.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="space-y-2">
                {entries.map((b) => (
                  <FeedEntry key={b.id} book={b} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
