import { db } from "@/lib/db";
import { book, readingList, readingListItem } from "@/lib/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import type { Book, ReadingList, ReadingListWithProgress } from "./types";

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
