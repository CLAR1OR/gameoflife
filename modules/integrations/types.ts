import { InferSelectModel } from "drizzle-orm";
import { integrationCredential } from "@/lib/db/schema";

export type IntegrationCredential = InferSelectModel<typeof integrationCredential>;
export type IntegrationProvider = "todoist" | "google_calendar";

/** Subset of a Todoist task we care about in the side panel. */
export type TodoistTask = {
  id: string;
  content: string;
  description: string | null;
  url: string;
  isCompleted: boolean;
  priority: 1 | 2 | 3 | 4;
  /** Plain "due today" / "tomorrow" / ISO from the Todoist API. */
  due: {
    date: string;
    string: string;
    isRecurring: boolean;
    datetime: string | null;
  } | null;
  projectId: string;
  labels: string[];
  order: number;
};

/** Subset of a Todoist project we expose. */
export type TodoistProject = {
  id: string;
  name: string;
  color: string;
  isInboxProject: boolean;
};

/** Public view of an integration credential — no token leaks to the client. */
export type IntegrationStatus = {
  provider: IntegrationProvider;
  connected: boolean;
  connectedAt: Date | null;
};
