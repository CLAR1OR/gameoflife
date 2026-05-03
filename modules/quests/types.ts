import { InferSelectModel } from "drizzle-orm";
import { quest, questTask } from "@/lib/db/schema";

export type Quest = InferSelectModel<typeof quest>;
export type QuestTask = InferSelectModel<typeof questTask>;

export type LinkedBookForQuest = {
  id: string;
  title: string;
  authors: string;
  coverUrl: string | null;
  status: string;
};

export type QuestWithTasks = Quest & {
  tasks: QuestTask[];
  progress: { done: number; total: number; pct: number };
  linkedBooks: LinkedBookForQuest[];
};

/** Max simultaneously active side quests. */
export const MAX_SIDE_QUESTS = 5;

export type QuestStats = {
  sideCompleted: number;
  mainCompleted: number;
  totalAbandoned: number;
  totalXpFromQuests: number;
};
