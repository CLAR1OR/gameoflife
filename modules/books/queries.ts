import { db } from "@/lib/db";
import { book, bookRead, readingList, readingListItem } from "@/lib/db/schema";
import { and, asc, desc, eq, gte } from "drizzle-orm";
import type { Book, BookRead, ReadingList, ReadingListWithProgress } from "./types";

export async function getBooksByUser(userId: string): Promise<Book[]> {
  return db
    .select()
    .from(book)
    .where(eq(book.userId, userId))
    .orderBy(desc(book.finishedAt), desc(book.createdAt));
}

export async function getBookById(
  id: string,
  userId: string
): Promise<Book | null> {
  const row = await db.query.book.findFirst({
    where: (b, { and: a, eq: e }) => a(e(b.id, id), e(b.userId, userId)),
  });
  return row ?? null;
}

export async function getReadingLists(
  userId: string
): Promise<ReadingListWithProgress[]> {
  const lists = await db
    .select()
    .from(readingList)
    .where(eq(readingList.userId, userId))
    .orderBy(asc(readingList.sortOrder), asc(readingList.createdAt));

  if (lists.length === 0) return [];

  const result: ReadingListWithProgress[] = [];
  for (const l of lists) {
    const items = await db
      .select({
        bookId: readingListItem.bookId,
        coverUrl: book.coverUrl,
        status: book.status,
      })
      .from(readingListItem)
      .innerJoin(book, eq(readingListItem.bookId, book.id))
      .where(eq(readingListItem.listId, l.id))
      .orderBy(asc(readingListItem.sortOrder));

    const total = items.length;
    const read = items.filter((i) => i.status === "read").length;
    const sampleCovers = items
      .slice(0, 5)
      .map((i) => i.coverUrl);

    result.push({
      ...l,
      total,
      read,
      pct: total === 0 ? 0 : (read / total) * 100,
      sampleCovers,
    });
  }
  return result;
}

export async function getReadingListWithBooks(
  id: string,
  userId: string
): Promise<{ list: ReadingList; books: Book[] } | null> {
  const list = await db.query.readingList.findFirst({
    where: (l, { and: a, eq: e }) => a(e(l.id, id), e(l.userId, userId)),
  });
  if (!list) return null;

  const rows = await db
    .select({ book: book })
    .from(readingListItem)
    .innerJoin(book, eq(readingListItem.bookId, book.id))
    .where(eq(readingListItem.listId, list.id))
    .orderBy(asc(readingListItem.sortOrder));

  return { list, books: rows.map((r) => r.book) };
}

export async function getActivatedReadingListTemplateIds(
  userId: string
): Promise<Set<string>> {
  const rows = await db
    .select({ templateId: readingList.templateId })
    .from(readingList)
    .where(eq(readingList.userId, userId));
  const ids = new Set<string>();
  for (const r of rows) {
    if (r.templateId) ids.add(r.templateId);
  }
  return ids;
}

/** Books currently in "reading" status, most recently started first. */
export async function getCurrentlyReading(userId: string): Promise<Book[]> {
  return db
    .select()
    .from(book)
    .where(and(eq(book.userId, userId), eq(book.status, "reading")))
    .orderBy(desc(book.startedAt), desc(book.createdAt));
}

/** Number of books finished in the current year (local time). */
export async function getBooksReadThisYear(userId: string): Promise<number> {
  // Count read events (including rereads) this year.
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const rows = await db
    .select({ c: bookRead.id })
    .from(bookRead)
    .where(
      and(eq(bookRead.userId, userId), gte(bookRead.finishedAt, yearStart))
    );
  return rows.length;
}

export type MonthBucket = { key: string; label: string; count: number; pages: number };
export type YearBucket = { year: number; count: number; pages: number };

/**
 * Monthly breakdown of finishes across the last 12 months, ending with the
 * current month (buckets are month-of-year labels like "Mar").
 */
