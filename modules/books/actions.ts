"use server";

import { db } from "@/lib/db";
import {
  book,
  bookRead,
  readingList,
  readingListItem,
  achievement,
  skill,
  quest,
} from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { getReadingListTemplate } from "@/lib/books-templates";
import { openLibraryCoverUrl, parseGoodreadsCsv } from "@/lib/books-csv";
import { checkAccountLevelAchievements } from "@/lib/account-achievements";
import { calculateLevel } from "@/lib/xp";
import { XP_PER_BOOK } from "./types";

/** XP a book read grants to a linked subskill (if any). */
const BOOK_XP_TO_SKILL = XP_PER_BOOK;

/** Adjust a subskill's XP, recompute level. */
async function adjustSkillXp(
  skillId: string,
  userId: string,
  delta: number
) {
  const s = await db.query.skill.findFirst({
    where: (sk, { and: a, eq: e }) =>
      a(e(sk.id, skillId), e(sk.userId, userId)),
  });
  if (!s) return;
  if (s.level === 0) return; // locked subskills can't gain XP
  const newXp = Math.max(0, s.currentXp + delta);
  const newLevel = calculateLevel(newXp);
  await db
    .update(skill)
    .set({ currentXp: newXp, level: newLevel, updatedAt: new Date() })
    .where(eq(skill.id, skillId));
  revalidatePath(`/skills/${s.categoryId}`);
}

/** Auto-complete the linked quest if still active. */
async function autoCompleteQuest(questId: string, userId: string) {
  const q = await db.query.quest.findFirst({
    where: (row, { and: a, eq: e }) =>
      a(e(row.id, questId), e(row.userId, userId)),
  });
  if (!q || q.status !== "active") return;
  await db
    .update(quest)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(quest.id, questId));
  revalidatePath("/quests");
}

