"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchMyBooks, mergeBooks } from "@/modules/books/actions";
import { toast } from "sonner";

type Match = {
  id: string;
  title: string;
  authors: string;
  coverUrl: string | null;
  status: string;
  rating: number | null;
  year: number | null;
};

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    want: { label: "Want", cls: "text-muted-foreground border-border/60" },
    reading: { label: "Reading", cls: "text-glow border-glow/40" },
    read: { label: "Read", cls: "text-xp border-xp/40" },
  };
  const m = map[status] ?? map.want;
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0 text-[9px] font-mono uppercase tracking-wider ${m.cls}`}
    >
      {m.label}
    </span>
  );
}

export function LinkBookPicker({
  currentBookId,
  currentTitle,
  currentAuthors,
  onDone,
  onCancel,
}: {
  currentBookId: string;
  currentTitle: string;
  currentAuthors: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [q, setQ] = useState(currentTitle);
  const [results, setResults] = useState<Match[]>([]);
  const [searching, setSearching] = useState(false);
  const [merging, setMerging] = useState<string | null>(null);

  const run = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const rows = await searchMyBooks(trimmed, currentBookId);
      setResults(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed");
    }
    setSearching(false);
  };

  // Auto-run once with the default query
  useEffect(() => {
    void run(currentTitle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleMerge(target: Match) {
    const ok = window.confirm(
      `Link this book to "${target.title}" in your library?\n\nThe template entry will be removed and every reading list will point at your existing book instead. Your read status, rating, and notes for "${target.title}" are kept.`
    );
    if (!ok) return;
    setMerging(target.id);
    try {
      await mergeBooks(currentBookId, target.id);
      toast.success(`Linked to "${target.title}"`);
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setMerging(null);
  }

  return (
    <div className="space-y-3 rounded-md border border-border/60 bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Link to an existing book
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          cancel
        </button>
      </div>

      <p className="text-[11px] text-muted-foreground leading-snug">
        Already read this under a different edition? Search your library below
        and pick the entry you actually read — the challenge will then count
        it as done.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(q);
        }}
        className="flex gap-2"
      >
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your library"
          className="h-8 text-sm"
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={searching || !q.trim()}
        >
          {searching ? "…" : "Search"}
        </Button>
      </form>

      {results.length === 0 && !searching && q.trim() && (
        <p className="text-xs text-muted-foreground italic">
          No matches in your library for &ldquo;{q}&rdquo;. Try a shorter
          query.
        </p>
      )}

      {results.length > 0 && (
        <div className="max-h-64 overflow-y-auto space-y-1.5">
          {results.map((r) => (
            <div
              key={r.id}
              className="flex items-start gap-2 rounded-md border border-border/50 bg-card p-2"
            >
              {r.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.coverUrl}
                  alt={r.title}
                  className="w-9 h-12 object-cover rounded border border-border shrink-0"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.visibility =
                      "hidden";
                  }}
                />
              ) : (
                <div className="w-9 h-12 flex items-center justify-center bg-muted/40 rounded border border-border shrink-0 text-xs text-muted-foreground">
                  📖
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium leading-tight line-clamp-1">
                  {r.title}
                </div>
                <div className="text-[11px] text-muted-foreground line-clamp-1">
                  {r.authors}
                  {r.year ? ` · ${r.year}` : ""}
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <StatusPill status={r.status} />
                  {r.rating && (
                    <span className="text-[10px] text-yellow-400 tracking-widest">
                      {"★".repeat(r.rating)}
                    </span>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[10px] shrink-0"
                onClick={() => handleMerge(r)}
                disabled={merging === r.id}
              >
                {merging === r.id ? "Linking…" : "Link"}
              </Button>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground/60">
        Searching among books you&apos;ve saved. Excluded: this entry itself.
        Hint: &ldquo;{currentAuthors}&rdquo;.
      </p>
    </div>
  );
}
