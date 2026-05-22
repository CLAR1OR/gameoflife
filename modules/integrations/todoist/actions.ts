"use server";

import { db } from "@/lib/db";
import { integrationCredential, userSettings } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { checkAccountLevelAchievements } from "@/lib/account-achievements";
import { getIntegrationCredential } from "../queries";
import {
  closeTask,
  createTask,
  listProjects,
  listSections,
  listTasksInProject,
  listTodayTasks,
  reopenTask,
  TodoistError,
  updateTask,
} from "./client";
import type {
  TodoistProject,
  TodoistSection,
  TodoistTask,
} from "../types";

async function getToken(userId: string): Promise<string | null> {
  const cred = await getIntegrationCredential(userId, "todoist");
  return cred?.accessToken ?? null;
}

function unwrap(e: unknown): string {
  if (e instanceof TodoistError) {
    if (e.status === 401 || e.status === 403)
      return "Todoist rejected the token. Reconnect from Account → Integrations.";
    return `Todoist error: ${e.message}`;
  }
  return e instanceof Error ? e.message : "Failed";
}

/** Flat XP awarded per Todoist task completion. */
const XP_PER_TODOIST_TASK = 1;

async function awardGeneralXp(userId: string, amount: number) {
  const existing = await db.query.userSettings.findFirst({
    where: (s, { eq: e }) => e(s.userId, userId),
  });
  if (existing) {
    await db
      .update(userSettings)
      .set({
        generalXp: sql`${userSettings.generalXp} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(userSettings.userId, userId));
  } else {
    await db.insert(userSettings).values({ userId, generalXp: amount });
  }
  await checkAccountLevelAchievements(userId);
}

export async function saveTodoistToken(token: string): Promise<void> {
  const session = await requireSession();
  const trimmed = token.trim();
  if (!trimmed) throw new Error("Token is empty");

  try {
    await listProjects(trimmed);
  } catch (e) {
    throw new Error(unwrap(e));
  }

  const existing = await getIntegrationCredential(session.user.id, "todoist");
  if (existing) {
    await db
      .update(integrationCredential)
      .set({
        accessToken: trimmed,
        updatedAt: new Date(),
      })
      .where(eq(integrationCredential.id, existing.id));
  } else {
    await db.insert(integrationCredential).values({
      userId: session.user.id,
      provider: "todoist",
      accessToken: trimmed,
    });
  }
  revalidatePath("/account");
}

export async function disconnectTodoist(): Promise<void> {
  const session = await requireSession();
  await db
    .delete(integrationCredential)
    .where(
      and(
        eq(integrationCredential.userId, session.user.id),
        eq(integrationCredential.provider, "todoist")
      )
    );
  revalidatePath("/account");
}

export type TodoistPanelData = {
  connected: boolean;
  tasks: TodoistTask[];
  projects: TodoistProject[];
  sections: TodoistSection[];
  error: string | null;
};

export async function loadTodoistData(
  opts?: { projectId?: string }
): Promise<TodoistPanelData> {
  const session = await requireSession();
  const token = await getToken(session.user.id);
  if (!token) {
    return {
      connected: false,
      tasks: [],
      projects: [],
      sections: [],
      error: null,
    };
  }
  try {
    // Tasks and projects must succeed — the panel can't render without
    // them. Sections is best-effort: if it fails (e.g. an account-level
    // quirk), we render flat instead of taking the whole panel down.
    const [tasks, projects, sectionsResult] = await Promise.all([
      opts?.projectId
        ? listTasksInProject(token, opts.projectId)
        : listTodayTasks(token),
      listProjects(token),
      listSections(token).catch((e) => {
        console.error("Todoist sections fetch failed:", e);
        return [] as TodoistSection[];
      }),
    ]);
    return {
      connected: true,
      tasks,
      projects,
      sections: sectionsResult,
      error: null,
    };
  } catch (e) {
    return {
      connected: true,
      tasks: [],
      projects: [],
      sections: [],
      error: unwrap(e),
    };
  }
}

/** Lightweight count for the top-nav badge — never throws, returns 0 on
 *  any failure or when not connected. */
export async function getTodoistOpenCount(): Promise<number> {
  try {
    const session = await requireSession();
    const token = await getToken(session.user.id);
    if (!token) return 0;
    const tasks = await listTodayTasks(token);
    return tasks.length;
  } catch {
    return 0;
  }
}

export async function completeTodoistTask(taskId: string): Promise<void> {
  const session = await requireSession();
  const token = await getToken(session.user.id);
  if (!token) throw new Error("Todoist not connected");
  try {
    await closeTask(token, taskId);
  } catch (e) {
    throw new Error(unwrap(e));
  }
  // Reward the completion in our gamification layer.
  await awardGeneralXp(session.user.id, XP_PER_TODOIST_TASK);
  revalidatePath("/account");
}

export async function reopenTodoistTask(taskId: string): Promise<void> {
  const session = await requireSession();
  const token = await getToken(session.user.id);
  if (!token) throw new Error("Todoist not connected");
  try {
    await reopenTask(token, taskId);
  } catch (e) {
    throw new Error(unwrap(e));
  }
}

export async function createTodoistTask(data: {
  content: string;
  dueString?: string;
  projectId?: string;
}): Promise<TodoistTask> {
  const session = await requireSession();
  const token = await getToken(session.user.id);
  if (!token) throw new Error("Todoist not connected");
  const content = data.content.trim();
  if (!content) throw new Error("Task is empty");
  try {
    return await createTask(token, {
      content,
      dueString: data.dueString,
      projectId: data.projectId,
    });
  } catch (e) {
    throw new Error(unwrap(e));
  }
}

export async function rescheduleTodoistTask(
  taskId: string,
  dueString: string
): Promise<TodoistTask> {
  const session = await requireSession();
  const token = await getToken(session.user.id);
  if (!token) throw new Error("Todoist not connected");
  const ds = dueString.trim();
  try {
    // Todoist treats an empty due_string as "no due date".
    return await updateTask(token, taskId, { dueString: ds || null });
  } catch (e) {
    throw new Error(unwrap(e));
  }
}

export async function setTodoistTaskPriority(
  taskId: string,
  priority: 1 | 2 | 3 | 4
): Promise<TodoistTask> {
  const session = await requireSession();
  const token = await getToken(session.user.id);
  if (!token) throw new Error("Todoist not connected");
  try {
    return await updateTask(token, taskId, { priority });
  } catch (e) {
    throw new Error(unwrap(e));
  }
}
