import { db } from "@/lib/db";
import { achievement, book, readingListItem } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import {
  seedAchievements,
  evaluateAchievements,
  type AchievementSpec,
} from "./achievement-engine";

// =====================
// COUNT-BASED ACHIEVEMENTS
// =====================

const BOOKS_READ_TRIGGER = ["books_read_count"] as const;
type BooksReadTrigger = (typeof BOOKS_READ_TRIGGER)[number];

const BOOK_ACHIEVEMENTS: AchievementSpec<BooksReadTrigger>[] = [
  { name: "First Book", description: "Finish your first book", icon: "📖", triggerType: "books_read_count", triggerCount: 1 },
  { name: "Bookworm", description: "Read 10 books", icon: "🐛", triggerType: "books_read_count", triggerCount: 10 },
  { name: "Avid Reader", description: "Read 25 books", icon: "📚", triggerType: "books_read_count", triggerCount: 25 },
  { name: "Well-Read", description: "Read 50 books", icon: "🎓", triggerType: "books_read_count", triggerCount: 50 },
  { name: "Bibliophile", description: "Read 100 books", icon: "👑", triggerType: "books_read_count", triggerCount: 100 },
  { name: "Library Unto Yourself", description: "Read 250 books", icon: "🏛️", triggerType: "books_read_count", triggerCount: 250 },
  { name: "Master Librarian", description: "Read 500 books", icon: "🗂️", triggerType: "books_read_count", triggerCount: 500 },
  { name: "Beyond Bibliophile", description: "Read 1000 books", icon: "♾️", triggerType: "books_read_count", triggerCount: 1000 },
];

export async function ensureBookAchievementsSeeded(userId: string) {
  await seedAchievements(userId, BOOKS_READ_TRIGGER, BOOK_ACHIEVEMENTS);
}

// =====================
// EXTRA ACHIEVEMENTS (page-totals + streaks + burst)
// =====================

const EXTRA_TRIGGERS = [
  "book_max_pages",
  "book_total_pages",
  "book_burst",
  "book_rating_streak",
  "book_monthly_streak",
] as const;
type ExtraTrigger = (typeof EXTRA_TRIGGERS)[number];

const EXTRA_BOOK_ACHIEVEMENTS: AchievementSpec<ExtraTrigger>[] = [
  {
    name: "Marathon",
    description: "Finish a book of 1000 pages or more",
    icon: "🏃",
    triggerType: "book_max_pages",
    triggerCount: 1000,
  },
  { name: "Ten Thousand Pages", description: "Read 10,000 pages total", icon: "📄", triggerType: "book_total_pages", triggerCount: 10_000 },
  { name: "Fifty Thousand Pages", description: "Read 50,000 pages total", icon: "📜", triggerType: "book_total_pages", triggerCount: 50_000 },
  { name: "One Hundred Thousand Pages", description: "Read 100,000 pages total", icon: "🗿", triggerType: "book_total_pages", triggerCount: 100_000 },
  { name: "Speed Reader", description: "Finish 3 books within any 7-day window", icon: "⚡", triggerType: "book_burst", triggerCount: 3 },
  { name: "Perfect Shelf", description: "5 consecutive 5-star reads", icon: "⭐", triggerType: "book_rating_streak", triggerCount: 5 },
  { name: "Year of Reading", description: "Finish at least one book every month for 12 months in a row", icon: "📅", triggerType: "book_monthly_streak", triggerCount: 12 },
];

export async function ensureExtraBookAchievementsSeeded(userId: string) {
  await seedAchievements(userId, EXTRA_TRIGGERS, EXTRA_BOOK_ACHIEVEMENTS);
}

/** True iff any `need` of the sorted timestamps span ≤ `windowDays`. */
function maxBurstAchieved(timestamps: number[], windowDays: number): number {
  // Returns the largest N such that some window of `windowDays` contains N timestamps.
  if (timestamps.length === 0) return 0;
  const sorted = [...timestamps].sort((a, b) => a - b);
  const windowMs = windowDays * 24 * 60 * 60 * 1000;
  let best = 1;
  let left = 0;
  for (let right = 0; right < sorted.length; right++) {
    while (sorted[right] - sorted[left] > windowMs) left++;
    best = Math.max(best, right - left + 1);
  }
  return best;
}

/** Longest trailing streak of 5-star reads (counting backwards from the
 * most recent finish). */
function ratingStreak(finishes: { rating: number | null }[]): number {
  let streak = 0;
  for (let i = finishes.length - 1; i >= 0; i--) {
    if (finishes[i].rating === 5) streak++;
    else break;
  }
  return streak;
}

/** Longest run of consecutive months (ending in current month) that
 * each contain ≥1 finish. */
function monthlyStreakEndingNow(finishes: { d: Date }[]): number {
  if (finishes.length === 0) return 0;
  const byMonth = new Set<string>();
  for (const f of finishes) {
    byMonth.add(
      `${f.d.getFullYear()}-${String(f.d.getMonth() + 1).padStart(2, "0")}`
    );
  }
  const now = new Date();
  let n = 0;
  while (true) {
    const d = new Date(now.getFullYear(), now.getMonth() - n, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth.has(key)) break;
    n++;
  }
  return n;
}

export async function checkBooksReadAchievements(
  userId: string
): Promise<string[]> {
  const readRows = await db
    .select({ id: book.id })
    .from(book)
    .where(and(eq(book.userId, userId), eq(book.status, "read")));
  return evaluateAchievements(userId, BOOKS_READ_TRIGGER, {
    books_read_count: readRows.length,
  });
}

export async function checkExtraBookAchievements(
  userId: string
): Promise<string[]> {
  const readBooks = await db
    .select()
    .from(book)
    .where(and(eq(book.userId, userId), eq(book.status, "read")));

  if (readBooks.length === 0) {
    // Still evaluate, so that any previously-unlocked achievement re-locks
    // if the user reset their library.
    return evaluateAchievements(userId, EXTRA_TRIGGERS, {
      book_max_pages: 0,
      book_total_pages: 0,
      book_burst: 0,
      book_rating_streak: 0,
      book_monthly_streak: 0,
    });
  }

  const maxPages = readBooks.reduce((m, b) => Math.max(m, b.pages ?? 0), 0);
  const totalPages = readBooks.reduce((s, b) => s + (b.pages ?? 0), 0);

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

  return evaluateAchievements(userId, EXTRA_TRIGGERS, {
    book_max_pages: maxPages,
    book_total_pages: totalPages,
    book_burst: maxBurstAchieved(finishes.map((f) => f.t), 7),
    book_rating_streak: ratingStreak(finishes),
    book_monthly_streak: monthlyStreakEndingNow(finishes),
  });
}

/** Per-reading-list completion check. These achievements have
 * triggerType="reading_list_completed" and triggerReadingListId pointing at
 * the list. Unlocks when every book in the list is status="read". */
export async function checkReadingListCompletion(userId: string): Promise<void> {
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