/** Reopen a previously-completed linked quest (book un-read). */
async function reopenQuest(questId: string, userId: string) {
  const q = await db.query.quest.findFirst({
    where: (row, { and: a, eq: e }) =>
      a(e(row.id, questId), e(row.userId, userId)),
  });
  if (!q || q.status !== "completed") return;
  await db
    .update(quest)
    .set({ status: "active", completedAt: null })
    .where(eq(quest.id, questId));
  revalidatePath("/quests");
}

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
  skillId?: string | null;
  questId?: string | null;
}) {
  const session = await requireSession();

  const coverUrl =
    data.coverUrl ?? openLibraryCoverUrl(data.isbn ?? null, "M");
  const status = data.status ?? "want";
  const finishedAt =
    data.finishedAt ?? (status === "read" ? new Date() : null);
  const startedAt =
    data.startedAt ?? (status === "reading" ? new Date() : null);

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
      startedAt,
      finishedAt,
      notes: data.notes ?? null,
      source: data.source ?? "manual",
      skillId: data.skillId ?? null,
      questId: data.questId ?? null,
    })
    .returning();

  if (status === "read" && finishedAt) {
    await db.insert(bookRead).values({
      bookId: row.id,
      userId: session.user.id,
      startedAt: startedAt,
      finishedAt: finishedAt,
      rating: data.rating ?? null,
      notes: data.notes ?? null,
    });
    if (row.skillId) {
      await adjustSkillXp(row.skillId, session.user.id, BOOK_XP_TO_SKILL);
    }
    if (row.questId) {
      await autoCompleteQuest(row.questId, session.user.id);
    }
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
    skillId?: string | null;
    questId?: string | null;
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

  // Transition want/reading → read: create a new bookRead row, grant XP, complete linked quest
  if (!wasRead && isRead) {
    const finishedAt = updates.finishedAt ?? existing.finishedAt ?? new Date();
    const startedAt = updates.startedAt ?? existing.startedAt ?? null;
    await db.insert(bookRead).values({
      bookId: id,
      userId: session.user.id,
      startedAt,
      finishedAt,
      rating: data.rating ?? existing.rating ?? null,
      notes: data.notes ?? existing.notes ?? null,
    });
    const linkedSkillId = data.skillId ?? existing.skillId;
    if (linkedSkillId) {
      await adjustSkillXp(linkedSkillId, session.user.id, BOOK_XP_TO_SKILL);
    }
    const linkedQuestId = data.questId ?? existing.questId;
    if (linkedQuestId) {
      await autoCompleteQuest(linkedQuestId, session.user.id);
    }
    await onBookRead(session.user.id);
  } else if (wasRead && !isRead) {
    // Transition read → want/reading: remove the latest bookRead row, reverse XP, reopen quest
    const latest = await db.query.bookRead.findFirst({
      where: (br, { and: a, eq: e }) =>
        a(e(br.bookId, id), e(br.userId, session.user.id)),
      orderBy: (br, { desc: d }) => [d(br.finishedAt)],
    });
    if (latest) {
      await db.delete(bookRead).where(eq(bookRead.id, latest.id));
    }
    const linkedSkillId = data.skillId ?? existing.skillId;
    if (linkedSkillId) {
      await adjustSkillXp(linkedSkillId, session.user.id, -BOOK_XP_TO_SKILL);
    }
    const linkedQuestId = data.questId ?? existing.questId;
    if (linkedQuestId) {
      await reopenQuest(linkedQuestId, session.user.id);
    }
    await onBookUnread(session.user.id);
  } else if (wasRead && isRead) {
    // Still read — rating/notes/finish-date might have changed. Sync into
    // the most recent bookRead row so the history stays consistent.
    const latest = await db.query.bookRead.findFirst({
      where: (br, { and: a, eq: e }) =>
        a(e(br.bookId, id), e(br.userId, session.user.id)),
      orderBy: (br, { desc: d }) => [d(br.finishedAt)],
    });
    if (latest) {
      await db
        .update(bookRead)
        .set({
          finishedAt:
            updates.finishedAt ?? existing.finishedAt ?? latest.finishedAt,
          startedAt: updates.startedAt ?? existing.startedAt ?? latest.startedAt,
          rating:
            data.rating !== undefined
              ? data.rating
              : (existing.rating ?? latest.rating),
          notes:
            data.notes !== undefined
              ? data.notes
              : (existing.notes ?? latest.notes),
        })
        .where(eq(bookRead.id, latest.id));
    }
    await checkReadingListCompletion(session.user.id);
  }

  revalidatePath("/books");
  revalidatePath(`/books/${id}`);
  return updates;
}

/** Log an additional read of an already-read book. */
export async function logReread(
  id: string,
  data: {
    finishedAt?: Date;
    startedAt?: Date | null;
    rating?: number | null;
    notes?: string | null;
  } = {}
) {
  const session = await requireSession();
  const existing = await db.query.book.findFirst({
    where: (b, { and: a, eq: e }) => a(e(b.id, id), e(b.userId, session.user.id)),
  });
  if (!existing) throw new Error("Book not found");

  const finishedAt = data.finishedAt ?? new Date();
  const startedAt = data.startedAt ?? null;

  await db.insert(bookRead).values({
    bookId: id,
    userId: session.user.id,
    startedAt,
    finishedAt,
    rating: data.rating ?? null,
    notes: data.notes ?? null,
  });

  // Bump the book's most-recent fields so the gallery sort stays correct
  await db
    .update(book)
    .set({
      status: "read",
      finishedAt,
      rating: data.rating ?? existing.rating ?? null,
      notes: data.notes ?? existing.notes ?? null,
    })
    .where(and(eq(book.id, id), eq(book.userId, session.user.id)));

  if (existing.skillId) {
    await adjustSkillXp(existing.skillId, session.user.id, BOOK_XP_TO_SKILL);
  }

  await onBookRead(session.user.id);
  revalidatePath("/books");
  revalidatePath(`/books/${id}`);
  return { logged: true };
}

