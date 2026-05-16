import { InferSelectModel } from "drizzle-orm";
import { habit, habitCompletion } from "@/lib/db/schema";

export type Habit = InferSelectModel<typeof habit>;
export type HabitCompletion = InferSelectModel<typeof habitCompletion>;

export type HabitWithLink = Habit & {
  /** ISO date strings (YYYY-MM-DD) — unique dates for daily habits; may have duplicates for irregular. */
  completedDates: string[];
  /** Current streak — for daily habits only. 0 for irregular. When the habit
   *  has `targetPerWeek < 7`, this is a *weekly* streak (consecutive weeks
   *  meeting the target) rather than consecutive days. */
  currentStreak: number;
  /** Whether `currentStreak` represents days or weeks. */
  streakUnit: "day" | "week";
  /** Best streak ever — daily habits. 0 for irregular. Unit matches `streakUnit`. */
  bestStreak: number;
  /** Total completions across all time. */
  totalCompletions: number;
  /** Completions logged today (only meaningful for irregular; 0 or 1 for daily). */
  todayCount: number;
  /** Completions logged in the current ISO week (Mon–Sun). Used for
   *  flexible-cadence habits to show "X / target this week". */
  thisWeekCount: number;
  /** Which subskill this habit feeds (if any) */
  skillName: string | null;
  /** Which category (root skill) this habit belongs to */
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
};
