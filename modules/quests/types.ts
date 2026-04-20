import { InferSelectModel } from "drizzle-orm";
import { quest } from "@/lib/db/schema";

export type Quest = InferSelectModel<typeof quest>;

/** Max simultaneously active side quests. */
export const MAX_SIDE_QUESTS = 5;

export type QuestStats = {
  sideCompleted: number;
  mainCompleted: number;
  totalAbandoned: number;
  totalXpFromQuests: number;
};