/** Delete a specific read row (not the book). */
export async function deleteBookRead(readId: string) {
  const session = await requireSession();
  const row = await db.query.bookRead.findFirst({
    where: (br, { and: a, eq: e }) =>
      a(e(br.id, readId), e(br.userId, session.user.id)),
    with: { book: true },
  });
  if (!row) return;

  await db.delete(bookRead).where(eq(bookRead.id, readId));

  // If this was the only read, drop the book back to "reading" (the user can
  // re-mark it manually). Otherwise sync the book's most-recent fields from
  // the newest remaining read.
  const remaining = await db
    .select()
    .from(bookRead)
    .where(
      and(
        eq(bookRead.bookId, row.bookId),
        eq(bookRead.userId, session.user.id)
      )
    )
    .orderBy(desc(bookRead.finishedAt));

  if (remaining.length === 0) {
    await db
      .update(book)
      .set({ status: "reading", finishedAt: null, rating: null })
      .where(eq(book.id, row.bookId));
  } else {
    const newest = remaining[0];
    await db
      .update(book)
      .set({
        finishedAt: newest.finishedAt,
        rating: newest.rating,
        notes: newest.notes,
      })
      .where(eq(book.id, row.bookId));
  }

  if (row.book.skillId) {
    await adjustSkillXp(row.book.skillId, session.user.id, -BOOK_XP_TO_SKILL);
  }
  await onBookUnread(session.user.id);

  revalidatePath("/books");
  revalidatePath(`/books/${row.bookId}`);
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

/**
 * Client-side book search across the user's own library — used by the
 * "this is the same book" picker. Case-insensitive match on title or authors.
 */
export async function searchMyBooks(
  q: string,
  excludeId: string
): Promise<
  Array<{
    id: string;
    title: string;
    authors: string;
    coverUrl: string | null;
    status: string;
    rating: number | null;
    year: number | null;
  }>
> {
  const session = await requireSession();
  const term = q.trim().toLowerCase();
  if (!term) return [];

  const rows = await db
    .select()
    .from(book)
    .where(eq(book.userId, session.user.id));

  return rows
    .filter(
      (b) =>
        b.id !== excludeId &&
        (b.title.toLowerCase().includes(term) ||
          b.authors.toLowerCase().includes(term))
    )
    .slice(0, 20)
    .map((b) => ({
      id: b.id,
      title: b.title,
      authors: b.authors,
      coverUrl: b.coverUrl,
      status: b.status,
      rating: b.rating,
      year: b.year,
    }));
}

/**
 * "This is the same book as that one." Moves every reading-list reference
 * from `sourceId` over to `targetId`, then deletes the source book. Used to
 * link a template-added placeholder to an existing library entry the user
 * has already read.
 */
export async function mergeBooks(sourceId: string, targetId: string) {
  const session = await requireSession();
  if (sourceId === targetId) {
    throw new Error("Cannot merge a book with itself");
  }

  const [source, target] = await Promise.all([
    db.query.book.findFirst({
      where: (b, { and: a, eq: e }) =>
        a(e(b.id, sourceId), e(b.userId, session.user.id)),
    }),
    db.query.book.findFirst({
      where: (b, { and: a, eq: e }) =>
        a(e(b.id, targetId), e(b.userId, session.user.id)),
    }),
  ]);
  if (!source || !target) throw new Error("Book not found");

  // Find which reading-lists contain the target already — skip those for
  // source so we don't create duplicate items within one list.
  const targetLists = await db
    .select({ listId: readingListItem.listId })
    .from(readingListItem)
    .where(
      and(
        eq(readingListItem.bookId, targetId),
        eq(readingListItem.userId, session.user.id)
      )
    );
  const targetListIds = new Set(targetLists.map((r) => r.listId));

  const sourceListRows = await db
    .select({ id: readingListItem.id, listId: readingListItem.listId })
    .from(readingListItem)
    .where(
      and(
        eq(readingListItem.bookId, sourceId),
        eq(readingListItem.userId, session.user.id)
      )
    );

  for (const row of sourceListRows) {
    if (targetListIds.has(row.listId)) {
      // Target is already in this list — just drop the source reference
      await db.delete(readingListItem).where(eq(readingListItem.id, row.id));
    } else {
      // Re-point the item at the target book
      await db
        .update(readingListItem)
        .set({ bookId: targetId })
        .where(eq(readingListItem.id, row.id));
    }
  }

  // Delete the source book. cascade handles any leftover links.
  await db
    .delete(book)
    .where(and(eq(book.id, sourceId), eq(book.userId, session.user.id)));

  // The target may now complete (or un-complete) a reading list — re-check.
  await checkReadingListCompletion(session.user.id);
  await checkAccountLevelAchievements(session.user.id);

  revalidatePath("/books");
  revalidatePath("/books/challenges");
  revalidatePath("/achievements");
  return { mergedIntoId: targetId };
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
  await ensureExtraBookAchievementsSeeded(session.user.id);

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

export async function updateReadingList(
  id: string,
  data: { name?: string; description?: string | null; icon?: string }
) {
  const session = await requireSession();
  const trimmed: typeof data = { ...data };
  if (trimmed.name !== undefined) trimmed.name = trimmed.name.trim();
  await db
    .update(readingList)
    .set(trimmed)
    .where(and(eq(readingList.id, id), eq(readingList.userId, session.user.id)));
  revalidatePath("/books/challenges");
  revalidatePath(`/books/challenges/${id}`);
}

export async function removeBookFromReadingList(
  listId: string,
  bookId: string
) {
  const session = await requireSession();
  await db
    .delete(readingListItem)
    .where(
      and(
        eq(readingListItem.listId, listId),
        eq(readingListItem.bookId, bookId),
        eq(readingListItem.userId, session.user.id)
      )
    );
  await checkReadingListCompletion(session.user.id);
  revalidatePath("/books/challenges");
  revalidatePath(`/books/challenges/${listId}`);
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

    const finishedAt =
      r.status === "read" ? r.dateRead ?? r.dateAdded : null;
    const [inserted] = await db
      .insert(book)
      .values({
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
        finishedAt,
        notes: r.review,
        source: "goodreads_csv",
      })
      .returning();

    if (r.status === "read" && finishedAt) {
      await db.insert(bookRead).values({
        bookId: inserted.id,
        userId: session.user.id,
        startedAt: null,
        finishedAt,
        rating: r.rating,
        notes: r.review,
      });
    }
    imported++;
  }

  await ensureBookAchievementsSeeded(session.user.id);
  await ensureExtraBookAchievementsSeeded(session.user.id);
  await checkBooksReadAchievements(session.user.id);
  await checkExtraBookAchievements(session.user.id);
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
  { name: "Master Librarian", description: "Read 500 books", icon: "🗂️", count: 500 },
  { name: "Beyond Bibliophile", description: "Read 1000 books", icon: "♾️", count: 1000 },
];

export async function ensureBookAchievementsSeeded(userId: string) {
  const existing = await db.query.achievement.findMany({
    where: (a, { and: _and, eq: _eq }) =>
      _and(_eq(a.userId, userId), _eq(a.triggerType, "books_read_count")),
  });
  const existingCounts = new Set(
    existing.map((a) => a.triggerCount).filter((c): c is number => c != null)
  );
  const toInsert = BOOK_ACHIEVEMENTS.filter(
    (ba) => !existingCounts.has(ba.count)
  );
  if (toInsert.length === 0) return;

  await db.insert(achievement).values(
    toInsert.map((ba) => ({
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

// =====================
// ADVANCED BOOK ACHIEVEMENTS
// =====================

type ExtraBookAchievement = {
  name: string;
  description: string;
  icon: string;
  triggerType:
    | "book_max_pages"
    | "book_total_pages"
    | "book_burst"
    | "book_rating_streak"
    | "book_monthly_streak";
  triggerCount: number;
};

const EXTRA_BOOK_ACHIEVEMENTS: ExtraBookAchievement[] = [
  {
    name: "Marathon",
    description: "Finish a book of 1000 pages or more",
    icon: "🏃",
    triggerType: "book_max_pages",
    triggerCount: 1000,
  },
  {
    name: "Ten Thousand Pages",
    description: "Read 10,000 pages total",
    icon: "📄",
    triggerType: "book_total_pages",
    triggerCount: 10_000,
  },
  {
    name: "Fifty Thousand Pages",
    description: "Read 50,000 pages total",
    icon: "📜",
    triggerType: "book_total_pages",
    triggerCount: 50_000,
  },
  {
    name: "One Hundred Thousand Pages",
    description: "Read 100,000 pages total",
    icon: "🗿",
    triggerType: "book_total_pages",
    triggerCount: 100_000,
  },
  {
    name: "Speed Reader",
    description: "Finish 3 books within any 7-day window",
    icon: "⚡",
    triggerType: "book_burst",
    triggerCount: 3,
  },
  {
    name: "Perfect Shelf",
    description: "5 consecutive 5-star reads",
    icon: "⭐",
    triggerType: "book_rating_streak",
    triggerCount: 5,
  },
  {
    name: "Year of Reading",
    description: "Finish at least one book every month for 12 months in a row",
    icon: "📅",
    triggerType: "book_monthly_streak",
    triggerCount: 12,
  },
];

export async function ensureExtraBookAchievementsSeeded(userId: string) {
  const existing = await db.query.achievement.findMany({
    where: (a, { and: _and, eq: _eq, or: _or }) =>
      _and(
        _eq(a.userId, userId),
        _or(
          _eq(a.triggerType, "book_max_pages"),
          _eq(a.triggerType, "book_total_pages"),
          _eq(a.triggerType, "book_burst"),
          _eq(a.triggerType, "book_rating_streak"),
          _eq(a.triggerType, "book_monthly_streak")
        )
      ),
  });
  // Dedup key: triggerType + triggerCount
  const existingKeys = new Set(
    existing.map((a) => `${a.triggerType}:${a.triggerCount}`)
  );
  const toInsert = EXTRA_BOOK_ACHIEVEMENTS.filter(
    (ba) => !existingKeys.has(`${ba.triggerType}:${ba.triggerCount}`)
  );
  if (toInsert.length === 0) return;

  await db.insert(achievement).values(
    toInsert.map((ba) => ({
      userId,
      categoryId: null,
      source: "custom" as const,
      name: ba.name,
      description: ba.description,
      icon: ba.icon,
      triggerType: ba.triggerType,
      triggerCount: ba.triggerCount,
    }))
  );
}

/** Iterate sorted timestamps, return true iff any 3 consecutive entries
 * span <= 6 days (i.e. 3 books within a 7-day window). */
function hasBurst(
  timestamps: number[],
  need: number,
  windowDays: number
): boolean {
  if (timestamps.length < need) return false;
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  const sorted = [...timestamps].sort((a, b) => a - b);
  for (let i = 0; i <= sorted.length - need; i++) {
    if (sorted[i + need - 1] - sorted[i] <= windowMs) return true;
  }
  return false;
}

/** Check every non-count book achievement and unlock/re-lock as needed. */
async function checkExtraBookAchievements(userId: string) {
  const achievements = await db.query.achievement.findMany({
    where: (a, { and: _and, eq: _eq, or: _or }) =>
      _and(
        _eq(a.userId, userId),
        _or(
          _eq(a.triggerType, "book_max_pages"),
          _eq(a.triggerType, "book_total_pages"),
          _eq(a.triggerType, "book_burst"),
          _eq(a.triggerType, "book_rating_streak"),
          _eq(a.triggerType, "book_monthly_streak")
        )
      ),
  });
  if (achievements.length === 0) return [];

  const readBooks = await db
    .select()
    .from(book)
    .where(and(eq(book.userId, userId), eq(book.status, "read")));

  // Precompute metrics once
  const maxPages = readBooks.reduce(
    (m, b) => Math.max(m, b.pages ?? 0),
    0
  );
  const totalPages = readBooks.reduce((s, b) => s + (b.pages ?? 0), 0);

  // Finish timestamps for burst + monthly calculations
  const finishes = readBooks
    .filter((b) => b.finishedAt)
    .map((b) => {
      const d =
        typeof b.finishedAt === "number"
          ? new Date((b.finishedAt as number) * 1000)
          : (b.finishedAt as Date);
      return { t: d.getTime(), d, rating: b.rating };
    })
    .sort((a, b) => a.t - b.t);

  // Rating streak: take the most recent N finishes in order, check all are 5
  function hasRatingStreak(n: number): boolean {
    if (finishes.length < n) return false;
    const recent = finishes.slice(-n);
    return recent.every((f) => f.rating === 5);
  }

  // Monthly streak: count consecutive months ending in current month,
  // each containing >= 1 finish.
  function hasMonthlyStreak(n: number): boolean {
    if (finishes.length === 0) return false;
    const byMonth = new Set<string>();
    for (const f of finishes) {
      byMonth.add(
        `${f.d.getFullYear()}-${String(f.d.getMonth() + 1).padStart(2, "0")}`
      );
    }
    const now = new Date();
    for (let i = 0; i < n; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth.has(key)) return false;
    }
    return true;
  }

  const newlyUnlocked: string[] = [];
  for (const a of achievements) {
    if (a.triggerCount == null) continue;
    let should = false;
    if (a.triggerType === "book_max_pages") {
      should = maxPages >= a.triggerCount;
    } else if (a.triggerType === "book_total_pages") {
      should = totalPages >= a.triggerCount;
    } else if (a.triggerType === "book_burst") {
      should = hasBurst(
        finishes.map((f) => f.t),
        a.triggerCount,
        7
      );
    } else if (a.triggerType === "book_rating_streak") {
      should = hasRatingStreak(a.triggerCount);
    } else if (a.triggerType === "book_monthly_streak") {
      should = hasMonthlyStreak(a.triggerCount);
    }

    if (should && !a.isUnlocked) {
      await db
        .update(achievement)
        .set({ isUnlocked: true, unlockedAt: new Date() })
        .where(eq(achievement.id, a.id));
      newlyUnlocked.push(a.name);
    } else if (!should && a.isUnlocked) {
      await db
        .update(achievement)
        .set({ isUnlocked: false, unlockedAt: null })
        .where(eq(achievement.id, a.id));
    }
  }
  return newlyUnlocked;
}

// =====================
// LINKING & HISTORY HELPERS (called client-side from dialogs)
// =====================

export type BookLinkOptions = {
  subskillGroups: {
    categoryId: string;
    categoryName: string;
    categoryIcon: string | null;
    subskills: { id: string; name: string }[];
  }[];
  activeQuests: { id: string; name: string; type: "main" | "side" }[];
};

export async function getBookLinkOptions(): Promise<BookLinkOptions> {
  const session = await requireSession();
  const { getSubskillsGrouped } = await import("@/modules/habits/queries");
  const { getActiveQuests } = await import("@/modules/quests/queries");
  const [groups, active] = await Promise.all([
    getSubskillsGrouped(session.user.id),
    getActiveQuests(session.user.id),
  ]);
  const activeQuests = [
    ...(active.main
      ? [{ id: active.main.id, name: active.main.name, type: "main" as const }]
      : []),
    ...active.side.map((q) => ({ id: q.id, name: q.name, type: "side" as const })),
  ];
  return { subskillGroups: groups, activeQuests };
}

export async function getBookReadHistory(bookId: string) {
  const session = await requireSession();
  const rows = await db
    .select()
    .from(bookRead)
    .where(
      and(eq(bookRead.bookId, bookId), eq(bookRead.userId, session.user.id))
    )
    .orderBy(desc(bookRead.finishedAt), desc(bookRead.createdAt));
  return rows;
}

async function onBookRead(userId: string) {
  await ensureBookAchievementsSeeded(userId);
  await ensureExtraBookAchievementsSeeded(userId);
  await checkBooksReadAchievements(userId);
  await checkExtraBookAchievements(userId);
  await checkReadingListCompletion(userId);
  await checkAccountLevelAchievements(userId);
}

async function onBookUnread(userId: string) {
  await checkBooksReadAchievements(userId);
  await checkExtraBookAchievements(userId);
  await checkReadingListCompletion(userId);
  await checkAccountLevelAchievements(userId);
}

void XP_PER_BOOK;
