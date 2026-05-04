"use client";

import { useState } from "react";
import type { Book } from "@/modules/books/types";
import { BookDetailsDialog } from "./book-details-dialog";

export function BookCard({ book }: { book: Book }) {
  const [open, setOpen] = useState(false);
  const status = book.status;
  const isRead = status === "read";
  const isReading = status === "reading";

  const fallback = (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 bg-muted/30">
      <span className="text-3xl opacity-40">📖</span>
      <span className="text-[11px] font-medium mt-1 line-clamp-3">
        {book.title}
      </span>
      <span className="text-[9px] text-muted-foreground line-clamp-1 mt-0.5">
        {book.authors}
      </span>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group relative aspect-[2/3] w-full overflow-hidden rounded-md border transition-all hover:scale-[1.04] hover:z-10 ${
          isReading
            ? "border-glow/60 glow-green shadow-lg"
            : isRead
              ? "border-border/60 shadow-md"
              : "border-border/40 opacity-70 grayscale hover:grayscale-0 hover:opacity-100"
        }`}
        title={`${book.title} — ${book.authors}`}
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
        {!book.coverUrl && fallback}

        {/* Reading-in-progress corner pulse */}
        {isReading && (
          <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-glow shadow-[0_0_6px_rgba(0,255,136,0.8)] animate-pulse" />
        )}

        {/* Rating stars if rated */}
        {isRead && book.rating && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-1.5 py-1">
            <div className="text-[10px] text-xp font-mono tracking-widest">
              {"★".repeat(book.rating)}
              <span className="text-muted-foreground/60">
                {"★".repeat(5 - book.rating)}
              </span>
            </div>
          </div>
        )}

        {/* Status overlay on hover for want-to-read */}
        {status === "want" && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
            <span className="text-[9px] font-mono uppercase tracking-wider text-white/70">
              Want to read
            </span>
          </div>
        )}
      </button>

      <BookDetailsDialog book={book} open={open} onOpenChange={setOpen} />
    </>
  );
}
