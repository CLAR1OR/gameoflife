"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  completeTodoistTask,
  createTodoistTask,
  loadTodoistData,
  rescheduleTodoistTask,
  setTodoistTaskDescription,
  setTodoistTaskPriority,
  type TodoistPanelData,
} from "@/modules/integrations/todoist/actions";
import type {
  TodoistProject,
  TodoistSection,
  TodoistTask,
} from "@/modules/integrations/types";

const PRIORITY_COLOR: Record<number, string> = {
  4: "text-destructive border-destructive/40",
  3: "text-xp border-xp/40",
  2: "text-glow border-glow/40",
  1: "text-muted-foreground border-border/40",
};

function priorityLabel(p: number): string {
  return p === 4 ? "p1" : p === 3 ? "p2" : p === 2 ? "p3" : "p4";
}

function nextPriority(p: 1 | 2 | 3 | 4): 1 | 2 | 3 | 4 {
  // Cycle p4(lowest) → p3 → p2 → p1(highest) → p4. API priority is
  // inverted (4 = highest urgency), so we increment with wrap.
  return ((p % 4) + 1) as 1 | 2 | 3 | 4;
}

const VIEW_STORAGE_KEY = "todoist-panel-view";
const DATA_CACHE_PREFIX = "todoist-panel-cache:";
/** Hide cached data older than this and trigger a foreground reload. */
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type View = { kind: "today" } | { kind: "project"; id: string };

function viewKey(v: View): string {
  return v.kind === "today" ? "today" : `project:${v.id}`;
}

function parseView(raw: string | null): View {
  if (!raw || raw === "today") return { kind: "today" };
  if (raw.startsWith("project:")) {
    return { kind: "project", id: raw.slice("project:".length) };
  }
  return { kind: "today" };
}

type CacheEntry = { data: TodoistPanelData; fetchedAt: number };

function readCache(view: View): CacheEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DATA_CACHE_PREFIX + viewKey(view));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (!parsed.data || typeof parsed.fetchedAt !== "number") return null;
    if (Date.now() - parsed.fetchedAt > CACHE_MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(view: View, data: TodoistPanelData) {
  if (typeof window === "undefined") return;
  // Don't cache error states — we want the next open to retry fresh.
  if (data.error || !data.connected) return;
  try {
    const entry: CacheEntry = { data, fetchedAt: Date.now() };
    window.localStorage.setItem(
      DATA_CACHE_PREFIX + viewKey(view),
      JSON.stringify(entry)
    );
  } catch {
    // localStorage can be disabled or full — fail quietly.
  }
}

/** Fire-and-forget: tells the top-nav badge to refresh its count. */
function dispatchTasksChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("todoist-tasks-changed"));
  }
}

