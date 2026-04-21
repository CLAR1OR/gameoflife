import { InferSelectModel } from "drizzle-orm";
import { habit, habitCompletion } from "@/lib/db/schema";

export type Habit = InferSelectModel<typeof habit>;
export type HabitCompletion = InferSelectModel<typeof habitCompletion>;

export type HabitWithLink = Habit & {
  /** ISO date strings (YYYY-MM-DD) — unique dates for daily habits; may have duplicates for irregular. */
  completedDates: string[];
  /** Current streak — for daily habits only. 0 for irregular. */
  currentStreak: number;
  /** Best streak ever — daily habits. 0 for irregular. */
  bestStreak: number;
  /** Total completions across all time. */
  totalCompletions: number;
  /** Completions logged today (only meaningful for irregular; 0 or 1 for daily). */
  todayCount: number;
  /** Which subskill this habit feeds (if any) */
  skillName: string | null;
  /** Which category (root skill) this habit belongs to */
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
};
