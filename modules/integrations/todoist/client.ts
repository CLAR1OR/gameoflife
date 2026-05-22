import type { TodoistProject, TodoistTask } from "../types";

/** Todoist unified API. REST v2 (api.todoist.com/rest/v2) returns 410
 *  Gone as of late 2025 — everything moved here. */
const BASE = "https://api.todoist.com/api/v1";

/** Task object as returned by the v1 API on the wire (snake_case). Only
 *  the fields we actually use are typed; the rest is ignored. */
type RawTask = {
  id: string;
  content: string;
  description: string;
  checked: boolean;
  is_deleted?: boolean;
  priority: number;
  due: {
    date: string;
    string: string;
    is_recurring: boolean;
    datetime: string | null;
  } | null;
  project_id: string;
  labels: string[];
  child_order: number;
};

type RawProject = {
  id: string;
  name: string;
  color: string;
  inbox_project?: boolean;
};

/** All list endpoints in v1 are paginated; cursor handling can be added
 *  later if needed. For now we just take the first page. */
type Paginated<T> = { results: T[]; next_cursor: string | null };

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

function taskUrl(id: string): string {
  return `https://todoist.com/showTask?id=${id}`;
}

function mapTask(r: RawTask): TodoistTask {
  return {
    id: r.id,
    content: r.content,
    description: r.description || null,
    url: taskUrl(r.id),
    isCompleted: r.checked,
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
    order: r.child_order,
  };
}

function mapProject(r: RawProject): TodoistProject {
  return {
    id: r.id,
    name: r.name,
    color: r.color,
    isInboxProject: r.inbox_project ?? false,
  };
}

/** GET /tasks/filter?query=today|overdue — paginated, we take page 1. */
export async function listTodayTasks(token: string): Promise<TodoistTask[]> {
  const data = await call<Paginated<RawTask>>(
    token,
    `/tasks/filter?query=${encodeURIComponent("today | overdue")}&limit=200`
  );
  return (data?.results ?? []).map(mapTask);
}

/** GET /tasks?project_id=... — all open tasks in a single project. */
export async function listTasksInProject(
  token: string,
  projectId: string
): Promise<TodoistTask[]> {
  const data = await call<Paginated<RawTask>>(
    token,
    `/tasks?project_id=${encodeURIComponent(projectId)}&limit=200`
  );
  return (data?.results ?? []).map(mapTask);
}

export async function listProjects(token: string): Promise<TodoistProject[]> {
  const data = await call<Paginated<RawProject>>(token, "/projects?limit=200");
  return (data?.results ?? []).map(mapProject);
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
