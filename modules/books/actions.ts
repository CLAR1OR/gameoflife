"use server";

import { db } from "@/lib/db";
import { book, readingList, readingListItem, achievement } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { getReadingListTemplate } from "@/lib/books-templates";
import { openLibraryCoverUrl, parseGoodreadsCsv } from "@/lib/books-csv";
import { checkAccountLevelAchievements } from "@/lib/account-achievements";
import { XP_PER_BOOK } from "./types";

export async function createBook(data: {
  title: string;
  authors: string;
  isbn?: string | null;
  coverUrl?: string | null;
  pages?: number | null;
  year?: number | null;
  description?: string | null;
  status?: "want" | "reading" | "read";
  rating?: number | null;
  finishedAt?: Date | null;
  startedAt?: Date | null;
  notes?: string | null;
  source?: string;
}) {
  const session = await requireSession();

  const coverUrl =
    data.coverUrl ?? openLibraryCoverUrl(data.isbn ?? null, "M");
  const status = data.status ?? "want";

  const [row] = await db
    .insert(book)
    .values({
      userId: session.user.id,
      title: data.title.trim(),
      authors: data.authors.trim() || "Unknown",
      isbn: data.isbn ?? null,
      coverUrl: coverUrl,
      pages: data.pages ?? null,
      year: data.year ?? null,
      description: data.description ?? null,
      status,
      rating: data.rating ?? null,
      startedAt: data.startedAt ?? (status === "reading" ? new Date() : null),
      finishedAt: data.finishedAt ?? (status === "read" ? new Date() : null),
      notes: data.notes ?? null,
      source: data.source ?? "manual",
    })
    .returning();

  if (status === "read") {
    await onBookRead(session.user.id);
  }

  revalidatePath("/books");
  return row;
}

export async function updateBook(
  id: string,
  data: {
    title?: string;
    authors?: string;
    isbn?: string | null;
    coverUrl?: string | null;
    pages?: number | null;
    year?: number | null;
    status?: "want" | "reading" | "read";
    rating?: number | null;
    startedAt?: Date | null;
    finishedAt?: Date | null;
    notes?: string | null;
  }
) {
  const session = await requireSession();
  const existing = await db.query.book.findFirst({
    where: (b, { and: a, eq: e }) => a(e(b.id, id), e(b.userId, session.user.id)),
  });
  if (!existing) throw new Error("Book not found");

  const updates: Partial<typeof data> & {
    startedAt?: Date | null;
    finishedAt?: Date | null;
  } = { ...data };

  // Auto-set timestamps on status transitions if not manually provided
  if (data.status && data.status !== existing.status) {
    if (data.status === "reading" && data.startedAt === undefined) {
      updates.startedAt = existing.startedAt ?? new Date();
    }
    if (data.status === "read" && data.finishedAt === undefined) {
      updates.finishedAt = new Date();
      if (!existing.startedAt && data.startedAt === undefined) {
        updates.startedAt = existing.startedAt ?? new Date();
      }
    }
    if (data.status === "want") {
      if (data.startedAt === undefined) updates.startedAt = null;
      if (data.finishedAt === undefined) updates.finishedAt = null;
    }
  }

  await db
    .update(book)
    .set(updates)
    .where(and(eq(book.id, id), eq(book.userId, session.user.id)));

  const wasRead = existing.status === "read";
  const isRead = (data.status ?? existing.status) === "read";
  if (!wasRead && isRead) {
    await onBookRead(session.user.id);
  } else if (wasRead && !isRead) {
    await onBookUnread(session.user.id);
  } else if (wasRead && isRead) {
    // Still read but maybe rating changed — just re-check list completion
    await checkReadingListCompletion(session.user.id);
  }

  revalidatePath("/books");
  revalidatePath(`/books/${id}`);
  return updates;
}

export async function deleteBook(id: string) {
  const session = await requireSession();
  const existing = await db.query.book.findFirst({
    where: (b, { and: a, eq: e }) => a(e(b.id, id), e(b.userId, session.user.id)),
  });
  if (!existing) return;

  await db
    .delete(book)
    .where(and(eq(book.id, id), eq(book.userId, session.user.id)));

  if (existing.status === "read") {
    await onBookUnread(session.user.id);
  }

  revalidatePath("/books");
}

