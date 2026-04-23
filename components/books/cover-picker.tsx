"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CoverCandidate = {
  coverUrl: string;
  title: string;
  authors: string;
  year?: number;
  key: string;
};

async function searchCovers(q: string): Promise<CoverCandidate[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(
    q
  )}&limit=24&fields=title,author_name,first_publish_year,cover_i,isbn,cover_edition_key,key,edition_key`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Open Library request failed");
  const data = (await res.json()) as {
    docs: Array<{
      title?: string;
      author_name?: string[];
      first_publish_year?: number;
      cover_i?: number;
      isbn?: string[];
      cover_edition_key?: string;
      edition_key?: string[];
      key?: string;
    }>;
  };

  const out: CoverCandidate[] = [];
  const seen = new Set<string>();
  for (const d of data.docs ?? []) {
    if (!d.title) continue;
    // Prefer cover_i (more reliable), fall back to ISBN-keyed cover
    let coverUrl: string | null = null;
    if (d.cover_i) {
      coverUrl = `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`;
    } else if (d.isbn && d.isbn.length > 0) {
      const isbn = d.isbn.find((v) => /^\d{13}$/.test(v)) ?? d.isbn[0];
      coverUrl = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
    } else if (d.cover_edition_key) {
      coverUrl = `https://covers.openlibrary.org/b/olid/${d.cover_edition_key}-M.jpg`;
    }
    if (!coverUrl) continue;
    if (seen.has(coverUrl)) continue;
    seen.add(coverUrl);
    out.push({
      coverUrl,
      title: d.title,
      authors: (d.author_name ?? []).join(", ") || "Unknown",
      year: d.first_publish_year,
      key: coverUrl,
    });
  }
  return out;
}

export function CoverPicker({
  defaultQuery,
  currentUrl,
  onPick,
  onCancel,
}: {
  defaultQuery: string;
  currentUrl: string | null;
  onPick: (url: string | null) => void;
  onCancel: () => void;
}) {
  const [q, setQ] = useState(defaultQuery);
  const [customUrl, setCustomUrl] = useState("");
  const [candidates, setCandidates] = useState<CoverCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await searchCovers(trimmed);
      setCandidates(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    }
    setLoading(false);
  };

  // Auto-run once with the provided default query when the picker opens
  useEffect(() => {
    if (defaultQuery) {
      void run(defaultQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3 rounded-md border border-border/60 bg-muted/20 p-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Pick a cover
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          cancel
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(q);
        }}
        className="flex gap-2"
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search Open Library (title + author)"
          className="h-8 text-sm"
        />
        <Button
          type="submit"
          size="sm"
          variant="outline"
          disabled={loading || !q.trim()}
        >
          {loading ? "…" : "Search"}
        </Button>
      </form>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {candidates.length === 0 && !loading && !error && (
        <p className="text-xs text-muted-foreground italic">
          No covers found yet — try a different query.
        </p>
      )}

      {candidates.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
          {candidates.map((c) => {
            const isCurrent = currentUrl === c.coverUrl;
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => onPick(c.coverUrl)}
                title={`${c.title}${c.year ? ` (${c.year})` : ""} — ${c.authors}`}
                className={`aspect-[2/3] overflow-hidden rounded border-2 transition-all hover:scale-105 ${
                  isCurrent
                    ? "border-glow shadow-[0_0_8px_rgba(0,255,136,0.6)]"
                    : "border-transparent hover:border-glow/40"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.coverUrl}
                  alt={c.title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.visibility =
                      "hidden";
                  }}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Custom URL + clear */}
      <div className="space-y-2 pt-2 border-t border-border/40">
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Or paste a URL
        </div>
        <div className="flex gap-2">
          <Input
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://…"
            className="h-8 text-sm"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!customUrl.trim()}
            onClick={() => onPick(customUrl.trim())}
          >
            Set
          </Button>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onPick(null)}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Remove cover
          </button>
        </div>
      </div>
    </div>
  );
}
