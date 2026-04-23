import { InferSelectModel } from "drizzle-orm";
import { book, bookRead, readingList, readingListItem } from "@/lib/db/schema";

export type Book = InferSelectModel<typeof book>;
export type BookRead = InferSelectModel<typeof bookRead>;
export type ReadingList = InferSelectModel<typeof readingList>;
export type ReadingListItem = InferSelectModel<typeof readingListItem>;

export type BookStatus = "want" | "reading" | "read";

export type ReadingListWithProgress = ReadingList & {
  total: number;
  read: number;
  pct: number;
  sampleCovers: (string | null)[];
};

/** XP awarded when a book is marked as read. Tunable single source of truth. */
export const XP_PER_BOOK = 25;
