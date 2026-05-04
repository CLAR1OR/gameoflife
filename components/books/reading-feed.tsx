"use client";

import { useState } from "react";
import type { RecentReadEntry } from "@/modules/books/queries";
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

function FeedEntry({ entry }: { entry: RecentReadEntry }) {
  const [open, setOpen] = useState(false);
  const { read, book } = entry;
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
            {read.finishedAt && (
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                {formatDay(read.finishedAt)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            {read.rating ? (
              <span className="text-[11px] text-xp tracking-widest">
                {"★".repeat(read.rating)}
                <span className="text-muted-foreground/30">
                  {"★".repeat(5 - read.rating)}
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
          {read.notes && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 italic">
              &ldquo;{read.notes}&rdquo;
            </p>
          )}
        </div>
      </button>
      <BookDetailsDialog book={book} open={open} onOpenChange={setOpen} />
    </>
  );
}

export function ReadingFeed({ entries }: { entries: RecentReadEntry[] }) {
  if (entries.length === 0) return null;

  const groups = new Map<string, RecentReadEntry[]>();
  const groupOrder: string[] = [];
  for (const e of entries) {
    if (!e.read.finishedAt) continue;
    const key = formatMonth(e.read.finishedAt);
    if (!groups.has(key)) {
      groups.set(key, []);
      groupOrder.push(key);
    }
    groups.get(key)!.push(e);
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
        🕮 Recently finished
      </h2>
      <div className="space-y-6">
        {groupOrder.map((month) => {
          const monthEntries = groups.get(month)!;
          return (
            <div key={month} className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {month}
                </h3>
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-[10px] font-mono text-muted-foreground">
                  {monthEntries.length} book{monthEntries.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="space-y-2">
                {monthEntries.map((e) => (
                  <FeedEntry key={e.read.id} entry={e} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
