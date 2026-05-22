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

/** A right-side slide-in panel that hosts third-party integrations
 *  (currently just Todoist). Toggled with `q`; closed with `esc`. The
 *  shortcut is ignored when the user is typing in an input/textarea so
 *  it never steals keystrokes mid-edit. */
export function IntegrationsSidePanel() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "q" && !isTypingTarget(e.target)) {
        e.preventDefault();
        setOpen((s) => !s);
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
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
  }, [open]);

  return (
    <>
      {/* Backdrop — click outside to close. Non-blocking when closed. */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 bg-background/40 backdrop-blur-sm z-40 transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        role="dialog"
        aria-label="Integrations side panel"
        aria-hidden={!open}
        className={`fixed top-0 right-0 h-full w-[320px] sm:w-[400px] lg:w-[460px] xl:w-[520px] 2xl:w-[580px] z-50 bg-background border-l border-border shadow-xl transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/60">
          <h2 className="text-xs font-mono uppercase tracking-wider text-glow">
            📋 Todoist
          </h2>
          <div className="flex items-center gap-1">
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
        <div className="p-4 overflow-y-auto h-[calc(100%-49px)]">
          {/* Always-mounted so the cached list is visible the instant
              the panel slides in; the panel handles its own SWR-style
              background refresh and focus revalidation. */}
          <TodoistPanel isOpen={open} />
        </div>
      </aside>
    </>
  );
}
