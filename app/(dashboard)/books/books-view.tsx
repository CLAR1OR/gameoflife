"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookCard } from "@/components/books/book-card";
import { AddBookDialog } from "@/components/books/add-book-dialog";
import { CsvImportDialog } from "@/components/books/csv-import-dialog";
import { YearlyGoalRing } from "@/components/books/yearly-goal-ring";
import { ReadingStats } from "@/components/books/reading-stats";
import { ReadingFeed } from "@/components/books/reading-feed";
import type { Book, BookStatus } from "@/modules/books/types";
import type { MonthBucket, YearBucket } from "@/modules/books/queries";

type Filter = "all" | BookStatus;
type Sort = "recent" | "rating" | "author" | "title";

export function BooksView({
  books,
  stats,
  yearTotal,
  yearlyGoal,
  months,
  years,
  ratings,
  recent,
}: {
  books: Book[];
  stats: {
    total: number;
    read: number;
    reading: number;
    want: number;
    pagesRead: number;
    avgRating: number | null;
  };
  yearTotal: number;
  yearlyGoal: number;
  months: MonthBucket[];
  years: YearBucket[];
  ratings: number[];
  recent: Book[];
}) {
  const PAGE_SIZE = 50;
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("recent");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Reset pagination whenever the result set changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter, sort, search]);

  const filtered = useMemo(() => {
    let list = books;
    if (filter !== "all") list = list.filter((b) => b.status === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.authors.toLowerCase().includes(q)
      );
    }
    const sorted = [...list];
    if (sort === "recent") {
      sorted.sort((a, b) => {
        const fa = a.finishedAt ? new Date(a.finishedAt).getTime() : 0;
        const fb = b.finishedAt ? new Date(b.finishedAt).getTime() : 0;
        if (fa !== fb) return fb - fa;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else if (sort === "rating") {
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sort === "author") {
      sorted.sort((a, b) => a.authors.localeCompare(b.authors));
    } else if (sort === "title") {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    return sorted;
  }, [books, filter, sort, search]);

  const currentlyReading = books.filter((b) => b.status === "reading");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Books</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your personal library — {stats.total} book
            {stats.total === 1 ? "" : "s"} tracked.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/books/challenges">
            <Button variant="outline" size="sm">
              📚 Challenges
            </Button>
          </Link>
          <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
            📥 Import CSV
          </Button>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            + Add Book
          </Button>
        </div>
      </div>

      {/* Yearly goal ring */}
      <YearlyGoalRing read={yearTotal} goal={yearlyGoal} />

      {/* Currently reading spotlight */}
      {currentlyReading.length > 0 && (
        <section>
          <h2 className="text-xs font-mono uppercase tracking-wider text-glow mb-3">
            📗 Currently reading
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
            {currentlyReading.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
        </section>
      )}

      {/* Stats row */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Total" value={stats.total} accent="glow" />
          <StatCard label="Read" value={stats.read} accent="xp" />
          <StatCard label="Reading" value={stats.reading} accent="glow" />
          <StatCard label="Want" value={stats.want} accent="glow-purple" />
          <StatCard
            label="Pages read"
            value={stats.pagesRead.toLocaleString()}
            accent="xp"
            sub={
              stats.avgRating != null
                ? `Avg rating ${stats.avgRating}★`
                : undefined
            }
          />
        </div>
      )}

      {/* Filters */}
      {stats.total > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <FilterChip
            active={filter === "all"}
            onClick={() => setFilter("all")}
          >
            All ({stats.total})
          </FilterChip>
          <FilterChip
            active={filter === "read"}
            onClick={() => setFilter("read")}
          >
            Read ({stats.read})
          </FilterChip>
          <FilterChip
            active={filter === "reading"}
            onClick={() => setFilter("reading")}
          >
            Reading ({stats.reading})
          </FilterChip>
          <FilterChip
            active={filter === "want"}
            onClick={() => setFilter("want")}
          >
            Want ({stats.want})
          </FilterChip>
          <div className="flex-1" />
          <Input
            placeholder="Search title or author…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="rounded-md border border-input bg-background px-2 py-1.5 text-xs"
          >
            <option value="recent">Recently finished</option>
            <option value="rating">Highest rated</option>
            <option value="author">Author A-Z</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
      )}

      {/* Gallery */}
      {stats.total === 0 ? (
        <div className="rounded-xl border border-dashed bg-muted/20 p-10 text-center space-y-4">
          <div className="text-6xl">📚</div>
          <div>
            <p className="font-medium">Your library is empty</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              Add books manually, search Open Library, or import your entire
              Goodreads library via CSV. Completed books give XP to your
              account.
            </p>
          </div>
          <div className="flex justify-center gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              📥 Import CSV
            </Button>
            <Button onClick={() => setAddOpen(true)}>+ Add Book</Button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No books match that filter.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
            {filtered.slice(0, visibleCount).map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
          {filtered.length > visibleCount && (
            <div className="flex items-center justify-center py-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setVisibleCount((v) =>
                    Math.min(v + PAGE_SIZE, filtered.length)
                  )
                }
              >
                + Load more (
                {Math.min(PAGE_SIZE, filtered.length - visibleCount)} of{" "}
                {filtered.length - visibleCount} remaining)
              </Button>
            </div>
          )}
          {filtered.length > PAGE_SIZE && visibleCount >= filtered.length && (
            <div className="flex items-center justify-center py-3">
              <button
                type="button"
                onClick={() => setVisibleCount(PAGE_SIZE)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Collapse to first {PAGE_SIZE}
              </button>
            </div>
          )}
        </>
      )}

      {/* Stats */}
      <ReadingStats months={months} years={years} ratings={ratings} />

      {/* Reading feed */}
      <ReadingFeed books={recent} />

      <AddBookDialog open={addOpen} onOpenChange={setAddOpen} />
      <CsvImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-mono uppercase tracking-wider transition-colors ${
        active
          ? "border-glow/50 bg-glow/10 text-glow"
          : "border-border text-muted-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: "glow" | "glow-purple" | "xp";
}) {
  const accentClass =
    accent === "glow"
      ? "text-glow border-glow/20"
      : accent === "glow-purple"
        ? "text-glow-purple border-glow-purple/20"
        : "text-xp border-xp/20";
  return (
    <div className={`rounded-xl border bg-card p-3 ${accentClass}`}>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
        {label}
      </div>
      <div className="text-xl font-mono mt-1">{value}</div>
      {sub && (
        <div className="text-[10px] text-muted-foreground/70 font-mono mt-0.5 truncate">
          {sub}
        </div>
      )}
    </div>
  );
}

// Re-export for convenience
export type { BookStatus };
