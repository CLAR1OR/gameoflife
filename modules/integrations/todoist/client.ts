import type { TodoistProject, TodoistTask } from "../types";

const BASE = "https://api.todoist.com/rest/v2";

/** Raw shapes coming back from the Todoist REST v2 API — we map a few
 *  fields and drop the rest before exposing to the rest of the app. */
type RawTask = {
  id: string;
  content: string;
  description: string;
  url: string;
  is_completed: boolean;
  priority: number;
  due: {
    date: string;
    string: string;
    is_recurring: boolean;
    datetime: string | null;
  } | null;
  project_id: string;
  labels: string[];
  order: number;
};

type RawProject = {
  id: string;
  name: string;
  color: string;
  is_inbox_project: boolean;
};

class TodoistError extends Error {
  status: number;
  body: string;
  constructor(message: string, status: number, body: string) {
    super(message);
    this.name = "TodoistError";
    this.status = status;
    this.body = body;
  }
}

async function call<T>(
  token: string,
  path: string,
  init?: RequestInit
): Promise<T | null> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (res.status === 204) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new TodoistError(
      `Todoist API ${res.status}: ${res.statusText}`,
      res.status,
      body
    );
  }
  return (await res.json()) as T;
}

function mapTask(r: RawTask): TodoistTask {
  return {
    id: r.id,
    content: r.content,
    description: r.description || null,
    url: r.url,
    isCompleted: r.is_completed,
    priority: r.priority as 1 | 2 | 3 | 4,
    due: r.due
      ? {
          date: r.due.date,
          string: r.due.string,
          isRecurring: r.due.is_recurring,
          datetime: r.due.datetime,
        }
      : null,
    projectId: r.project_id,
    labels: r.labels,
    order: r.order,
  };
}

function mapProject(r: RawProject): TodoistProject {
  return {
    id: r.id,
    name: r.name,
    color: r.color,
    isInboxProject: r.is_inbox_project,
  };
}

/** Hits /tasks with a `filter` so we get only today + overdue. */
export async function listTodayTasks(token: string): Promise<TodoistTask[]> {
  const raw = await call<RawTask[]>(
    token,
    `/tasks?filter=${encodeURIComponent("today | overdue")}`
  );
  return (raw ?? []).map(mapTask);
}

export async function listProjects(token: string): Promise<TodoistProject[]> {
  const raw = await call<RawProject[]>(token, "/projects");
  return (raw ?? []).map(mapProject);
}

export async function closeTask(token: string, taskId: string): Promise<void> {
  await call<null>(token, `/tasks/${taskId}/close`, { method: "POST" });
}

export async function reopenTask(token: string, taskId: string): Promise<void> {
  await call<null>(token, `/tasks/${taskId}/reopen`, { method: "POST" });
}

export async function createTask(
  token: string,
  data: { content: string; dueString?: string; projectId?: string }
): Promise<TodoistTask> {
  const raw = await call<RawTask>(token, "/tasks", {
    method: "POST",
    body: JSON.stringify({
      content: data.content,
      due_string: data.dueString,
      project_id: data.projectId,
    }),
  });
  if (!raw) throw new Error("Todoist returned no task on create");
  return mapTask(raw);
}

export { TodoistError };
