"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { globalSearch, type SearchHit } from "@/modules/search/actions";

const KIND_LABEL: Record<SearchHit["kind"], string> = {
  category: "Skill",
  subskill: "Subskill",
  book: "Book",
  quest: "Quest",
  habit: "Habit",
  achievement: "Achievement",
};

const KIND_CLS: Record<SearchHit["kind"], string> = {
  category: "text-glow border-glow/40",
  subskill: "text-glow border-glow/40",
  book: "text-xp border-xp/40",
  quest: "text-glow-purple border-glow-purple/40",
  habit: "text-glow border-glow/40",
  achievement: "text-xp border-xp/40",
};

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const reqSeq = useRef(0);

  // ⌘K / Ctrl-K to open; /-key also opens if not already in an input.
  // Listens for a "open-global-search" custom event so other UI (nav button)
  // can trigger it without prop-drilling.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === "/") {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        const editable =
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          target?.isContentEditable;
        if (!editable) {
          e.preventDefault();
          setOpen(true);
        }
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-global-search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-global-search", onOpen);
    };
  }, []);

  // Reset state when closed
  useEffect(() => {
    if (!open) {
      setQuery("");
      setHits([]);
      setActive(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (query.trim().length < 1) {
      setHits([]);
      return;
    }
    const seq = ++reqSeq.current;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const rows = await globalSearch(query);
        if (seq === reqSeq.current) {
          setHits(rows);
          setActive(0);
        }
      } catch {
        if (seq === reqSeq.current) setHits([]);
      }
      if (seq === reqSeq.current) setLoading(false);
    }, 150);
    return () => clearTimeout(t);
  }, [query, open]);

  function go(hit: SearchHit) {
    setOpen(false);
    router.push(hit.href);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = hits[active];
      if (hit) go(hit);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 sm:!max-w-xl !gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Global search</DialogTitle>
        <div className="flex items-center border-b border-border px-4">
          <span className="text-muted-foreground mr-2 text-sm">🔍</span>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search skills, books, quests, habits, achievements…"
            className="flex-1 bg-transparent border-0 outline-none py-4 text-sm placeholder:text-muted-foreground"
          />
          <kbd className="text-[10px] font-mono text-muted-foreground/60 border border-border/60 rounded px-1.5 py-0.5">
            esc
          </kbd>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {loading && hits.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              Searching…
            </p>
          )}
          {!loading && query.trim() && hits.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              No matches for &ldquo;{query}&rdquo;.
            </p>
          )}
          {!query.trim() && (
            <div className="px-3 py-4 space-y-2 text-xs text-muted-foreground/80">
              <div>
                Type to search across skills, subskills, books, quests, habits,
                and achievements.
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <kbd className="border border-border/60 rounded px-1.5 py-0.5">
                  ↑
                </kbd>
                <kbd className="border border-border/60 rounded px-1.5 py-0.5">
                  ↓
                </kbd>
                <span>navigate</span>
                <kbd className="border border-border/60 rounded px-1.5 py-0.5 ml-2">
                  ↵
                </kbd>
                <span>open</span>
                <kbd className="border border-border/60 rounded px-1.5 py-0.5 ml-2">
                  /
                </kbd>
                <span>focus search</span>
              </div>
            </div>
          )}
          <ul>
            {hits.map((hit, i) => (
              <li key={`${hit.kind}-${hit.id}`}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(hit)}
                  className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                    i === active
                      ? "bg-accent"
                      : "hover:bg-accent/60"
                  }`}
                >
                  <span className="text-xl shrink-0">{hit.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium line-clamp-1">
                      {hit.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground line-clamp-1">
                      {hit.subtitle}
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-mono uppercase tracking-wider border rounded px-1.5 py-0 shrink-0 ${KIND_CLS[hit.kind]}`}
                  >
                    {KIND_LABEL[hit.kind]}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-border/60 px-4 py-2 text-[10px] font-mono text-muted-foreground/60 flex items-center justify-between">
          <span>
            <kbd className="border border-border/60 rounded px-1 py-0.5">
              ⌘
            </kbd>
            <kbd className="border border-border/60 rounded px-1 py-0.5 ml-0.5">
              K
            </kbd>{" "}
            to open / close
          </span>
          <span>{hits.length > 0 ? `${hits.length} results` : ""}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
