"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  completeTodoistTask,
  createTodoistTask,
  loadTodoistData,
  type TodoistPanelData,
} from "@/modules/integrations/todoist/actions";
import type { TodoistProject, TodoistTask } from "@/modules/integrations/types";

const PRIORITY_COLOR: Record<number, string> = {
  4: "text-destructive border-destructive/40",
  3: "text-xp border-xp/40",
  2: "text-glow border-glow/40",
  1: "text-muted-foreground border-border/40",
};

function priorityLabel(p: number): string {
  return p === 4 ? "p1" : p === 3 ? "p2" : p === 2 ? "p3" : "p4";
}

type View =
  | { kind: "today" }
  | { kind: "project"; id: string };

function viewKey(v: View): string {
  return v.kind === "today" ? "today" : `project:${v.id}`;
}

export function TodoistPanel() {
  const [data, setData] = useState<TodoistPanelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [view, setView] = useState<View>({ kind: "today" });
  const reloadRef = useRef(0);

  async function refresh(target: View = view) {
    const id = ++reloadRef.current;
    setLoading(true);
    const next = await loadTodoistData(
      target.kind === "project" ? { projectId: target.id } : undefined
    );
    if (id !== reloadRef.current) return;
    setData(next);
    setLoading(false);
  }

  // Initial load + re-load whenever the active view changes.
  useEffect(() => {
    refresh(view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewKey(view)]);

  async function handleComplete(task: TodoistTask) {
    if (!data) return;
    const prev = data;
    setData({ ...data, tasks: data.tasks.filter((t) => t.id !== task.id) });
    try {
      await completeTodoistTask(task.id);
      toast.success("Completed");
    } catch (e) {
      setData(prev);
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setAdding(true);
    try {
      const created = await createTodoistTask({
        content,
        // In "Today" view we schedule for today; in a project view we
        // add the task to that project with no due date.
        dueString: view.kind === "today" ? "today" : undefined,
        projectId: view.kind === "project" ? view.id : undefined,
      });
      setDraft("");
      if (data) {
        setData({ ...data, tasks: [created, ...data.tasks] });
      }
      toast.success("Added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setAdding(false);
  }

  if (loading && !data) {
    return (
      <div className="text-xs font-mono text-muted-foreground py-6 text-center">
        loading…
      </div>
    );
  }
  if (!data) return null;

  if (!data.connected) {
    return (
      <div className="rounded-md border border-border/60 bg-card/40 p-4 text-sm space-y-2">
        <p className="font-medium">Todoist not connected</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Paste your personal API token on the integrations settings to see
          your tasks here.
        </p>
        <Link
          href="/account#integrations"
          className="inline-block text-xs font-mono text-glow hover:underline"
        >
          → Open settings
        </Link>
      </div>
    );
  }

  if (data.error) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs space-y-2">
        <p className="text-destructive font-medium">Todoist error</p>
        <p className="text-muted-foreground">{data.error}</p>
        <button
          type="button"
          onClick={() => refresh()}
          className="text-glow font-mono hover:underline"
        >
          retry
        </button>
      </div>
    );
  }

  // Sort projects so Inbox is first, then alphabetical.
  const sortedProjects = [...data.projects].sort((a, b) => {
    if (a.isInboxProject !== b.isInboxProject) return a.isInboxProject ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  const projectsById = new Map(sortedProjects.map((p) => [p.id, p]));

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-3">
      <form onSubmit={handleAdd} className="flex gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={
            view.kind === "today"
              ? "+ Quick add (for today)…"
              : `+ Add to ${projectsById.get(view.id)?.name ?? "project"}…`
          }
          className="flex-1 rounded-md border border-border/60 bg-card/40 px-2 py-1.5 text-xs outline-none focus:border-glow/60"
        />
        <button
          type="submit"
          disabled={adding || !draft.trim()}
          className="rounded-md border border-glow/40 bg-glow/10 px-3 py-1.5 text-xs font-mono text-glow hover:bg-glow/20 disabled:opacity-40 transition-colors"
        >
          {adding ? "…" : "add"}
        </button>
      </form>

      <div className="flex items-center gap-1.5">
        <select
          value={view.kind === "today" ? "__today" : view.id}
          onChange={(e) => {
            const v = e.target.value;
            setView(v === "__today" ? { kind: "today" } : { kind: "project", id: v });
          }}
          className="flex-1 h-7 rounded-md border border-border/60 bg-card/40 px-2 text-xs font-mono outline-none focus:border-glow/60"
        >
          <option value="__today">📅 Today + overdue ({data.tasks.length})</option>
          {sortedProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.isInboxProject ? "📥" : "#"} {p.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => refresh()}
          className="h-7 px-2 rounded-md border border-border/60 bg-card/40 text-xs font-mono text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
          title="Refresh"
        >
          ↻
        </button>
      </div>

      {data.tasks.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-6 text-center">
          {view.kind === "today"
            ? "Nothing on today's list. 🎉"
            : "No open tasks in this project."}
        </p>
      ) : view.kind === "today" ? (
        <GroupedByProject
          tasks={data.tasks}
          projects={sortedProjects}
          today={today}
          onComplete={handleComplete}
        />
      ) : (
        <FlatTaskList
          tasks={data.tasks}
          today={today}
          onComplete={handleComplete}
        />
      )}

      <p className="text-[10px] font-mono text-muted-foreground/50 text-center pt-2 border-t border-border/30">
        press <kbd className="px-1 py-0.5 rounded bg-card/60 border border-border/40">q</kbd> or <kbd className="px-1 py-0.5 rounded bg-card/60 border border-border/40">esc</kbd> to close
      </p>
    </div>
  );
}

function GroupedByProject({
  tasks,
  projects,
  today,
  onComplete,
}: {
  tasks: TodoistTask[];
  projects: TodoistProject[];
  today: string;
  onComplete: (t: TodoistTask) => void;
}) {
  const groups = useMemo(() => {
    const byProject = new Map<string, TodoistTask[]>();
    for (const t of tasks) {
      const arr = byProject.get(t.projectId) ?? [];
      arr.push(t);
      byProject.set(t.projectId, arr);
    }
    // Preserve the sorted-project order; drop empty groups.
    return projects
      .map((p) => ({ project: p, tasks: byProject.get(p.id) ?? [] }))
      .filter((g) => g.tasks.length > 0);
  }, [tasks, projects]);

  return (
    <div className="space-y-3">
      {groups.map(({ project, tasks: group }) => (
        <div key={project.id} className="space-y-1.5">
          <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1">
            <span>{project.isInboxProject ? "📥" : "#"}</span>
            <span>{project.name}</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-muted-foreground/40">{group.length}</span>
          </h3>
          <ul className="space-y-1.5">
            {group.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                today={today}
                onComplete={onComplete}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function FlatTaskList({
  tasks,
  today,
  onComplete,
}: {
  tasks: TodoistTask[];
  today: string;
  onComplete: (t: TodoistTask) => void;
}) {
  return (
    <ul className="space-y-1.5">
      {tasks.map((t) => (
        <TaskRow key={t.id} task={t} today={today} onComplete={onComplete} />
      ))}
    </ul>
  );
}

function TaskRow({
  task,
  today,
  onComplete,
}: {
  task: TodoistTask;
  today: string;
  onComplete: (t: TodoistTask) => void;
}) {
  const overdue = !!(task.due?.date && task.due.date < today);
  return (
    <li className="rounded-md border border-border/60 bg-card/40 px-2.5 py-2 text-xs flex items-start gap-2">
      <button
        type="button"
        onClick={() => onComplete(task)}
        aria-label="Complete"
        className={`h-4 w-4 rounded-full border shrink-0 mt-0.5 hover:bg-glow/20 transition-colors ${PRIORITY_COLOR[task.priority]}`}
        title={priorityLabel(task.priority)}
      />
      <div className="flex-1 min-w-0">
        <a
          href={task.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block leading-snug hover:text-glow transition-colors"
        >
          {task.content}
        </a>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-[10px] font-mono text-muted-foreground/70">
          {task.due && (
            <span className={overdue ? "text-destructive" : ""}>
              ⏱ {task.due.string}
            </span>
          )}
          {task.labels.map((l) => (
            <span key={l}>@{l}</span>
          ))}
        </div>
      </div>
    </li>
  );
}
