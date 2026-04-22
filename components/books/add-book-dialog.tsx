"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBook } from "@/modules/books/actions";
import { toast } from "sonner";

type SearchResult = {
  title: string;
  authors: string;
  isbn: string | null;
  year: number | null;
  coverUrl: string | null;
};

async function searchOpenLibrary(q: string): Promise<SearchResult[]> {
  // Open Library is a public JSON endpoint, no key needed.
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(
    q
  )}&limit=10&fields=title,author_name,first_publish_year,isbn,cover_i`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Open Library request failed");
  const data = (await res.json()) as {
    docs: Array<{
      title?: string;
      author_name?: string[];
      first_publish_year?: number;
      isbn?: string[];
      cover_i?: number;
    }>;
  };
  return (data.docs ?? [])
    .filter((d) => d.title)
    .map((d) => {
      const isbn = d.isbn?.find((v) => /^\d{13}$/.test(v)) ?? d.isbn?.[0] ?? null;
      const coverFromIsbn = isbn
        ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`
        : d.cover_i
          ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
          : null;
      return {
        title: d.title!,
        authors: (d.author_name ?? []).join(", ") || "Unknown",
        isbn,
        year: d.first_publish_year ?? null,
        coverUrl: coverFromIsbn,
      };
    });
}

export function AddBookDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [mode, setMode] = useState<"search" | "manual">("search");
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const [manualTitle, setManualTitle] = useState("");
  const [manualAuthors, setManualAuthors] = useState("");
  const [manualYear, setManualYear] = useState("");
  const [manualStatus, setManualStatus] = useState<"want" | "reading" | "read">(
    "want"
  );

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setSearching(true);
    try {
      const rows = await searchOpenLibrary(q.trim());
      setResults(rows);
      if (rows.length === 0) {
        toast.info("No results — try a different query, or add manually.");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed");
    }
    setSearching(false);
  }

  async function handleAddFromSearch(r: SearchResult, status: "want" | "reading" | "read") {
    setAdding(r.title);
    try {
      await createBook({
        title: r.title,
        authors: r.authors,
        isbn: r.isbn,
        coverUrl: r.coverUrl,
        year: r.year,
        status,
        source: "openlibrary",
      });
      toast.success(`Added "${r.title}"`);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setAdding(null);
  }

  async function handleAddManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manualTitle.trim()) return;
    setAdding("manual");
    try {
      await createBook({
        title: manualTitle.trim(),
        authors: manualAuthors.trim() || "Unknown",
        year: manualYear ? parseInt(manualYear, 10) : null,
        status: manualStatus,
        source: "manual",
      });
      toast.success(`Added "${manualTitle}"`);
      setManualTitle("");
      setManualAuthors("");
      setManualYear("");
      setManualStatus("want");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setAdding(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:!max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add a book</DialogTitle>
          <DialogDescription>
            Search Open Library or enter the details by hand.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 border-b border-border">
          <button
            type="button"
            onClick={() => setMode("search")}
            className={`px-3 py-2 text-sm font-mono uppercase tracking-wider transition-colors ${
              mode === "search"
                ? "border-b-2 border-glow text-glow -mb-px"
                : "text-muted-foreground"
            }`}
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={`px-3 py-2 text-sm font-mono uppercase tracking-wider transition-colors ${
              mode === "manual"
                ? "border-b-2 border-glow text-glow -mb-px"
                : "text-muted-foreground"
            }`}
          >
            Manual
          </button>
        </div>

        {mode === "search" ? (
          <div className="space-y-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                autoFocus
                placeholder="Title or author — e.g. Siddhartha Hesse"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Button type="submit" disabled={searching || !q.trim()}>
                {searching ? "Searching…" : "Search"}
              </Button>
            </form>
            <div className="max-h-[50vh] overflow-y-auto space-y-2">
              {results.map((r, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-md border border-border/60 bg-card p-2"
                >
                  {r.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.coverUrl}
                      alt={r.title}
                      className="w-12 h-16 object-cover rounded border border-border shrink-0"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.visibility =
                          "hidden";
                      }}
                    />
                  ) : (
                    <div className="w-12 h-16 flex items-center justify-center bg-muted/30 rounded border border-border shrink-0 text-muted-foreground">
                      📖
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium leading-tight line-clamp-2">
                      {r.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {r.authors}
                      {r.year ? ` · ${r.year}` : ""}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => handleAddFromSearch(r, "want")}
                      disabled={adding === r.title}
                    >
                      + Want
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[10px] border-glow/40 text-glow"
                      onClick={() => handleAddFromSearch(r, "reading")}
                      disabled={adding === r.title}
                    >
                      + Reading
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 px-2 text-[10px] border-xp/40 text-xp"
                      onClick={() => handleAddFromSearch(r, "read")}
                      disabled={adding === r.title}
                    >
                      + Read
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <form onSubmit={handleAddManual} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="b-title">Title</Label>
              <Input
                id="b-title"
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="b-authors">Author(s)</Label>
              <Input
                id="b-authors"
                value={manualAuthors}
                onChange={(e) => setManualAuthors(e.target.value)}
                placeholder="Comma-separated"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="b-year">Year</Label>
                <Input
                  id="b-year"
                  type="number"
                  value={manualYear}
                  onChange={(e) => setManualYear(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="b-status">Status</Label>
                <select
                  id="b-status"
                  value={manualStatus}
                  onChange={(e) =>
                    setManualStatus(e.target.value as "want" | "reading" | "read")
                  }
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="want">Want to read</option>
                  <option value="reading">Reading</option>
                  <option value="read">Read</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={adding === "manual"}>
                {adding === "manual" ? "Adding…" : "Add book"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