export async function setBookStatus(id: string, status: "want" | "reading" | "read") {
  return updateBook(id, { status });
}

export async function rateBook(id: string, rating: number | null) {
  return updateBook(id, { rating });
}

// =====================
// READING LISTS / CHALLENGES
// =====================

export async function activateReadingListTemplate(templateId: string) {
  const session = await requireSession();
  const template = getReadingListTemplate(templateId);
  if (!template) throw new Error("Template not found");

  // Prevent duplicate activation
  const existing = await db.query.readingList.findFirst({
    where: (l, { and: a, eq: e }) =>
      a(e(l.userId, session.user.id), e(l.templateId, templateId)),
  });
  if (existing) throw new Error("Already activated");

  const [list] = await db
    .insert(readingList)
    .values({
      userId: session.user.id,
      templateId: template.id,
      name: template.name,
      description: template.description,
      icon: template.icon,
      coverImage: template.coverImage ?? null,
    })
    .returning();

  // Create books for this list (want status by default)
  for (let i = 0; i < template.books.length; i++) {
    const tb = template.books[i];
    const [created] = await db
      .insert(book)
      .values({
        userId: session.user.id,
        title: tb.title,
        authors: tb.authors,
        isbn: tb.isbn ?? null,
        coverUrl: openLibraryCoverUrl(tb.isbn ?? null, "M"),
        year: tb.year ?? null,
        status: "want",
        source: "template",
      })
      .returning();
    await db.insert(readingListItem).values({
      listId: list.id,
      bookId: created.id,
      userId: session.user.id,
      sortOrder: i,
    });
  }

  // Also create a "complete this list" achievement
  await db.insert(achievement).values({
    userId: session.user.id,
    categoryId: null,
    source: "custom",
    name: `Completed: ${template.name}`,
    description: `Finish every book in "${template.name}"`,
    icon: "📚",
    triggerType: "reading_list_completed",
    triggerReadingListId: list.id,
  });

  await ensureBookAchievementsSeeded(session.user.id);

  revalidatePath("/books");
  revalidatePath("/books/challenges");
  revalidatePath("/achievements");
  return list;
}

export async function createReadingList(data: {
  name: string;
  description?: string;
  icon?: string;
}) {
  const session = await requireSession();
  const [list] = await db
    .insert(readingList)
    .values({
      userId: session.user.id,
      name: data.name,
      description: data.description ?? null,
      icon: data.icon ?? "📚",
    })
    .returning();
  revalidatePath("/books/challenges");
  return list;
}

export async function addBookToReadingList(listId: string, bookId: string) {
  const session = await requireSession();
  const items = await db
    .select()
    .from(readingListItem)
    .where(eq(readingListItem.listId, listId));
  const nextOrder = items.length;
  await db.insert(readingListItem).values({
    listId,
    bookId,
    userId: session.user.id,
    sortOrder: nextOrder,
  });
  revalidatePath("/books/challenges");
}

export async function deleteReadingList(id: string) {
  const session = await requireSession();
  await db
    .delete(readingList)
    .where(and(eq(readingList.id, id), eq(readingList.userId, session.user.id)));
  revalidatePath("/books/challenges");
  revalidatePath("/achievements");
}

// =====================
// CSV IMPORT
// =====================

export async function importGoodreadsCsv(csvText: string) {
  const session = await requireSession();
  const rows = parseGoodreadsCsv(csvText);

  let imported = 0;
  let skipped = 0;
  for (const r of rows) {
    // Dedup by (title + authors) — case-insensitive
    const existing = await db.query.book.findFirst({
      where: (b, { and: a, eq: e }) =>
        a(e(b.userId, session.user.id), e(b.title, r.title)),
    });
    if (existing) {
      skipped++;
      continue;
    }

    await db.insert(book).values({
      userId: session.user.id,
      title: r.title,
      authors: r.authors,
      isbn: r.isbn,
      coverUrl: openLibraryCoverUrl(r.isbn, "M"),
      pages: r.pages,
      year: r.year,
      status: r.status,
      rating: r.rating,
      startedAt: r.status === "reading" ? r.dateAdded : null,
      finishedAt: r.status === "read" ? r.dateRead ?? r.dateAdded : null,
      notes: r.review,
      source: "goodreads_csv",
    });
    imported++;
  }

  await ensureBookAchievementsSeeded(session.user.id);
  await checkBooksReadAchievements(session.user.id);
  await checkAccountLevelAchievements(session.user.id);

  revalidatePath("/books");
  revalidatePath("/");
  revalidatePath("/achievements");

  return { imported, skipped, total: rows.length };
}

