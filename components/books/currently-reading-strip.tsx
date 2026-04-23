"use client";

import { useState } from "react";
import Link from "next/link";
import { BookDetailsDialog } from "./book-details-dialog";
import type { Book } from "@/modules/books/types";

const MAX_VISIBLE = 4;

function MiniCover({ book }: { book: Book }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`${book.title} — ${book.authors}`}
        className="relative aspect-[2/3] w-full overflow-hidden rounded-md border border-glow/60 shadow-lg transition-transform hover:scale-[1.04] hover:z-10"
      >
        {book.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={book.coverUrl}
            alt={book.title}
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        ) : null}
        {!book.coverUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/30 p-1 text-center">
            <span className="text-xl opacity-50">📖</span>
            <span className="text-[9px] font-medium mt-1 line-clamp-3">
              {book.title}
            </span>
          </div>
        )}
        {/* Subtle pulse corner to indicate "reading" */}
        <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-glow shadow-[0_0_6px_rgba(0,255,136,0.8)] animate-pulse" />
      </button>
      <BookDetailsDialog book={book} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function CurrentlyReadingStrip({ books }: { books: Book[] }) {
  const visible = books.slice(0, MAX_VISIBLE);
  const extra = books.length - visible.length;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-mono uppercase tracking-wider text-glow">
          📗 Currently Reading
        </h3>
        {books.length > 0 && (
          <span className="text-[10px] font-mono text-muted-foreground">
            {books.length} active
          </span>
        )}
      </div>

      {books.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-2">
          <div className="text-4xl opacity-30">📖</div>
          <p className="text-xs text-muted-foreground">
            No active reads
          </p>
          <Link
            href="/books"
            className="text-[10px] font-mono uppercase tracking-wider text-glow/70 hover:text-glow"
          >
            Start one →
          </Link>
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-5 gap-2 content-center">
          {visible.map((b) => (
            <MiniCover key={b.id} book={b} />
          ))}
          {extra > 0 ? (
            <Link
              href="/books"
              className="relative aspect-[2/3] w-full overflow-hidden rounded-md border-2 border-dashed border-border bg-muted/20 hover:border-glow/40 hover:bg-glow/5 transition-colors flex flex-col items-center justify-center gap-0.5"
              title={`${extra} more currently reading`}
            >
              <span className="text-lg font-mono font-bold text-glow">
                +{extra}
              </span>
              <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground">
                more
              </span>
            </Link>
          ) : (
            // Pad out the row to 5 columns with empty tiles so the 4 covers
            // keep a consistent size
            Array.from({ length: Math.max(0, 5 - visible.length) }).map(
              (_, i) => <div key={`empty-${i}`} />
            )
          )}
        </div>
      )}
    </div>
  );
}
