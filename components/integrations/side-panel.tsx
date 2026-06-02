"use client";

import { useEffect, useState } from "react";
import { TodoistPanel } from "./todoist-panel";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

/** Centered floating modal that hosts the Todoist panel. Mirrors the
 *  Google Calendar modal shape (backdrop + card). The modal stays
 *  mounted at all times — visibility is toggled with opacity +
 *  pointer-events so the Todoist panel's SWR cache + component state
 *  survive open/close cycles. Press `q` once to open, `q` again to
 *  surface the quick-add dialogue. `Esc` or `Shift+Q` close (quick-add
 *  first, then the modal). */
export function IntegrationsSidePanel() {
  const [open, setOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  // Lock background scrolling while the modal is open so scroll
  // events stay inside the panel instead of moving the page behind it.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const typing = isTypingTarget(e.target);
      const key = e.key.toLowerCase();
      if (key === "q" && !typing) {
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Q closes the panel (and the quick-add overlay, if any).
          if (open) {
            setQuickAddOpen(false);
            setOpen(false);
          }
        } else if (!open) {
          setOpen(true);
        } else if (!quickAddOpen) {
          setQuickAddOpen(true);
        }
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        if (quickAddOpen) setQuickAddOpen(false);
        else setOpen(false);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-todoist-panel", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-todoist-panel", onOpenEvent);
    };
  }, [open, quickAddOpen]);

  return (
    <div
      role="dialog"
      aria-modal={open}
      aria-label="Todoist"
      aria-hidden={!open}
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 transition-opacity duration-150 ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl shadow-black/40">
        <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/60 shrink-0">
          <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
            📋 Todoist
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setQuickAddOpen(true)}
              className="text-muted-foreground hover:text-foreground transition-colors text-xs font-mono px-2 py-1 rounded border border-border/60 hover:border-foreground/40"
              title="Quick add (q)"
            >
              + add
            </button>
            <a
              href="https://app.todoist.com/app/today"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors text-xs font-mono px-2 py-1 rounded border border-border/60 hover:border-foreground/40"
              title="Open Todoist in a new tab"
            >
              open ↗
            </a>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm px-1"
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>
        </header>
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <TodoistPanel
            isOpen={open}
            quickAddOpen={quickAddOpen}
            onCloseQuickAdd={() => setQuickAddOpen(false)}
          />
        </div>
        <footer className="px-4 py-2 border-t border-border/60 text-[10px] font-mono text-muted-foreground/50 text-center shrink-0">
          <kbd className="px-1 py-0.5 rounded bg-card/60 border border-border/40">q</kbd>{" "}
          add ·{" "}
          <kbd className="px-1 py-0.5 rounded bg-card/60 border border-border/40">⇧Q</kbd>
          /
          <kbd className="px-1 py-0.5 rounded bg-card/60 border border-border/40">esc</kbd>{" "}
          close · +1 XP per completion
        </footer>
      </div>
    </div>
  );
}