export async function getBooksPerMonth(
  userId: string,
  months = 12
): Promise<MonthBucket[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  // Every read event in window (rereads included), join to book for pages.
  const rows = await db
    .select({
      finishedAt: bookRead.finishedAt,
      pages: book.pages,
    })
    .from(bookRead)
    .innerJoin(book, eq(bookRead.bookId, book.id))
    .where(
      and(eq(bookRead.userId, userId), gte(bookRead.finishedAt, start))
    );

  const buckets: MonthBucket[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString(undefined, { month: "short" });
    buckets.push({ key, label, count: 0, pages: 0 });
  }

  for (const r of rows) {
    if (!r.finishedAt) continue;
    const d = typeof r.finishedAt === "number" ? new Date(r.finishedAt * 1000) : r.finishedAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const bucket = buckets.find((b) => b.key === key);
    if (bucket) {
      bucket.count++;
      bucket.pages += r.pages ?? 0;
    }
  }
  return buckets;
}

/** Year-by-year finish counts across the user's full history. */
export async function getBooksPerYear(userId: string): Promise<YearBucket[]> {
  const rows = await db
    .select({ finishedAt: bookRead.finishedAt, pages: book.pages })
    .from(bookRead)
    .innerJoin(book, eq(bookRead.bookId, book.id))
    .where(eq(bookRead.userId, userId));

  const map = new Map<number, YearBucket>();
  for (const r of rows) {
    if (!r.finishedAt) continue;
    const d =
      typeof r.finishedAt === "number" ? new Date(r.finishedAt * 1000) : r.finishedAt;
    const y = d.getFullYear();
    if (!map.has(y)) map.set(y, { year: y, count: 0, pages: 0 });
    const bucket = map.get(y)!;
    bucket.count++;
    bucket.pages += r.pages ?? 0;
  }
  return Array.from(map.values()).sort((a, b) => a.year - b.year);
}

/** Rating distribution: count of books at each 1-5 rating. */
export async function getRatingDistribution(
  userId: string
): Promise<number[]> {
  const rows = await db
    .select({ rating: book.rating })
    .from(book)
    .where(and(eq(book.userId, userId), eq(book.status, "read")));
  const dist = [0, 0, 0, 0, 0]; // indices 0..4 = ratings 1..5
  for (const r of rows) {
    if (r.rating && r.rating >= 1 && r.rating <= 5) {
      dist[r.rating - 1]++;
    }
  }
  return dist;
}

/** Recently finished books, most recent first. Each read event is a row,
 * so rereads show up as separate entries. */
export type RecentReadEntry = {
  read: BookRead;
  book: Book;
};

export async function getRecentlyFinished(
  userId: string,
  limit = 20
): Promise<RecentReadEntry[]> {
  const rows = await db
    .select({ read: bookRead, book: book })
    .from(bookRead)
    .innerJoin(book, eq(bookRead.bookId, book.id))
    .where(eq(bookRead.userId, userId))
    .orderBy(desc(bookRead.finishedAt), desc(bookRead.createdAt))
    .limit(limit);
  return rows;
}

/** All reads of a single book, newest first. */
export async function getReadHistory(
  bookId: string,
  userId: string
): Promise<BookRead[]> {
  return db
    .select()
    .from(bookRead)
    .where(and(eq(bookRead.bookId, bookId), eq(bookRead.userId, userId)))
    .orderBy(desc(bookRead.finishedAt), desc(bookRead.createdAt));
}

export async function getBookStats(userId: string): Promise<{
  total: number;
  read: number;
  reading: number;
  want: number;
  pagesRead: number;
  avgRating: number | null;
}> {
  const rows = await db
    .select()
    .from(book)
    .where(eq(book.userId, userId));
  const read = rows.filter((r) => r.status === "read");
  const reading = rows.filter((r) => r.status === "reading");
  const want = rows.filter((r) => r.status === "want");
  const pagesRead = read.reduce((s, r) => s + (r.pages ?? 0), 0);
  const ratings = read
    .map((r) => r.rating)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const avgRating =
    ratings.length === 0
      ? null
      : Math.round(
          (ratings.reduce((s, v) => s + v, 0) / ratings.length) * 10
        ) / 10;
  return {
    total: rows.length,
    read: read.length,
    reading: reading.length,
    want: want.length,
    pagesRead,
    avgRating,
  };
}