export function TodoistPanel({ isOpen }: { isOpen: boolean }) {
  const [data, setData] = useState<TodoistPanelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [view, setView] = useState<View>({ kind: "today" });
  const reloadRef = useRef(0);
  const wasOpenRef = useRef(false);

  // Restore last view from localStorage on mount.
  useEffect(() => {
    const raw =
      typeof window !== "undefined"
        ? window.localStorage.getItem(VIEW_STORAGE_KEY)
        : null;
    setView(parseView(raw));
  }, []);

  // Persist view changes.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VIEW_STORAGE_KEY, viewKey(view));
  }, [view]);

  const refresh = useCallback(async (target: View) => {
    const id = ++reloadRef.current;
    setLoading(true);
    const next = await loadTodoistData(
      target.kind === "project" ? { projectId: target.id } : undefined
    );
    if (id !== reloadRef.current) return;
    setData(next);
    setLoading(false);
  }, []);

  // Persist data to localStorage whenever it changes — covers both the
  // refresh path and optimistic mutations (complete, add, reschedule,
  // priority). writeCache is a no-op for error/disconnected states.
  useEffect(() => {
    if (data) writeCache(view, data);
  }, [data, view]);

  // When the view changes: hydrate from cache immediately (so the list
  // is visible the instant the panel slides in), then refresh in the
  // background. Cache-miss falls through to a foreground spinner.
  useEffect(() => {
    const cached = readCache(view);
    if (cached) {
      setData(cached.data);
    } else {
      setData(null);
    }
    refresh(view);
  }, [refresh, view]);

  // Auto-refresh when the tab/window regains focus — only while the
  // panel is actually open, to avoid hammering Todoist while the user
  // is off doing something else.
  useEffect(() => {
    function onFocus() {
      if (isOpen && document.visibilityState === "visible") refresh(view);
    }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [refresh, view, isOpen]);

  // When the panel goes from closed → open, kick off a background
  // refresh so the user sees today's truth shortly after opening (even
  // though the cached list rendered immediately).
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) refresh(view);
    wasOpenRef.current = isOpen;
  }, [isOpen, refresh, view]);

  async function handleComplete(task: TodoistTask) {
    if (!data) return;
    const prev = data;
    setData({ ...data, tasks: data.tasks.filter((t) => t.id !== task.id) });
    try {
      await completeTodoistTask(task.id);
      toast.success("Completed +1 XP");
      dispatchTasksChanged();
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
        dueString: view.kind === "today" ? "today" : undefined,
        projectId: view.kind === "project" ? view.id : undefined,
      });
      setDraft("");
      if (data) {
        setData({ ...data, tasks: [created, ...data.tasks] });
      }
      toast.success("Added");
      dispatchTasksChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setAdding(false);
  }

  async function handleReschedule(task: TodoistTask, dueString: string) {
    if (!data) return;
    try {
      const updated = await rescheduleTodoistTask(task.id, dueString);
      setData({
        ...data,
        tasks: data.tasks.map((t) => (t.id === task.id ? updated : t)),
      });
      toast.success(updated.due ? `Due ${updated.due.string}` : "Cleared due");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handleCyclePriority(task: TodoistTask) {
    if (!data) return;
    const np = nextPriority(task.priority);
    // Optimistic
    const prev = data;
    setData({
      ...data,
      tasks: data.tasks.map((t) =>
        t.id === task.id ? { ...t, priority: np } : t
      ),
    });
    try {
      await setTodoistTaskPriority(task.id, np);
    } catch (e) {
      setData(prev);
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  async function handleEditDescription(task: TodoistTask, description: string) {
    if (!data) return;
    if ((task.description ?? "") === description) return;
    const prev = data;
    setData({
      ...data,
      tasks: data.tasks.map((t) =>
        t.id === task.id ? { ...t, description: description || null } : t
      ),
    });
    try {
      await setTodoistTaskDescription(task.id, description);
    } catch (e) {
      setData(prev);
      toast.error(e instanceof Error ? e.message : "Failed");
    }
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
          onClick={() => refresh(view)}
          className="text-glow font-mono hover:underline"
        >
          retry
        </button>
      </div>
    );
  }

  const sortedProjects = [...data.projects].sort((a, b) => {
    if (a.isInboxProject !== b.isInboxProject) return a.isInboxProject ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  const projectsById = new Map(sortedProjects.map((p) => [p.id, p]));
  const today = new Date().toISOString().slice(0, 10);

  // If the persisted project view points to a project that no longer
  // exists (deleted, archived, etc.), gracefully fall back to Today.
  if (view.kind === "project" && !projectsById.has(view.id)) {
    return (
      <div className="text-xs font-mono text-muted-foreground py-6 text-center">
        Saved project unavailable — switching to Today…
        <button
          type="button"
          onClick={() => setView({ kind: "today" })}
          className="block mx-auto mt-2 text-glow hover:underline"
        >
          continue
        </button>
      </div>
    );
  }

  const handlers = {
    onComplete: handleComplete,
    onReschedule: handleReschedule,
    onCyclePriority: handleCyclePriority,
    onEditDescription: handleEditDescription,
  };

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
            setView(
              v === "__today" ? { kind: "today" } : { kind: "project", id: v }
            );
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
          onClick={() => refresh(view)}
          disabled={loading}
          className={`h-7 px-2 rounded-md border border-border/60 bg-card/40 text-xs font-mono text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors ${
            loading ? "animate-pulse" : ""
          }`}
          title={loading ? "Refreshing…" : "Refresh"}
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
          sections={data.sections}
          today={today}
          handlers={handlers}
        />
      ) : (
        <ProjectView
          tasks={data.tasks}
          sections={data.sections.filter((s) => s.projectId === view.id)}
          today={today}
          handlers={handlers}
        />
      )}

      <p className="text-[10px] font-mono text-muted-foreground/50 text-center pt-2 border-t border-border/30">
        press <kbd className="px-1 py-0.5 rounded bg-card/60 border border-border/40">q</kbd> or <kbd className="px-1 py-0.5 rounded bg-card/60 border border-border/40">esc</kbd> to close · +1 XP per completion
      </p>
    </div>
  );
}

type RowHandlers = {
  onComplete: (t: TodoistTask) => void;
  onReschedule: (t: TodoistTask, due: string) => void;
  onCyclePriority: (t: TodoistTask) => void;
  onEditDescription: (t: TodoistTask, description: string) => void;
};

/** Build a {root tasks → children} map where any task whose parent is
 *  NOT in the list is treated as a root (otherwise we'd lose orphans). */
function buildHierarchy(tasks: TodoistTask[]): {
  roots: TodoistTask[];
  childrenOf: Map<string, TodoistTask[]>;
} {
  const ids = new Set(tasks.map((t) => t.id));
  const childrenOf = new Map<string, TodoistTask[]>();
  const roots: TodoistTask[] = [];
  for (const t of tasks) {
    if (t.parentId && ids.has(t.parentId)) {
      const arr = childrenOf.get(t.parentId) ?? [];
      arr.push(t);
      childrenOf.set(t.parentId, arr);
    } else {
      roots.push(t);
    }
  }
  // Sort children by Todoist's own child_order.
  for (const arr of childrenOf.values()) arr.sort((a, b) => a.order - b.order);
  return { roots, childrenOf };
}

function GroupedByProject({
  tasks,
  projects,
  sections,
  today,
  handlers,
}: {
  tasks: TodoistTask[];
  projects: TodoistProject[];
  sections: TodoistSection[];
  today: string;
  handlers: RowHandlers;
}) {
  const groups = useMemo(() => {
    const byProject = new Map<string, TodoistTask[]>();
    for (const t of tasks) {
      const arr = byProject.get(t.projectId) ?? [];
      arr.push(t);
      byProject.set(t.projectId, arr);
    }
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
          <ProjectView
            tasks={group}
            sections={sections.filter((s) => s.projectId === project.id)}
            today={today}
            handlers={handlers}
            compact
          />
        </div>
      ))}
    </div>
  );
}

