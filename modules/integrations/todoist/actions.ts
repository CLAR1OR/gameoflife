"use server";

import { db } from "@/lib/db";
import { integrationCredential } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { requireSession } from "@/lib/auth-server";
import { revalidatePath } from "next/cache";
import { getIntegrationCredential } from "../queries";
import {
  closeTask,
  createTask,
  listProjects,
  listTasksInProject,
  listTodayTasks,
  reopenTask,
  TodoistError,
} from "./client";
import type { TodoistProject, TodoistTask } from "../types";

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

export async function saveTodoistToken(token: string): Promise<void> {
  const session = await requireSession();
  const trimmed = token.trim();
  if (!trimmed) throw new Error("Token is empty");

  // Smoke test: try one request before saving so we don't store a bad token.
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
  error: string | null;
};

export async function loadTodoistData(
  opts?: { projectId?: string }
): Promise<TodoistPanelData> {
  const session = await requireSession();
  const token = await getToken(session.user.id);
  if (!token) {
    return { connected: false, tasks: [], projects: [], error: null };
  }
  try {
    const [tasks, projects] = await Promise.all([
      opts?.projectId
        ? listTasksInProject(token, opts.projectId)
        : listTodayTasks(token),
      listProjects(token),
    ]);
    return { connected: true, tasks, projects, error: null };
  } catch (e) {
    return {
      connected: true,
      tasks: [],
      projects: [],
      error: unwrap(e),
    };
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
