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
import {
  ensureBookAchievementsSeeded,
  ensureExtraBookAchievementsSeeded,
  checkBooksReadAchievements,
  checkExtraBookAchievements,
  checkReadingListCompletion,
} from "@/lib/books-achievements";
import { evaluateQuestTaskTriggers } from "@/lib/quest-task-triggers";
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
  await evaluateQuestTaskTriggers(userId);
  revalidatePath("/quests");
}

async function onBookUnread(userId: string) {
  await checkBooksReadAchievements(userId);
  await checkExtraBookAchievements(userId);
  await checkReadingListCompletion(userId);
  await checkAccountLevelAchievements(userId);
  await evaluateQuestTaskTriggers(userId);
  revalidatePath("/quests");
}

void XP_PER_BOOK;