/** A single project's tasks, grouped by section. Used both inside the
 *  per-project view and inside the today-grouped-by-project view. */
function ProjectView({
  tasks,
  sections,
  today,
  handlers,
  compact,
}: {
  tasks: TodoistTask[];
  sections: TodoistSection[];
  today: string;
  handlers: RowHandlers;
  compact?: boolean;
}) {
  const { roots, childrenOf } = useMemo(() => buildHierarchy(tasks), [tasks]);

  const sortedSections = useMemo(
    () =>
      [...sections].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
    [sections]
  );

  const bySection = new Map<string | null, TodoistTask[]>();
  for (const t of roots) {
    const key = t.sectionId ?? null;
    const arr = bySection.get(key) ?? [];
    arr.push(t);
    bySection.set(key, arr);
  }
  for (const arr of bySection.values()) arr.sort((a, b) => a.order - b.order);

  const blocks: { label: string | null; tasks: TodoistTask[] }[] = [];
  // Null-section ("project root") tasks first, then named sections in order.
  const rootBlock = bySection.get(null);
  if (rootBlock && rootBlock.length) blocks.push({ label: null, tasks: rootBlock });
  for (const s of sortedSections) {
    const arr = bySection.get(s.id);
    if (arr && arr.length) blocks.push({ label: s.name, tasks: arr });
  }

  // If a section exists in the data but isn't in our `sections` list
  // (shouldn't normally happen, but be defensive), append at the end.
  const knownSectionIds = new Set(sortedSections.map((s) => s.id));
  for (const [sid, arr] of bySection.entries()) {
    if (sid && !knownSectionIds.has(sid)) {
      blocks.push({ label: "—", tasks: arr });
    }
  }

  return (
    <div className={compact ? "space-y-1.5" : "space-y-3"}>
      {blocks.map((b, idx) => (
        <div key={`${b.label ?? "root"}-${idx}`} className="space-y-1">
          {b.label && (
            <h4 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/60 px-1">
              · {b.label}
            </h4>
          )}
          <ul className="space-y-1.5">
            {b.tasks.map((t) => (
              <TaskNode
                key={t.id}
                task={t}
                childrenOf={childrenOf}
                today={today}
                handlers={handlers}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function TaskNode({
  task,
  childrenOf,
  today,
  handlers,
}: {
  task: TodoistTask;
  childrenOf: Map<string, TodoistTask[]>;
  today: string;
  handlers: RowHandlers;
}) {
  const kids = childrenOf.get(task.id);
  return (
    <li className="space-y-1.5">
      <TaskRow task={task} today={today} handlers={handlers} />
      {kids && kids.length > 0 && (
        <ul className="space-y-1.5 ml-4 border-l border-border/40 pl-2">
          {kids.map((c) => (
            <TaskNode
              key={c.id}
              task={c}
              childrenOf={childrenOf}
              today={today}
              handlers={handlers}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function TaskRow({
  task,
  today,
  handlers,
}: {
  task: TodoistTask;
  today: string;
  handlers: RowHandlers;
}) {
  const overdue = !!(task.due?.date && task.due.date < today);
  const [editingDue, setEditingDue] = useState(false);
  const [dueDraft, setDueDraft] = useState("");

  // Description state is per-row and survives task re-renders. Always
  // starts collapsed — the 📝 button is brighter when notes exist so
  // the row still telegraphs "there's stuff here" at a glance.
  const hasDescription = !!(task.description && task.description.trim());
  const [descOpen, setDescOpen] = useState(false);
  const [descDraft, setDescDraft] = useState(task.description ?? "");

  // Keep the local draft in sync if the parent's task gets replaced
  // (e.g. after a fresh fetch overwrites optimistic state).
  useEffect(() => {
    setDescDraft(task.description ?? "");
  }, [task.description]);

  function startEditDue() {
    setDueDraft(task.due?.string ?? "");
    setEditingDue(true);
  }
  function cancelEditDue() {
    setEditingDue(false);
    setDueDraft("");
  }
  function commitEditDue() {
    if (!editingDue) return;
    setEditingDue(false);
    if ((task.due?.string ?? "") !== dueDraft) {
      handlers.onReschedule(task, dueDraft);
    }
  }

  function commitDescription() {
    handlers.onEditDescription(task, descDraft);
  }

  return (
    <div className="rounded-md border border-border/60 bg-card/40 px-2.5 py-2 text-xs flex items-start gap-2">
      <button
        type="button"
        onClick={() => handlers.onComplete(task)}
        aria-label="Complete (+1 XP)"
        title={`Complete · +1 XP`}
        className={`h-4 w-4 rounded-full border shrink-0 mt-0.5 hover:bg-glow/20 transition-colors ${PRIORITY_COLOR[task.priority]}`}
      />
      <div className="flex-1 min-w-0">
        <a
          href={task.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block leading-snug hover:text-glow transition-colors break-words"
        >
          {task.content}
        </a>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[10px] font-mono text-muted-foreground/70">
          {editingDue ? (
            <input
              autoFocus
              value={dueDraft}
              onChange={(e) => setDueDraft(e.target.value)}
              onBlur={commitEditDue}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitEditDue();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelEditDue();
                }
              }}
              placeholder="e.g. tomorrow, next mon, jan 5"
              className="h-5 rounded border border-glow/40 bg-card/60 px-1 text-[10px] outline-none focus:border-glow/60 min-w-[10rem]"
            />
          ) : (
            <button
              type="button"
              onClick={startEditDue}
              title="Click to reschedule"
              className={`hover:text-foreground transition-colors ${overdue ? "text-destructive" : ""}`}
            >
              ⏱ {task.due?.string ?? "no date"}
            </button>
          )}
          <button
            type="button"
            onClick={() => handlers.onCyclePriority(task)}
            title="Cycle priority"
            className={`hover:text-foreground transition-colors px-1 rounded border ${PRIORITY_COLOR[task.priority]}`}
          >
            {priorityLabel(task.priority)}
          </button>
          <button
            type="button"
            onClick={() => setDescOpen((s) => !s)}
            title={hasDescription ? "Edit description" : "Add description"}
            className={`hover:text-foreground transition-colors ${
              hasDescription ? "text-foreground/80" : ""
            }`}
          >
            📝
            {hasDescription ? "" : "+"}
          </button>
          {task.labels.map((l) => (
            <span key={l}>@{l}</span>
          ))}
        </div>
        {descOpen && (
          <textarea
            value={descDraft}
            onChange={(e) => setDescDraft(e.target.value)}
            onBlur={commitDescription}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setDescDraft(task.description ?? "");
                setDescOpen(false);
              }
            }}
            placeholder="Add details, links, sub-points…"
            rows={Math.min(8, Math.max(2, descDraft.split("\n").length + 1))}
            className="mt-1.5 w-full rounded border border-border/60 bg-card/60 hover:border-border focus:border-glow/60 px-2 py-1.5 text-[11px] leading-snug resize-y outline-none whitespace-pre-wrap"
          />
        )}
      </div>
    </div>
  );
}
