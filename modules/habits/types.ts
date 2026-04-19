import { InferSelectModel } from "drizzle-orm";
import { habit, habitCompletion } from "@/lib/db/schema";

export type Habit = InferSelectModel<typeof habit>;
export type HabitCompletion = InferSelectModel<typeof habitCompletion>;

export type HabitWithLink = Habit & {
  /** ISO date strings (YYYY-MM-DD) for completions in the fetched range */
  completedDates: string[];
  /** Current streak in days ending today or yesterday */
  currentStreak: number;
  /** Which subskill this habit feeds (if any) */
  skillName: string | null;
  /** Which category (root skill) this habit belongs to */
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
};
