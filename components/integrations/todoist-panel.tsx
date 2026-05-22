"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  completeTodoistTask,
  createTodoistTask,
  loadTodoistData,
  type TodoistPanelData,
} from "@/modules/integrations/todoist/actions";
import type { TodoistTask } from "@/modules/integrations/types";

const PRIORITY_COLOR: Record<number, string> = {
  4: "text-destructive border-destructive/40",
  3: "text-xp border-xp/40",
  2: "text-glow border-glow/40",
  1: "text-muted-foreground border-border/40",
};

function priorityLabel(p: number): string {
  return p === 4 ? "p1" : p === 3 ? "p2" : p === 2 ? "p3" : "p4";
}

export function TodoistPanel() {
  const [data, setData] = useState<TodoistPanelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const reloadRef = useRef(0);

  async function refresh() {
    const id = ++reloadRef.current;
    setLoading(true);
    const next = await loadTodoistData();
    if (id !== reloadRef.current) return; // a newer reload superseded us
    setData(next);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleComplete(task: TodoistTask) {
    if (!data) return;
    // Optimistic: remove the task from the list immediately.
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
        dueString: "today",
      });
      setDraft("");
      // Prepend the newly-created task so the user sees it immediately.
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
          today&apos;s tasks here.
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
          onClick={refresh}
          className="text-glow font-mono hover:underline"
        >
          retry
        </button>
      </div>
    );
  }

  const projectsById = new Map(data.projects.map((p) => [p.id, p]));

  return (
    <div className="space-y-3">
      <form onSubmit={handleAdd} className="flex gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="+ Quick add (for today)…"
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

      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        <span>
          Today + overdue ({data.tasks.length})
        </span>
        <button
          type="button"
          onClick={refresh}
          className="hover:text-foreground transition-colors"
        >
          ↻ refresh
        </button>
      </div>

      {data.tasks.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-6 text-center">
          Nothing on today&apos;s list. 🎉
        </p>
      ) : (
        <ul className="space-y-1.5">
          {data.tasks.map((t) => {
            const project = projectsById.get(t.projectId);
            const overdue =
              t.due?.date && t.due.date < new Date().toISOString().slice(0, 10);
            return (
              <li
                key={t.id}
                className="rounded-md border border-border/60 bg-card/40 px-2.5 py-2 text-xs flex items-start gap-2 group"
              >
                <button
                  type="button"
                  onClick={() => handleComplete(t)}
                  aria-label="Complete"
                  className={`h-4 w-4 rounded-full border shrink-0 mt-0.5 hover:bg-glow/20 transition-colors ${PRIORITY_COLOR[t.priority]}`}
                  title={priorityLabel(t.priority)}
                />
                <div className="flex-1 min-w-0">
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block leading-snug hover:text-glow transition-colors"
                  >
                    {t.content}
                  </a>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5 text-[10px] font-mono text-muted-foreground/70">
                    {project && !project.isInboxProject && (
                      <span>#{project.name}</span>
                    )}
                    {t.due && (
                      <span className={overdue ? "text-destructive" : ""}>
                        ⏱ {t.due.string}
                      </span>
                    )}
                    {t.labels.map((l) => (
                      <span key={l}>@{l}</span>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-[10px] font-mono text-muted-foreground/50 text-center pt-2 border-t border-border/30">
        press <kbd className="px-1 py-0.5 rounded bg-card/60 border border-border/40">q</kbd> or <kbd className="px-1 py-0.5 rounded bg-card/60 border border-border/40">esc</kbd> to close
      </p>
    </div>
  );
}
