"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBook, deleteBook } from "@/modules/books/actions";
import { toast } from "sonner";
import type { Book } from "@/modules/books/types";
import { CoverPicker } from "./cover-picker";

function StatusButton({
  value,
  current,
  onSelect,
  label,
  emoji,
  accent,
}: {
  value: "want" | "reading" | "read";
  current: string;
  onSelect: (v: "want" | "reading" | "read") => void;
  label: string;
  emoji: string;
  accent: string;
}) {
  const selected = value === current;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`flex-1 rounded-md border px-3 py-2 text-sm transition-colors ${
        selected
          ? `${accent} border-current`
          : "border-border bg-muted/40 hover:bg-accent"
      }`}
    >
      <div className="flex items-center gap-1.5 justify-center">
        <span>{emoji}</span>
        <span>{label}</span>
      </div>
    </button>
  );
}

function dateToInput(d: Date | number | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "number" ? new Date(d * 1000) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function inputToDate(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  // Local midnight of the chosen day
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function BookDetailsDialog({
  book,
  open,
  onOpenChange,
}: {
  book: Book;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [status, setStatusRaw] = useState(book.status);
  const [rating, setRating] = useState<number | null>(book.rating);
  const [notes, setNotes] = useState(book.notes ?? "");
  const [startedAt, setStartedAt] = useState(dateToInput(book.startedAt));
  const [finishedAt, setFinishedAt] = useState(dateToInput(book.finishedAt));
  const [coverUrl, setCoverUrl] = useState<string | null>(book.coverUrl);
  const [pickingCover, setPickingCover] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setStatusRaw(book.status);
    setRating(book.rating);
    setNotes(book.notes ?? "");
    setStartedAt(dateToInput(book.startedAt));
    setFinishedAt(dateToInput(book.finishedAt));
    setCoverUrl(book.coverUrl);
    setPickingCover(false);
  }, [book, open]);

  /** Wrap status changes so the dates auto-populate to today if empty. */
  function setStatus(next: "want" | "reading" | "read") {
    const today = dateToInput(new Date());
    if (next === "reading" && !startedAt) setStartedAt(today);
    if (next === "read") {
      if (!startedAt) setStartedAt(today);
      if (!finishedAt) setFinishedAt(today);
    }
    setStatusRaw(next);
  }

  async function handleSave() {
    setLoading(true);
    try {
      await updateBook(book.id, {
        status,
        rating,
        notes: notes.trim() || null,
        startedAt: inputToDate(startedAt),
        finishedAt: inputToDate(finishedAt),
        coverUrl,
      });
      toast.success("Book updated");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!confirm(`Remove "${book.title}" from your library?`)) return;
    setLoading(true);
    try {
      await deleteBook(book.id);
      toast.success("Removed");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:!max-w-lg">
        <DialogHeader>
          <div className="flex gap-4">
            <div className="relative w-24 h-36 shrink-0">
              {coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverUrl}
                  alt={book.title}
                  className="w-24 h-36 object-cover rounded-md border border-border"
                />
              ) : (
                <div className="w-24 h-36 flex items-center justify-center bg-muted/30 rounded-md border border-border text-3xl">
                  📖
                </div>
              )}
              <button
                type="button"
                onClick={() => setPickingCover((s) => !s)}
                className="absolute bottom-1 left-1 right-1 text-[10px] font-mono bg-black/70 text-white/90 hover:bg-black/90 rounded px-1 py-0.5 transition-colors"
              >
                {pickingCover ? "close" : "change cover"}
              </button>
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg leading-tight">
                {book.title}
              </DialogTitle>
              <DialogDescription className="text-sm mt-1">
                {book.authors}
              </DialogDescription>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {book.year && (
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {book.year}
                  </Badge>
                )}
                {book.pages && (
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {book.pages} pp
                  </Badge>
                )}
                {book.isbn && (
                  <Badge variant="outline" className="text-[10px] font-mono">
                    ISBN {book.isbn}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          {pickingCover && (
            <CoverPicker
              defaultQuery={`${book.title} ${book.authors}`}
              currentUrl={coverUrl}
              onPick={(url) => {
                setCoverUrl(url);
                setPickingCover(false);
              }}
              onCancel={() => setPickingCover(false)}
            />
          )}

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex gap-2">
              <StatusButton
                value="want"
                current={status}
                onSelect={setStatus}
                label="Want to Read"
                emoji="📖"
                accent="bg-muted text-foreground"
              />
              <StatusButton
                value="reading"
                current={status}
                onSelect={setStatus}
                label="Reading"
                emoji="📗"
                accent="bg-glow/20 text-glow"
              />
              <StatusButton
                value="read"
                current={status}
                onSelect={setStatus}
                label="Read"
                emoji="✓"
                accent="bg-xp/20 text-xp"
              />
            </div>
          </div>

          {status === "read" && (
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(rating === n ? null : n)}
                    className={`h-8 w-8 rounded-md text-lg transition-colors ${
                      rating != null && n <= rating
                        ? "text-yellow-400"
                        : "text-muted-foreground/30 hover:text-muted-foreground"
                    }`}
                  >
                    ★
                  </button>
                ))}
                {rating && (
                  <button
                    type="button"
                    onClick={() => setRating(null)}
                    className="ml-2 text-xs text-muted-foreground hover:text-foreground self-center"
                  >
                    clear
                  </button>
                )}
              </div>
            </div>
          )}

          {(status === "reading" || status === "read") && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="book-started">Started</Label>
                <Input
                  id="book-started"
                  type="date"
                  value={startedAt}
                  onChange={(e) => setStartedAt(e.target.value)}
                />
              </div>
              {status === "read" && (
                <div className="space-y-2">
                  <Label htmlFor="book-finished">Finished</Label>
                  <Input
                    id="book-finished"
                    type="date"
                    value={finishedAt}
                    onChange={(e) => setFinishedAt(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="book-notes">Notes</Label>
            <textarea
              id="book-notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Your thoughts on this book…"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-y placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <DialogFooter className="!justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={loading}
            className="text-destructive hover:text-destructive"
          >
            Remove
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