// =====================
// ACHIEVEMENT BOOKKEEPING
// =====================

const BOOK_ACHIEVEMENTS: {
  name: string;
  description: string;
  icon: string;
  count: number;
}[] = [
  { name: "First Book", description: "Finish your first book", icon: "📖", count: 1 },
  { name: "Bookworm", description: "Read 10 books", icon: "🐛", count: 10 },
  { name: "Avid Reader", description: "Read 25 books", icon: "📚", count: 25 },
  { name: "Well-Read", description: "Read 50 books", icon: "🎓", count: 50 },
  { name: "Bibliophile", description: "Read 100 books", icon: "👑", count: 100 },
  { name: "Library Unto Yourself", description: "Read 250 books", icon: "🏛️", count: 250 },
];

export async function ensureBookAchievementsSeeded(userId: string) {
  const existing = await db.query.achievement.findMany({
    where: (a, { and: _and, eq: _eq }) =>
      _and(_eq(a.userId, userId), _eq(a.triggerType, "books_read_count")),
  });
  if (existing.length > 0) return;

  await db.insert(achievement).values(
    BOOK_ACHIEVEMENTS.map((ba) => ({
      userId,
      categoryId: null,
      source: "custom" as const,
      name: ba.name,
      description: ba.description,
      icon: ba.icon,
      triggerType: "books_read_count" as const,
      triggerCount: ba.count,
    }))
  );
}

async function checkBooksReadAchievements(userId: string) {
  const readRows = await db
    .select({ id: book.id })
    .from(book)
    .where(and(eq(book.userId, userId), eq(book.status, "read")));
  const count = readRows.length;

  const achievements = await db.query.achievement.findMany({
    where: (a, { and: _and, eq: _eq }) =>
      _and(_eq(a.userId, userId), _eq(a.triggerType, "books_read_count")),
  });

  const newlyUnlocked: string[] = [];
  for (const a of achievements) {
    if (a.triggerCount == null) continue;
    const shouldBeUnlocked = count >= a.triggerCount;
    if (shouldBeUnlocked && !a.isUnlocked) {
      await db
        .update(achievement)
        .set({ isUnlocked: true, unlockedAt: new Date() })
        .where(eq(achievement.id, a.id));
      newlyUnlocked.push(a.name);
    } else if (!shouldBeUnlocked && a.isUnlocked) {
      await db
        .update(achievement)
        .set({ isUnlocked: false, unlockedAt: null })
        .where(eq(achievement.id, a.id));
    }
  }
  return newlyUnlocked;
}

async function checkReadingListCompletion(userId: string) {
  const listAchievements = await db.query.achievement.findMany({
    where: (a, { and: _and, eq: _eq }) =>
      _and(
        _eq(a.userId, userId),
        _eq(a.triggerType, "reading_list_completed")
      ),
  });

  for (const a of listAchievements) {
    if (!a.triggerReadingListId) continue;
    const items = await db
      .select({ status: book.status })
      .from(readingListItem)
      .innerJoin(book, eq(readingListItem.bookId, book.id))
      .where(eq(readingListItem.listId, a.triggerReadingListId));

    const complete =
      items.length > 0 && items.every((i) => i.status === "read");

    if (complete && !a.isUnlocked) {
      await db
        .update(achievement)
        .set({ isUnlocked: true, unlockedAt: new Date() })
        .where(eq(achievement.id, a.id));
    } else if (!complete && a.isUnlocked) {
      await db
        .update(achievement)
        .set({ isUnlocked: false, unlockedAt: null })
        .where(eq(achievement.id, a.id));
    }
  }
}

async function onBookRead(userId: string) {
  await ensureBookAchievementsSeeded(userId);
  await checkBooksReadAchievements(userId);
  await checkReadingListCompletion(userId);
  await checkAccountLevelAchievements(userId);
}

async function onBookUnread(userId: string) {
  await checkBooksReadAchievements(userId);
  await checkReadingListCompletion(userId);
  await checkAccountLevelAchievements(userId);
}

void XP_PER_BOOK;
