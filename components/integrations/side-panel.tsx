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
 *  Google Calendar modal shape (backdrop + card) instead of the older
 *  right-side slide-in. Press `q` once to open, `q` again to surface
 *  the quick-add dialogue. Esc closes the quick-add first, then the
 *  panel. */
export function IntegrationsSidePanel() {
  const [open, setOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "q" && !isTypingTarget(e.target)) {
        e.preventDefault();
        if (!open) {
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

  if (!open) {
    // Keep the panel mounted off-screen so its cache + state survive
    // close/open cycles — same trick we use for instant reopens.
    return (
      <div aria-hidden className="hidden">
        <TodoistPanel
          isOpen={false}
          quickAddOpen={false}
          onCloseQuickAdd={() => setQuickAddOpen(false)}
        />
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Todoist"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={() => setOpen(false)}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-border bg-card shadow-2xl shadow-black/40">
        <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/60">
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
        <div className="flex-1 min-h-0 overflow-hidden">
          <TodoistPanel
            isOpen={open}
            quickAddOpen={quickAddOpen}
            onCloseQuickAdd={() => setQuickAddOpen(false)}
          />
        </div>
        <footer className="px-4 py-2 border-t border-border/60 text-[10px] font-mono text-muted-foreground/50 text-center">
          <kbd className="px-1 py-0.5 rounded bg-card/60 border border-border/40">q</kbd> add · <kbd className="px-1 py-0.5 rounded bg-card/60 border border-border/40">esc</kbd> close · +1 XP per completion
        </footer>
      </div>
    </div>
  );
}
